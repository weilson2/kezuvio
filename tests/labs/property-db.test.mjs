import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import { propertyModule } from "../../packages/property/index.ts";
import { cafeModule } from "../../packages/cafe/index.ts";
import { commerceModule } from "../../packages/commerce/index.ts";
import { automationModule } from "../../packages/automation/index.ts";
import { LabsError, tokenHash } from "../../packages/demo-platform/index.ts";

loadLocalEnvironment("test");
for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"])
  assert.ok(
    new URL(process.env[key]).pathname.endsWith("_test"),
    "Dedicated test database required",
  );
const runtime = createDatabase(),
  owner = createDatabase(process.env.MIGRATION_DATABASE_URL);
const repo = createRepository(runtime, propertyModule);
const fails = (status) => (error) =>
  error instanceof LabsError && error.status === status;
const payload = (p, type, args = {}) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: p.generation,
  csrf: p.csrf,
});
function bind(session, repository) {
  session.act = async (type, args) =>
    (session.packet = await repository.act(
      session.token,
      payload(session.packet, type, args),
    ));
  session.read = async () =>
    (session.packet = await repository.read(session.token));
  return session;
}
async function manager(repository = repo) {
  const s = bind(await repository.start(), repository);
  await s.act("role", { role: "manager" });
  return s;
}
const listing = {
  title: "Sample Damar Residence",
  area: "Taman Damar, Selangor",
  type: "Condo",
  priceSen: 45000000,
  bedrooms: 3,
  bathrooms: 2,
  sizeSqft: 1050,
  description: "Fictional three-bedroom home for the Property CRM demo.",
  status: "Available",
};
async function lead(s, listingId, agentId) {
  const known = new Set(s.packet.state.leads.map((l) => l.id));
  await s.act("lead.create", {
    contactId: "contact-1",
    listingId,
    agentId,
    source: "Demo portal",
    notes: "Fictional concurrent viewing fixture.",
  });
  const created = s.packet.state.leads.find((l) => !known.has(l.id));
  await s.act("lead.move", {
    id: created.id,
    version: created.version,
    stage: "Qualified",
    reason: "",
  });
  return s.packet.state.leads.find((l) => l.id === created.id);
}
const hour = 3600000;
const base = Math.ceil(Date.now() / hour) * hour + 5 * 24 * hour;
const slot = (leadId, offset = 0) => ({
  leadId,
  startAt: new Date(base + offset * hour).toISOString(),
  endAt: new Date(base + (offset + 1) * hour).toISOString(),
});
async function stored(s) {
  return (
    await owner.$queryRawUnsafe(
      "SELECT state FROM property.documents WHERE workspace_id=$1::uuid AND generation=$2",
      s.packet.workspaceId,
      s.packet.generation,
    )
  )[0].state;
}

await test("new records, a viewing and history persist through another connection", async () => {
  const s = await manager();
  await s.act("listing.create", listing);
  const property = s.packet.state.listings.find(
    (l) => l.title === listing.title,
  );
  const l = await lead(s, property.id, "agent-1");
  await s.act("appointment.schedule", slot(l.id));
  const other = createDatabase();
  try {
    const read = await createRepository(other, propertyModule).read(s.token);
    assert.ok(
      read.state.appointments.some(
        (a) => a.leadId === l.id && a.status === "Scheduled",
      ),
    );
    assert.equal(
      read.state.listings.find((a) => a.id === property.id).priceSen,
      45000000,
    );
    assert.ok(read.state.history.length > 0);
  } finally {
    await other.$disconnect();
  }
});

await test("listing restore persists once across connections and preserves historical associations", async () => {
  const s = await manager();
  const original = s.packet.state.listings.find(
    (item) => item.id === "listing-8",
  );
  const historicalLeads = structuredClone(s.packet.state.leads);
  const historicalViewings = structuredClone(s.packet.state.appointments);
  await s.act("listing.archive", {
    id: original.id,
    version: original.version,
  });
  const archived = s.packet.state.listings.find(
    (item) => item.id === original.id,
  );
  const request = payload(s.packet, "listing.restore", {
    id: archived.id,
    version: archived.version,
  });
  const peer = createDatabase();
  try {
    const other = createRepository(peer, propertyModule);
    await Promise.all([
      repo.act(s.token, request),
      other.act(s.token, request),
    ]);
    const read = await other.read(s.token);
    assert.deepEqual(
      read.state.listings.find((item) => item.id === original.id),
      {
        ...original,
        version: original.version + 2,
        status: "Unavailable",
      },
    );
    assert.deepEqual(read.state.leads, historicalLeads);
    assert.deepEqual(read.state.appointments, historicalViewings);
    assert.equal(
      read.state.history.filter(
        (item) =>
          item.event === "listing.restore" && item.subjectId === original.id,
      ).length,
      1,
    );
    const [audit] = await owner.$queryRawUnsafe(
      "SELECT count(*)::integer AS n FROM platform.audit WHERE workspace_id=$1::uuid AND action='listing.restore'",
      read.workspaceId,
    );
    assert.equal(audit.n, 1);
    await s.act("role", { role: "customer" });
    assert.ok(!s.packet.state.listings.some((item) => item.id === original.id));
    // Retrying an accepted manager action returns only the current role's projection.
    const replay = await other.act(s.token, request);
    assert.deepEqual(replay.state.leads, []);
    assert.ok(!replay.state.listings.some((item) => item.id === original.id));
  } finally {
    await peer.$disconnect();
  }
});

