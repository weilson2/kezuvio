import type { IconName } from "@kezuvio/ui";
export const services: {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: IconName;
  detail: string;
  features: string[];
  fit: string;
}[] = [
  {
    slug: "web-development",
    title: "Web development",
    short: "A better first impression.",
    description:
      "Thoughtful, responsive websites that make your business easier to discover and understand.",
    icon: "web",
    detail:
      "A clear website connects what you do with what your customers need. We plan fast, accessible experiences with purposeful content and an easy path to get in touch.",
    features: [
      "Responsive business websites",
      "Content structure and search essentials",
      "Accessible interfaces",
      "E-commerce planning and integrations",
    ],
    fit: "Businesses establishing a presence, refreshing an outdated site or simplifying online enquiries.",
  },
  {
    slug: "mobile-apps",
    title: "Mobile applications",
    short: "Your business, within reach.",
    description:
      "Practical mobile experiences for customers, teams and the way your business works.",
    icon: "phone",
    detail:
      "Bring the right tools closer to the people who use them. Start with a focused mobile workflow, then expand around real feedback rather than a long list of assumptions.",
    features: [
      "Customer and staff applications",
      "Android and iOS planning",
      "Prototypes and usability review",
      "API and business-system integration",
    ],
    fit: "Teams with a recurring customer or staff workflow that benefits from a dedicated mobile experience.",
  },
  {
    slug: "pos-systems",
    title: "POS systems",
    short: "Keep the counter moving.",
    description:
      "Connected checkout, stock and reporting workflows for retail and F&B operations.",
    icon: "pos",
    detail:
      "Connect everyday sales with a clearer view of your operations. Define your catalogue, permissions and reporting needs before deciding on checkout hardware and integrations.",
    features: [
      "Product catalogue and checkout flows",
      "Stock and sales reporting",
      "Staff roles and shift workflows",
      "Receipt and hardware feasibility review",
    ],
    fit: "Retailers and food businesses looking to reduce repeated entry and understand daily operations.",
  },
  {
    slug: "qr-ordering",
    title: "QR ordering",
    short: "Less waiting. More serving.",
    description:
      "Simple digital menus and ordering journeys designed around your restaurant floor.",
    icon: "qr",
    detail:
      "Make the journey from menu to kitchen easier to follow. A useful ordering system respects your table layout, menu options and the way your team handles busy service.",
    features: [
      "Mobile menu and item options",
      "Table-based ordering journeys",
      "Kitchen and order-status views",
      "Clear simulated prototype checkout",
    ],
    fit: "Cafés and restaurants exploring self-service ordering and clearer communication between guests and staff.",
  },
  {
    slug: "custom-software",
    title: "Custom software",
    short: "Built around your workflow.",
    description:
      "Booking, operations and AI automation shaped to the work you actually need to do.",
    icon: "code",
    detail:
      "When spreadsheets and disconnected tools become hard to maintain, start by mapping the work. Build a focused system around the bottlenecks, with sensible permissions and room to improve.",
    features: [
      "Booking and internal operations tools",
      "Workflow mapping and prototypes",
      "Reporting and third-party integrations",
      "Human-reviewed AI automation exploration",
    ],
    fit: "SMEs with specific processes that off-the-shelf tools do not handle well.",
  },
  {
    slug: "saas",
    title: "SaaS products",
    short: "Give your idea a strong start.",
    description:
      "From a focused product concept to a maintainable platform that can grow with demand.",
    icon: "layers",
    detail:
      "Turn an idea into a testable product scope. Prioritise the core job, define who it serves and validate the experience before committing to a larger platform.",
    features: [
      "Product discovery and MVP definition",
      "Reusable interface systems",
      "Account and permission architecture",
      "Iteration and maintainability planning",
    ],
    fit: "Founders and businesses validating a repeatable software offering for a defined customer group.",
  },
];
export const concepts = [
  {
    name: "Ruang",
    category: "Workspace booking",
    description:
      "A calm booking experience for shared spaces, from choosing a room to reviewing a reservation.",
    type: "booking",
    tags: ["Booking", "Web app"],
  },
  {
    name: "Saji",
    category: "Restaurant ordering",
    description:
      "A simple menu-to-kitchen journey that keeps the next step clear for guests and staff.",
    type: "ordering",
    tags: ["QR ordering", "F&B"],
  },
  {
    name: "Alur",
    category: "Business overview",
    description:
      "An approachable dashboard concept for bringing daily tasks and business information together.",
    type: "dashboard",
    tags: ["Custom software", "SME"],
  },
];
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
export const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(
  /[^0-9]/g,
  "",
);
export const siteUrl = process.env.SITE_URL || "http://localhost:3000";
