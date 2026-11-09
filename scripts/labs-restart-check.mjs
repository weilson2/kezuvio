import { writeFile, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../packages/database/index.ts";
import { platformFixture } from "../packages/demo-platform/index.ts";
loadLocalEnvironment("test");
if (
  !process.env.DATABASE_URL ||
  !new URL(process.env.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
const db = createDatabase(),
  repo = createRepository(db, platformFixture);
const file = ".local/postgresql/restart-proof.json";
const act = (p, type, args = {}) => ({
  type,
  args,
  generation: p.generation,
  csrf: p.csrf,
  requestId: randomUUID(),
});
try {
  if (process.argv[2] === "prepare") {
    const { token, packet } = await repo.start();
    const manager = await repo.act(
      token,
      act(packet, "role", { role: "manager" }),
    );
    const request = act(manager, "fixture.consume");
    const committed = await repo.act(token, request);
    await writeFile(file, JSON.stringify({ token, request, committed }), {
      flag: "wx",
    });
    console.log(
      "Persisted restart fixture; tokens omitted. Stop and restart this local cluster before verify.",
    );
  } else if (process.argv[2] === "verify") {
    const { token, request, committed } = JSON.parse(
      await readFile(file, "utf8"),
    );
    assert.deepEqual(await repo.read(token), committed);
    assert.deepEqual(await repo.act(token, request), committed);
    await unlink(file);
    console.log(
      "PASS: database restart preserves session, committed state and duplicate-action protection.",
    );
  } else throw new Error("Use prepare or verify");
} finally {
  await db.$disconnect();
}