await test("listing restoration rejects unauthorized, foreign, stale-version and stale-generation writes", async () => {
  const s = await manager(),
    other = await manager();
  await s.act("listing.archive", { id: "listing-8", version: 1 });
  const archived = s.packet.state.listings.find(
    (item) => item.id === "listing-8",
  );
  const restore = { id: archived.id, version: archived.version };
  const before = await stored(s);
  for (const role of ["customer", "viewer"]) {
    await s.act("role", { role });
    await assert.rejects(s.act("listing.restore", restore), fails(403));
    assert.deepEqual(await stored(s), before);
  }
  await s.act("role", { role: "manager" });
  await assert.rejects(
    s.act("listing.restore", { ...restore, version: 1 }),
    fails(409),
  );
  await assert.rejects(
    s.act("listing.restore", { id: "listing-1", version: 1 }),
    fails(409),
  );
  await other.act("listing.create", listing);
  const foreign = other.packet.state.listings.find(
    (item) => item.title === listing.title,
  );
  await other.act("listing.archive", {
    id: foreign.id,
    version: foreign.version,
  });
  await assert.rejects(
    s.act("listing.restore", { id: foreign.id, version: 2 }),
    fails(404),
  );
  assert.deepEqual(await stored(s), before);
  const pending = payload(s.packet, "listing.restore", restore);
  await s.act("reset");
  const resetState = await stored(s);
  await assert.rejects(repo.act(s.token, pending), fails(409));
  assert.deepEqual(await stored(s), resetState);
  assert.equal(
    other.packet.state.listings.find((item) => item.id === foreign.id).status,
    "Archived",
  );
});

for (const conflict of ["agent", "listing"]) {
  await test(`concurrent ${conflict} conflict on separate connections admits exactly one claim and allows adjacency`, async () => {
    const s = await manager();
    const first = await lead(s, "listing-1", "agent-1");
    const second = await lead(
      s,
      conflict === "listing" ? "listing-1" : "listing-2",
      conflict === "agent" ? "agent-1" : "agent-2",
    );
    const peer = createDatabase();
    try {
      const other = createRepository(peer, propertyModule);
      const race = await Promise.allSettled([
        repo.act(
          s.token,
          payload(s.packet, "appointment.schedule", slot(first.id)),
        ),
        other.act(
          s.token,
          payload(s.packet, "appointment.schedule", slot(second.id)),
        ),
      ]);
      assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(
        race.find((r) => r.status === "rejected").reason.status,
        409,
      );
      await s.read();
      const active = s.packet.state.appointments.filter((a) =>
        [first.id, second.id].includes(a.leadId),
      );
      assert.equal(active.length, 1);
      const unbooked = active[0].leadId === first.id ? second : first;
      await s.act("appointment.schedule", slot(unbooked.id, 1));
      assert.equal(
        s.packet.state.appointments.filter((a) =>
          [first.id, second.id].includes(a.leadId),
        ).length,
        2,
      );
    } finally {
      await peer.$disconnect();
    }
  });
}

await test("failed rescheduling preserves original slot and cancellation releases it without duplicates", async () => {
  const s = await manager();
  const first = await lead(s, "listing-1", "agent-1"),
    second = await lead(s, "listing-2", "agent-1");
  await s.act("appointment.schedule", slot(first.id));
  await s.act("appointment.schedule", slot(second.id, 2));
  const a = s.packet.state.appointments.find((a) => a.leadId === first.id);
  const b = s.packet.state.appointments.find((a) => a.leadId === second.id);
  const before = await stored(s);
  await assert.rejects(
    s.act("appointment.reschedule", {
      id: b.id,
      version: b.version,
      startAt: a.startAt,
      endAt: a.endAt,
    }),
    fails(409),
  );
  assert.deepEqual(await stored(s), before);
  const cancel = payload(s.packet, "appointment.cancel", {
    id: a.id,
    version: a.version,
  });
  const [one, two] = await Promise.all([
    repo.act(s.token, cancel),
    repo.act(s.token, cancel),
  ]);
  assert.deepEqual(one.state.appointments, two.state.appointments);
  await s.read();
  await s.act("appointment.reschedule", {
    id: b.id,
    version: b.version,
    startAt: a.startAt,
    endAt: a.endAt,
  });
  const result = await stored(s);
  assert.equal(
    result.appointments.find((r) => r.id === a.id).status,
    "Cancelled",
  );
  assert.equal(
    result.appointments.find((r) => r.id === b.id).startAt,
    a.startAt,
  );
  const [audit] = await owner.$queryRawUnsafe(
    "SELECT count(*)::integer AS n FROM platform.audit WHERE workspace_id=$1::uuid AND action='appointment.cancel'",
    s.packet.workspaceId,
  );
  assert.equal(audit.n, 1);
});

