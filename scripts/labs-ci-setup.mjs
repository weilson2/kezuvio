import pg from "pg";
if (process.env.CI !== "true")
  throw new Error("This bootstrap is restricted to disposable CI databases");
const bootstrap = new URL(process.env.BOOTSTRAP_DATABASE_URL || "");
if (!["127.0.0.1", "localhost"].includes(bootstrap.hostname))
  throw new Error("CI bootstrap must use the local service container");
const owner = new URL(process.env.MIGRATION_DATABASE_URL || "");
const runtime = new URL(process.env.DATABASE_URL || "");
if (
  owner.pathname !== "/kezuvio_labs_test" ||
  runtime.pathname !== owner.pathname
)
  throw new Error("Only the dedicated CI test database can be provisioned");
const client = new pg.Client({ connectionString: bootstrap.toString() });
await client.connect();
try {
  for (const url of [owner, runtime]) {
    if (
      !/^[a-z][a-z0-9_]*$/.test(url.username) ||
      !/^[a-zA-Z0-9_-]{8,}$/.test(url.password)
    )
      throw new Error("Invalid CI role settings");
    await client.query(
      `CREATE ROLE "${url.username}" LOGIN PASSWORD '${url.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`,
    );
  }
  await client.query(
    `CREATE DATABASE kezuvio_labs_test OWNER "${owner.username}"`,
  );
  await client.query("REVOKE ALL ON DATABASE kezuvio_labs_test FROM PUBLIC");
  await client.query(
    `GRANT CONNECT ON DATABASE kezuvio_labs_test TO "${owner.username}", "${runtime.username}"`,
  );
  console.log("Disposable local CI database provisioned.");
} finally {
  await client.end();
}
