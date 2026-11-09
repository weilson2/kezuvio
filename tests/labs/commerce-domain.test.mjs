import test from "node:test";
import assert from "node:assert/strict";
import {
  commerceModule as module,
  commerceTotals,
} from "../../packages/commerce/index.ts";
import {
  quoteCommerce,
  parsePriceSen,
} from "../../packages/commerce/pricing.ts";
import { LabsError } from "../../packages/demo-platform/index.ts";

const actor = (role = "customer", customerId = "customer-a") => ({
  role,
  customerId,
});
const apply = (
  state,
  type,
  args = {},
  role = "customer",
  customerId = "customer-a",
) =>
  module.reduce(
    state,
    {
      type,
      args,
      generation: 1,
      requestId: "51b4579b-53e3-4825-8e81-af6d68fb765e",
      csrf: "a".repeat(64),
    },
    actor(role, customerId),
  );
const view = (state, role = "customer", id = "customer-a") =>
  module.project(state, actor(role, id));
const product = (state, id = "notebook") =>
  state.products.find((p) => p.id === id);
const add = (state, qty = 2, id = "notebook", customer = "customer-a") =>
  apply(
    state,
    "cart.set",
    {
      productId: id,
      qty,
      version: view(state, "customer", customer).cart.version,
    },
    "customer",
    customer,
  );
const checkoutArgs = (state, overrides = {}, customer = "customer-a") => ({
  cartVersion: view(state, "customer", customer).cart.version,
  catalogVersion: state.catalogVersion,
  code: "EVOLVE10",
  method: "Card",
  decline: false,
  ...overrides,
});
const checkout = (state, overrides = {}, customer = "customer-a") =>
  apply(
    state,
    "checkout",
    checkoutArgs(state, overrides, customer),
    "customer",
    customer,
  );
const updateArgs = (state, overrides = {}) => ({
  id: "notebook",
  name: product(state).name,
  category: product(state).category,
  description: product(state).description,
  priceSen: product(state).priceSen,
  ...overrides,
});
const fail = (
  state,
  type,
  args,
  status,
  role = "customer",
  customer = "customer-a",
) => {
  const before = structuredClone(state);
  assert.throws(
    () => apply(state, type, args, role, customer),
    (error) => error instanceof LabsError && error.status === status,
  );
  assert.deepEqual(
    state,
    before,
    "Rejected actions must preserve their complete source state",
  );
};

test("six independent fictional Commerce products retain legacy catalogue names and integer prices", () => {
  const first = module.seed(),
    second = module.seed();
  assert.deepEqual(first, second);
  assert.equal(module.id, "commerce-studio");
  assert.equal(first.products.length, 6);
  assert.equal(first.catalogVersion, 1);
  assert.equal(product(first).priceSen, 1800);
  assert.equal(product(first).onHand, 24);
  first.products[0].onHand = 0;
  assert.equal(second.products[0].onHand, 24);
});

test("money conversion rejects excess precision and discounts round half up at the whole order", () => {
  assert.deepEqual(quoteCommerce(5, "EVOLVE10"), {
    discountSen: 1,
    totalSen: 4,
  });
  assert.deepEqual(quoteCommerce(15, "EVOLVE10"), {
    discountSen: 2,
    totalSen: 13,
  });
  assert.deepEqual(quoteCommerce(3600, "EVOLVE10"), {
    discountSen: 360,
    totalSen: 3240,
  });
  assert.deepEqual(quoteCommerce(3600, ""), { discountSen: 0, totalSen: 3600 });
  for (const [input, expected] of [
    ["0.01", 1],
    ["18", 1800],
    ["18.1", 1810],
    ["10000.00", 1000000],
  ])
    assert.equal(parsePriceSen(input), expected);
  for (const input of [
    "1.001",
    "-1",
    "NaN",
    "Infinity",
    "1e2",
    " 1",
    "1.",
    ".5",
    "0",
    "10000.01",
  ])
    assert.throws(() => parsePriceSen(input));
});

