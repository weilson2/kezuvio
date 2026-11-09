import { randomUUID } from "node:crypto";
import { quotePayment } from "./pricing.ts";
import {
  LabsError,
  assertRole,
  integer,
  type ProductModule,
} from "../demo-platform/index.ts";

export type CafeItem = {
  id: string;
  name: string;
  category: "Drinks" | "Food" | "Bakery";
  variant: string;
  priceSen: number;
  onHand: number;
  reserved: number;
  restockable: boolean;
};
export type CafeLine = {
  itemId: string;
  name: string;
  variant: string;
  qty: number;
  unitPriceSen: number;
};
export type Payment = {
  method: "Cash" | "Card" | "QR";
  discountPct: number;
  discountSen: number;
  totalSen: number;
  tenderSen: number;
  changeSen: number;
  shiftId: string;
  paidAt: string;
};
export type Refund = {
  amountSen: number;
  restock: boolean;
  at: string;
  shiftId: string;
};
export type CafeOrder = {
  id: string;
  number: number;
  customerId: string;
  table: number;
  status: "Received" | "Preparing" | "Ready" | "Served" | "Cancelled";
  lines: CafeLine[];
  subtotalSen: number;
  createdAt: string;
  payment: Payment | null;
  refund: Refund | null;
};
export type Shift = {
  id: string;
  openingSen: number;
  openedAt: string;
  closedAt: string | null;
  closedCashSen: number | null;
};
export type Movement = {
  id: string;
  itemId: string;
  kind: "Sale" | "Restock" | "Waste" | "Adjustment";
  qty: number;
  note: string;
  at: string;
};
export type CafeState = {
  menu: CafeItem[];
  orders: CafeOrder[];
  shifts: Shift[];
  activeShiftId: string | null;
  movements: Movement[];
  nextOrder: number;
};
export type CafeTotals = {
  grossSen: number;
  discountSen: number;
  refundSen: number;
  netSen: number;
  paidOrders: number;
  cashExpectedSen: number;
};
export type CafeOrderView = Omit<
  CafeOrder,
  "customerId" | "lines" | "subtotalSen" | "payment" | "refund"
> & {
  lines: (Omit<CafeLine, "unitPriceSen"> & { unitPriceSen?: number })[];
  subtotalSen?: number;
  payment?: Payment | null;
  refund?: Refund | null;
  paid: boolean;
  refunded: boolean;
};
export type CafeView = {
  menu: CafeItem[];
  orders: CafeOrderView[];
  shifts?: Shift[];
  activeShiftId?: string | null;
  movements?: Movement[];
  totals?: CafeTotals;
};

function seed(): CafeState {
  const item = (
    id: string,
    name: string,
    category: CafeItem["category"],
    variant: string,
    priceSen: number,
    onHand: number,
    restockable = false,
  ): CafeItem => ({
    id,
    name,
    category,
    variant,
    priceSen,
    onHand,
    reserved: 0,
    restockable,
  });
  return {
    menu: [
      item("kopi-iced", "Kopi susu", "Drinks", "Iced", 750, 20),
      item("kopi-hot", "Kopi susu", "Drinks", "Hot", 650, 20),
      item("teh-iced", "Teh tarik", "Drinks", "Iced", 600, 18),
      item("matcha-iced", "Matcha latte", "Drinks", "Iced", 1250, 12),
      item(
        "bottled-water",
        "Mineral water",
        "Drinks",
        "Sealed 500ml",
        250,
        24,
        true,
      ),
      item("nasi-lemak", "Nasi lemak", "Food", "Classic", 1200, 15),
      item("chicken-toast", "Chicken toast", "Food", "Toasted", 1450, 10),
      item("kaya-toast", "Kaya toast", "Food", "Two slices", 550, 16),
      item("butter-croissant", "Butter croissant", "Bakery", "Fresh", 850, 12),
      item(
        "cookie-pack",
        "Chocolate cookies",
        "Bakery",
        "Sealed pack",
        650,
        18,
        true,
      ),
    ],
    orders: [],
    shifts: [],
    activeShiftId: null,
    movements: [],
    nextOrder: 1,
  };
}