await test("database shape and overlap constraints reject malformed writes without disturbing saved state", async () => {
  const s = await manager();
  const l = await lead(s, "listing-1", "agent-1");
  await s.act("appointment.schedule", slot(l.id));
  const before = await stored(s);
  const a = before.appointments.find((a) => a.leadId === l.id);
  for (const change of [
    { ...before, listings: [{ ...before.listings[0], priceSen: 1.5 }] },
    {
      ...before,
      appointments: [...before.appointments, { ...a, id: randomUUID() }],
    },
    {
      ...before,
      appointments: [
        ...before.appointments,
        { ...a, id: randomUUID(), status: "Cancelled", endAt: a.startAt },
      ],
    },
  ]) {
    await assert.rejects(
      owner.$executeRawUnsafe(
        "UPDATE property.documents SET state=$2::jsonb WHERE workspace_id=$1::uuid",
        s.packet.workspaceId,
        JSON.stringify(change),
      ),
    );
  }
  assert.deepEqual(await stored(s), before);
});

await test("manager-only actions, filtered customer and viewer projections and foreign references", async () => {
  const s = await manager(),
    other = await manager();
  await other.act("listing.create", listing);
  const foreign = other.packet.state.listings.find(
    (l) => l.title === listing.title,
  ).id;
  await assert.rejects(
    s.act("lead.create", {
      contactId: "contact-1",
      listingId: foreign,
      agentId: "agent-1",
      source: "Sample",
      notes: "",
    }),
    fails(404),
  );
  await s.act("role", { role: "customer" });
  assert.ok(s.packet.state.listings.length > 0);
  assert.ok(s.packet.state.listings.every((l) => l.status === "Available"));
  for (const key of [
    "contacts",
    "leads",
    "agents",
    "appointments",
    "reminders",
    "history",
  ])
    assert.deepEqual(s.packet.state[key] ?? [], []);
  await assert.rejects(s.act("listing.create", listing), fails(403));
  await s.act("role", { role: "viewer" });
  assert.ok(s.packet.state.analytics);
  assert.deepEqual(s.packet.state.contacts ?? [], []);
  assert.deepEqual(s.packet.state.listings ?? [], []);
  await assert.rejects(
    s.act("appointment.schedule", slot("lead-1")),
    fails(403),
  );
});

await test("runtime RLS fails closed for unscoped, foreign workspace, wrong product and stale generation", async () => {
  const a = await manager(),
    b = await manager();
  assert.deepEqual(
    await runtime.$queryRawUnsafe("SELECT * FROM property.documents"),
    [],
  );
  await runtime.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.workspace',$1,true),set_config('labs.product','property-crm',true),set_config('labs.generation','1',true)",
      a.packet.workspaceId,
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT workspace_id FROM property.documents"),
      [{ workspace_id: a.packet.workspaceId }],
    );
    assert.equal(
      await tx.$executeRawUnsafe(
        "DELETE FROM property.documents WHERE workspace_id=$1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','cafe-pos',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM property.documents"),
      [],
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','property-crm',true),set_config('labs.generation','2',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM property.documents"),
      [],
    );
  });
});

await test("reset racing a schedule rejects stale actions and preserves every other product and visitor", async () => {
  const s = await manager(),
    other = await manager();
  const others = await Promise.all(
    [cafeModule, commerceModule, automationModule].map(async (module) => {
      const repository = createRepository(runtime, module);
      return { repository, session: await repository.start() };
    }),
  );
  const l = await lead(s, "listing-1", "agent-1");
  const old = payload(s.packet, "appointment.schedule", slot(l.id));
  const raced = await Promise.allSettled([
    repo.act(s.token, old),
    s.act("reset"),
  ]);
  assert.equal(raced[1].status, "fulfilled");
  await s.read();
  assert.equal(s.packet.generation, 2);
  assert.ok(!s.packet.state.leads.some((lead) => lead.id === l.id));
  assert.ok(!s.packet.state.appointments.some((a) => a.leadId === l.id));
  await assert.rejects(repo.act(s.token, old), fails(409));
  assert.deepEqual(
    (await repo.read(other.token)).state.leads,
    other.packet.state.leads,
  );
  for (const { repository, session } of others) {
    const read = await repository.read(session.token);
    assert.deepEqual(read.state, session.packet.state);
    await assert.rejects(repo.read(session.token), fails(401));
  }
});

await test("expired sessions cannot reschedule or reset", async () => {
  const s = await manager(),
    before = await stored(s);
  await owner.$executeRawUnsafe(
    "UPDATE platform.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE token_hash=$1",
    tokenHash(s.token),
  );
  await assert.rejects(
    s.act("appointment.schedule", slot("lead-1")),
    fails(401),
  );
  await assert.rejects(s.act("reset"), fails(401));
  assert.deepEqual(await stored(s), before);
});

after(async () => {
  await Promise.all([runtime.$disconnect(), owner.$disconnect()]);
});
