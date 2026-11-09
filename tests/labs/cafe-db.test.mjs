import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import { cafeModule } from "../../packages/cafe/index.ts";
import {
  LabsError,
  platformFixture,
} from "../../packages/demo-platform/index.ts";
loadLocalEnvironment("test");
for (const key of ["DATABASE_URL", "MIGRATION_DATABASE_URL"])
  assert.ok(new URL(process.env[key]).pathname.endsWith("_test"));
const db = createDatabase(),
  owner = createDatabase(process.env.MIGRATION_DATABASE_URL),
  repo = createRepository(db, cafeModule);
const fail = (status) => (error) =>
  error instanceof LabsError && error.status === status;
const payload = (p, type, args = {}) => ({
  type,
  args,
  generation: p.generation,
  csrf: p.csrf,
  requestId: randomUUID(),
});
async function visitor(role = "customer") {
  const s = await repo.start();
  s.act = async (type, args = {}) =>
    (s.packet = await repo.act(s.token, payload(s.packet, type, args)));
  if (role !== "customer") await s.act("role", { role });
  return s;
}
const item = (p) => p.state.menu.find((x) => x.id === "kopi-iced");
const orderArgs = { table: 4, lines: [{ itemId: "kopi-iced", qty: 2 }] };
async function stored(s) {
  return (
    await owner.$queryRawUnsafe(
      "SELECT state FROM cafe.documents WHERE workspace_id=$1::uuid AND generation=$2",
      s.packet.workspaceId,
      s.packet.generation,
    )
  )[0].state;
}

await test("one persisted order flows from table to kitchen, payment, stock and net report", async () => {
  const s = await visitor();
  await s.act("order.submit", orderArgs);
  assert.equal(item(s.packet).reserved, 2);
  assert.equal(item(s.packet).onHand, 20);
  const id = s.packet.state.orders[0].id;
  await s.act("role", { role: "kitchen" });
  assert.equal("payment" in s.packet.state.orders[0], false);
  assert.equal("unitPriceSen" in s.packet.state.orders[0].lines[0], false);
  for (const status of ["Preparing", "Ready", "Served"]) {
    await s.act("order.advance", { id });
    assert.equal(s.packet.state.orders[0].status, status);
  }
  await s.act("role", { role: "cashier" });
  await s.act("shift.open", { openingSen: 10000 });
  await s.act("payment.settle", {
    id,
    method: "Cash",
    discountPct: 10,
    tenderSen: 2000,
  });
  const payment = s.packet.state.orders[0].payment;
  assert.equal(payment.totalSen, 1350);
  assert.equal(payment.changeSen, 650);
  assert.equal(item(s.packet).onHand, 18);
  assert.equal(item(s.packet).reserved, 0);
  assert.equal(s.packet.state.totals.netSen, 1350);
  assert.equal(s.packet.state.totals.cashExpectedSen, 11350);
  await s.act("role", { role: "manager" });
  await s.act("refund.full", { id, restock: false });
  assert.equal(item(s.packet).onHand, 18);
  assert.equal(s.packet.state.totals.netSen, 0);
  assert.equal(s.packet.state.totals.cashExpectedSen, 10000);
  await assert.rejects(s.act("refund.full", { id, restock: false }), fail(409));
  await s.act("shift.close");
  assert.equal(s.packet.state.shifts[0].closedCashSen, 10000);
});

