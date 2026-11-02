export type Role = "manager" | "staff" | "viewer";
export type CartKind = "qr" | "pos" | "shop";
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  symbol: string;
  description: string;
  variants?: { name: string; extra: number }[];
};
export type CartLine = {
  key: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  variant: string;
};
export type Sale = {
  id: string;
  kind: "pos" | "shop";
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  method: string;
  tender: number;
  change: number;
  refunded: boolean;
  status: "Paid" | "Packed" | "Shipped" | "Refunded";
  shift: number;
};
export type FoodOrder = {
  id: string;
  table: number;
  lines: CartLine[];
  total: number;
  status: "Received" | "Preparing" | "Ready" | "Completed";
};
export type Booking = {
  id: string;
  service: string;
  date: string;
  time: string;
  customer: string;
  status: "Confirmed" | "Cancelled";
};
export type Entry = {
  id: string;
  kind: "Income" | "Expense";
  category: string;
  amount: number;
  note: string;
};
export type Invoice = {
  id: string;
  customer: string;
  description: string;
  amount: number;
  paid: boolean;
};
export type DemoState = {
  version: 1;
  revision: number;
  counter: number;
  role: Role;
  products: Product[];
  menu: Product[];
  carts: Record<CartKind, CartLine[]>;
  sales: Sale[];
  foodOrders: FoodOrder[];
  bookings: Booking[];
  shift: {
    open: boolean;
    number: number;
    openingCash: number;
    closedCash: number | null;
  };
  entries: Entry[];
  invoices: Invoice[];
  contacts: {
    id: string;
    kind: "Customer" | "Supplier";
    name: string;
    email: string;
  }[];
  audit: { id: string; role: Role; event: string }[];
  business: { theme: string; headline: string; description: string };
};
export class DemoError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export const money = (cents: number) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(
    cents / 100,
  );
