import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
/** Local-only convenience. Explicit environment variables always win outside test tooling. */
export function loadLocalEnvironment(mode: "dev" | "test" = "dev", all = true) {
  const name = all ? `.env.${mode}` : `.env.${mode}.runtime`;
  const candidates = [
    resolve(".local/postgresql", name),
    resolve("../../.local/postgresql", name),
  ];
  const file = candidates.find(existsSync);
  if (!file) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const split = line.indexOf("=");
    if (split < 0) continue;
    const key = line.slice(0, split),
      value = line.slice(split + 1);
    if (
      (all || key === "DATABASE_URL" || key === "LABS_ORIGIN") &&
      !process.env[key]
    )
      process.env[key] = value;
  }
}