test("manager creates and edits products, archives reversibly, and audits opening stock", () => {
  let state = module.seed();
  const original = structuredClone(state);
  state = apply(
    state,
    "product.create",
    {
      name: " Sample bowl ",
      category: "Home",
      description: "Fictional bowl.",
      priceSen: 2500,
      onHand: 3,
    },
    "manager",
  );
  const created = state.products.at(-1);
  assert.equal(created.name, "Sample bowl");
  assert.equal(state.catalogVersion, 2);
  assert.equal(state.movements[0].qty, 3);
  assert.equal(state.movements[0].productId, created.id);
  assert.deepEqual(original, module.seed());
  state = apply(
    state,
    "product.update",
    updateArgs(state, { name: "Renamed notebook", priceSen: 1900 }),
    "manager",
  );
  assert.equal(product(state).priceSen, 1900);
  state = apply(
    state,
    "product.archive",
    { id: "notebook", active: false },
    "manager",
  );
  assert.equal(
    view(state).products.some((p) => p.id === "notebook"),
    false,
  );
  assert.equal(view(state, "manager").products.length, 7);
  state = apply(
    state,
    "product.archive",
    { id: "notebook", active: true },
    "manager",
  );
  assert.equal(
    view(state).products.some((p) => p.id === "notebook"),
    true,
  );
});

test("all seller and shopping mutation families enforce roles before input effects", () => {
  const state = module.seed();
  for (const role of ["customer", "kitchen", "cashier", "viewer"]) {
    for (const type of [
      "product.create",
      "product.update",
      "product.archive",
      "inventory.adjust",
      "order.advance",
      "refund.full",
    ])
      fail(state, type, {}, 403, role);
  }
  for (const role of ["manager", "kitchen", "cashier", "viewer"]) {
    for (const type of ["cart.set", "cart.clear", "checkout"])
      fail(state, type, {}, 403, role);
  }
});

test("strict input validation rejects unknown fields, unsafe numbers and unsupported actions", () => {
  const state = module.seed(),
    fields = {
      name: "Sample",
      category: "Home",
      description: "Sample goods",
      priceSen: 100,
      onHand: 1,
    };
  for (const bad of [
    { ...fields, priceSen: 0 },
    { ...fields, priceSen: 1.5 },
    { ...fields, priceSen: 1000001 },
    { ...fields, onHand: -1 },
    { ...fields, onHand: 10001 },
    { ...fields, onHand: NaN },
    { ...fields, name: " " },
    { ...fields, name: "a".repeat(81) },
    { ...fields, category: "a".repeat(41) },
    { ...fields, description: "a".repeat(301) },
    { ...fields, product: "cafe-pos" },
  ])
    fail(state, "product.create", bad, 400, "manager");
  fail(
    state,
    "product.update",
    updateArgs(state, { id: "missing" }),
    404,
    "manager",
  );
  fail(
    state,
    "product.archive",
    { id: "notebook", active: "false" },
    400,
    "manager",
  );
  fail(
    state,
    "cart.set",
    { productId: "notebook", qty: 1, version: 0, customerId: "customer-b" },
    400,
  );
  fail(state, "cart.set", { productId: "notebook", qty: 0.5, version: 0 }, 400);
  fail(state, "product.delete", { id: "notebook" }, 400, "manager");
});

