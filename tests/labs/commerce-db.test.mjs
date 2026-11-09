import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  createRepository,
  loadLocalEnvironment,
} from "../../packages/database/index.ts";
import { commerceModule } from "../../packages/commerce/index.ts";
import { cafeModule } from "../../packages/cafe/index.ts";
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
const db = createDatabase(),
  owner = createDatabase(process.env.MIGRATION_DATABASE_URL);
const repo = createRepository(db, commerceModule);
const fail = (status) => (error) =>
  error instanceof LabsError && error.status === status;
const payload = (p, type, args = {}) => ({
  type,
  args,
  requestId: randomUUID(),
  generation: p.generation,
  csrf: p.csrf,
});
function bind(s) {
  s.act = async (type, args = {}) =>
    (s.packet = await repo.act(s.token, payload(s.packet, type, args)));
  s.refresh = async () => (s.packet = await repo.read(s.token));
  s.cart = async (productId = "notebook", qty = 1) =>
    s.act("cart.set", { productId, qty, version: s.packet.state.cart.version });
  s.checkout = async (overrides = {}) =>
    s.act("checkout", checkoutArgs(s.packet, overrides));
  return s;
}
const checkoutArgs = (p, overrides = {}) => ({
  cartVersion: p.state.cart.version,
  catalogVersion: p.state.catalogVersion,
  code: "EVOLVE10",
  method: "Card",
  decline: false,
  ...overrides,
});
async function visitor(role = "customer") {
  const s = bind(await repo.start());
  if (role !== "customer") await s.act("role", { role });
  return s;
}
async function stored(s) {
  return (
    await owner.$queryRawUnsafe(
      "SELECT state FROM commerce.documents WHERE workspace_id=$1::uuid AND product='commerce-studio' AND generation=$2",
      s.packet.workspaceId,
      s.packet.generation,
    )
  )[0].state;
}
const stock = (p, id = "notebook") =>
  p.state.products.find((x) => x.id === id).onHand;
async function joinedCustomer(s) {
  // Test-only owner fixture: prove customer projection and shared-stock races
  // without adding an insecure public workspace-joining endpoint.
  const token = newToken();
  await owner.$executeRawUnsafe(
    "INSERT INTO platform.sessions(token_hash,workspace_id,product,role,customer_id,expires_at) VALUES($1,$2::uuid,'commerce-studio','customer',$3::uuid,$4::timestamptz)",
    tokenHash(token),
    s.packet.workspaceId,
    randomUUID(),
    s.packet.expiresAt,
  );
  return bind({ token, packet: await repo.read(token) });
}

await test("persisted product, cart, checkout, fulfilment and refund reconcile through a new connection", async () => {
  const s = await visitor("manager");
  await s.act("product.create", {
    name: "Sample pin",
    category: "Accessories",
    description: "Fictional pin",
    priceSen: 105,
    onHand: 4,
  });
  const id = s.packet.state.products.at(-1).id;
  await s.act("role", { role: "customer" });
  await s.cart(id, 1);
  await s.checkout();
  const o = s.packet.state.orders[0];
  assert.equal(o.subtotalSen, 105);
  assert.equal(o.discountSen, 11);
  assert.equal(o.totalSen, 94);
  assert.equal(stock(s.packet, id), 3);
  assert.equal(s.packet.state.cart.lines.length, 0);
  const otherDb = createDatabase();
  try {
    assert.deepEqual(
      await createRepository(otherDb, commerceModule).read(s.token),
      s.packet,
    );
  } finally {
    await otherDb.$disconnect();
  }
  await s.act("role", { role: "manager" });
  await s.act("product.update", {
    id,
    name: "Renamed pin",
    category: "Home",
    description: "Changed sample",
    priceSen: 999,
  });
  assert.equal(s.packet.state.orders[0].lines[0].name, "Sample pin");
  assert.equal(s.packet.state.orders[0].lines[0].unitPriceSen, 105);
  for (const status of ["Packed", "Shipped", "Delivered"])
    await s.act("order.advance", { id: o.id, status });
  await assert.rejects(
    s.act("refund.full", { id: o.id, restock: true }),
    fail(409),
  );
  await s.act("refund.full", { id: o.id, restock: false });
  assert.equal(s.packet.state.totals.netSen, 0);
  assert.equal(s.packet.state.totals.refundSen, 94);
  assert.equal(stock(s.packet, id), 3);
});