await test("two workers cannot settle the same order twice, and idempotent retry produces one audit effect", async () => {
  const s = await visitor("cashier");
  await s.act("order.submit", orderArgs);
  await s.act("shift.open", { openingSen: 10000 });
  const id = s.packet.state.orders[0].id;
  const first = payload(s.packet, "payment.settle", {
    id,
    method: "QR",
    discountPct: 0,
    tenderSen: 0,
  });
  const secondDb = createDatabase();
  try {
    const other = createRepository(secondDb, cafeModule);
    const result = await Promise.allSettled([
      repo.act(s.token, first),
      other.act(s.token, { ...first, requestId: randomUUID() }),
    ]);
    assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
    assert.ok(fail(409)(result.find((x) => x.status === "rejected").reason));
    const current = await repo.read(s.token);
    assert.equal(item(current).onHand, 18);
    const saved = await owner.$queryRawUnsafe(
      "SELECT count(*)::int AS count FROM platform.audit WHERE workspace_id=$1::uuid AND action='payment.settle'",
      s.packet.workspaceId,
    );
    assert.equal(saved[0].count, 1);
    // If the other unique request won, a new attempt remains a conflict. A known
    // successful request in the next workspace exercises retry after reconnection.
  } finally {
    await secondDb.$disconnect();
  }
  const t = await visitor("cashier");
  await t.act("order.submit", orderArgs);
  await t.act("shift.open", { openingSen: 0 });
  const request = payload(t.packet, "payment.settle", {
    id: t.packet.state.orders[0].id,
    method: "Card",
    discountPct: 0,
    tenderSen: 0,
  });
  const committed = await repo.act(t.token, request);
  const retries = await Promise.all([
    repo.act(t.token, request),
    repo.act(t.token, request),
  ]);
  assert.deepEqual(retries, [committed, committed]);
  assert.equal(item(committed).onHand, 18);
});

await test("simulated payment failure and invalid stock adjustment leave the full business aggregate unchanged", async () => {
  const s = await visitor("manager");
  await s.act("order.submit", orderArgs);
  await s.act("shift.open", { openingSen: 0 });
  const before = await stored(s),
    id = s.packet.state.orders[0].id;
  await assert.rejects(
    s.act("payment.settle", {
      id,
      method: "Card",
      discountPct: 0,
      tenderSen: 0,
      simulateFailure: true,
    }),
    fail(409),
  );
  await assert.rejects(
    s.act("inventory.adjust", {
      itemId: "kopi-iced",
      onHand: 1,
      note: "Invalid reservation change",
    }),
    fail(409),
  );
  assert.deepEqual(await stored(s), before);
  assert.equal(
    (
      await owner.$queryRawUnsafe(
        "SELECT count(*)::int AS count FROM platform.audit WHERE workspace_id=$1::uuid AND action IN ('payment.settle','inventory.adjust')",
        s.packet.workspaceId,
      )
    )[0].count,
    0,
  );
});

