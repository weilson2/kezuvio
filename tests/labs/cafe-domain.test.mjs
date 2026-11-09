import test from "node:test";
import assert from "node:assert/strict";
import { cafeModule, totals } from "../../packages/cafe/index.ts";
import { LabsError } from "../../packages/demo-platform/index.ts";

const actor = (role = "manager", customerId = "customer-a") => ({
  role,
  customerId,
});
const apply = (
  state,
  type,
  args = {},
  role = "manager",
  customerId = "customer-a",
) =>
  cafeModule.reduce(
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
const item = (state, id = "kopi-iced") =>
  state.menu.find((entry) => entry.id === id);
const submit = (
  state,
  qty = 2,
  itemId = "kopi-iced",
  role = "customer",
  customerId = "customer-a",
) =>
  apply(
    state,
    "order.submit",
    { table: 1, lines: [{ itemId, qty }] },
    role,
    customerId,
  );
const open = (state, openingSen = 10000) =>
  apply(state, "shift.open", { openingSen });
const pay = (state, overrides = {}, index = 0, role = "cashier") =>
  apply(
    state,
    "payment.settle",
    {
      id: state.orders[index].id,
      method: "Cash",
      discountPct: 10,
      tenderSen: 2000,
      ...overrides,
    },
    role,
  );
const fail = (
  state,
  type,
  args,
  status,
  role = "manager",
  customerId = "customer-a",
) => {
  const before = structuredClone(state);
  assert.throws(
    () => apply(state, type, args, role, customerId),
    (error) => error instanceof LabsError && error.status === status,
  );
  assert.deepEqual(
    state,
    before,
    "Rejected action must leave every source field unchanged",
  );
};
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};

test("seed is deterministic, detached and contains ten bounded fictional SKUs", () => {
  const first = cafeModule.seed();
  assert.deepEqual(first, cafeModule.seed());
  assert.equal(first.menu.length, 10);
  assert.equal(item(first).priceSen, 750);
  assert.equal(item(first).onHand, 20);
  assert.equal(item(first, "bottled-water").restockable, true);
  first.menu[0].onHand = 0;
  assert.equal(item(cafeModule.seed()).onHand, 20);
});