test("cart quantities persist per customer and every edit uses an optimistic version", () => {
  let state = add(module.seed());
  assert.deepEqual(view(state).cart, {
    version: 1,
    lines: [
      {
        productId: "notebook",
        name: "Everyday notebook",
        qty: 2,
        unitPriceSen: 1800,
      },
    ],
    subtotalSen: 3600,
  });
  assert.equal(product(state).onHand, 24, "A cart does not reserve stock");
  assert.deepEqual(view(state, "customer", "customer-b").cart, {
    version: 0,
    lines: [],
    subtotalSen: 0,
  });
  fail(state, "cart.set", { productId: "notebook", qty: 3, version: 0 }, 409);
  state = add(state, 1, "mug", "customer-b");
  state = add(state, 0);
  assert.equal(view(state).cart.lines.length, 0);
  assert.equal(view(state).cart.version, 2);
  assert.equal(
    view(state, "customer", "customer-b").cart.lines[0].productId,
    "mug",
  );
  state = add(state, 1);
  state = apply(state, "cart.clear", { version: view(state).cart.version });
  assert.equal(view(state).cart.lines.length, 0);
  assert.equal(view(state).cart.version, 4);
});

test("archived and unavailable products cannot be added but can be removed from old carts", () => {
  let state = add(module.seed());
  state = apply(
    state,
    "product.archive",
    { id: "notebook", active: false },
    "manager",
  );
  fail(state, "cart.set", { productId: "notebook", qty: 1, version: 1 }, 409);
  fail(state, "checkout", checkoutArgs(state), 409);
  state = add(state, 0);
  assert.equal(view(state).cart.lines.length, 0);
  fail(state, "cart.set", { productId: "mug", qty: 17, version: 2 }, 409);
});

test("checkout consumes live stock once, snapshots prices, clears only buyer cart and reconciles coupon totals", () => {
  let state = add(add(module.seed(), 1, "mug", "customer-b"));
  const source = structuredClone(state);
  state = checkout(state);
  assert.equal(source.orders.length, 0);
  assert.equal(state.orders.length, 1);
  assert.deepEqual(state.orders[0].lines, [
    {
      productId: "notebook",
      name: "Everyday notebook",
      qty: 2,
      unitPriceSen: 1800,
    },
  ]);
  assert.equal(state.orders[0].subtotalSen, 3600);
  assert.equal(state.orders[0].discountSen, 360);
  assert.equal(state.orders[0].totalSen, 3240);
  assert.equal(product(state).onHand, 22);
  assert.equal(view(state).cart.lines.length, 0);
  assert.equal(view(state, "customer", "customer-b").cart.lines.length, 1);
  assert.equal(state.movements[0].qty, -2);
  assert.deepEqual(commerceTotals(state), {
    grossSen: 3600,
    discountSen: 360,
    refundSen: 0,
    netSen: 3240,
    paidOrders: 1,
    activeOrders: 1,
    unitsSold: 2,
    lowStock: 0,
  });
  fail(state, "checkout", checkoutArgs(state), 400);
});

test("checkout rejects obsolete cart and catalogue quotes, including price changes", () => {
  let state = add(module.seed()),
    stale = checkoutArgs(state);
  state = add(state, 3);
  fail(state, "checkout", stale, 409);
  stale = checkoutArgs(state);
  state = apply(
    state,
    "product.update",
    updateArgs(state, { priceSen: 2000 }),
    "manager",
  );
  fail(state, "checkout", stale, 409);
  assert.equal(view(state).cart.subtotalSen, 6000);
  state = checkout(state);
  assert.equal(state.orders[0].totalSen, 5400);
});

test("mock declines and invalid coupon/payment inputs have no stock, order, cart or financial effects", () => {
  const state = add(module.seed());
  fail(state, "checkout", checkoutArgs(state, { decline: true }), 409);
  for (const override of [
    { code: "BAD" },
    { code: "evolve10" },
    { method: "Cash" },
    { decline: "false" },
    { totalSen: 1 },
    { catalogVersion: 1.5 },
  ])
    fail(state, "checkout", checkoutArgs(state, override), 400);
  const paid = checkout(state, { code: "", method: "QR" });
  assert.equal(paid.orders[0].totalSen, 3600);
  assert.equal(paid.orders[0].method, "QR");
});