await test("competing orders reserve the last available item without overselling", async () => {
  const s = await visitor("manager");
  await s.act("inventory.adjust", {
    itemId: "kopi-iced",
    onHand: 1,
    note: "Last unit scenario",
  });
  const args = { table: 1, lines: [{ itemId: "kopi-iced", qty: 1 }] };
  const results = await Promise.allSettled([
    repo.act(s.token, payload(s.packet, "order.submit", args)),
    repo.act(s.token, payload(s.packet, "order.submit", args)),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(fail(409)(results.find((r) => r.status === "rejected").reason));
  const current = await repo.read(s.token);
  assert.equal(item(current).onHand, 1);
  assert.equal(item(current).reserved, 1);
});

await test("cancellation racing payment commits one terminal financial outcome", async () => {
  const s = await visitor("manager");
  await s.act("order.submit", orderArgs);
  await s.act("shift.open", { openingSen: 10000 });
  const id = s.packet.state.orders[0].id;
  const results = await Promise.allSettled([
    repo.act(s.token, payload(s.packet, "order.cancel", { id })),
    repo.act(
      s.token,
      payload(s.packet, "payment.settle", {
        id,
        method: "Cash",
        discountPct: 0,
        tenderSen: 2000,
      }),
    ),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const current = await repo.read(s.token),
    order = current.state.orders[0];
  assert.equal(item(current).reserved, 0);
  assert.equal(item(current).onHand, order.payment ? 18 : 20);
  assert.equal(current.state.totals.netSen, order.payment ? 1500 : 0);
});

await test("prepared cancellation records waste, and sealed goods restock on one full refund", async () => {
  const s = await visitor("manager");
  await s.act("order.submit", orderArgs);
  const id = s.packet.state.orders[0].id;
  await s.act("order.advance", { id });
  await s.act("order.cancel", { id });
  assert.equal(item(s.packet).onHand, 18);
  assert.equal(item(s.packet).reserved, 0);
  assert.equal(
    s.packet.state.movements.filter((m) => m.kind === "Waste").length,
    1,
  );
  await s.act("order.submit", {
    table: 2,
    lines: [{ itemId: "bottled-water", qty: 1 }],
  });
  const retail = s.packet.state.orders[1].id;
  await s.act("shift.open", { openingSen: 0 });
  await s.act("payment.settle", {
    id: retail,
    method: "Card",
    discountPct: 0,
    tenderSen: 0,
  });
  await s.act("refund.full", { id: retail, restock: true });
  assert.equal(
    s.packet.state.menu.find((x) => x.id === "bottled-water").onHand,
    24,
  );
  await assert.rejects(s.act("order.advance", { id: retail }), fail(409));
});

await test("Cafe reset and permissions cannot affect another visitor or legacy-platform fixture", async () => {
  const a = await visitor("manager"),
    b = await visitor("manager");
  const fixture = createRepository(db, platformFixture),
    f = await fixture.start();
  await a.act("order.submit", orderArgs);
  await b.act("order.submit", orderArgs);
  const stale = payload(a.packet, "order.submit", orderArgs);
  await a.act("reset");
  assert.equal(a.packet.state.orders.length, 0);
  assert.equal(item(a.packet).onHand, 20);
  await assert.rejects(repo.act(a.token, stale), fail(409));
  assert.equal((await repo.read(b.token)).state.orders.length, 1);
  assert.equal((await fixture.read(f.token)).state.stock, 1);
  await assert.rejects(repo.read(f.token), fail(401));
  await a.act("role", { role: "customer" });
  await assert.rejects(
    a.act("order.cancel", { id: b.packet.state.orders[0].id }),
    fail(404),
  );
  await assert.rejects(a.act("shift.open", { openingSen: 0 }), fail(403));
  await assert.rejects(
    a.act("inventory.adjust", {
      itemId: "kopi-iced",
      onHand: 50,
      note: "Forbidden",
    }),
    fail(403),
  );
});

await test("database rejects negative stock, missing shape and wrong-product rows", async () => {
  const s = await visitor("manager");
  const snapshot = await stored(s);
  await assert.rejects(
    owner.$executeRawUnsafe(
      "UPDATE cafe.documents SET state=jsonb_set(state,'{menu,0,onHand}','-1') WHERE workspace_id=$1::uuid",
      s.packet.workspaceId,
    ),
  );
  await assert.rejects(
    owner.$executeRawUnsafe(
      "UPDATE cafe.documents SET state='{}'::jsonb WHERE workspace_id=$1::uuid",
      s.packet.workspaceId,
    ),
  );
  await assert.rejects(
    owner.$executeRawUnsafe(
      "INSERT INTO cafe.documents(workspace_id,product,generation,state) VALUES($1::uuid,'wrong-product',2,$2::jsonb)",
      s.packet.workspaceId,
      JSON.stringify(snapshot),
    ),
  );
  assert.deepEqual(await stored(s), snapshot);
  assert.deepEqual(
    await db.$queryRawUnsafe("SELECT * FROM cafe.documents"),
    [],
  );
});

await test("reset racing a Cafe settlement removes only the old generation", async () => {
  const s = await visitor("manager");
  await s.act("order.submit", orderArgs);
  await s.act("shift.open", { openingSen: 0 });
  const id = s.packet.state.orders[0].id;
  const results = await Promise.allSettled([
    repo.act(
      s.token,
      payload(s.packet, "payment.settle", {
        id,
        method: "Card",
        discountPct: 0,
        tenderSen: 0,
      }),
    ),
    repo.act(s.token, payload(s.packet, "reset")),
  ]);
  assert.equal(results[1].status, "fulfilled");
  const fresh = await repo.read(s.token);
  assert.equal(fresh.state.orders.length, 0);
  assert.equal(item(fresh).onHand, 20);
  assert.equal(fresh.state.totals.netSen, 0);
});

after(async () => {
  await Promise.all([db.$disconnect(), owner.$disconnect()]);
});
