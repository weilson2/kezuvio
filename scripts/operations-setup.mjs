import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const directory = resolve(".local/operations");
await mkdir(directory, { recursive: true });
try {
  await writeFile(
    resolve(directory, "config.json"),
    JSON.stringify(
      {
        key: randomBytes(32).toString("base64url"),
        signingKey: randomBytes(48).toString("base64url"),
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "Created private local operations configuration. Read .local/operations/config.json locally to sign in at /operations. Key not printed.",
  );
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log(
    "Existing operations configuration preserved. No key was changed.",
  );
}
