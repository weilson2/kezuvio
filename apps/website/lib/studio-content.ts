/** Reviewable studio copy. Fictional demonstrations are not client projects. */
export type StudioProduct = {
  slug: string;
  name: string;
  category: string;
  overview: string;
  features: string[];
  audience: string[];
  limitations: string[];
  serviceSlug:
    "web-development" | "pos-systems" | "custom-software" | "ai-automation";
  screenshot: string;
};

export const studioProducts: StudioProduct[] = [
  {
    slug: "cafe-pos",
    name: "Cafe POS & QR Ordering",
    category: "Orders, kitchen and counter",
    overview:
      "Follow a fictional café order from a table QR menu through the kitchen, simulated payment and a reconciled sales view.",
    features: [
      "Table menus and QR ordering",
      "Shared kitchen and cashier workflow",
      "Stock, receipts and controlled refunds",
      "Saved visitor workspace and independent reset",
    ],
    audience: [
      "Cafés and small restaurants",
      "Food businesses planning a counter or ordering workflow",
    ],
    limitations: [
      "Payments and printer output are simulations; no payment provider or physical printer is connected.",
      "Stock tracks sellable items rather than ingredient recipes; offline and multi-branch operations need separate design.",
      "Roles are selectable demonstrations inside a private visitor workspace, not production employee authentication.",
    ],
    serviceSlug: "pos-systems",
    screenshot: "/demo-previews/cafe-pos.png",
  },
  {
    slug: "commerce-studio",
    name: "Commerce Studio",
    category: "Catalogue, checkout and fulfilment",
    overview:
      "Run a fictional shop with persistent products, inventory, customer carts and orders, then explore the seller's fulfilment workflow.",
    features: [
      "Searchable product catalogue and saved carts",
      "Coupons and simulated checkout",
      "Seller stock and fulfilment controls",
      "Refunds and sales summaries from the same saved orders",
    ],
    audience: [
      "Small retailers",
      "Businesses defining an online shop or catalogue workflow",
    ],
    limitations: [
      "Checkout uses fictional payments; no bank, courier or live marketplace is connected.",
      "Shipping, customer authentication, tax treatment and a production returns policy require an agreed project scope.",
      "The sample catalogue and bounded visitor workspace are intended for demonstration.",
    ],
    serviceSlug: "web-development",
    screenshot: "/demo-previews/commerce-studio.png",
  },
  {
    slug: "automation-hub",
    name: "AI Automation Hub",
    category: "Inquiry, quotation and human review",
    overview:
      "Turn a fictional project inquiry into explainable requirements and a quotation draft, with visible task execution and a human approval step.",
    features: [
      "Versioned local requirements analysis",
      "Editable quotation drafts in MYR",
      "Revision-specific human approval",
      "Durable demo tasks, retries and internal follow-ups",
    ],
    audience: [
      "Service businesses handling repeat inquiries",
      "Teams exploring a supervised quotation or operations workflow",
    ],
    limitations: [
      "The demo uses deterministic local rules, with no paid model API or autonomous customer communication.",
      "Approved output remains a reviewable draft; email, WhatsApp and other external delivery are not activated.",
      "Illustrative rates and simulated roles do not establish a real commercial approval or staff login.",
    ],
    serviceSlug: "ai-automation",
    screenshot: "/demo-previews/automation-hub.png",
  },
  {
    slug: "property-crm",
    name: "Property CRM",
    category: "Listings, leads and viewings",
    overview:
      "Manage fictional Malaysian properties and contacts, assign leads, book viewings and follow a sales opportunity to its recorded outcome.",
    features: [
      "Listing and contact search with linked leads",
      "Keyboard-accessible sales stages and assignment history",
      "Viewing conflicts and internal follow-up reminders",
      "Distinct listing asking value and closed-lead conversion",
    ],
    audience: [
      "Property sales teams reviewing a CRM idea",
      "Small teams coordinating leads and appointments",
    ],
    limitations: [
      "Properties, contacts, agents and prices are fictional; no live listing feed or external calendar is connected.",
      "Appointments and reminders remain inside the demo; no customer messages are sent.",
      "Production access control, data import and agency-specific sales rules need separate requirements.",
    ],
    serviceSlug: "custom-software",
    screenshot: "/demo-previews/property-crm.png",
  },
  {
    slug: "accounting-cloud",
    name: "Accounting Cloud",
    category: "Journals, balances and reports",
    overview:
      "Explore a fictional SME's double-entry workflow, from invoices and partial settlements to a trial balance, financial statements and bank matching.",
    features: [
      "Balanced posted journals and controlled reversals",
      "Receivables, payables and dated aging",
      "Journal-derived ledger, profit and loss and balance sheet",
      "Manual bank matching and weighted-average inventory",
    ],
    audience: [
      "SMEs discussing reporting requirements",
      "Teams reviewing an accounting software prototype with their adviser",
    ],
    limitations: [
      "This is an accounting logic demonstration, not a production accounting service or professional accounting advice.",
      "No LHDN, MyInvois, SST certification, tax filing or official e-Invoice connection is claimed.",
      "The costing, credit-note and reversal policies are bounded demo policies and need professional review before business use.",
    ],
    serviceSlug: "custom-software",
    screenshot: "/demo-previews/accounting-cloud.png",
  },
  {
    slug: "interior-3d",
    name: "Interior 3D Studio",
    category: "Room design and illustrative estimates",
    overview:
      "Arrange original primitive furniture in an interactive room, change surfaces and dimensions, save a layout and inspect its illustrative cost.",
    features: [
      "Interactive 3D room with orbit and zoom",
      "Furniture selection, dimensions and placement feedback",
      "Wall, floor and furniture finish previews",
      "Saved layouts, independent duplicates and screenshot export",
    ],
    audience: [
      "Interior and furniture businesses exploring a configurator",
      "Teams demonstrating room options to customers",
    ],
    limitations: [
      "Geometry uses centimetre controls, quarter-turn rotations and rectangular floor collision checks; it is not a CAD or structural measurement tool.",
      "Catalogue prices and surface rates are illustrative, with no supplier integration or real quotation.",
      "3D rendering and image export depend on browser WebGL support; mobile performance varies by device.",
    ],
    serviceSlug: "custom-software",
    screenshot: "/demo-previews/interior-3d.png",
  },
];

