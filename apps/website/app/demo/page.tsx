import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@kezuvio/ui";
import { PageIntro } from "@/components/site";
import { demos } from "@/lib/demo/catalog";
import "./demo.css";
export const metadata: Metadata = {
  title: "Interactive demo portal",
  description:
    "Try fictional business software demonstrations, including AI Automation Hub, Commerce Studio and café POS with independent saved workspaces.",
  alternates: { canonical: "/demo" },
};
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
            All payments and messages are simulated. Café POS, Commerce Studio
            and AI Automation Hub each have their own saved workspace; the five
            legacy demos share a one-hour workspace in this browser. Each
            workspace can be reset from its demo controls.
          </p>
        </div>
        <article className="demo-panel" style={{ marginBottom: 24 }}>
          <span className="eyebrow">New / Commerce Studio</span>
          <h2>One shop. Every step connected.</h2>
          <p>
            Manage fictional products and stock, shop the catalogue, simulate
            checkout and follow orders through fulfilment. Explore the seller
            dashboard in an independent saved workspace.
          </p>
          <Link href="/demo/commerce-studio" className="button">
            Try Commerce Studio <Icon name="arrow" />
          </Link>
        </article>
        <article className="demo-panel" style={{ marginBottom: 24 }}>
          <span className="eyebrow">New / AI Automation Hub</span>
          <h2>From inquiry to a reviewed quotation.</h2>
          <p>
            Explore deterministic requirements analysis, editable pricing, a
            working task queue and follow-up tracking. A person approves every
            quotation before it can be marked ready. No messages are sent.
          </p>
          <Link href="/demo/automation-hub" className="button">
            Try AI Automation Hub <Icon name="arrow" />
          </Link>
        </article>
        <div className="demo-portal-grid">
          {demos.map((demo, i) => (
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