function exact(
  args: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
): void {
  if (
    required.some((key) => !Object.hasOwn(args, key)) ||
    Object.keys(args).some(
      (key) => !required.includes(key) && !optional.includes(key),
    )
  ) {
    throw new LabsError(400, "Unexpected or missing action arguments.");
  }
}
function text(value: unknown, label: string, max = 120): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new LabsError(
      400,
      `${label} is required and must be at most ${max} characters.`,
    );
  return value.trim();
}
function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean")
    throw new LabsError(400, `${label} must be true or false.`);
  return value;
}
function findOrder(state: CafeState, value: unknown): CafeOrder {
  const id = text(value, "Order ID", 80);
  const order = state.orders.find((entry) => entry.id === id);
  if (!order) throw new LabsError(404, "Order not found in this workspace.");
  return order;
}
function findItem(state: CafeState, value: unknown): CafeItem {
  const id = text(value, "Item ID", 80);
  const item = state.menu.find((entry) => entry.id === id);
  if (!item) throw new LabsError(404, "Menu item not found.");
  return item;
}
function openShift(state: CafeState): Shift {
  const shift = state.shifts.find(
    (entry) => entry.id === state.activeShiftId && !entry.closedAt,
  );
  if (!shift) throw new LabsError(409, "Open a cashier shift first.");
  return shift;
}
function movement(
  state: CafeState,
  itemId: string,
  kind: Movement["kind"],
  qty: number,
  note: string,
  at: string,
): void {
  if (state.movements.length >= 2000)
    throw new LabsError(
      429,
      "Demo movement limit reached. Reset this workspace.",
    );
  state.movements.push({ id: randomUUID(), itemId, kind, qty, note, at });
}

/** Cash is actual tender less change, with refunds attributed to the issuing shift. */
export function totals(state: CafeState): CafeTotals {
  const active = state.shifts.find((shift) => shift.id === state.activeShiftId);
  const result: CafeTotals = {
    grossSen: 0,
    discountSen: 0,
    refundSen: 0,
    netSen: 0,
    paidOrders: 0,
    cashExpectedSen: active?.openingSen ?? 0,
  };
  for (const order of state.orders) {
    if (order.payment) {
      result.grossSen += order.subtotalSen;
      result.discountSen += order.payment.discountSen;
      result.netSen += order.payment.totalSen;
      result.paidOrders += 1;
      if (
        active &&
        order.payment.method === "Cash" &&
        order.payment.shiftId === active.id
      )
        result.cashExpectedSen += order.payment.totalSen;
    }
    if (order.refund) {
      result.refundSen += order.refund.amountSen;
      result.netSen -= order.refund.amountSen;
      if (
        active &&
        order.payment?.method === "Cash" &&
        order.refund.shiftId === active.id
      )
        result.cashExpectedSen -= order.refund.amountSen;
    }
  }
  return result;
}

