/**
 * Local logical backup + destructive-operation-bounded restore rehearsal.
 * Run: node scripts/labs-backup.mjs
 * Reads only this repository's protected local settings; no URL/password argv.
 * Archives retain local ownership/ACL references, but do not contain role passwords.
 * Restoring on another cluster requires separately provisioned equivalent roles.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = join(repository, ".local", "postgresql");
const bin = join(local, "runtime", "pgsql", "bin");
const host = "127.0.0.1",
  port = 55432;
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const destination = join(local, "backups", runId);
let phase = "validating local configuration";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const check = (value) => {
  if (!value) throw new Error("Verification failed");
};

async function settings(name) {
  const text = await readFile(join(local, name), "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );
}
function connection(url, mode) {
  const parsed = new URL(url);
  check(
    parsed.protocol === "postgresql:" &&
      parsed.hostname === host &&
      parsed.port === String(port),
  );
  check(
    parsed.pathname === `/kezuvio_labs_${mode}` &&
      !parsed.search &&
      !parsed.hash,
  );
  check(
    decodeURIComponent(parsed.username) === `labs_${mode}_owner` &&
      parsed.password,
  );
  return {
    host,
    port,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
  };
}
function client(config) {
  return new pg.Client({
    ...config,
    connectionTimeoutMillis: 5000,
    application_name: "kezuvio-local-backup",
    options: "-c timezone=UTC",
    query_timeout: 120000,
  });
}
function postgres(name, args, config) {
  // Remove inherited PostgreSQL connection overrides. Credentials exist only in
  // the child environment, not the command line, logs, errors or manifest.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("PG")),
  );
  const result = spawnSync(join(bin, `${name}.exe`), args, {
    cwd: repository,
    windowsHide: true,
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
    env: {
      ...env,
      PGHOST: host,
      PGPORT: String(port),
      PGUSER: config.user,
      PGPASSWORD: config.password,
      PGDATABASE: config.database,
      PGCONNECT_TIMEOUT: "5",
      PGOPTIONS: "-c timezone=UTC",
    },
  });
  // Print only the utility's error headline, redacting the in-memory secret.
  if (result.status !== 0) {
    const headline = result.stderr
      ?.split(/\r?\n/)
      .find((line) => line.includes("error:"));
    if (headline)
      console.error(
        headline
          .replaceAll(config.password, "[redacted]")
          .replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted URL]"),
      );
  }
  check(!result.error && result.status === 0);
  return result.stdout;
}
async function restrictBackupDirectory() {
  await mkdir(destination, { recursive: true, mode: 0o700 });
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `
    $ErrorActionPreference = 'Stop'
    $backupPath = $env:LABS_BACKUP_DIRECTORY
    $acl = [Security.AccessControl.DirectorySecurity]::new()
    $acl.SetAccessRuleProtection($true, $false)
    $current = [Security.Principal.WindowsIdentity]::GetCurrent().User
    foreach ($sid in @($current, [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
      $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'))
    }
    [IO.Directory]::SetAccessControl($backupPath, $acl)
    $actual = [IO.Directory]::GetAccessControl($backupPath)
    if (!$actual.AreAccessRulesProtected) { throw 'Protection required' }
    foreach ($rule in $actual.Access) {
      if ($rule.AccessControlType -eq 'Allow' -and $rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -notin @($current.Value, 'S-1-5-18')) { throw 'Unexpected access' }
    }
  `,
    ],
    {
      windowsHide: true,
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, LABS_BACKUP_DIRECTORY: destination },
    },
  );
  if (result.error || result.status !== 0) {
    console.error(
      `Backup ACL helper failed (exit ${result.status ?? "unavailable"}, code ${result.error?.code ?? "none"}).`,
    );
  }
  check(!result.error && result.status === 0);
}

const schemaQuery = `
WITH user_namespaces AS (
  SELECT oid,nspname FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
), definitions AS (
  SELECT 'schema' kind,n.nspname name,jsonb_build_object('owner',pg_get_userbyid(s.nspowner),'acl',s.nspacl::text)::text definition
    FROM user_namespaces n JOIN pg_namespace s ON s.oid=n.oid
  UNION ALL SELECT 'table',n.nspname||'.'||c.relname,
    jsonb_build_object('kind',c.relkind,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity,'acl',coalesce(c.relacl,acldefault((CASE WHEN c.relkind='S' THEN 's' ELSE 'r' END)::"char",c.relowner))::text)::text
    FROM pg_class c JOIN user_namespaces n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','S','v','m')
  UNION ALL SELECT 'column',n.nspname||'.'||c.relname||'.'||a.attname,
    jsonb_build_object('position',a.attnum,'type',format_type(a.atttypid,a.atttypmod),'required',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'default',pg_get_expr(d.adbin,d.adrelid))::text
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN user_namespaces n ON n.oid=c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p','v','m')
  UNION ALL SELECT 'constraint',n.nspname||'.'||c.relname||'.'||x.conname,pg_get_constraintdef(x.oid,true)
    FROM pg_constraint x JOIN pg_class c ON c.oid=x.conrelid JOIN user_namespaces n ON n.oid=c.relnamespace
  UNION ALL SELECT 'index',n.nspname||'.'||c.relname,pg_get_indexdef(c.oid)
    FROM pg_class c JOIN user_namespaces n ON n.oid=c.relnamespace WHERE c.relkind='i'
  UNION ALL SELECT 'function',n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
    jsonb_build_object('definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text)::text
    FROM pg_proc p JOIN user_namespaces n ON n.oid=p.pronamespace WHERE p.prokind IN ('f','p')
  UNION ALL SELECT 'policy',schemaname||'.'||tablename||'.'||policyname,
    jsonb_build_object('permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'withCheck',with_check)::text
    FROM pg_policies WHERE schemaname IN (SELECT nspname FROM user_namespaces)
  UNION ALL SELECT 'sequence',schemaname||'.'||sequencename,
    jsonb_build_object('type',data_type::text,'start',start_value,'min',min_value,'max',max_value,'increment',increment_by,'cycle',cycle,'cache',cache_size)::text
    FROM pg_sequences WHERE schemaname IN (SELECT nspname FROM user_namespaces)
)
SELECT kind,name,definition FROM definitions ORDER BY kind,name,definition`;

async function inspect(db) {
  const tables = (
    await db.query(`SELECT n.nspname AS schema,c.relname AS name
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relkind IN ('r','p') AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
    ORDER BY n.nspname,c.relname`)
  ).rows;
  check(
    tables.some(
      (t) => t.schema === "public" && t.name === "_prisma_migrations",
    ),
  );
  check(tables.some((t) => t.schema === "platform" && t.name === "workspaces"));
  check(tables.some((t) => t.schema === "cafe" && t.name === "documents"));
  const data = [];
  for (const table of tables) {
    const rows = (
      await db.query(
        `SELECT row_to_json(t)::text AS record FROM ${quote(table.schema)}.${quote(table.name)} t`,
      )
    ).rows;
    const hashes = rows.map((row) => digest(row.record)).sort();
    data.push({
      table: `${table.schema}.${table.name}`,
      rows: rows.length,
      sha256: digest(hashes.join("\n")),
    });
  }
  const schema = (await db.query(schemaQuery)).rows;
  return { schemaSha256: digest(JSON.stringify(schema)), tables: data };
}

async function verifySequences(db) {
  const sequences = (
    await db.query(`SELECT sn.nspname AS sequence_schema,s.relname AS sequence_name,
    tn.nspname AS table_schema,t.relname AS table_name,a.attname AS column_name
    FROM pg_class s JOIN pg_namespace sn ON sn.oid=s.relnamespace
    JOIN pg_depend d ON d.objid=s.oid AND d.deptype IN ('a','i') AND d.classid='pg_class'::regclass AND d.refclassid='pg_class'::regclass
    JOIN pg_class t ON t.oid=d.refobjid JOIN pg_namespace tn ON tn.oid=t.relnamespace
    JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=d.refobjsubid
    WHERE s.relkind='S' AND sn.nspname !~ '^pg_'`)
  ).rows;
  for (const sequence of sequences) {
    const [{ last_value, is_called }] = (
      await db.query(
        `SELECT last_value,is_called FROM ${quote(sequence.sequence_schema)}.${quote(sequence.sequence_name)}`,
      )
    ).rows;
    const [{ maximum }] = (
      await db.query(
        `SELECT max(${quote(sequence.column_name)})::text AS maximum FROM ${quote(sequence.table_schema)}.${quote(sequence.table_name)}`,
      )
    ).rows;
    if (maximum !== null)
      check(
        BigInt(last_value) > BigInt(maximum) ||
          (BigInt(last_value) === BigInt(maximum) && is_called),
      );
  }
}

async function backup(mode, owner, bootstrap) {
  const source = client(owner),
    administrator = client(bootstrap);
  const scratch = `kezuvio_restore_${mode}_${randomUUID().replaceAll("-", "")}`;
  // Only names generated here can ever reach CREATE/DROP DATABASE.
  check(/^kezuvio_restore_(dev|test)_[a-f0-9]{32}$/.test(scratch));
  let scratchCreated = false,
    restored;
  try {
    phase = `opening ${mode} snapshot`;
    await source.connect();
    await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const snapshot = (
      await source.query("SELECT pg_export_snapshot() AS snapshot")
    ).rows[0].snapshot;
    check(/^[0-9A-F-]+$/.test(snapshot));
    const expected = await inspect(source);
    const archive = join(destination, `${mode}.dump`);
    phase = `dumping ${mode} snapshot`;
    // FORCE RLS applies to the migration owner too; its explicit owner policy
    // permits all rows. Allow that policy during dump, then compare every row.
    postgres(
      "pg_dump",
      [
        "--format=custom",
        "--enable-row-security",
        "--file",
        archive,
        "--snapshot",
        snapshot,
        "--no-password",
      ],
      owner,
    );
    // Both the contents digest and dump use exactly the exported MVCC snapshot.
    await source.query("COMMIT");
    const archiveBytes = await readFile(archive);
    const sha256 = digest(archiveBytes);
    check(archiveBytes.subarray(0, 5).toString("ascii") === "PGDMP");
    postgres("pg_restore", ["--list", archive], bootstrap);
    phase = `creating isolated ${mode} restore database`;
    await administrator.connect();
    await administrator.query(
      `CREATE DATABASE ${quote(scratch)} OWNER ${quote(owner.user)} TEMPLATE template0`,
    );
    scratchCreated = true;
    await administrator.query(
      `REVOKE ALL ON DATABASE ${quote(scratch)} FROM PUBLIC`,
    );
    phase = `restoring ${mode} archive`;
    postgres(
      "pg_restore",
      [
        "--exit-on-error",
        "--single-transaction",
        "--dbname",
        scratch,
        "--no-password",
        archive,
      ],
      { ...bootstrap, database: scratch },
    );
    restored = client({ ...bootstrap, database: scratch });
    await restored.connect();
    phase = `comparing ${mode} restored schema and contents`;
    const actual = await inspect(restored);
    if (actual.schemaSha256 !== expected.schemaSha256)
      console.error("Restored schema fingerprint differs.");
    if (JSON.stringify(actual.tables) !== JSON.stringify(expected.tables))
      console.error("Restored table fingerprints differ.");
    check(JSON.stringify(actual) === JSON.stringify(expected));
    await verifySequences(restored);
    check(digest(await readFile(archive)) === sha256);
    return {
      database: owner.database,
      archive: `${mode}.dump`,
      bytes: archiveBytes.length,
      sha256,
      verified: true,
      verification:
        "snapshot contents, schema including RLS/ACLs/migrations, and sequence safety",
      ...expected,
    };
  } finally {
    await restored?.end().catch(() => {});
    await source.end().catch(() => {});
    if (scratchCreated) {
      // No FORCE and no deletion of source databases; this connection never
      // points at a source DB, and the generated name is not accepted as input.
      await administrator.query(`DROP DATABASE ${quote(scratch)}`);
    }
    await administrator.end().catch(() => {});
  }
}

try {
  check(process.platform === "win32" && process.argv.length === 2);
  const dev = connection(
    (await settings(".env.dev")).MIGRATION_DATABASE_URL,
    "dev",
  );
  const test = connection(
    (await settings(".env.test")).MIGRATION_DATABASE_URL,
    "test",
  );
  const password = (await settings(".env.bootstrap")).PGPASSWORD;
  check(typeof password === "string" && password.length >= 32);
  const bootstrap = {
    host,
    port,
    database: "postgres",
    user: "kezuvio_bootstrap",
    password,
  };
  phase = "protecting backup directory";
  await restrictBackupDirectory();
  const manifest = {
    format: 1,
    createdAt: new Date().toISOString(),
    endpoint: "127.0.0.1:55432",
    scope:
      "Local Kezuvio dev/test logical database archives; no global role/password dump.",
    restoreRequirement:
      "Equivalent original owner/runtime roles must exist; this rehearsal uses the same protected local cluster. No external restore or disaster recovery claim.",
    snapshotNote:
      "Each database uses its own exported repeatable-read snapshot. Sequence counters are nontransactional; restored counters are checked against restored row maxima.",
    databases: [],
  };
  for (const [mode, config] of [
    ["dev", dev],
    ["test", test],
  ]) {
    manifest.databases.push(await backup(mode, config, bootstrap));
    console.log(
      `PASS: ${mode} snapshot dumped, restored, compared; generated scratch database removed.`,
    );
  }
  phase = "saving verified manifest";
  await writeFile(
    join(destination, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    `Verified local backup: .local/postgresql/backups/${runId}/manifest.json`,
  );
  console.log(
    "Archives and manifest are private, Git-ignored, and contain no credential URLs or role passwords.",
  );
} catch {
  // Never print arbitrary errors, child stderr, connection strings or rows.
  console.error(
    `Backup did not complete while ${phase}. No source database was modified. Any archives are retained for inspection; absence of a manifest means unverified.`,
  );
  process.exitCode = 1;
}