export type DraftPackage = {
  id: string;
  name: string;
  scope: string[];
  revisionAllowance: string;
  exclusions: string[];
  deliveryAssumptions: string;
  options: string[];
  priceLabel: string;
};
const priceLabel = "Draft — quotation after scope review";
const standardReview =
  "Draft allowance: two consolidated review rounds on the agreed design or workflow. Scope changes and additional rounds require a reviewed change request.";

export const draftPackages: DraftPackage[] = [
  {
    id: "landing-page",
    name: "Landing Page",
    scope: [
      "One focused page with an agreed visitor journey",
      "Responsive layout and accessible contact calls to action",
      "Approved text and image placement",
      "Page title, description and social sharing preview",
    ],
    revisionAllowance: standardReview,
    exclusions: [
      "Brand strategy, custom photography and extensive copywriting",
      "Checkout, customer accounts and business-system integrations",
      "Domain, hosting and third-party subscription charges",
    ],
    deliveryAssumptions:
      "Schedule follows an approved page outline, supplied brand assets and one person coordinating consolidated feedback. Publishing requires founder and client approval.",
    options: [
      "Additional language version",
      "Copywriting workshop",
      "Additional campaign page",
    ],
    priceLabel,
  },
  {
    id: "business-website",
    name: "Business Website",
    scope: [
      "An agreed set of company and service pages",
      "Reusable responsive page components",
      "Contact inquiry journey and basic search metadata",
      "Editor and handover approach selected during discovery",
    ],
    revisionAllowance: standardReview,
    exclusions: [
      "Unlimited pages or ongoing content entry",
      "Custom CRM, checkout and undocumented integrations",
      "Guaranteed search rankings or AI recommendations",
    ],
    deliveryAssumptions:
      "Page count, language versions, editing requirements and content ownership are agreed before the schedule. Required access and approved content must be available.",
    options: [
      "Content management integration",
      "Additional service pages",
      "Maintenance and content support",
    ],
    priceLabel,
  },
  {
    id: "e-commerce-website",
    name: "E-commerce Website",
    scope: [
      "Product catalogue and agreed category structure",
      "Cart, checkout and order-status journeys",
      "Seller fulfilment workflow and scoped inventory needs",
      "Payment and shipping feasibility review before integration",
    ],
    revisionAllowance: standardReview,
    exclusions: [
      "Payment-provider approval or transaction fees",
      "Courier agreements, marketplace migration and unlimited catalogue entry",
      "Tax or regulatory certification",
    ],
    deliveryAssumptions:
      "Product data, stock ownership, shipping rules, return policy and chosen providers must be confirmed. Real payments activate only after separate approval and testing.",
    options: [
      "Catalogue import",
      "Approved courier integration",
      "Customer account and order-history features",
    ],
    priceLabel,
  },
  {
    id: "custom-pos",
    name: "Custom POS",
    scope: [
      "Agreed sales, catalogue and staff workflows",
      "Inventory and sales reporting rules",
      "Receipt and shift-control requirements",
      "Optional café table, QR and kitchen journey definition",
    ],
    revisionAllowance:
      "Draft allowance: two consolidated workflow review rounds using the agreed acceptance scenarios. Hardware or business-rule changes require a reviewed change request.",
    exclusions: [
      "Terminals, printers, scanners and network equipment",
      "Payment acquiring, offline operation and multi-branch sync unless specified",
      "Fiscal, tax or payment certification",
    ],
    deliveryAssumptions:
      "Sales rules, supported hardware, connectivity, permissions and reconciliation examples are confirmed before delivery estimates. Physical device compatibility needs an actual device check.",
    options: [
      "QR ordering",
      "Printer or scanner feasibility prototype",
      "Additional branch or inventory workflows",
    ],
    priceLabel,
  },
  {
    id: "crm",
    name: "CRM",
    scope: [
      "Agreed contact and lead data model",
      "Assignment, sales stages and follow-up workflows",
      "Role and reporting requirements",
      "A reviewed import and retention approach",
    ],
    revisionAllowance:
      "Draft allowance: two consolidated workflow review rounds against agreed lead journeys. New entities or stage rules require a reviewed change request.",
    exclusions: [
      "Unreviewed customer-data migration",
      "Bulk messaging, external calendar sync and lead-provider subscriptions",
      "Unlimited custom reports or agency-specific compliance guarantees",
    ],
    deliveryAssumptions:
      "The team supplies its process, sample fictional records, permission matrix and reporting examples. Real data transfer requires an approved handling plan.",
    options: [
      "Reviewed data import",
      "Approved calendar integration",
      "Custom dashboards and exports",
    ],
    priceLabel,
  },
  {
    id: "ai-automation",
    name: "AI Automation",
    scope: [
      "One agreed process and its human approval checkpoints",
      "Input validation and explainable output or decision rules",
      "Bounded task execution, retries and visible history",
      "Evaluation with fictional acceptance examples",
    ],
    revisionAllowance:
      "Draft allowance: two consolidated process review rounds using the agreed evaluation set. Additional tools, providers or autonomous actions require separate review.",
    exclusions: [
      "Paid model APIs and third-party subscriptions",
      "Unsupervised customer communications or production command execution",
      "Guaranteed model accuracy, savings or business outcomes",
    ],
    deliveryAssumptions:
      "Process owners define permitted actions, escalation rules, output review and a representative evaluation set. Any external service or paid API needs approval before activation.",
    options: [
      "Approved document or CRM connector",
      "Additional evaluation cases",
      "Usage monitoring and ongoing process review",
    ],
    priceLabel,
  },
  {
    id: "website-maintenance",
    name: "Website Maintenance",
    scope: [
      "An agreed update and dependency review schedule",
      "Backup and recovery checks for the supported environment",
      "Defined small content-change allowance",
      "A documented issue intake and handover process",
    ],
    revisionAllowance:
      "Draft allowance: one consolidated review of each included content change. Monthly request volume, response windows and carry-over rules are agreed in the maintenance proposal.",
    exclusions: [
      "Unlimited development, major redesign or new integrations",
      "Round-the-clock support or guaranteed recovery times unless contracted",
      "Hosting, domain renewal and external provider charges",
    ],
    deliveryAssumptions:
      "Existing source access, hosting ownership, backup responsibilities and support hours are reviewed before support begins. Inherited faults and unsupported dependencies need a separate assessment.",
    options: [
      "Additional content changes",
      "Extended support coverage",
      "Periodic accessibility or performance review",
    ],
    priceLabel,
  },
];

