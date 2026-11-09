import { randomUUID } from "node:crypto";
import {
  LabsError,
  assertRole,
  integer,
  type ProductModule,
} from "../demo-platform/index.ts";
import { quoteCommerce } from "./pricing.ts";

export type CommerceProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  symbol: string;
  priceSen: number;
  onHand: number;
  active: boolean;
};
export type CommerceLine = {
  productId: string;
  name: string;
  qty: number;
  unitPriceSen: number;
};
export type CommerceCart = {
  customerId: string;
  version: number;
  lines: { productId: string; qty: number }[];
};
export type CommerceOrder = {
  id: string;
  number: number;
  customerId: string;
  status: "Paid" | "Packed" | "Shipped" | "Delivered";
  lines: CommerceLine[];
  subtotalSen: number;
  discountSen: number;
  totalSen: number;
  code: string;
  method: "Card" | "QR";
  createdAt: string;
  refund: { amountSen: number; restock: boolean; at: string } | null;
};
export type CommerceMovement = {
  id: string;
  productId: string;
  kind: "Sale" | "Refund" | "Adjustment";
  qty: number;
  note: string;
  at: string;
};
export type CommerceState = {
  products: CommerceProduct[];
  carts: CommerceCart[];
  orders: CommerceOrder[];
  movements: CommerceMovement[];
  nextOrder: number;
  catalogVersion: number;
};
export type CommerceTotals = {
  grossSen: number;
  discountSen: number;
  refundSen: number;
  netSen: number;
  paidOrders: number;
  activeOrders: number;
  unitsSold: number;
  lowStock: number;
};
export type CommerceView = {
  products: CommerceProduct[];
  cart: { version: number; lines: CommerceLine[]; subtotalSen: number };
  orders: Omit<CommerceOrder, "customerId">[];
  catalogVersion: number;
  totals?: CommerceTotals;
  movements?: CommerceMovement[];
};

function seed(): CommerceState {
  const goods: [string, string, string, number, number, string, string][] = [
    [
      "notebook",
      "Everyday notebook",
      "Stationery",
      1800,
      24,
      "▤",
      "A fictional A5 notebook for everyday ideas.",
    ],
    [
      "mug",
      "Studio ceramic mug",
      "Home",
      3200,
      16,
      "◡",
      "A fictional ceramic mug in a quiet cloud finish.",
    ],
    [
      "tote",
      "Canvas tote",
      "Accessories",
      2800,
      20,
      "▢",
      "A fictional reusable canvas carryall.",
    ],
    [
      "pen",
      "Fine-tip pen set",
      "Stationery",
      1200,
      40,
      "╱",
      "A fictional set of three smooth-writing pens.",
    ],
    [
      "bottle",
      "Daily water bottle",
      "Accessories",
      4500,
      12,
      "◫",
      "A fictional 600 ml bottle for your daily routine.",
    ],
    [
      "planner",
      "Weekly desk planner",
      "Stationery",
      2400,
      18,
      "▦",
      "A fictional undated planner to make space for the week.",
    ],
  ];
  return {
    products: goods.map(
      ([id, name, category, priceSen, onHand, symbol, description]) => ({
        id,
        name,
        category,
        priceSen,
        onHand,
        symbol,
        description,
        active: true,
      }),
    ),
    carts: [],
    orders: [],
    movements: [],
    nextOrder: 1,
    catalogVersion: 1,
  };
}
function keys(args: Record<string, unknown>, expected: string[]) {
  if (
    Object.keys(args).length !== expected.length ||
    expected.some((key) => !Object.hasOwn(args, key))
  )
    throw new LabsError(400, "Unexpected or missing action arguments.");
}
function text(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new LabsError(
      400,
      `${label} is required and must be at most ${max} characters.`,
    );
  return value.trim();
}
function bool(value: unknown) {
  if (typeof value !== "boolean")
    throw new LabsError(400, "Expected true or false.");
  return value;
}
function product(state: CommerceState, value: unknown) {
  const id = text(value, "Product ID", 80);
  const found = state.products.find((p) => p.id === id);
  if (!found) throw new LabsError(404, "Product not found in this workspace.");
  return found;
}
function order(state: CommerceState, value: unknown) {
  const id = text(value, "Order ID", 80);
  const found = state.orders.find((o) => o.id === id);
  if (!found) throw new LabsError(404, "Order not found in this workspace.");
  return found;
}
function fields(args: Record<string, unknown>) {
  return {
    name: text(args.name, "Name", 80),
    category: text(args.category, "Category", 40),
    description: text(args.description, "Description", 300),
    priceSen: integer(args.priceSen, "Price in sen", 1, 1000000),
  };
}
function cartFor(state: CommerceState, customerId: string): CommerceCart {
  return (
    state.carts.find((c) => c.customerId === customerId) ?? {
      customerId,
      version: 0,
      lines: [],
    }
  );
}
function cartLines(state: CommerceState, cart: CommerceCart): CommerceLine[] {
  return cart.lines.map((line) => {
    const p = product(state, line.productId);
    return {
      productId: p.id,
      name: p.name,
      qty: line.qty,
      unitPriceSen: p.priceSen,
    };
  });
}
function saveCart(state: CommerceState, cart: CommerceCart) {
  if (!state.carts.includes(cart)) {
    if (state.carts.length >= 50)
      throw new LabsError(
        429,
        "Demo cart limit reached. Reset this workspace.",
      );
    state.carts.push(cart);
  }
  cart.version += 1;
}
function version(cart: CommerceCart, value: unknown) {
  if (integer(value, "Cart version", 0) !== cart.version)
    throw new LabsError(409, "Your cart changed. Refresh before continuing.");
}
function movement(
  state: CommerceState,
  productId: string,
  kind: CommerceMovement["kind"],
  qty: number,
  note: string,
  at: string,
) {
  if (state.movements.length >= 2000)
    throw new LabsError(
      429,
      "Demo movement limit reached. Reset this workspace.",
    );
  state.movements.push({ id: randomUUID(), productId, kind, qty, note, at });
}
export function commerceTotals(state: CommerceState): CommerceTotals {
  const result: CommerceTotals = {
    grossSen: 0,
    discountSen: 0,
    refundSen: 0,
    netSen: 0,
    paidOrders: state.orders.length,
    activeOrders: 0,
    unitsSold: 0,
    lowStock: state.products.filter((p) => p.active && p.onHand <= 5).length,
  };
  for (const o of state.orders) {
    result.grossSen += o.subtotalSen;
    result.discountSen += o.discountSen;
    result.refundSen += o.refund?.amountSen ?? 0;
    if (!o.refund) {
      if (o.status !== "Delivered") result.activeOrders += 1;
      result.unitsSold += o.lines.reduce((sum, line) => sum + line.qty, 0);
    }
  }
  result.netSen = result.grossSen - result.discountSen - result.refundSen;
  return result;
}

