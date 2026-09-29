import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { rm, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, join } from "node:path";
import { loadLocalEnvironment } from "../packages/database/environment.ts";
loadLocalEnvironment("test");
if (
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Acceptance preview requires the dedicated test database");
const env = {
  ...process.env,
  LABS_ACCEPTANCE_MODE: "1",
  LABS_ORIGIN: "http://127.0.0.1:3100",
  NEXT_TELEMETRY_DISABLED: "1",
  OPERATIONS_TEST_MODE: "1",
  OPERATIONS_TEST_KEY:
    process.env.OPERATIONS_TEST_KEY ||
    "kezuvio-ephemeral-operations-preview-only",
  OPERATIONS_TEST_SIGNING_KEY: randomBytes(48).toString("base64url"),
};
// Dedicated disposable operations test state; development keys and tasks stay separate.
const operationPreview = new URL("../tmp/operations-preview", import.meta.url);
const repositoryPath = await realpath(
  fileURLToPath(new URL("../", import.meta.url)),
);
try {
  const target = await realpath(fileURLToPath(operationPreview));
  if (relative(repositoryPath, target) !== join("tmp", "operations-preview"))
    throw new Error(
      "Operations preview cleanup target is outside its dedicated directory",
    );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await rm(operationPreview, {
  recursive: true,
  force: true,
});
// The web process receives runtime credentials only.
delete env.MIGRATION_DATABASE_URL;
delete env.DATABASE_RUNTIME_ROLE;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "apps/website",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  { env, stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
