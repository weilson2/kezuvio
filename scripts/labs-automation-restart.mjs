import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../packages/database/index.ts";
import { automationModule } from "../packages/automation/index.ts";

loadLocalEnvironment("test");
const url = new URL(process.env.DATABASE_URL);
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55432" ||
  url.pathname !== "/kezuvio_labs_test"
)
  throw new Error("Local Kezuvio test database required");
const db = createDatabase();
const repo = createRepository(db, automationModule);
const file = ".local/postgresql/automation-restart-proof.json";
const action = (packet, type, args) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: packet.generation,
  csrf: packet.csrf,
});
function check(condition) {
  if (!condition) throw new Error("Restart verification failed");
}
try {
  if (process.argv[2] === "prepare") {
    const { token, packet } = await repo.start();
    const submitted = await repo.act(
      token,
      action(packet, "inquiry.submit", {
        businessName: "Sample Juniper Studio",
        contactName: "Sample Guest",
        email: "juniper@example.test",
        brief: "A fictional website and booking workflow.",
        budgetSen: 400000,
        timelineWeeks: 8,
      }),
    );
    const manager = await repo.act(
      token,
      action(submitted, "role", { role: "manager" }),
    );
    const id = manager.state.tasks[0].id;
    const running = await repo.act(
      token,
      action(manager, "task.start", { id }),
    );
    const runId = running.state.tasks[0].runId;
    const finish = action(running, "task.finish", { id, runId, fail: false });
    await writeFile(file, JSON.stringify({ token, finish }), {
      flag: "wx",
      mode: 0o600,
    });
    console.log("Running Automation task saved in the local test database.");
  } else if (process.argv[2] === "verify") {
    const { token, finish } = JSON.parse(await readFile(file, "utf8"));
    const saved = await repo.read(token);
    const task = saved.state.tasks.find((t) => t.id === finish.args.id);
    check(task?.status === "Running" && task.runId === finish.args.runId);
    const done = await repo.act(token, finish);
    const replay = await repo.act(token, finish);
    for (const p of [done, replay]) {
      check(
        p.state.tasks[0].status === "Succeeded" &&
          p.state.analyses.length === 1 &&
          p.state.quotes.length === 1 &&
          p.state.quotes[0].status === "Draft" &&
          p.state.history.filter((h) => h.event === "Run succeeded").length ===
            1,
      );
    }
    await unlink(file);
    console.log(
      "PASS: running task survived restart and completion replay created one analysis and draft.",
    );
  } else throw new Error("Use prepare or verify");
} catch {
  console.error(
    "Automation restart rehearsal did not complete. Inspect the private fixture and database status.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
