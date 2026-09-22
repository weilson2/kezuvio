import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@kezuvio/ui";
import { PageIntro } from "@/components/site";
import { demos } from "@/lib/demo/catalog";
import "./demo.css";
export const metadata: Metadata = pageMetadata({
  title: "Interactive demo portal",
  description:
    "Try fictional business software demonstrations, including Property CRM, AI Automation Hub, Commerce Studio and café POS with independent saved workspaces.",
  alternates: { canonical: "/demo" },
},"/demo");

const portalDemos: typeof demos = [
  ...demos,
  {
    slug: "interior-3d",
    name: "Interior 3D Studio",
    category: "Room design & configuration",
    description:
      "Arrange original furniture models, preview room finishes and save an illustrative design with an itemised estimate.",
    icon: "layers",
    features: [
      "Interactive 3D room",
      "Furniture configuration",
      "Saved designs & estimates",
    ],
    color: "clay",
  },
  {
    slug: "accounting-cloud",
    name: "Accounting Cloud",
    category: "Journals & reporting",
    description:
      "Post fictional double-entry transactions, settle invoices and reconcile reports in an independent saved workspace.",
    icon: "layers",
    features: [
      "Balanced journals",
      "Receivables & payables",
      "Reconciled statements",
    ],
    color: "indigo",
  },
  {
    slug: "commerce-studio",
    name: "Commerce Studio",
    category: "Commerce & inventory",
    description:
      "Manage fictional products, simulate checkout and track orders through fulfilment in a saved shop workspace.",
    icon: "layers",
    features: [
      "Product & stock management",
      "Mock checkout",
      "Seller dashboard",
    ],
    color: "indigo",
  },
  {
    slug: "automation-hub",
    name: "AI Automation Hub",
    category: "Inquiry & workflow",
    description:
      "Turn a fictional inquiry into a reviewed quotation using local rules and a working task queue.",
    icon: "spark",
    features: [
      "Requirements analysis",
      "Quotation approval",
      "Follow-up tracking",
    ],
    color: "clay",
  },
  {
    slug: "property-crm",
    name: "Property CRM",
    category: "Listings & sales",
    description:
      "Manage fictional Malaysian listings, assign leads and schedule viewings in a saved workspace.",
    icon: "web",
    features: ["Listings & leads", "Sales pipeline", "Viewing appointments"],
    color: "forest",
  },
];

export default function DemoPortal() {
  return (
    <>
      <PageIntro
        eyebrow="Explore / Experiment / Reset"
        title="See what useful software can do."
        description="Hands-on demonstrations. Fictional businesses, sample data and real interactions. Find a workflow that feels familiar, then make it your own."
      />
      <section className="container content-bottom">
        <div className="portal-notice">
          <span className="demo-pill">DEMO MODE</span>
          <p>
            All payments and messages are simulated. Café POS, Commerce Studio,
            AI Automation Hub, Property CRM, Accounting Cloud and Interior 3D
            Studio each have their own saved workspace. The five legacy demos
            share a one-hour workspace in this browser. Each workspace can be
            reset from its demo controls.
          </p>
        </div>
        <div className="demo-portal-grid">
          {portalDemos.map((demo, i) => (
            <article className="demo-portal-card" key={demo.slug}>
              <div
                className={`portal-art tone-${demo.color}`}
                aria-hidden="true"
              >
                <div className="portal-art-top">
                  <span>{demo.name.toLowerCase()}</span>
                  <span>•••</span>
                </div>
                <div className="portal-art-body">
                  <div className="portal-art-side">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="portal-art-content">
                    <Icon name={demo.icon} />
                    <strong>{demo.category}</strong>
                    <div className="portal-art-bars">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="portal-art-line" />
                  </div>
                </div>
                <span className="portal-number">0{i + 1}</span>
              </div>
              <div className="portal-card-copy">
                <span className="eyebrow">{demo.category}</span>
                <h2>{demo.name}</h2>
                <p>{demo.description}</p>
                <ul>
                  {demo.features.map((f) => (
                    <li key={f}>
                      <Icon name="check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="button-row">
                  <Link href={`/demo/${demo.slug}`} className="button">
                    Try Demo <Icon name="arrow" />
                  </Link>
                  <Link
                    href={`/contact?service=${demo.slug === "pos" || demo.slug === "cafe-pos" ? "pos-systems" : demo.slug === "business-website" ? "web-development" : "custom-software"}`}
                    className="text-link"
                  >
                    Request Quote
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="notice" style={{ marginTop: 32 }}>
          Use sample information only. These demonstrations are not production
          business systems. Staff and manager roles are selectable examples
          within your own workspace, not access to a real business.
        </p>
      </section>
    </>
  );
}
