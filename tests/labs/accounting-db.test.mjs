import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import { accountingModule } from "../../packages/accounting/index.ts";
import { propertyModule } from "../../packages/property/index.ts";
loadLocalEnvironment("test");
for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"])
  assert.ok(new URL(process.env[key]).pathname.endsWith("_test"));
const runtime = createDatabase(),
  owner = createDatabase(process.env.MIGRATION_DATABASE_URL);
const repo = createRepository(runtime, accountingModule);
const action = (p, type, args = {}) => ({
  type,
  args,
  generation: p.generation,
  csrf: p.csrf,
  requestId: randomUUID(),
});
const rejects = (status) => (error) => error.status === status;
async function manager(repository = repo) {
  const s = await repository.start();
  s.read = async () => (s.packet = await repository.read(s.token));
  s.act = async (type, args = {}) =>
    (s.packet = await repository.act(s.token, action(s.packet, type, args)));
  await s.act("role", { role: "manager" });
  return s;
}
const post = (s, kind, amountSen = 100000) => ({
  kind,
  date: s.packet.state.today,
  memo: "Fictional integration fixture",
  partyId: ["Invoice", "Bill"].includes(kind)
    ? s.packet.state.parties.find(
        (p) => p.kind === (kind === "Invoice" ? "Customer" : "Supplier"),
      ).id
    : null,
  dueDate: ["Invoice", "Bill"].includes(kind) ? s.packet.state.today : null,
  amountSen,
});
const newest = (before, after, key) =>
  after[key].find((x) => !before[key].some((y) => y.id === x.id));
async function stored(s) {
  return (
    await owner.$queryRawUnsafe(
      "SELECT state FROM accounting.documents WHERE workspace_id=$1::uuid AND generation=$2",
      s.packet.workspaceId,
      s.packet.generation,
    )
  )[0].state;
}

await test("Accounting seed and immutable journals persist across independent connections with reconciled reports", async () => {
  const s = await manager();
  const other = createDatabase();
  try {
    const p = await createRepository(other, accountingModule).read(s.token);
    assert.deepEqual(p.state.journals, s.packet.state.journals);
    const r = p.state.reports;
    assert.equal(r.totalDebitSen, r.totalCreditSen);
    assert.equal(r.balanceDifferenceSen, 0);
    assert.equal(
      r.receivableSen,
      r.aging
        .filter((x) => x.kind === "Invoice")
        .reduce((n, x) => n + x.outstandingSen, 0),
    );
    assert.equal(
      r.payableSen,
      r.aging
        .filter((x) => x.kind === "Bill")
        .reduce((n, x) => n + x.outstandingSen, 0),
    );
  } finally {
    await other.$disconnect();
  }
});

await test("Invoice, partial receipt and credit reconcile persisted AR and sales without duplicate revenue", async () => {
  const s = await manager(),
    initial = s.packet.state.reports;
  let before = s.packet.state;
  await s.act("transaction.post", post(s, "Invoice"));
  let document = newest(before, s.packet.state, "documents");
  await s.act("document.settle", {
    id: document.id,
    version: document.version,
    date: s.packet.state.today,
    amountSen: 30000,
  });
  document = s.packet.state.documents.find((d) => d.id === document.id);
  await s.act("document.credit", {
    id: document.id,
    version: document.version,
    date: s.packet.state.today,
    amountSen: 20000,
    memo: "Fictional price correction",
  });
  await s.read();
  const r = s.packet.state.reports;
  assert.equal(r.receivableSen - initial.receivableSen, 50000);
  assert.equal(r.cashSen - initial.cashSen, 30000);
  assert.equal(r.incomeSen - initial.incomeSen, 80000);
  assert.equal(r.totalDebitSen, r.totalCreditSen);
  assert.equal(r.balanceDifferenceSen, 0);
});

await test("Separate-connection duplicate receipt commits one effect; competing stale settlements cannot overpay", async () => {
  const s = await manager();
  let before = s.packet.state;
  await s.act("transaction.post", post(s, "Invoice", 10000));
  const d = newest(before, s.packet.state, "documents");
  const request = action(s.packet, "document.settle", {
    id: d.id,
    version: d.version,
    date: s.packet.state.today,
    amountSen: 7000,
  });
  const other = createDatabase();
  try {
    await Promise.all([
      repo.act(s.token, request),
      createRepository(other, accountingModule).act(s.token, request),
    ]);
    await s.read();
    const saved = s.packet.state.documents.find((x) => x.id === d.id);
    assert.equal(saved.settledSen, 7000);
    assert.equal(saved.version, d.version + 1);
    const attempts = await Promise.allSettled([
      s.act("document.settle", {
        id: d.id,
        version: saved.version,
        date: s.packet.state.today,
        amountSen: 2000,
      }),
      createRepository(other, accountingModule).act(
        s.token,
        action(s.packet, "document.settle", {
          id: d.id,
          version: saved.version,
          date: s.packet.state.today,
          amountSen: 2000,
        }),
      ),
    ]);
    assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 1);
    await s.read();
    assert.equal(
      s.packet.state.documents.find((x) => x.id === d.id).settledSen,
      9000,
    );
    const [audit] = await owner.$queryRawUnsafe(
      "SELECT count(*)::int AS n FROM platform.audit WHERE workspace_id=$1::uuid AND action='document.settle'",
      s.packet.workspaceId,
    );
    assert.equal(audit.n, 2);
  } finally {
    await other.$disconnect();
  }
});