await test("parallel duplicate checkout commits one order, stock deduction, audit and request", async () => {
  const s = await visitor();
  await s.cart("notebook", 2);
  const action = payload(s.packet, "checkout", checkoutArgs(s.packet));
  const second = createDatabase();
  try {
    const results = await Promise.all([
      repo.act(s.token, action),
      createRepository(second, commerceModule).act(s.token, action),
    ]);
    assert.deepEqual(results[0], results[1]);
    s.packet = results[0];
  } finally {
    await second.$disconnect();
  }
  assert.equal(s.packet.state.orders.length, 1);
  assert.equal(stock(s.packet), 22);
  assert.equal((await stored(s)).movements.length, 1);
  const [count] = await owner.$queryRawUnsafe(
    "SELECT count(*)::integer AS n FROM platform.audit WHERE workspace_id=$1::uuid AND action='checkout'",
    s.packet.workspaceId,
  );
  assert.equal(count.n, 1);
  await assert.rejects(
    repo.act(s.token, { ...action, args: { ...action.args, code: "" } }),
    fail(409),
  );
});

await test("two customer carts cannot oversell the last unit; losing cart stays intact", async () => {
  const a = await visitor("manager");
  await a.act("inventory.adjust", {
    id: "notebook",
    delta: -23,
    note: "Last unit race fixture",
  });
  await a.act("role", { role: "customer" });
  const b = await joinedCustomer(a);
  await a.cart();
  await b.cart();
  await a.refresh();
  const result = await Promise.allSettled([
    repo.act(a.token, payload(a.packet, "checkout", checkoutArgs(a.packet))),
    repo.act(b.token, payload(b.packet, "checkout", checkoutArgs(b.packet))),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(result.find((x) => x.status === "rejected").reason.status, 409);
  await a.refresh();
  await b.refresh();
  assert.equal(a.packet.state.orders.length + b.packet.state.orders.length, 1);
  assert.equal(
    a.packet.state.cart.lines.length + b.packet.state.cart.lines.length,
    1,
  );
  assert.equal(stock(a.packet), 0);
  assert.equal((await stored(a)).orders.length, 1);
  assert.ok(!JSON.stringify(a.packet.state).includes(b.packet.customerId));
});

await test("different request IDs cannot submit the same cart twice", async () => {
  const s = await visitor();
  await s.cart();
  const result = await Promise.allSettled([
    repo.act(s.token, payload(s.packet, "checkout", checkoutArgs(s.packet))),
    repo.act(s.token, payload(s.packet, "checkout", checkoutArgs(s.packet))),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  await s.refresh();
  assert.equal(s.packet.state.orders.length, 1);
  assert.equal(stock(s.packet), 23);
});

await test("declines, invalid coupons and client supplied prices cannot mutate persisted state", async () => {
  const s = await visitor();
  await s.cart();
  const before = await stored(s);
  await assert.rejects(s.checkout({ decline: true }), fail(409));
  await assert.rejects(s.checkout({ code: "FREE" }), fail(400));
  await assert.rejects(s.checkout({ totalSen: 1 }), fail(400));
  await assert.rejects(s.checkout({ workspaceId: randomUUID() }), fail(400));
  assert.deepEqual(await stored(s), before);
  await s.checkout();
  assert.equal(s.packet.state.orders[0].totalSen, 1620);
});

await test("catalogue and cart versions reject stale prices, stale quantities and archived goods", async () => {
  const s = await visitor();
  await s.cart();
  const oldCheckout = payload(s.packet, "checkout", checkoutArgs(s.packet));
  const oldCart = payload(s.packet, "cart.set", {
    productId: "notebook",
    qty: 3,
    version: s.packet.state.cart.version,
  });
  await s.cart("notebook", 2);
  await assert.rejects(repo.act(s.token, oldCart), fail(409));
  await s.act("role", { role: "manager" });
  await s.act("product.update", {
    id: "notebook",
    name: "Everyday notebook",
    category: "Stationery",
    description: "New sample price",
    priceSen: 1900,
  });
  await s.act("role", { role: "customer" });
  await assert.rejects(repo.act(s.token, oldCheckout), fail(409));
  assert.equal(s.packet.state.cart.subtotalSen, 3800);
  await s.act("role", { role: "manager" });
  await s.act("product.archive", { id: "notebook", active: false });
  await s.act("role", { role: "customer" });
  assert.equal(
    s.packet.state.products.some((x) => x.id === "notebook"),
    false,
  );
  await assert.rejects(s.checkout(), fail(409));
  await s.cart("notebook", 0);
  assert.equal(s.packet.state.cart.lines.length, 0);
});

await test("seller authorization and response filtering apply on the server and idempotent replay", async () => {
  const s = await visitor("manager");
  const request = payload(s.packet, "inventory.adjust", {
    id: "notebook",
    delta: 1,
    note: "Private seller note",
  });
  await repo.act(s.token, request);
  for (const role of ["customer", "viewer", "cashier", "kitchen"]) {
    await s.act("role", { role });
    await assert.rejects(
      s.act("inventory.adjust", {
        id: "notebook",
        delta: 1,
        note: "Forbidden",
      }),
      fail(403),
    );
    await assert.rejects(
      s.act("product.archive", { id: "notebook", active: false }),
      fail(403),
    );
    const replay = await repo.act(s.token, request);
    assert.equal(replay.role, role);
    assert.equal(replay.state.movements, undefined);
    assert.equal(replay.state.orders.length, 0);
    if (role !== "customer") await assert.rejects(s.cart(), fail(403));
  }
  assert.equal((await stored(s)).products[0].onHand, 25);
});

await test("Commerce sessions, reads, writes and reset are independent from Cafe and other visitors", async () => {
  const a = await visitor(),
    b = await visitor();
  const cafe = createRepository(db, cafeModule),
    c = await cafe.start();
  const cp = await cafe.act(
    c.token,
    payload(c.packet, "order.submit", {
      table: 1,
      lines: [{ itemId: "kopi-iced", qty: 1 }],
    }),
  );
  await a.cart();
  await a.checkout();
  await b.cart("mug", 2);
  const stale = payload(a.packet, "cart.set", {
    productId: "mug",
    qty: 1,
    version: a.packet.state.cart.version,
  });
  await a.act("reset");
  assert.equal(stock(a.packet), 24);
  assert.equal(a.packet.state.orders.length, 0);
  await assert.rejects(repo.act(a.token, stale), fail(409));
  assert.deepEqual(await repo.read(b.token), b.packet);
  assert.deepEqual(await cafe.read(c.token), cp);
  await assert.rejects(repo.read(c.token), fail(401));
  await assert.rejects(cafe.read(a.token), fail(401));
});

await test("reset racing checkout leaves only the fresh generation", async () => {
  const s = await visitor();
  await s.cart();
  const actions = [
    payload(s.packet, "checkout", checkoutArgs(s.packet)),
    payload(s.packet, "reset"),
  ];
  const results = await Promise.allSettled(
    actions.map((a) => repo.act(s.token, a)),
  );
  assert.equal(results[1].status, "fulfilled");
  await s.refresh();
  assert.equal(s.packet.generation, 2);
  assert.equal(stock(s.packet), 24);
  assert.equal(s.packet.state.cart.lines.length, 0);
  assert.equal(s.packet.state.orders.length, 0);
  const rows = await owner.$queryRawUnsafe(
    "SELECT generation FROM commerce.documents WHERE workspace_id=$1::uuid",
    s.packet.workspaceId,
  );
  assert.deepEqual(rows, [{ generation: 2 }]);
});

await test("concurrent refunds restore stock once and overflow failure rolls back all lines", async () => {
  const s = await visitor();
  await s.cart();
  await s.cart("mug", 1);
  await s.checkout();
  const id = s.packet.state.orders[0].id;
  await s.act("role", { role: "manager" });
  await s.act("inventory.adjust", {
    id: "mug",
    delta: 9985,
    note: "Fill capacity",
  });
  const before = await stored(s);
  await assert.rejects(s.act("refund.full", { id, restock: true }), fail(409));
  assert.deepEqual(await stored(s), before);
  await s.act("inventory.adjust", {
    id: "mug",
    delta: -1,
    note: "Make one unit room",
  });
  const result = await Promise.allSettled([
    s.act("refund.full", { id, restock: true }),
    s.act("refund.full", { id, restock: true }),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  await s.refresh();
  assert.equal(stock(s.packet), 24);
  assert.equal(stock(s.packet, "mug"), 10000);
  assert.equal(s.packet.state.totals.netSen, 0);
});

await test("RLS is fail-closed and excludes another workspace, product and generation", async () => {
  const a = await visitor(),
    b = await visitor();
  assert.deepEqual(
    await db.$queryRawUnsafe("SELECT * FROM commerce.documents"),
    [],
  );
  await db.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.workspace',$1,true),set_config('labs.product','commerce-studio',true),set_config('labs.generation','1',true)",
      a.packet.workspaceId,
    );
    const rows = await tx.$queryRawUnsafe(
      "SELECT workspace_id FROM commerce.documents",
    );
    assert.deepEqual(rows, [{ workspace_id: a.packet.workspaceId }]);
    assert.equal(
      await tx.$executeRawUnsafe(
        "DELETE FROM commerce.documents WHERE workspace_id=$1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    assert.equal(
      await tx.$executeRawUnsafe(
        "UPDATE commerce.documents SET generation=2 WHERE workspace_id=$1::uuid",
        b.packet.workspaceId,
      ),
      0,
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','cafe-pos',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM commerce.documents"),
      [],
    );
    await tx.$queryRawUnsafe(
      "SELECT set_config('labs.product','commerce-studio',true),set_config('labs.generation','2',true)",
    );
    assert.deepEqual(
      await tx.$queryRawUnsafe("SELECT * FROM commerce.documents"),
      [],
    );
  });
  await assert.rejects(
    db.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        "SELECT set_config('labs.workspace',$1,true),set_config('labs.product','commerce-studio',true),set_config('labs.generation','1',true)",
        a.packet.workspaceId,
      );
      await tx.$executeRawUnsafe(
        "INSERT INTO commerce.documents(workspace_id,product,generation,state) VALUES($1::uuid,'commerce-studio',2,$2::jsonb)",
        b.packet.workspaceId,
        JSON.stringify(commerceModule.seed()),
      );
    }),
  );
  assert.deepEqual(
    await db.$queryRawUnsafe("SELECT * FROM commerce.documents"),
    [],
  );
});

await test("database constraints reject negative/fractional stock, missing shape and wrong product", async () => {
  const s = await visitor();
  const before = await stored(s);
  for (const invalid of ["-1", "0.5", "10001"])
    await assert.rejects(
      owner.$executeRawUnsafe(
        "UPDATE commerce.documents SET state=jsonb_set(state,'{products,0,onHand}',$2::jsonb) WHERE workspace_id=$1::uuid",
        s.packet.workspaceId,
        invalid,
      ),
    );
  await assert.rejects(
    owner.$executeRawUnsafe(
      "UPDATE commerce.documents SET state='{}'::jsonb WHERE workspace_id=$1::uuid",
      s.packet.workspaceId,
    ),
  );
  await assert.rejects(
    owner.$executeRawUnsafe(
      "INSERT INTO commerce.documents(workspace_id,product,generation,state) VALUES($1::uuid,'cafe-pos',2,$2::jsonb)",
      s.packet.workspaceId,
      JSON.stringify(before),
    ),
  );
  assert.deepEqual(await stored(s), before);
});

await test("expired Commerce session cannot checkout or reset", async () => {
  const s = await visitor();
  await s.cart();
  const before = await stored(s);
  await owner.$executeRawUnsafe(
    "UPDATE platform.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE token_hash=$1",
    tokenHash(s.token),
  );
  await assert.rejects(s.checkout(), fail(401));
  await assert.rejects(s.act("reset"), fail(401));
  assert.deepEqual(await stored(s), before);
});

after(async () => {
  await Promise.all([db.$disconnect(), owner.$disconnect()]);
});
