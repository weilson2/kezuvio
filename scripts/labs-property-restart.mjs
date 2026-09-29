import { readFile, writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../packages/database/index.ts";
import { propertyModule } from "../packages/property/index.ts";

loadLocalEnvironment("test");
const url = new URL(process.env.DATABASE_URL);
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "55432" ||
  url.pathname !== "/kezuvio_labs_test"
)
  throw new Error("Local Kezuvio test database required");
const db = createDatabase();
const repo = createRepository(db, propertyModule);
const file = ".local/postgresql/property-restart-proof.json";
const action = (packet, type, args) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: packet.generation,
  csrf: packet.csrf,
});
function check(condition) {
  if (!condition) throw new Error("Property restart verification failed");
}

try {
  if (process.argv[2] === "prepare") {
    const { token, packet } = await repo.start();
    const manager = await repo.act(
      token,
      action(packet, "role", { role: "manager" }),
    );
    const known = new Set(manager.state.leads.map((lead) => lead.id));
    const created = await repo.act(
      token,
      action(manager, "lead.create", {
        contactId: "contact-1",
        listingId: "listing-1",
        agentId: "agent-1",
        source: "Local restart rehearsal",
        notes: "Fictional viewing fixture.",
      }),
    );
    const lead = created.state.leads.find((lead) => !known.has(lead.id));
    const qualified = await repo.act(
      token,
      action(created, "lead.move", {
        id: lead.id,
        version: lead.version,
        stage: "Qualified",
        reason: "",
      }),
    );
    const start = Date.now() + 7 * 24 * 3600000;
    const request = action(qualified, "appointment.schedule", {
      leadId: lead.id,
      startAt: new Date(start).toISOString(),
      endAt: new Date(start + 3600000).toISOString(),
    });
    const booked = await repo.act(token, request);
    const appointment = booked.state.appointments.find(
      (item) => item.leadId === lead.id,
    );
    check(appointment?.status === "Scheduled");
    await writeFile(
      file,
      JSON.stringify({
        token,
        request,
        appointment,
        historyCount: booked.state.history.length,
      }),
      { flag: "wx", mode: 0o600 },
    );
    console.log("Scheduled Property viewing saved in the local test database.");
  } else if (process.argv[2] === "verify") {
    const { token, request, appointment, historyCount } = JSON.parse(
      await readFile(file, "utf8"),
    );
    const saved = await repo.read(token);
    const replay = await repo.act(token, request);
    for (const packet of [saved, replay]) {
      const matches = packet.state.appointments.filter(
        (item) => item.leadId === appointment.leadId,
      );
      check(
        matches.length === 1 &&
          matches[0].id === appointment.id &&
          matches[0].status === "Scheduled" &&
          matches[0].startAt === appointment.startAt &&
          matches[0].endAt === appointment.endAt &&
          packet.state.history.length === historyCount,
      );
    }
    await unlink(file);
    console.log(
      "PASS: viewing, session, audit history and duplicate-action protection survived restart.",
    );
  } else throw new Error("Use prepare or verify");
} catch {
  console.error(
    "Property restart rehearsal did not complete. Inspect the private fixture and database status.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