test("independent customer carts cannot oversell the last unit after another checkout", () => {
  let state = module.seed();
  state = apply(
    state,
    "inventory.adjust",
    { id: "notebook", delta: -23, note: "Last sample unit" },
    "manager",
  );
  state = add(add(state, 1), 1, "notebook", "customer-b");
  state = checkout(state);
  fail(
    state,
    "checkout",
    checkoutArgs(state, {}, "customer-b"),
    409,
    "customer",
    "customer-b",
  );
  assert.equal(product(state).onHand, 0);
  assert.equal(view(state, "customer", "customer-b").cart.lines[0].qty, 1);
  assert.equal(state.orders.length, 1);
});

test("inventory adjustments require a note and cannot create negative or excessive stock", () => {
  let state = module.seed();
  for (const [delta, note, status] of [
    [0, "note", 400],
    [-25, "note", 409],
    [10000, "note", 409],
    [1, "", 400],
    [1, "a".repeat(161), 400],
  ])
    fail(
      state,
      "inventory.adjust",
      { id: "notebook", delta, note },
      status,
      "manager",
    );
  state = apply(
    state,
    "inventory.adjust",
    { id: "notebook", delta: 6, note: "Sample delivery" },
    "manager",
  );
  assert.equal(product(state).onHand, 30);
  assert.deepEqual(
    {
      kind: state.movements[0].kind,
      qty: state.movements[0].qty,
      note: state.movements[0].note,
    },
    { kind: "Adjustment", qty: 6, note: "Sample delivery" },
  );
});

test("fulfilment follows explicit Paid/Packed/Shipped/Delivered steps without skipping or replay", () => {
  let state = checkout(add(module.seed()));
  const id = state.orders[0].id;
  fail(state, "order.advance", { id, status: "Shipped" }, 409, "manager");
  for (const status of ["Packed", "Shipped", "Delivered"]) {
    state = apply(state, "order.advance", { id, status }, "manager");
    assert.equal(state.orders[0].status, status);
    fail(state, "order.advance", { id, status }, 409, "manager");
  }
  assert.equal(commerceTotals(state).activeOrders, 0);
  assert.equal(commerceTotals(state).netSen, 3240);
});

test("full refund restores unshipped stock and reverses net revenue exactly once", () => {
  let state = checkout(add(module.seed()));
  const id = state.orders[0].id;
  state = apply(state, "order.advance", { id, status: "Packed" }, "manager");
  state = apply(state, "refund.full", { id, restock: true }, "manager");
  assert.equal(product(state).onHand, 24);
  assert.equal(state.orders[0].refund.amountSen, 3240);
  assert.equal(commerceTotals(state).netSen, 0);
  assert.equal(commerceTotals(state).refundSen, 3240);
  assert.equal(commerceTotals(state).unitsSold, 0);
  assert.equal(commerceTotals(state).activeOrders, 0);
  fail(state, "refund.full", { id, restock: true }, 409, "manager");
  fail(state, "order.advance", { id, status: "Shipped" }, 409, "manager");
});

test("shipped goods cannot restock but a full no-restock refund is available", () => {
  let state = checkout(add(module.seed()));
  const id = state.orders[0].id;
  for (const status of ["Packed", "Shipped"])
    state = apply(state, "order.advance", { id, status }, "manager");
  fail(state, "refund.full", { id, restock: true }, 409, "manager");
  state = apply(state, "refund.full", { id, restock: false }, "manager");
  assert.equal(product(state).onHand, 22);
  assert.equal(state.movements.length, 1);
  assert.equal(commerceTotals(state).netSen, 0);
});

test("product edits and archive preserve immutable order prices and refund amount", () => {
  let state = checkout(add(module.seed()));
  const originalOrder = structuredClone(state.orders[0]);
  state = apply(
    state,
    "product.update",
    updateArgs(state, { name: "New notebook", priceSen: 9000 }),
    "manager",
  );
  state = apply(
    state,
    "product.archive",
    { id: "notebook", active: false },
    "manager",
  );
  assert.deepEqual(state.orders[0], originalOrder);
  state = apply(
    state,
    "refund.full",
    { id: originalOrder.id, restock: true },
    "manager",
  );
  assert.equal(state.orders[0].refund.amountSen, 3240);
  assert.equal(product(state).onHand, 24);
  assert.equal(product(state).active, false);
});

