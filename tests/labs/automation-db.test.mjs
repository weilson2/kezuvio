import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import {
  automationModule,
  createAutomationModule,
  RUN_LEASE_MS,
} from "../../packages/automation/index.ts";
import { cafeModule } from "../../packages/cafe/index.ts";
import { commerceModule } from "../../packages/commerce/index.ts";
import {
  LabsError,
  newToken,
  tokenHash,
} from "../../packages/demo-platform/index.ts";

loadLocalEnvironment("test");
for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"])
  assert.ok(
    new URL(process.env[key]).pathname.endsWith("_test"),
    "Dedicated test database required",
  );
const runtime = createDatabase(),
  owner = createDatabase(process.env.MIGRATION_DATABASE_URL);
const repo = createRepository(runtime, automationModule);
const fails = (status) => (error) =>
  error instanceof LabsError && error.status === status;
const payload = (p, type, args = {}) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: p.generation,
  csrf: p.csrf,
});
const inquiry = {
  businessName: "Fictional Juniper Studio",
  contactName: "Sample Guest",
  email: "juniper@example.test",
  brief:
    "A website with an appointment booking workflow and a reporting dashboard.",
  budgetSen: 500000,
  timelineWeeks: 8,
};
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
async function submitted(repository = repo) {
  const s = bind(await repository.start(), repository);
  await s.act("inquiry.submit", inquiry);
  await s.act("role", { role: "manager" });
  return s;
}
async function start(s, id = s.packet.state.tasks[0].id) {
  await s.act("task.start", { id });
  return s.packet.state.tasks.find((t) => t.id === id);
}
const finishArgs = (task, fail = false) => ({
  id: task.id,
  runId: task.runId,
  fail,
});
async function draft(s) {
  await s.act("task.finish", finishArgs(await start(s)));
  return s.packet.state.quotes[0];
}
async function approve(s, q) {
  await s.act("quote.approve", {
    id: q.id,
    revision: q.revision,
    note: "Reviewed fictional scope.",
  });
  return s.packet.state.quotes[0];
}
async function stored(s) {
  return (
    await owner.$queryRawUnsafe(
      "SELECT state FROM automation.documents WHERE workspace_id=$1::uuid AND generation=$2",
      s.packet.workspaceId,
      s.packet.generation,
    )
  )[0].state;
}

await test("inquiry, analysis, price snapshot and approved readiness persist through a new connection", async () => {
  const s = await submitted();
  const { rules } = s.packet.state;
  await s.act("rules.update", {
    version: rules.version,
    rates: rules.rates.map(({ key, unitPriceSen }) => ({
      key,
      unitPriceSen: key === "website" ? 190000 : unitPriceSen,
    })),
  });
  const q = await draft(s);
  assert.equal(q.pricingRulesVersion, 2);
  assert.equal(q.lines.find((l) => l.key === "website").unitPriceSen, 190000);
  assert.equal(
    q.totalSen,
    q.lines.reduce((sum, l) => sum + l.quantity * l.unitPriceSen, 0),
  );
  await assert.rejects(
    s.act("quote.queue-ready", { id: q.id, revision: q.revision }),
    fails(409),
  );
  const a = await approve(s, q);
  await s.act("quote.queue-ready", { id: a.id, revision: a.revision });
  const task = await start(s);
  const independent = createDatabase();
  try {
    const other = createRepository(independent, automationModule);
    const p = await other.read(s.token);
    assert.equal(p.state.tasks[0].runId, task.runId);
    const done = await other.act(
      s.token,
      payload(p, "task.finish", finishArgs(task)),
    );
    assert.equal(done.state.quotes[0].status, "Ready");
    assert.equal(done.state.quotes[0].approval.revision, a.revision);
    assert.equal(done.state.tasks[0].status, "Succeeded");
    assert.ok(
      done.state.history.some((h) => h.note.includes("Nothing was sent")),
    );
  } finally {
    await independent.$disconnect();
  }
});