export const commerceModule: ProductModule<CommerceState> = {
  id: "commerce-studio",
  seed,
  reduce(source, action, actor) {
    const state = structuredClone(source),
      args = action.args;
    const seller = () => assertRole(actor.role, ["manager"]);
    const shopper = () => assertRole(actor.role, ["customer"]);
    const at = new Date().toISOString();
    switch (action.type) {
      case "product.create": {
        seller();
        keys(args, ["name", "category", "description", "priceSen", "onHand"]);
        if (state.products.length >= 100)
          throw new LabsError(
            429,
            "Demo product limit reached. Reset this workspace.",
          );
        const p = {
          id: randomUUID(),
          ...fields(args),
          onHand: integer(args.onHand, "Stock", 0, 10000),
          symbol: "◇",
          active: true,
        };
        state.products.push(p);
        state.catalogVersion += 1;
        if (p.onHand)
          movement(
            state,
            p.id,
            "Adjustment",
            p.onHand,
            "Opening stock for new product",
            at,
          );
        break;
      }
      case "product.update": {
        seller();
        keys(args, ["id", "name", "category", "description", "priceSen"]);
        Object.assign(product(state, args.id), fields(args));
        state.catalogVersion += 1;
        break;
      }
      case "product.archive": {
        seller();
        keys(args, ["id", "active"]);
        product(state, args.id).active = bool(args.active);
        state.catalogVersion += 1;
        break;
      }
      case "inventory.adjust": {
        seller();
        keys(args, ["id", "delta", "note"]);
        const p = product(state, args.id),
          delta = integer(args.delta, "Stock adjustment", -10000, 10000);
        if (!delta)
          throw new LabsError(400, "Stock adjustment must not be zero.");
        const note = text(args.note, "Adjustment note", 160);
        const next = p.onHand + delta;
        if (next < 0 || next > 10000)
          throw new LabsError(
            409,
            "Adjustment would put stock outside 0–10,000.",
          );
        p.onHand = next;
        state.catalogVersion += 1;
        movement(state, p.id, "Adjustment", delta, note, at);
        break;
      }
      case "cart.set": {
        shopper();
        keys(args, ["productId", "qty", "version"]);
        const cart = cartFor(state, actor.customerId);
        version(cart, args.version);
        const p = product(state, args.productId),
          qty = integer(args.qty, "Quantity", 0, 99);
        if (qty && (!p.active || qty > p.onHand))
          throw new LabsError(409, "This product or quantity is unavailable.");
        const line = cart.lines.find((l) => l.productId === p.id);
        if (qty === 0)
          cart.lines = cart.lines.filter((l) => l.productId !== p.id);
        else if (line) line.qty = qty;
        else {
          if (cart.lines.length >= 20)
            throw new LabsError(
              429,
              "A demo cart can hold at most 20 products.",
            );
          cart.lines.push({ productId: p.id, qty });
        }
        saveCart(state, cart);
        break;
      }
      case "cart.clear": {
        shopper();
        keys(args, ["version"]);
        const cart = cartFor(state, actor.customerId);
        version(cart, args.version);
        cart.lines = [];
        saveCart(state, cart);
        break;
      }
      case "checkout": {
        shopper();
        keys(args, [
          "cartVersion",
          "catalogVersion",
          "code",
          "method",
          "decline",
        ]);
        const cart = cartFor(state, actor.customerId);
        version(cart, args.cartVersion);
        if (
          integer(args.catalogVersion, "Catalog version", 1) !==
          state.catalogVersion
        )
          throw new LabsError(
            409,
            "The catalogue changed. Refresh and review your cart before checkout.",
          );
        if (args.code !== "" && args.code !== "EVOLVE10")
          throw new LabsError(
            400,
            "Use EVOLVE10 or leave the sample code empty.",
          );
        if (args.method !== "Card" && args.method !== "QR")
          throw new LabsError(400, "Choose a simulated Card or QR payment.");
        const decline = bool(args.decline);
        if (!cart.lines.length)
          throw new LabsError(400, "Add a product before checkout.");
        if (state.orders.length >= 50)
          throw new LabsError(
            429,
            "Demo order limit reached. Reset this workspace.",
          );
        for (const line of cart.lines) {
          const p = product(state, line.productId);
          if (!p.active || line.qty > p.onHand)
            throw new LabsError(
              409,
              "A product is no longer available in this quantity. Review your cart.",
            );
        }
        if (decline)
          throw new LabsError(
            409,
            "Simulated payment declined. Nothing was charged or changed.",
          );
        const lines = cartLines(state, cart),
          subtotalSen = lines.reduce(
            (sum, l) => sum + l.qty * l.unitPriceSen,
            0,
          );
        const o: CommerceOrder = {
          id: randomUUID(),
          number: state.nextOrder++,
          customerId: actor.customerId,
          status: "Paid",
          lines,
          subtotalSen,
          ...quoteCommerce(subtotalSen, args.code),
          code: args.code,
          method: args.method,
          createdAt: at,
          refund: null,
        };
        for (const line of lines) {
          product(state, line.productId).onHand -= line.qty;
          movement(
            state,
            line.productId,
            "Sale",
            -line.qty,
            `Order ${o.number}`,
            at,
          );
        }
        state.orders.unshift(o);
        cart.lines = [];
        saveCart(state, cart);
        state.catalogVersion += 1;
        break;
      }
      case "order.advance": {
        seller();
        keys(args, ["id", "status"]);
        const o = order(state, args.id);
        const transitions: Partial<
          Record<CommerceOrder["status"], CommerceOrder["status"]>
        > = { Paid: "Packed", Packed: "Shipped", Shipped: "Delivered" };
        if (
          o.refund ||
          !transitions[o.status] ||
          args.status !== transitions[o.status]
        )
          throw new LabsError(
            409,
            "Choose the next fulfilment step for an active order.",
          );
        o.status = transitions[o.status]!;
        break;
      }
      case "refund.full": {
        seller();
        keys(args, ["id", "restock"]);
        const o = order(state, args.id),
          restock = bool(args.restock);
        if (o.refund)
          throw new LabsError(409, "This order was already refunded.");
        if (restock && !["Paid", "Packed"].includes(o.status))
          throw new LabsError(
            409,
            "Shipped or delivered items cannot be restocked in this demo.",
          );
        if (restock) {
          for (const line of o.lines)
            if (product(state, line.productId).onHand + line.qty > 10000)
              throw new LabsError(409, "Restock would exceed the stock limit.");
          for (const line of o.lines) {
            product(state, line.productId).onHand += line.qty;
            movement(
              state,
              line.productId,
              "Refund",
              line.qty,
              `Refund for order ${o.number}`,
              at,
            );
          }
          state.catalogVersion += 1;
        }
        o.refund = { amountSen: o.totalSen, restock, at };
        break;
      }
      default:
        throw new LabsError(400, "Unknown commerce action.");
    }
    return state;
  },
  project(state, actor): CommerceView {
    const manager = actor.role === "manager",
      customer = actor.role === "customer";
    const cart = customer
      ? cartFor(state, actor.customerId)
      : { version: 0, lines: [], customerId: "" };
    const lines = cartLines(state, cart);
    return structuredClone({
      products: state.products.filter((p) => manager || p.active),
      cart: {
        version: cart.version,
        lines,
        subtotalSen: lines.reduce((sum, l) => sum + l.qty * l.unitPriceSen, 0),
      },
      orders: state.orders
        .filter(
          (o) => manager || (customer && o.customerId === actor.customerId),
        )
        .map(({ customerId: _customer, ...o }) => o),
      catalogVersion: state.catalogVersion,
      ...(manager || actor.role === "viewer"
        ? { totals: commerceTotals(state) }
        : {}),
      ...(manager ? { movements: state.movements } : {}),
    });
  },
};
