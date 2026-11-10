import { spawnSync } from "node:child_process";
import pg from "pg";
import { loadLocalEnvironment } from "../packages/database/environment.ts";
const mode = process.argv.includes("--test") ? "test" : "dev";
loadLocalEnvironment(mode);
if (
  !process.env.MIGRATION_DATABASE_URL ||
  !/^[a-z][a-z0-9_]*$/.test(process.env.DATABASE_RUNTIME_ROLE || "")
)
  throw new Error("Migration URL and safe runtime role required");
const url = new URL(process.env.MIGRATION_DATABASE_URL);
if (mode === "test" && !url.pathname.endsWith("_test"))
  throw new Error("Test migrations require a database ending in _test");
const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { stdio: "inherit", env: process.env },
);
if (result.status !== 0) process.exit(result.status || 1);
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
});
await client.connect();
try {
  const role = `"${process.env.DATABASE_RUNTIME_ROLE}"`;
  await client.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  await client.query(
    `GRANT EXECUTE ON FUNCTION platform.active_workspace_count() TO ${role}`,
  );
  await client.query(
    `GRANT EXECUTE ON FUNCTION platform.prune_expired(), platform.admit_creation() TO ${role}`,
  );
  for (const schema of ["platform", "cafe", "commerce", "automation"]) {
    const exists = await client.query(
      "SELECT 1 FROM pg_namespace WHERE nspname=$1",
      [schema],
    );
    if (!exists.rowCount) continue;
    await client.query(`GRANT USAGE ON SCHEMA ${schema} TO ${role}`);
    await client.query(
      `GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${role}`,
    );
    await client.query(
      `GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO ${role}`,
    );
  }
  await client.query(`REVOKE ALL ON platform.admission FROM ${role}`);
  console.log(`Runtime grants applied (${mode}); credentials omitted.`);
} finally {
  await client.end();
}
