import type { IconName } from "@kezuvio/ui";
export const demos: {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: IconName;
  features: string[];
  color: string;
}[] = [
  {
    slug: "business-website",
    name: "Ruang Studio",
    category: "Business website",
    description:
      "Shape a fictional studio website with editable content and three visual themes.",
    icon: "web",
    features: ["Live content editing", "Theme switching", "Sample enquiry"],
    color: "forest",
  },
  {
    slug: "e-commerce",
    name: "Kedai Everyday",
    category: "E-commerce",
    description:
      "Browse a small catalogue and take a cart through simulated checkout.",
    icon: "layers",
    features: ["Search & filters", "Discount code", "Order & stock tracking"],
    color: "indigo",
  },
  {
    slug: "cafe-pos",
    name: "Saji Café",
    category: "Café POS & QR ordering",
    description:
      "Connect table orders, kitchen tickets, cashier payments, stock and sales in one café workspace.",
    icon: "qr",
    features: [
      "Table & kitchen orders",
      "Payments & receipts",
      "Stock & sales reports",
    ],
    color: "clay",
  },
  {
    slug: "pos",
    name: "Kedai Counter",
    category: "POS system",
    description:
      "Open a shift, make a sale and see stock and reports update together.",
    icon: "pos",
    features: [
      "Cash / card / QR simulation",
      "Receipts & refunds",
      "Shift reports",
    ],
    color: "indigo",
  },
  {
    slug: "booking",
    name: "Ruang Bookings",
    category: "Booking system",
    description: "Find an available appointment, then reschedule or cancel it.",
    icon: "phone",
    features: [
      "Conflict checks",
      "Customer & admin views",
      "Notification previews",
    ],
    color: "forest",
  },
  {
    slug: "sme-management",
    name: "Alur Workspace",
    category: "SME management",
    description:
      "Bring sample finances, stock, contacts and invoices into one workspace.",
    icon: "code",
    features: [
      "Reconciled RM totals",
      "Invoices & cash ledger",
      "Roles & audit history",
    ],
    color: "indigo",
  },
];