await test("parallel claims and duplicate completions apply analysis and quote effects once", async () => {
  const s = await submitted();
  const id = s.packet.state.tasks[0].id;
  const results = await Promise.allSettled([
    s.act("task.start", { id }),
    s.act("task.start", { id }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.status, 409);
  await s.read();
  const action = payload(
    s.packet,
    "task.finish",
    finishArgs(s.packet.state.tasks[0]),
  );
  const [a, b] = await Promise.all([
    repo.act(s.token, action),
    repo.act(s.token, action),
  ]);
  assert.deepEqual(a.state, b.state);
  assert.equal(a.state.analyses.length, 1);
  assert.equal(a.state.quotes.length, 1);
  assert.equal(
    a.state.history.filter((h) => h.event === "Run succeeded").length,
    1,
  );
  await assert.rejects(
    repo.act(s.token, { ...action, args: { ...action.args, fail: true } }),
    fails(409),
  );
  const [audit] = await owner.$queryRawUnsafe(
    "SELECT count(*)::integer AS n FROM platform.audit WHERE workspace_id=$1::uuid AND action='task.finish'",
    a.workspaceId,
  );
  assert.equal(audit.n, 1);
});

await test("editing a running approved quote invalidates its readiness attempt", async () => {
  const s = await submitted();
  const a = await approve(s, await draft(s));
  await s.act("quote.queue-ready", { id: a.id, revision: a.revision });
  const task = await start(s);
  await s.act("quote.edit", {
    id: a.id,
    revision: a.revision,
    lines: [{ key: "custom", label: "Sample", quantity: 1, unitPriceSen: 105 }],
    discountPct: 10,
  });
  let q = s.packet.state.quotes[0];
  assert.equal(q.totalSen, 94);
  assert.equal(q.status, "Draft");
  assert.equal(q.approval, null);
  await assert.rejects(
    s.act("quote.approve", { id: q.id, revision: a.revision, note: "Stale." }),
    fails(409),
  );
  const state = await stored(s);
  // A superseded run may be failed immediately by the edit or at completion.
  if (state.tasks.find((t) => t.id === task.id).status === "Running")
    await s.act("task.finish", finishArgs(task));
  else await assert.rejects(s.act("task.finish", finishArgs(task)), fails(409));
  assert.equal(
    s.packet.state.tasks.find((t) => t.id === task.id).status,
    "Failed",
  );
  q = s.packet.state.quotes[0];
  assert.equal(q.status, "Draft");
  await assert.rejects(s.act("task.retry", { id: task.id }), fails(409));
});

await test("expired lease recovery rotates the run token and rejects a stale completion", async () => {
  let now = Date.now();
  const s = await submitted(
    createRepository(
      runtime,
      createAutomationModule(() => now),
    ),
  );
  const first = await start(s);
  await assert.rejects(s.act("task.recover", { id: first.id }), fails(409));
  now += RUN_LEASE_MS + 1;
  await assert.rejects(s.act("task.finish", finishArgs(first)), fails(409));
  await s.act("task.recover", { id: first.id });
  await s.act("task.retry", { id: first.id });
  const second = await start(s, first.id);
  assert.notEqual(first.runId, second.runId);
  assert.equal(second.attempts, 2);
  await assert.rejects(s.act("task.finish", finishArgs(first)), fails(409));
  await s.act("task.finish", finishArgs(second));
  assert.equal(s.packet.state.quotes.length, 1);
  assert.ok(s.packet.state.history.some((h) => h.event === "Run recovered"));
});

await test("another customer in the same workspace cannot see private inquiry, review or task data", async () => {
  const s = await submitted();
  await approve(s, await draft(s));
  await s.act("followup.create", {
    inquiryId: s.packet.state.inquiries[0].id,
    dueAt: new Date(Date.now() - 10000).toISOString(),
    note: "Manager-only reminder.",
  });
  const token = newToken();
  await owner.$executeRawUnsafe(
    "INSERT INTO platform.sessions(token_hash,workspace_id,product,role,customer_id,expires_at) VALUES($1,$2::uuid,'automation-hub','customer',$3::uuid,$4::timestamptz)",
    tokenHash(token),
    s.packet.workspaceId,
    randomUUID(),
    s.packet.expiresAt,
  );
  const other = await repo.read(token);
  for (const key of ["inquiries", "analyses", "quotes", "tasks", "followups"])
    assert.deepEqual(other.state[key], []);
  await assert.rejects(
    repo.act(
      token,
      payload(other, "followup.complete", {
        id: s.packet.state.followups[0].id,
        note: "Forbidden",
      }),
    ),
    fails(403),
  );
  await s.act("role", { role: "customer" });
  assert.equal(s.packet.state.quotes.length, 1);
  assert.ok(
    !JSON.stringify(s.packet.state).includes("Reviewed fictional scope."),
  );
  assert.equal(s.packet.state.history, undefined);
  await s.act("role", { role: "viewer" });
  assert.deepEqual(s.packet.state.quotes, []);
  assert.equal(s.packet.state.totals.overdueFollowups, 1);
});

await test("reset racing completion discards the old generation without touching other products", async () => {
  const s = await submitted(),
    other = await submitted();
  const cafe = createRepository(runtime, cafeModule),
    commerce = createRepository(runtime, commerceModule);
  const c = await cafe.start(),
    e = await commerce.start();
  const running = await start(s);
  const old = payload(s.packet, "task.finish", finishArgs(running));
  const actions = await Promise.allSettled([
    repo.act(s.token, old),
    s.act("reset"),
  ]);
  assert.equal(actions[1].status, "fulfilled");
  await s.read();
  assert.equal(s.packet.generation, 2);
  assert.deepEqual(s.packet.state.tasks, []);
  assert.deepEqual(s.packet.state.quotes, []);
  await assert.rejects(repo.act(s.token, old), fails(409));
  assert.deepEqual(await repo.read(other.token), other.packet);
  assert.deepEqual(await cafe.read(c.token), c.packet);
  assert.deepEqual(await commerce.read(e.token), e.packet);
  await assert.rejects(repo.read(c.token), fails(401));
  await assert.rejects(commerce.read(s.token), fails(401));
});

await test("runtime row policy filters workspace, product and generation and blocks cross-scope deletes", async () => {
  const a = await submitted(),
    b = await submitted();
  assert.deepEqual(
    await runtime.$queryRawUnsafe("SELECT * FROM automation.documents"),
    [],
  );
  await runtime.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.workspace',$1,true),set_config('labs.product','automation-hub',true),set_config('labs.generation','1',true)",
      a.packet.workspaceId,
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT workspace_id FROM automation.documents"),
      [{ workspace_id: a.packet.workspaceId }],
    );
    assert.equal(
      await tx.$executeRawUnsafe(
        "DELETE FROM automation.documents WHERE workspace_id=$1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','commerce-studio',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM automation.documents"),
      [],
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','automation-hub',true),set_config('labs.generation','2',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM automation.documents"),
      [],
    );
  });
});

await test("database rejects unapproved ready quotes and inconsistent totals", async () => {
  const s = await submitted();
  await draft(s);
  const before = await stored(s);
  for (const [path, value] of [
    ["{quotes,0,status}", '"Ready"'],
    ["{quotes,0,totalSen}", "1"],
    ["{quotes,0,lines,0,quantity}", "0.5"],
  ]) {
    await assert.rejects(
      owner.$executeRawUnsafe(
        "UPDATE automation.documents SET state=jsonb_set(state,$2::text[],$3::jsonb) WHERE workspace_id=$1::uuid",
        s.packet.workspaceId,
        path,
        value,
      ),
    );
  }
  assert.deepEqual(await stored(s), before);
});

after(async () => {
  await Promise.all([runtime.$disconnect(), owner.$disconnect()]);
});