await test("Balanced constraints and posted-journal immutability reject direct corruption atomically", async () => {
  const s = await manager(),
    before = await stored(s);
  const changed = structuredClone(before);
  changed.journals[0].memo = "Tampered posted journal";
  const unbalanced = structuredClone(before);
  const j = structuredClone(unbalanced.journals[0]);
  j.id = randomUUID();
  j.reference = "INVALID";
  j.lines[0].debitSen += 1;
  unbalanced.journals.push(j);
  const stockMismatch = structuredClone(before);
  stockMismatch.inventory[0].valueSen += 1;
  const controlMismatch = structuredClone(before);
  controlMismatch.documents[0].settledSen += 1;
  for (const state of [changed, unbalanced, stockMismatch, controlMismatch])
    await assert.rejects(
      owner.$executeRawUnsafe(
        "UPDATE accounting.documents SET state=$2::jsonb WHERE workspace_id=$1::uuid",
        s.packet.workspaceId,
        JSON.stringify(state),
      ),
    );
  assert.deepEqual(await stored(s), before);
});

await test("Concurrent reversal appends once and preserves original journal and totals", async () => {
  const s = await manager();
  const initial = s.packet.state.reports;
  const before = s.packet.state;
  await s.act("transaction.post", post(s, "Income", 12345));
  const j = newest(before, s.packet.state, "journals");
  const request = action(s.packet, "journal.reverse", {
    id: j.id,
    date: s.packet.state.today,
    memo: "Fictional controlled correction",
  });
  await Promise.all([repo.act(s.token, request), repo.act(s.token, request)]);
  await s.read();
  assert.deepEqual(
    s.packet.state.journals.find((x) => x.id === j.id),
    j,
  );
  assert.equal(
    s.packet.state.journals.filter((x) => x.reversalOf === j.id).length,
    1,
  );
  assert.equal(s.packet.state.reports.cashSen, initial.cashSen);
  assert.equal(s.packet.state.reports.profitSen, initial.profitSen);
  await assert.rejects(
    s.act("journal.reverse", {
      id: j.id,
      date: s.packet.state.today,
      memo: "Second reversal",
    }),
    rejects(409),
  );
});

await test("Concurrent stock sales cannot oversell or double-consume inventory value", async () => {
  const s = await manager(),
    item = s.packet.state.inventory.find((x) => x.quantity > 0);
  assert.ok(item);
  const initial = s.packet.state.reports;
  const args = {
    id: item.id,
    version: item.version,
    date: s.packet.state.today,
    quantity: item.quantity,
    unitPriceSen: 10000,
  };
  const results = await Promise.allSettled([
    repo.act(s.token, action(s.packet, "inventory.sell", args)),
    repo.act(s.token, action(s.packet, "inventory.sell", args)),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  await s.read();
  const after = s.packet.state.inventory.find((x) => x.id === item.id);
  assert.equal(after.quantity, 0);
  assert.equal(after.valueSen, 0);
  assert.equal(
    initial.inventoryValueSen - s.packet.state.reports.inventoryValueSen,
    item.valueSen,
  );
  assert.equal(s.packet.state.reports.balanceDifferenceSen, 0);
});

await test("RLS and references fail closed across workspace, product and generation; role replay stays redacted", async () => {
  const a = await manager(),
    b = await manager();
  assert.deepEqual(
    await runtime.$queryRawUnsafe("SELECT * FROM accounting.documents"),
    [],
  );
  await runtime.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.workspace',$1,true),set_config('labs.product','accounting-cloud',true),set_config('labs.generation','1',true)",
      a.packet.workspaceId,
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT workspace_id FROM accounting.documents"),
      [{ workspace_id: a.packet.workspaceId }],
    );
    assert.equal(
      await tx.$executeRawUnsafe(
        "DELETE FROM accounting.documents WHERE workspace_id=$1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','property-crm',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM accounting.documents"),
      [],
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','accounting-cloud',true),set_config('labs.generation','999',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM accounting.documents"),
      [],
    );
  });
  await b.act("party.create", {
    name: "Fictional private customer",
    kind: "Customer",
  });
  const foreign = b.packet.state.parties.at(-1).id;
  await assert.rejects(
    a.act("transaction.post", { ...post(a, "Invoice"), partyId: foreign }),
    rejects(404),
  );
  const request = action(a.packet, "transaction.post", post(a, "Income", 100));
  await repo.act(a.token, request);
  await a.read();
  await a.act("role", { role: "viewer" });
  const replay = await repo.act(a.token, request);
  for (const key of [
    "journals",
    "documents",
    "parties",
    "history",
    "inventory",
    "bankTransactions",
  ])
    assert.deepEqual(replay.state[key], []);
  await assert.rejects(
    a.act("transaction.post", post(b, "Income", 100)),
    rejects(403),
  );
});

await test("Accounting reset is generation-scoped and preserves another visitor and Property", async () => {
  const a = await manager(),
    b = await manager(),
    otherRepo = createRepository(runtime, propertyModule),
    property = await manager(otherRepo);
  const otherState = b.packet.state,
    propertyState = property.packet.state;
  const stale = action(a.packet, "transaction.post", post(a, "Income", 1000));
  const generation = a.packet.generation;
  await a.act("reset");
  assert.equal(a.packet.generation, generation + 1);
  await assert.rejects(repo.act(a.token, stale), rejects(409));
  assert.deepEqual(
    (await repo.read(b.token)).state.journals,
    otherState.journals,
  );
  const preserved = (await otherRepo.read(property.token)).state;
  for (const key of ["listings", "leads", "appointments", "history"])
    assert.deepEqual(preserved[key], propertyState[key]);
});
after(async () => {
  await runtime.$disconnect();
  await owner.$disconnect();
});