test("a multi-line restock capacity failure cannot partially restore stock or reverse revenue", () => {
  let state = checkout(add(add(module.seed()), 1, "mug"));
  state = apply(
    state,
    "inventory.adjust",
    { id: "mug", delta: 9985, note: "Fill sample capacity" },
    "manager",
  );
  fail(
    state,
    "refund.full",
    { id: state.orders[0].id, restock: true },
    409,
    "manager",
  );
  assert.equal(product(state).onHand, 22);
  assert.equal(product(state, "mug").onHand, 10000);
});

test("projections isolate customer orders/carts and omit seller details and customer identifiers", () => {
  let state = checkout(add(module.seed()));
  state = checkout(add(state, 1, "mug", "customer-b"), {}, "customer-b");
  state = add(state);
  const a = view(state),
    b = view(state, "customer", "customer-b"),
    manager = view(state, "manager"),
    viewer = view(state, "viewer");
  assert.equal(a.orders.length, 1);
  assert.equal(b.orders.length, 1);
  assert.notEqual(a.orders[0].id, b.orders[0].id);
  assert.equal(a.cart.lines.length, 1);
  assert.equal(b.cart.lines.length, 0);
  assert.equal("totals" in a, false);
  assert.equal("movements" in a, false);
  assert.equal(manager.orders.length, 2);
  assert.equal(manager.cart.lines.length, 0);
  assert.equal(JSON.stringify(manager).includes("customerId"), false);
  assert.equal(viewer.orders.length, 0);
  assert.equal("movements" in viewer, false);
  assert.equal(viewer.totals.netSen, 6120);
  for (const role of ["cashier", "kitchen"]) {
    const projected = view(state, role);
    assert.equal(projected.orders.length, 0);
    assert.equal(projected.cart.lines.length, 0);
    assert.equal("totals" in projected, false);
  }
  a.products[0].onHand = 0;
  manager.orders[0].lines[0].qty = 90;
  assert.equal(product(state).onHand, 22);
  assert.equal(state.orders[0].lines[0].qty, 1);
});

test("bounded product, cart, order and movement histories reject excess activity atomically", () => {
  const products = module.seed();
  while (products.products.length < 100)
    products.products.push({
      ...products.products[0],
      id: `p-${products.products.length}`,
    });
  fail(
    products,
    "product.create",
    {
      name: "Overflow",
      category: "Home",
      description: "Sample",
      priceSen: 100,
      onHand: 0,
    },
    429,
    "manager",
  );
  const carts = module.seed();
  carts.carts = Array.from({ length: 50 }, (_, i) => ({
    customerId: `customer-${i}`,
    version: 0,
    lines: [],
  }));
  fail(carts, "cart.set", { productId: "notebook", qty: 1, version: 0 }, 429);
  let orders = checkout(add(module.seed()));
  orders.orders = Array.from({ length: 50 }, (_, i) => ({
    ...orders.orders[0],
    id: `order-${i}`,
  }));
  orders = add(orders);
  fail(orders, "checkout", checkoutArgs(orders), 429);
  const movements = add(module.seed());
  movements.movements = Array.from({ length: 2000 }, (_, i) => ({
    id: `move-${i}`,
    productId: "notebook",
    kind: "Adjustment",
    qty: 1,
    note: "Sample",
    at: "2026-11-09T00:00:00.000Z",
  }));
  fail(movements, "checkout", checkoutArgs(movements), 429);
  fail(
    movements,
    "inventory.adjust",
    { id: "notebook", delta: 1, note: "Sample" },
    429,
    "manager",
  );
});