test("ordering merges duplicate SKU lines, snapshots prices and reserves without consuming stock", () => {
  const seed = freeze(cafeModule.seed());
  const state = apply(
    seed,
    "order.submit",
    {
      table: 6,
      lines: [
        { itemId: "kopi-iced", qty: 1 },
        { itemId: "kopi-iced", qty: 2 },
      ],
    },
    "customer",
  );
  assert.equal(state.orders.length, 1);
  assert.equal(state.orders[0].lines.length, 1);
  assert.equal(state.orders[0].lines[0].qty, 3);
  assert.equal(state.orders[0].subtotalSen, 2250);
  assert.equal(state.orders[0].status, "Received");
  assert.equal(state.orders[0].number, 1);
  assert.equal(state.nextOrder, 2);
  assert.equal(item(state).onHand, 20);
  assert.equal(item(state).reserved, 3);
  assert.equal(item(seed).reserved, 0);
  assert.match(state.orders[0].createdAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("insufficient available stock rejects the entire multi-line order without partial reservations", () => {
  const seed = cafeModule.seed();
  fail(
    seed,
    "order.submit",
    {
      table: 1,
      lines: [
        { itemId: "kopi-iced", qty: 1 },
        { itemId: "chicken-toast", qty: 11 },
      ],
    },
    409,
    "customer",
  );
  const reserved = submit(seed, 20);
  fail(
    reserved,
    "order.submit",
    { table: 2, lines: [{ itemId: "kopi-iced", qty: 1 }] },
    409,
    "customer",
  );
  assert.equal(item(reserved).onHand - item(reserved).reserved, 0);
});

test("ordering rejects malformed lines, table bounds, duplicate overflow and client price overrides", () => {
  const seed = cafeModule.seed();
  const valid = { table: 1, lines: [{ itemId: "kopi-iced", qty: 1 }] };
  for (const table of [0, 7, 1.5, "1", NaN])
    fail(seed, "order.submit", { ...valid, table }, 400, "customer");
  for (const qty of [
    0,
    -1,
    21,
    1.2,
    "2",
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    fail(
      seed,
      "order.submit",
      { ...valid, lines: [{ itemId: "kopi-iced", qty }] },
      400,
      "customer",
    );
  }
  for (const lines of [
    null,
    [],
    {},
    new Array(21).fill(valid.lines[0]),
    [null],
    [["kopi-iced"]],
    [{ itemId: "kopi-iced", qty: 1, priceSen: 0 }],
    [{ itemId: "kopi-iced" }],
  ]) {
    fail(seed, "order.submit", { table: 1, lines }, 400, "customer");
  }
  fail(
    seed,
    "order.submit",
    {
      ...valid,
      lines: [
        { itemId: "kopi-iced", qty: 11 },
        { itemId: "kopi-iced", qty: 10 },
      ],
    },
    400,
    "customer",
  );
  fail(
    seed,
    "order.submit",
    { ...valid, customerId: "somebody-else" },
    400,
    "customer",
  );
  fail(
    seed,
    "order.submit",
    { ...valid, lines: [{ itemId: "missing", qty: 1 }] },
    404,
    "customer",
  );
});

test("all mutation families enforce their simulated role permission on the server", () => {
  const state = open(submit(cafeModule.seed()));
  const id = state.orders[0].id;
  const cases = [
    [
      "order.submit",
      { table: 1, lines: [{ itemId: "kopi-iced", qty: 1 }] },
      ["kitchen", "viewer"],
    ],
    ["order.advance", { id }, ["customer", "cashier", "viewer"]],
    ["order.cancel", { id }, ["kitchen", "viewer"]],
    ["shift.open", { openingSen: 0 }, ["customer", "kitchen", "viewer"]],
    ["shift.close", {}, ["customer", "kitchen", "viewer"]],
    [
      "payment.settle",
      { id, method: "Cash", discountPct: 0, tenderSen: 2000 },
      ["customer", "kitchen", "viewer"],
    ],
    [
      "refund.full",
      { id, restock: false },
      ["customer", "kitchen", "cashier", "viewer"],
    ],
    [
      "inventory.adjust",
      { itemId: "kopi-iced", onHand: 25, note: "Counted" },
      ["customer", "kitchen", "cashier", "viewer"],
    ],
  ];
  for (const [type, args, denied] of cases)
    for (const role of denied) fail(state, type, args, 403, role);
});

test("kitchen progresses sequentially through Received, Preparing, Ready and Served", () => {
  let state = submit(cafeModule.seed());
  const id = state.orders[0].id;
  for (const status of ["Preparing", "Ready", "Served"]) {
    state = apply(freeze(state), "order.advance", { id }, "kitchen");
    assert.equal(state.orders[0].status, status);
  }
  fail(state, "order.advance", { id }, 409, "kitchen");
  assert.equal(item(state).reserved, 2);
  assert.equal(item(state).onHand, 20);
});

test("unprepared unpaid cancellation releases stock once and respects customer ownership", () => {
  const original = submit(cafeModule.seed());
  const id = original.orders[0].id;
  fail(original, "order.cancel", { id }, 403, "customer", "customer-b");
  const cancelled = apply(freeze(original), "order.cancel", { id }, "customer");
  assert.equal(cancelled.orders[0].status, "Cancelled");
  assert.equal(item(cancelled).reserved, 0);
  assert.equal(item(cancelled).onHand, 20);
  assert.equal(cancelled.movements.length, 0);
  fail(cancelled, "order.cancel", { id }, 409);
  fail(cancelled, "order.advance", { id }, 409, "kitchen");
  const opened = open(cancelled);
  fail(
    opened,
    "payment.settle",
    { id, method: "QR", discountPct: 0, tenderSen: 0 },
    409,
    "cashier",
  );
});

test("prepared unpaid cancellation requires manager and records waste without returning availability", () => {
  const original = submit(cafeModule.seed());
  const id = original.orders[0].id;
  const prepared = apply(original, "order.advance", { id }, "kitchen");
  fail(prepared, "order.cancel", { id }, 403, "customer");
  fail(prepared, "order.cancel", { id }, 403, "cashier");
  const cancelled = apply(prepared, "order.cancel", { id });
  assert.equal(item(cancelled).onHand, 18);
  assert.equal(item(cancelled).reserved, 0);
  assert.equal(cancelled.movements.length, 1);
  assert.equal(cancelled.movements[0].kind, "Waste");
  assert.equal(cancelled.movements[0].qty, -2);
  assert.equal(totals(cancelled).netSen, 0);
});

test("cash example charges RM13.50 with RM6.50 change and consumes reserved stock once", () => {
  const ordered = open(submit(cafeModule.seed()));
  const paid = pay(freeze(ordered));
  const payment = paid.orders[0].payment;
  assert.equal(payment.discountSen, 150);
  assert.equal(payment.totalSen, 1350);
  assert.equal(payment.tenderSen, 2000);
  assert.equal(payment.changeSen, 650);
  assert.equal(item(paid).onHand, 18);
  assert.equal(item(paid).reserved, 0);
  assert.equal(
    paid.movements.filter((entry) => entry.kind === "Sale").length,
    1,
  );
  assert.deepEqual(totals(paid), {
    grossSen: 1500,
    discountSen: 150,
    refundSen: 0,
    netSen: 1350,
    paidOrders: 1,
    cashExpectedSen: 11350,
  });
  const id = paid.orders[0].id;
  fail(
    paid,
    "payment.settle",
    { id, method: "Cash", discountPct: 10, tenderSen: 2000 },
    409,
    "cashier",
  );
  fail(paid, "order.cancel", { id }, 409);
});

test("payments use accepted price snapshots and round percentage discounts half up in integer sen", () => {
  const original = open(submit(cafeModule.seed(), 1));
  item(original).priceSen = 9999;
  const paid = pay(original, { discountPct: 1 });
  assert.equal(paid.orders[0].subtotalSen, 750);
  assert.equal(paid.orders[0].payment.discountSen, 8);
  assert.equal(paid.orders[0].payment.totalSen, 742);
  assert.equal(paid.orders[0].payment.changeSen, 1258);
});

test("mock payment failures, insufficient tender and absent shifts leave all stock and financial values unchanged", () => {
  const noShift = submit(cafeModule.seed());
  const id = noShift.orders[0].id;
  const args = { id, method: "Cash", discountPct: 0, tenderSen: 2000 };
  fail(noShift, "payment.settle", args, 409, "cashier");
  const state = open(noShift);
  fail(
    state,
    "payment.settle",
    { ...args, simulateFailure: true },
    409,
    "cashier",
  );
  fail(state, "payment.settle", { ...args, tenderSen: 100 }, 400, "cashier");
  fail(
    state,
    "payment.settle",
    { ...args, simulateFailure: "yes" },
    400,
    "cashier",
  );
  fail(
    state,
    "payment.settle",
    { ...args, method: "Live payment" },
    400,
    "cashier",
  );
  fail(state, "payment.settle", { ...args, tenderSen: -1 }, 400, "cashier");
  fail(
    state,
    "payment.settle",
    { ...args, tenderSen: 100_000_001 },
    400,
    "cashier",
  );
  fail(state, "payment.settle", { ...args, totalSen: 1 }, 400, "cashier");
});

test("cashier discounts stop at ten percent, manager discounts at thirty percent", () => {
  const state = open(submit(cafeModule.seed()));
  const args = {
    id: state.orders[0].id,
    method: "Cash",
    discountPct: 11,
    tenderSen: 2000,
  };
  fail(state, "payment.settle", args, 403, "cashier");
  for (const discountPct of [-1, 31, 1.5, "10"])
    fail(state, "payment.settle", { ...args, discountPct }, 400);
  const paid = pay(state, { discountPct: 30 }, 0, "manager");
  assert.equal(paid.orders[0].payment.totalSen, 1050);
});

test("Card and QR settle without cash change or changes to expected cash", () => {
  for (const method of ["Card", "QR"]) {
    const paid = pay(open(submit(cafeModule.seed())), { method, tenderSen: 0 });
    assert.equal(paid.orders[0].payment.tenderSen, 1350);
    assert.equal(paid.orders[0].payment.changeSen, 0);
    assert.equal(totals(paid).cashExpectedSen, 10000);
    const refunded = apply(paid, "refund.full", {
      id: paid.orders[0].id,
      restock: false,
    });
    assert.equal(totals(refunded).netSen, 0);
    assert.equal(totals(refunded).cashExpectedSen, 10000);
  }
});

test("full no-restock refund reverses net sales once with no second physical stock deduction", () => {
  const paid = pay(open(submit(cafeModule.seed())));
  const id = paid.orders[0].id;
  const prepared = apply(paid, "order.advance", { id }, "kitchen");
  fail(prepared, "refund.full", { id, restock: true }, 409);
  const refunded = apply(freeze(prepared), "refund.full", {
    id,
    restock: false,
  });
  assert.equal(refunded.orders[0].refund.amountSen, 1350);
  assert.equal(item(refunded).onHand, 18);
  assert.equal(item(refunded).reserved, 0);
  assert.equal(refunded.movements.length, 1);
  assert.deepEqual(totals(refunded), {
    grossSen: 1500,
    discountSen: 150,
    refundSen: 1350,
    netSen: 0,
    paidOrders: 1,
    cashExpectedSen: 10000,
  });
  fail(refunded, "refund.full", { id, restock: false }, 409);
  fail(refunded, "order.advance", { id }, 409, "kitchen");
  fail(
    refunded,
    "payment.settle",
    { id, method: "Cash", discountPct: 0, tenderSen: 2000 },
    409,
    "cashier",
  );
});

test("only sealed, unprepared retail orders may be restocked on a full refund", () => {
  const paid = pay(open(submit(cafeModule.seed(), 2, "bottled-water")), {
    discountPct: 0,
  });
  const id = paid.orders[0].id;
  const refunded = apply(paid, "refund.full", { id, restock: true });
  assert.equal(item(refunded, "bottled-water").onHand, 24);
  assert.equal(item(refunded, "bottled-water").reserved, 0);
  assert.equal(refunded.movements[1].kind, "Restock");
  assert.equal(refunded.movements[1].qty, 2);
  const prepared = apply(paid, "order.advance", { id }, "kitchen");
  fail(prepared, "refund.full", { id, restock: true }, 409);
  const coffee = pay(open(submit(cafeModule.seed())));
  fail(coffee, "refund.full", { id: coffee.orders[0].id, restock: true }, 409);
  fail(paid, "refund.full", { id, restock: "true" }, 400);
  const unpaid = open(submit(cafeModule.seed()));
  fail(unpaid, "refund.full", { id: unpaid.orders[0].id, restock: false }, 409);
});

test("mixed restock eligibility or restock capacity failure cannot return any line partially", () => {
  let mixed = apply(
    cafeModule.seed(),
    "order.submit",
    {
      table: 1,
      lines: [
        { itemId: "bottled-water", qty: 1 },
        { itemId: "kopi-iced", qty: 1 },
      ],
    },
    "customer",
  );
  mixed = pay(open(mixed), { discountPct: 0 });
  fail(mixed, "refund.full", { id: mixed.orders[0].id, restock: true }, 409);
  let capped = pay(open(submit(cafeModule.seed(), 1, "bottled-water")), {
    discountPct: 0,
  });
  capped = apply(capped, "inventory.adjust", {
    itemId: "bottled-water",
    onHand: 10000,
    note: "Demo delivery",
  });
  fail(capped, "refund.full", { id: capped.orders[0].id, restock: true }, 400);
});

test("shift close records expected cash and cross-shift cash refunds affect the issuing shift", () => {
  const paid = pay(open(submit(cafeModule.seed())));
  const firstShift = paid.activeShiftId;
  const id = paid.orders[0].id;
  const closed = apply(paid, "shift.close", {}, "cashier");
  assert.equal(closed.activeShiftId, null);
  assert.equal(closed.shifts[0].closedCashSen, 11350);
  assert.ok(closed.shifts[0].closedAt);
  fail(closed, "shift.close", {}, 409, "cashier");
  fail(closed, "refund.full", { id, restock: false }, 409);
  const second = open(closed, 5000);
  assert.notEqual(second.activeShiftId, firstShift);
  assert.equal(totals(second).cashExpectedSen, 5000);
  const refunded = apply(second, "refund.full", { id, restock: false });
  assert.equal(refunded.orders[0].refund.shiftId, second.activeShiftId);
  assert.equal(totals(refunded).cashExpectedSen, 3650);
  assert.equal(refunded.shifts[0].closedCashSen, 11350);
  assert.equal(apply(refunded, "shift.close").shifts[1].closedCashSen, 3650);
});

test("pending orders survive shift close and opening cash is bounded", () => {
  const seed = cafeModule.seed();
  for (const openingSen of [-1, 1.1, "0", 1000001])
    fail(seed, "shift.open", { openingSen }, 400);
  const state = open(submit(seed));
  fail(state, "shift.open", { openingSen: 0 }, 409);
  const closed = apply(state, "shift.close");
  assert.equal(closed.orders[0].payment, null);
  assert.equal(item(closed).reserved, 2);
  assert.equal(pay(open(closed)).orders[0].payment.totalSen, 1350);
});

test("inventory adjustments enforce reservations, bounded stock and an audit note", () => {
  const state = submit(cafeModule.seed());
  const args = { itemId: "kopi-iced", onHand: 2, note: "Physical count" };
  fail(state, "inventory.adjust", { ...args, onHand: 1 }, 409);
  for (const onHand of [-1, 10001, 1.2, "2", Infinity])
    fail(state, "inventory.adjust", { ...args, onHand }, 400);
  for (const note of ["", "   ", "x".repeat(121), null])
    fail(state, "inventory.adjust", { ...args, note }, 400);
  const changed = apply(freeze(state), "inventory.adjust", args);
  assert.equal(item(changed).onHand, 2);
  assert.equal(item(changed).reserved, 2);
  assert.equal(changed.movements[0].kind, "Adjustment");
  assert.equal(changed.movements[0].qty, -18);
  assert.equal(changed.movements[0].note, "Physical count");
});

test("role projections isolate customers and hide kitchen finances, manager movements and customer identifiers", () => {
  let state = submit(
    cafeModule.seed(),
    1,
    "kopi-iced",
    "customer",
    "customer-a",
  );
  state = submit(state, 1, "bottled-water", "customer", "customer-b");
  state = pay(open(state));
  const customer = cafeModule.project(state, actor("customer", "customer-a"));
  assert.equal(customer.orders.length, 1);
  assert.equal(customer.orders[0].id, state.orders[0].id);
  assert.equal(customer.orders[0].paid, true);
  assert.equal("totals" in customer, false);
  assert.equal("shifts" in customer, false);
  assert.equal("movements" in customer, false);
  const kitchen = cafeModule.project(state, actor("kitchen"));
  assert.equal(kitchen.orders.length, 2);
  for (const order of kitchen.orders) {
    for (const field of ["customerId", "subtotalSen", "payment", "refund"])
      assert.equal(field in order, false);
    assert.equal("unitPriceSen" in order.lines[0], false);
  }
  for (const field of ["totals", "movements", "shifts", "activeShiftId"])
    assert.equal(field in kitchen, false);
  const viewer = cafeModule.project(state, actor("viewer"));
  assert.deepEqual(viewer.orders, []);
  assert.equal(viewer.totals.netSen, 675);
  const cashier = cafeModule.project(state, actor("cashier"));
  assert.ok(cashier.activeShiftId);
  assert.equal("movements" in cashier, false);
  const manager = cafeModule.project(state, actor());
  assert.equal(manager.movements.length, 1);
  for (const view of [customer, kitchen, cashier, manager])
    for (const order of view.orders) assert.equal("customerId" in order, false);
  manager.menu[0].onHand = 0;
  manager.orders[0].lines[0].qty = 99;
  manager.orders[0].payment.totalSen = 1;
  manager.shifts[0].openingSen = 0;
  manager.movements[0].qty = 99;
  assert.equal(item(state).onHand, 19);
  assert.equal(state.orders[0].lines[0].qty, 1);
  assert.equal(state.orders[0].payment.totalSen, 675);
  assert.equal(state.shifts[0].openingSen, 10000);
  assert.equal(state.movements[0].qty, -1);
});

test("bounded order, shift and movement histories reject excessive demo activity atomically", () => {
  const ordered = submit(cafeModule.seed(), 1);
  const tooManyOrders = {
    ...ordered,
    orders: Array.from({ length: 50 }, () =>
      structuredClone(ordered.orders[0]),
    ),
  };
  fail(
    tooManyOrders,
    "order.submit",
    { table: 1, lines: [{ itemId: "kopi-iced", qty: 1 }] },
    429,
  );
  const tooManyShifts = {
    ...cafeModule.seed(),
    shifts: Array.from({ length: 100 }, () => ({
      id: "closed",
      openingSen: 0,
      openedAt: "",
      closedAt: "closed",
      closedCashSen: 0,
    })),
  };
  fail(tooManyShifts, "shift.open", { openingSen: 0 }, 429);
  const tooManyMovements = {
    ...open(ordered),
    movements: Array.from({ length: 2000 }, () => ({
      id: "x",
      itemId: "kopi-iced",
      kind: "Adjustment",
      qty: 0,
      note: "Test fixture",
      at: "",
    })),
  };
  fail(
    tooManyMovements,
    "payment.settle",
    {
      id: ordered.orders[0].id,
      method: "Cash",
      discountPct: 0,
      tenderSen: 2000,
    },
    429,
  );
  fail(cafeModule.seed(), "unknown.action", {}, 400);
});