export const cafeModule: ProductModule<CafeState> = {
  id: "cafe-pos",
  seed,
  reduce(source, action, actor) {
    // All tentative mutations target a detached copy, including mutations before a later failure.
    const state = structuredClone(source);
    const args = action.args;
    const now = new Date().toISOString();
    switch (action.type) {
      case "order.submit": {
        assertRole(actor.role, ["customer", "cashier", "manager"]);
        exact(args, ["table", "lines"]);
        const table = integer(args.table, "Table", 1, 6);
        if (state.orders.length >= 50)
          throw new LabsError(
            429,
            "Demo order limit reached. Reset this workspace.",
          );
        if (
          !Array.isArray(args.lines) ||
          args.lines.length < 1 ||
          args.lines.length > 20
        )
          throw new LabsError(400, "Choose between 1 and 20 order lines.");
        const quantities = new Map<string, number>();
        for (const raw of args.lines) {
          if (!raw || typeof raw !== "object" || Array.isArray(raw))
            throw new LabsError(400, "Invalid order line.");
          exact(raw as Record<string, unknown>, ["itemId", "qty"]);
          const item = findItem(state, raw.itemId);
          const qty = integer(raw.qty, "Quantity", 1, 20);
          quantities.set(
            item.id,
            integer(
              (quantities.get(item.id) ?? 0) + qty,
              "Combined item quantity",
              1,
              20,
            ),
          );
        }
        const lines: CafeLine[] = [];
        for (const [itemId, qty] of quantities) {
          const item = findItem(state, itemId);
          if (qty > item.onHand - item.reserved)
            throw new LabsError(
              409,
              `${item.name} has insufficient available stock.`,
            );
          item.reserved += qty;
          lines.push({
            itemId,
            name: item.name,
            variant: item.variant,
            qty,
            unitPriceSen: item.priceSen,
          });
        }
        const subtotalSen = lines.reduce(
          (sum, line) => sum + line.qty * line.unitPriceSen,
          0,
        );
        state.orders.push({
          id: randomUUID(),
          number: state.nextOrder++,
          customerId: actor.customerId,
          table,
          status: "Received",
          lines,
          subtotalSen,
          createdAt: now,
          payment: null,
          refund: null,
        });
        break;
      }
      case "order.advance": {
        assertRole(actor.role, ["kitchen", "manager"]);
        exact(args, ["id"]);
        const order = findOrder(state, args.id);
        if (
          order.refund ||
          order.status === "Cancelled" ||
          order.status === "Served"
        )
          throw new LabsError(409, "This order cannot advance further.");
        const next = {
          Received: "Preparing",
          Preparing: "Ready",
          Ready: "Served",
        } as const;
        order.status = next[order.status];
        break;
      }
      case "order.cancel": {
        assertRole(actor.role, ["customer", "cashier", "manager"]);
        exact(args, ["id"]);
        const order = findOrder(state, args.id);
        if (actor.role === "customer" && order.customerId !== actor.customerId)
          throw new LabsError(403, "You can only cancel your own order.");
        if (order.payment || order.refund || order.status === "Cancelled")
          throw new LabsError(
            409,
            "Only active unpaid orders can be cancelled. Paid orders require a refund.",
          );
        const prepared = order.status !== "Received";
        if (prepared) assertRole(actor.role, ["manager"]);
        for (const line of order.lines) {
          const item = findItem(state, line.itemId);
          if (item.reserved < line.qty || item.onHand < line.qty)
            throw new LabsError(409, "Stock reservation is unavailable.");
          item.reserved -= line.qty;
          if (prepared) {
            item.onHand -= line.qty;
            movement(
              state,
              item.id,
              "Waste",
              -line.qty,
              `Prepared order ${order.number} cancelled`,
              now,
            );
          }
        }
        order.status = "Cancelled";
        break;
      }
      case "shift.open": {
        assertRole(actor.role, ["cashier", "manager"]);
        exact(args, ["openingSen"]);
        if (state.activeShiftId)
          throw new LabsError(409, "A cashier shift is already open.");
        if (state.shifts.length >= 100)
          throw new LabsError(
            429,
            "Demo shift limit reached. Reset this workspace.",
          );
        const openingSen = integer(
          args.openingSen,
          "Opening cash",
          0,
          1_000_000,
        );
        const shift: Shift = {
          id: randomUUID(),
          openingSen,
          openedAt: now,
          closedAt: null,
          closedCashSen: null,
        };
        state.shifts.push(shift);
        state.activeShiftId = shift.id;
        break;
      }
      case "shift.close": {
        assertRole(actor.role, ["cashier", "manager"]);
        exact(args, []);
        const shift = openShift(state);
        shift.closedCashSen = totals(state).cashExpectedSen;
        shift.closedAt = now;
        state.activeShiftId = null;
        break;
      }
      case "payment.settle": {
        assertRole(actor.role, ["cashier", "manager"]);
        exact(
          args,
          ["id", "method", "discountPct", "tenderSen"],
          ["simulateFailure"],
        );
        const shift = openShift(state);
        const order = findOrder(state, args.id);
        if (order.payment || order.refund || order.status === "Cancelled")
          throw new LabsError(
            409,
            "This order cannot be settled again or after cancellation.",
          );
        if (!["Cash", "Card", "QR"].includes(args.method as string))
          throw new LabsError(400, "Choose a simulated payment method.");
        const method = args.method as Payment["method"];
        const discountPct = integer(
          args.discountPct,
          "Discount percentage",
          0,
          30,
        );
        if (actor.role !== "manager" && discountPct > 10)
          throw new LabsError(
            403,
            "Discounts above 10% require the Manager role.",
          );
        const suppliedTender = integer(
          args.tenderSen,
          "Tender amount",
          0,
          100_000_000,
        );
        if (
          Object.hasOwn(args, "simulateFailure") &&
          boolean(args.simulateFailure, "Simulated failure")
        )
          throw new LabsError(
            409,
            "Simulated payment failed. No payment or stock change was saved.",
          );
        const subtotal = order.lines.reduce(
          (sum, line) => sum + line.unitPriceSen * line.qty,
          0,
        );
        // Percentage discounts round half up once, at the whole-order sen level.
        const { discountSen, totalSen } = quotePayment(subtotal, discountPct);
        if (method === "Cash" && suppliedTender < totalSen)
          throw new LabsError(
            400,
            "Cash tender is less than the payable total.",
          );
        for (const line of order.lines) {
          const item = findItem(state, line.itemId);
          if (item.reserved < line.qty || item.onHand < line.qty)
            throw new LabsError(
              409,
              "Reserved stock is unavailable for settlement.",
            );
          item.onHand -= line.qty;
          item.reserved -= line.qty;
          movement(
            state,
            item.id,
            "Sale",
            -line.qty,
            `Mock payment for order ${order.number}`,
            now,
          );
        }
        order.subtotalSen = subtotal;
        const tenderSen = method === "Cash" ? suppliedTender : totalSen;
        order.payment = {
          method,
          discountPct,
          discountSen,
          totalSen,
          tenderSen,
          changeSen: tenderSen - totalSen,
          shiftId: shift.id,
          paidAt: now,
        };
        break;
      }
      case "refund.full": {
        assertRole(actor.role, ["manager"]);
        exact(args, ["id", "restock"]);
        const shift = openShift(state);
        const order = findOrder(state, args.id);
        const restock = boolean(args.restock, "Restock");
        if (!order.payment || order.refund || order.status === "Cancelled")
          throw new LabsError(
            409,
            "Only a paid order without a previous refund can be refunded.",
          );
        if (
          restock &&
          (order.status !== "Received" ||
            order.lines.some(
              (line) => !findItem(state, line.itemId).restockable,
            ))
        ) {
          throw new LabsError(
            409,
            "Restock is only available for unprepared orders containing sealed retail items.",
          );
        }
        if (restock) {
          for (const line of order.lines) {
            const item = findItem(state, line.itemId);
            item.onHand = integer(
              item.onHand + line.qty,
              "Restocked quantity",
              item.reserved,
              10_000,
            );
            movement(
              state,
              item.id,
              "Restock",
              line.qty,
              `Full refund for order ${order.number}`,
              now,
            );
          }
        }
        order.refund = {
          amountSen: order.payment.totalSen,
          restock,
          at: now,
          shiftId: shift.id,
        };
        break;
      }
      case "inventory.adjust": {
        assertRole(actor.role, ["manager"]);
        exact(args, ["itemId", "onHand", "note"]);
        const item = findItem(state, args.itemId);
        const onHand = integer(args.onHand, "On-hand stock", 0, 10_000);
        const note = text(args.note, "Adjustment note");
        if (onHand < item.reserved)
          throw new LabsError(
            409,
            "On-hand stock cannot be below reserved stock.",
          );
        const delta = onHand - item.onHand;
        item.onHand = onHand;
        movement(state, item.id, "Adjustment", delta, note, now);
        break;
      }
      default:
        throw new LabsError(400, "Unknown Cafe action.");
    }
    return state;
  },
  project(state, actor): CafeView {
    assertRole(actor.role, [
      "customer",
      "kitchen",
      "cashier",
      "manager",
      "viewer",
    ]);
    const allowed =
      actor.role === "viewer"
        ? []
        : actor.role === "customer"
          ? state.orders.filter(
              (order) => order.customerId === actor.customerId,
            )
          : state.orders;
    const orders: CafeOrderView[] = allowed.map((order) => {
      const base = {
        id: order.id,
        number: order.number,
        table: order.table,
        status: order.status,
        createdAt: order.createdAt,
        paid: !!order.payment,
        refunded: !!order.refund,
      };
      if (actor.role === "kitchen") {
        return {
          ...base,
          lines: order.lines.map(({ itemId, name, variant, qty }) => ({
            itemId,
            name,
            variant,
            qty,
          })),
        };
      }
      return {
        ...base,
        lines: structuredClone(order.lines),
        subtotalSen: order.subtotalSen,
        payment: structuredClone(order.payment),
        refund: structuredClone(order.refund),
      };
    });
    const view: CafeView = { menu: structuredClone(state.menu), orders };
    if (["cashier", "manager", "viewer"].includes(actor.role))
      view.totals = totals(state);
    if (["cashier", "manager"].includes(actor.role)) {
      view.shifts = structuredClone(state.shifts);
      view.activeShiftId = state.activeShiftId;
    }
    if (actor.role === "manager")
      view.movements = structuredClone(state.movements);
    return view;
  },
};