export type StudioFaq = { id: string; question: string; answer: string };
export const studioFaqs: StudioFaq[] = [
  {
    id: "website-cost",
    question: "How much does a business website cost?",
    answer:
      "Cost depends on the agreed pages, content preparation, design, editing tools, integrations and support. Start with a written scope and itemised estimate, then separate development from hosting, domains and ongoing services. The package outlines here are drafts; no selling price is final until the founder approves the quotation.",
  },
  {
    id: "landing-or-website",
    question: "Should I start with a landing page or a full website?",
    answer:
      "A landing page can suit one focused offer or campaign. A company with several services, customer questions or a growing content library may need a structured website. The useful starting point is the visitor's next action and the content needed to support it.",
  },
  {
    id: "website-timeline",
    question: "What affects a website's delivery schedule?",
    answer:
      "The schedule depends on agreed scope, content readiness, design decisions, integration access and the time needed for consolidated review and testing. A quotation should identify those dependencies and acceptance steps before committing to dates.",
  },
  {
    id: "pos-selection",
    question:
      "What should a café or retailer check before choosing a POS system?",
    answer:
      "Map ordering, checkout, refunds, staff permissions, stock and reconciliation first. Then check connectivity, device compatibility, payment-provider requirements and whether offline or multi-branch operation is needed. The café demonstration uses simulated payments and printer output, so a real installation needs separate hardware and provider testing.",
  },
  {
    id: "custom-crm",
    question: "When is a custom CRM useful?",
    answer:
      "A custom CRM can be worth evaluating when lead stages, assignment rules, permissions or reporting do not fit an existing tool. Compare the specific gaps with the cost of building and maintaining them. The Property CRM demonstrates one fictional workflow; production requirements and customer-data handling need their own review.",
  },
  {
    id: "ai-automation",
    question:
      "What can AI automation help with, and where should a person review it?",
    answer:
      "Repeatable inquiry analysis, document preparation and internal reminders can be useful starting points. Define permitted inputs, evaluation examples and a human checkpoint before consequential actions. This Automation Hub uses explainable local rules and does not send customer messages or call a paid model API.",
  },
  {
    id: "ecommerce-scope",
    question: "What needs to be agreed for an e-commerce website?",
    answer:
      "Confirm the catalogue, inventory ownership, delivery rules, returns, order handling and customer access. Review the selected payment and shipping providers separately, including their approval requirements and charges. The Commerce Studio demonstrates fictional checkout rather than a live payment connection.",
  },
  {
    id: "maintenance",
    question: "What should website maintenance include?",
    answer:
      "Define who owns dependency updates, backups, restore checks, monitoring and content changes. Agree supported hours, included request volume, response expectations and any exclusions. Major features, redesigns and external provider charges should be visible separately in the proposal.",
  },
  {
    id: "malaysian-customers",
    question:
      "Can these services be discussed for a business in Kuala Lumpur or Johor Bahru?",
    answer:
      "The studio's intended service market includes Malaysian SMEs, including businesses in Kuala Lumpur and Johor Bahru. Requirements, design reviews and demonstrations can be prepared for remote discussion. On-site work, travel, support coverage and delivery arrangements must be agreed for the project; no local office network is claimed.",
  },
  {
    id: "seo-ai-search",
    question:
      "Can a website be prepared for search engines and AI-assisted discovery?",
    answer:
      "Useful service explanations, clear headings, accurate metadata, accessible pages and relevant structured information help make a site understandable. Performance and crawl settings should be tested on the actual deployment. Rankings, traffic and inclusion in AI answers cannot be guaranteed.",
  },
  {
    id: "demos-client-work",
    question: "Are the demonstrations real client projects?",
    answer:
      "They are original demonstrations with fictional businesses, people and transactions. They show working software workflows and design choices without claiming client delivery, customer results or production readiness. The older portfolio studies remain labelled as independent concepts.",
  },
  {
    id: "inquiry-privacy",
    question: "What happens when I prepare a quotation inquiry here?",
    answer:
      "The contact form prepares a brief on your device for copying or downloading. It does not send the inquiry or store those contact details on a server. The separate interactive demonstrations use fictional visitor workspaces; use sample information there. Real communications and their data-handling arrangements remain subject to approval.",
  },
  {
    id: "accounting-integration",
    question:
      "Does the accounting demonstration provide official tax or e-Invoice integration?",
    answer:
      "No. Accounting Cloud demonstrates balanced journals and reconciled reports using fictional data. It does not claim LHDN, MyInvois or SST certification, and it does not submit filings or official e-Invoices. Any real business or regulatory integration requires its own requirements and qualified review.",
  },
];
