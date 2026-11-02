import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@kezuvio/ui";
import { PageIntro } from "@/components/site";
import { demos } from "@/lib/demo/catalog";
import "./demo.css";
export const metadata: Metadata = {
  title: "Interactive demo portal",
  description:
    "Try six fictional business software demonstrations: websites, commerce, QR ordering, POS, bookings and SME management.",
  alternates: { canonical: "/demo" },
};
export default function DemoPortal() {
  return (
    <>
      <PageIntro
        eyebrow="Explore / Experiment / Reset"
        title="See what useful software can do."
        description="Six hands-on demonstrations. Fictional businesses, sample data and real interactions. Find a workflow that feels familiar, then make it your own."
      />
      <section className="container content-bottom">
        <div className="portal-notice">
          <span className="demo-pill">DEMO MODE</span>
          <p>
            Every checkout is simulated. Each browser session gets an isolated
            workspace that expires after one hour. Reset it at any time.
          </p>
        </div>
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
                    href={`/contact?service=${demo.slug === "pos" ? "pos-systems" : demo.slug === "business-website" ? "web-development" : demo.slug === "qr-ordering" ? "qr-ordering" : "custom-software"}`}
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