export const bookingDates = [
  "2026-11-02",
  "2026-11-03",
  "2026-11-04",
  "2026-11-05",
  "2026-11-06",
];
export const bookingTimes = ["09:00", "10:30", "12:00", "14:00", "15:30"];
export const bookingServices = [
  {
    id: "consultation",
    name: "Business consultation",
    duration: "60 minutes",
    price: 8000,
  },
  { id: "workspace", name: "Studio room", duration: "60 minutes", price: 4500 },
  { id: "design", name: "Design review", duration: "60 minutes", price: 6500 },
];
export function initialState(): DemoState {
  return {
    version: 1,
    revision: 0,
    counter: 1000,
    role: "manager",
    products: [
      {
        id: "notebook",
        name: "Everyday notebook",
        category: "Stationery",
        price: 1800,
        stock: 24,
        symbol: "▤",
        description: "A fictional A5 notebook for everyday ideas.",
      },
      {
        id: "mug",
        name: "Studio ceramic mug",
        category: "Home",
        price: 3200,
        stock: 16,
        symbol: "◡",
        description: "A fictional ceramic mug in a quiet cloud finish.",
      },
      {
        id: "tote",
        name: "Canvas tote",
        category: "Accessories",
        price: 2800,
        stock: 20,
        symbol: "▢",
        description: "A fictional reusable canvas carryall.",
      },
      {
        id: "pen",
        name: "Fine-tip pen set",
        category: "Stationery",
        price: 1200,
        stock: 40,
        symbol: "╱",
        description: "A fictional set of three smooth-writing pens.",
      },
      {
        id: "bottle",
        name: "Daily water bottle",
        category: "Accessories",
        price: 4500,
        stock: 12,
        symbol: "◫",
        description: "A fictional 600 ml bottle for your daily routine.",
      },
      {
        id: "planner",
        name: "Weekly desk planner",
        category: "Stationery",
        price: 2400,
        stock: 18,
        symbol: "▦",
        description: "A fictional undated planner to make space for the week.",
      },
    ],
    menu: [
      {
        id: "nasi",
        name: "Nasi lemak",
        category: "Mains",
        price: 1200,
        stock: 99,
        symbol: "◒",
        description: "Coconut rice, sambal, egg and crisp anchovies.",
        variants: [
          { name: "Classic", extra: 0 },
          { name: "With chicken", extra: 600 },
        ],
      },
      {
        id: "toast",
        name: "Kaya toast",
        category: "Light bites",
        price: 600,
        stock: 99,
        symbol: "▱",
        description: "Toasted bread with kaya and butter.",
        variants: [
          { name: "Regular", extra: 0 },
          { name: "With eggs", extra: 300 },
        ],
      },
      {
        id: "noodles",
        name: "Mee goreng",
        category: "Mains",
        price: 1300,
        stock: 99,
        symbol: "≋",
        description: "Fried noodles with vegetables and a little heat.",
        variants: [
          { name: "Mild", extra: 0 },
          { name: "Spicy", extra: 0 },
        ],
      },
      {
        id: "kopi",
        name: "Kopi susu",
        category: "Drinks",
        price: 650,
        stock: 99,
        symbol: "◔",
        description: "A comforting local coffee with milk.",
        variants: [
          { name: "Hot", extra: 0 },
          { name: "Iced", extra: 100 },
        ],
      },
      {
        id: "tea",
        name: "Teh tarik",
        category: "Drinks",
        price: 550,
        stock: 99,
        symbol: "◕",
        description: "Creamy pulled milk tea.",
        variants: [
          { name: "Hot", extra: 0 },
          { name: "Iced", extra: 100 },
        ],
      },
      {
        id: "lime",
        name: "Lime cooler",
        category: "Drinks",
        price: 700,
        stock: 99,
        symbol: "◉",
        description: "Fresh citrus, ice and a bright finish.",
        variants: [
          { name: "Regular sugar", extra: 0 },
          { name: "Less sugar", extra: 0 },
        ],
      },
    ],
    carts: { qr: [], pos: [], shop: [] },
    sales: [],
    foodOrders: [],
    bookings: [
      {
        id: "BK-1000",
        service: "consultation",
        date: "2026-11-02",
        time: "10:30",
        customer: "Sample Customer A",
        status: "Confirmed",
      },
    ],
    shift: { open: false, number: 0, openingCash: 0, closedCash: null },
    entries: [
      {
        id: "E-001",
        kind: "Income",
        category: "Services",
        amount: 120000,
        note: "Sample design project",
      },
      {
        id: "E-002",
        kind: "Expense",
        category: "Operations",
        amount: 30000,
        note: "Sample studio expense",
      },
    ],
    invoices: [],
    contacts: [
      {
        id: "C-001",
        kind: "Customer",
        name: "Sample Customer A",
        email: "customer@example.test",
      },
      {
        id: "S-001",
        kind: "Supplier",
        name: "Sample Supplies",
        email: "supplier@example.test",
      },
    ],
    audit: [],
    business: {
      theme: "forest",
      headline: "Space for your next good idea.",
      description:
        "A fictional neighbourhood studio offering calm workspaces and thoughtful creative sessions.",
    },
  };
}
function str(value: unknown, name: string, max = 120) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new DemoError(`Enter a valid ${name} (up to ${max} characters).`);
  return value.trim();
}
function integer(value: unknown, name: string, min = 0, max = 1000000) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new DemoError(
      `${name} must be a whole number between ${min} and ${max}.`,
    );
  return value;
}
function choice<T extends string>(
  value: unknown,
  choices: readonly T[],
  name: string,
): T {
  if (typeof value !== "string" || !choices.includes(value as T))
    throw new DemoError(`Choose a valid ${name}.`);
  return value as T;
}
function permit(s: DemoState, roles: Role[]) {
  if (!roles.includes(s.role))
    throw new DemoError(
      "This action is not available to the selected demo role.",
      403,
    );
}
function id(s: DemoState, prefix: string) {
  return `${prefix}-${++s.counter}`;
}
function log(s: DemoState, event: string) {
  s.audit.unshift({ id: id(s, "A"), role: s.role, event });
  s.audit = s.audit.slice(0, 100);
}
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.qty, 0);
export function totals(s: DemoState) {
  const sales = s.sales.filter((x) => !x.refunded);
  const salesIncome = sales.reduce((n, x) => n + x.total, 0);
  const manualIncome = s.entries
    .filter((e) => e.kind === "Income")
    .reduce((n, e) => n + e.amount, 0);
  const expenses = s.entries
    .filter((e) => e.kind === "Expense")
    .reduce((n, e) => n + e.amount, 0);
  return {
    salesIncome,
    manualIncome,
    income: salesIncome + manualIncome,
    expenses,
    profit: salesIncome + manualIncome - expenses,
    orders: sales.length,
    receivables: s.invoices
      .filter((i) => !i.paid)
      .reduce((n, i) => n + i.amount, 0),
  };
}
export function cashExpected(s: DemoState) {
  return (
    s.shift.openingCash +
    s.sales
      .filter(
        (x) =>
          x.kind === "pos" &&
          x.shift === s.shift.number &&
          x.method === "Cash" &&
          !x.refunded,
      )
      .reduce((n, x) => n + x.total, 0)
  );
}
function slotAvailable(
  s: DemoState,
  service: string,
  date: string,
  time: string,
  exclude?: string,
) {
  return !s.bookings.some(
    (b) =>
      b.id !== exclude &&
      b.service === service &&
      b.date === date &&
      b.time === time &&
      b.status === "Confirmed",
  );
}
export function applyAction(
  previous: DemoState,
  action: string,
  args: Record<string, unknown> = {},
): DemoState {
  const s = structuredClone(previous);
  switch (action) {
    case "reset":
      return initialState();
    case "role":
      s.role = choice(args.role, ["manager", "staff", "viewer"], "role");
      log(s, `Demo role changed to ${s.role}`);
      break;
    case "business":
      s.business = {
        theme: choice(args.theme, ["forest", "indigo", "clay"], "theme"),
        headline: str(args.headline, "headline", 80),
        description: str(args.description, "description", 220),
      };
      log(s, "Edited sample business website");
      break;
    case "cart.add": {
      const kind = choice(args.kind, ["qr", "pos", "shop"], "cart");
      if (kind === "pos") permit(s, ["manager", "staff"]);
      const p = (kind === "qr" ? s.menu : s.products).find(
        (p) => p.id === args.productId,
      );
      if (!p) throw new DemoError("Product not found.", 404);
      const variant = p.variants?.find((v) => v.name === args.variant);
      if (p.variants && !variant) throw new DemoError("Choose an item option.");
      const key = p.id + ":" + (variant?.name || "Standard");
      const qty = integer(args.qty ?? 1, "Quantity", 1, 99);
      const existing = s.carts[kind].find((l) => l.key === key);
      const next = (existing?.qty || 0) + qty;
      if (next > 99 || (kind !== "qr" && next > p.stock))
        throw new DemoError("The requested quantity is not available.");
      if (s.carts[kind].length >= 30 && !existing)
        throw new DemoError("Cart limit reached. Reset or complete the order.");
      if (existing) existing.qty = next;
      else
        s.carts[kind].push({
          key,
          productId: p.id,
          name: p.name,
          price: p.price + (variant?.extra || 0),
          qty,
          variant: variant?.name || "Standard",
        });
      break;
    }
    case "cart.quantity": {
      const kind = choice(args.kind, ["qr", "pos", "shop"], "cart");
      if (kind === "pos") permit(s, ["manager", "staff"]);
      const line = s.carts[kind].find((l) => l.key === args.key);
      if (!line) throw new DemoError("Cart item not found.", 404);
      const qty = integer(args.qty, "Quantity", 0, 99);
      const stock = s.products.find((p) => p.id === line.productId)?.stock || 0;
      if (kind !== "qr" && qty > stock)
        throw new DemoError("Not enough stock.");
      line.qty = qty;
      s.carts[kind] = s.carts[kind].filter((l) => l.qty > 0);
      break;
    }
    case "qr.submit": {
      const table = integer(args.table, "Table", 1, 12);
      if (!s.carts.qr.length)
        throw new DemoError("Add an item to your order first.");
      if (s.foodOrders.length >= 50)
        throw new DemoError("Demo order limit reached. Reset the workspace.");
      s.foodOrders.unshift({
        id: id(s, "QR"),
        table,
        lines: s.carts.qr,
        total: cartTotal(s.carts.qr),
        status: "Received",
      });
      s.carts.qr = [];
      log(s, `Received a simulated order for table ${table}`);
      break;
    }
    case "qr.status": {
      permit(s, ["manager", "staff"]);
      const order = s.foodOrders.find((o) => o.id === args.id);
      if (!order) throw new DemoError("Order not found.", 404);
      const steps = ["Received", "Preparing", "Ready", "Completed"] as const;
      const next = steps[steps.indexOf(order.status) + 1];
      if (!next) throw new DemoError("This order is already complete.");
      order.status = next;
      log(s, `${order.id}: ${next}`);
      break;
    }
    case "booking.create":
    case "booking.reschedule": {
      const service = choice(
        args.service,
        bookingServices.map((s) => s.id),
        "service",
      );
      const date = choice(args.date, bookingDates, "demo date");
      const time = choice(args.time, bookingTimes, "time");
      const current =
        action === "booking.reschedule"
          ? s.bookings.find((b) => b.id === args.id)
          : undefined;
      if (
        action === "booking.reschedule" &&
        (!current || current.status === "Cancelled")
      )
        throw new DemoError("This booking cannot be rescheduled.");
      if (!slotAvailable(s, service, date, time, current?.id))
        throw new DemoError(
          "That time is already reserved. Choose another slot.",
          409,
        );
      if (current) {
        current.service = service;
        current.date = date;
        current.time = time;
        log(s, `${current.id} rescheduled`);
      } else {
        if (s.bookings.length >= 50)
          throw new DemoError(
            "Demo booking limit reached. Reset the workspace.",
          );
        const customer = choice(
          args.customer,
          ["Sample Customer A", "Sample Customer B", "Sample Customer C"],
          "fictional customer",
        );
        const b = {
          id: id(s, "BK"),
          service,
          date,
          time,
          customer,
          status: "Confirmed" as const,
        };
        s.bookings.unshift(b);
        log(s, `${b.id} confirmed`);
      }
      break;
    }
    case "booking.cancel": {
      const booking = s.bookings.find((b) => b.id === args.id);
      if (!booking || booking.status === "Cancelled")
        throw new DemoError("Active booking not found.");
      booking.status = "Cancelled";
      log(s, `${booking.id} cancelled`);
      break;
    }
    case "shift.open":
      permit(s, ["manager", "staff"]);
      if (s.shift.open) throw new DemoError("A shift is already open.");
      s.shift = {
        open: true,
        number: s.shift.number + 1,
        openingCash: integer(args.amount, "Opening cash", 0, 100000),
        closedCash: null,
      };
      log(s, `Opened shift ${s.shift.number}`);
      break;
    case "shift.close":
      permit(s, ["manager"]);
      if (!s.shift.open) throw new DemoError("No shift is open.");
      s.shift.closedCash = cashExpected(s);
      s.shift.open = false;
      log(s, `Closed shift ${s.shift.number}`);
      break;
    case "checkout": {
      const kind = choice(args.kind, ["pos", "shop"], "checkout");
      if (kind === "pos") {
        permit(s, ["manager", "staff"]);
        if (!s.shift.open) throw new DemoError("Open a shift before checkout.");
      }
      const lines = s.carts[kind];
      if (!lines.length) throw new DemoError("Your cart is empty.");
      if (s.sales.length >= 100)
        throw new DemoError("Demo sales limit reached. Reset the workspace.");
      const percent =
        kind === "shop"
          ? args.code === "" || args.code === undefined
            ? 0
            : args.code === "EVOLVE10"
              ? 10
              : (() => {
                  throw new DemoError(
                    "Use the sample code EVOLVE10, or leave the code empty.",
                  );
                })()
          : integer(
              args.discount ?? 0,
              "Discount",
              0,
              s.role === "manager" ? 50 : 10,
            );
      const method = choice(
        args.method,
        ["Cash", "Card", "QR"],
        "simulated payment method",
      );
      if (kind === "shop" && method === "Cash")
        throw new DemoError("Choose simulated Card or QR checkout.");
      const subtotal = cartTotal(lines);
      const discount = Math.round((subtotal * percent) / 100);
      const total = subtotal - discount;
      const tender =
        method === "Cash"
          ? integer(args.tender, "Cash tendered", total, 1000000)
          : total;
      for (const line of lines) {
        const product = s.products.find((p) => p.id === line.productId)!;
        if (product.stock < line.qty)
          throw new DemoError(
            `${product.name} does not have enough stock.`,
            409,
          );
        product.stock -= line.qty;
      }
      const sale: Sale = {
        id: id(s, kind === "pos" ? "POS" : "WEB"),
        kind,
        lines,
        subtotal,
        discount,
        total,
        method,
        tender,
        change: tender - total,
        refunded: false,
        status: "Paid",
        shift: kind === "pos" ? s.shift.number : 0,
      };
      s.sales.unshift(sale);
      s.carts[kind] = [];
      log(s, `${sale.id} simulated ${method} checkout: ${money(total)}`);
      break;
    }
    case "sale.refund": {
      permit(s, ["manager"]);
      const sale = s.sales.find((x) => x.id === args.id);
      if (!sale) throw new DemoError("Sale not found.", 404);
      if (sale.refunded)
        throw new DemoError("This sale has already been refunded.", 409);
      if (
        sale.kind === "pos" &&
        sale.method === "Cash" &&
        (!s.shift.open || sale.shift !== s.shift.number)
      )
        throw new DemoError(
          "Cash refunds must be made during the original open demo shift.",
        );
      sale.refunded = true;
      sale.status = "Refunded";
      for (const l of sale.lines)
        s.products.find((p) => p.id === l.productId)!.stock += l.qty;
      log(s, `${sale.id} fully refunded; stock restored`);
      break;
    }
    case "sale.status": {
      permit(s, ["manager", "staff"]);
      const sale = s.sales.find((x) => x.id === args.id && x.kind === "shop");
      if (!sale || sale.refunded)
        throw new DemoError("Active shop order not found.");
      if (sale.status === "Paid") sale.status = "Packed";
      else if (sale.status === "Packed") sale.status = "Shipped";
      else throw new DemoError("This order has already shipped.");
      log(s, `${sale.id}: ${sale.status}`);
      break;
    }
    case "stock.adjust": {
      permit(s, ["manager"]);
      const product = s.products.find((x) => x.id === args.id);
      if (!product) throw new DemoError("Product not found.");
      product.stock = integer(args.stock, "Stock", 0, 999);
      log(s, `Set ${product.name} stock to ${product.stock}`);
      break;
    }
    case "entry.add": {
      permit(s, ["manager"]);
      if (s.entries.length >= 100)
        throw new DemoError("Ledger limit reached. Reset the workspace.");
      const kind = choice(args.kind, ["Income", "Expense"], "entry type");
      const entry = {
        id: id(s, "E"),
        kind,
        amount: integer(args.amount, "Amount in sen", 1, 1000000),
        category: str(args.category, "category", 40),
        note: str(args.note, "sample description", 160),
      };
      s.entries.unshift(entry);
      log(s, `${entry.id}: ${kind} ${money(entry.amount)}`);
      break;
    }
    case "invoice.create": {
      permit(s, ["manager", "staff"]);
      if (s.invoices.length >= 50)
        throw new DemoError("Invoice limit reached. Reset the workspace.");
      const customer = s.contacts.find(
        (c) => c.id === args.customer && c.kind === "Customer",
      );
      if (!customer) throw new DemoError("Select a sample customer.");
      s.invoices.unshift({
        id: id(s, "INV"),
        customer: customer.name,
        description: str(args.description, "invoice description", 160),
        amount: integer(args.amount, "Invoice amount in sen", 1, 1000000),
        paid: false,
      });
      log(s, "Created a sample invoice");
      break;
    }
    case "invoice.pay": {
      permit(s, ["manager"]);
      const invoice = s.invoices.find((i) => i.id === args.id);
      if (!invoice || invoice.paid)
        throw new DemoError("Unpaid invoice not found.");
      if (s.entries.length >= 100) throw new DemoError("Ledger limit reached.");
      invoice.paid = true;
      s.entries.unshift({
        id: id(s, "E"),
        kind: "Income",
        category: "Invoice payment",
        amount: invoice.amount,
        note: invoice.id,
      });
      log(s, `${invoice.id} marked paid (simulated)`);
      break;
    }
    case "contact.add": {
      permit(s, ["manager", "staff"]);
      if (s.contacts.length >= 30)
        throw new DemoError("Contact limit reached.");
      const kind = choice(args.kind, ["Customer", "Supplier"], "contact kind");
      const suffix = s.contacts.filter((c) => c.kind === kind).length + 1;
      const name = `Sample ${kind} ${suffix}`;
      s.contacts.push({
        id: id(s, "C"),
        kind,
        name,
        email: `${kind.toLowerCase()}${suffix}@example.test`,
      });
      log(s, `Added ${name}`);
      break;
    }
    default:
      throw new DemoError("Unknown demo action.", 400);
  }
  s.revision++;
  return s;
}
