import { spawn } from "node:child_process";
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
};
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
