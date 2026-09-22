import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Icon } from "@kezuvio/ui";
import { CTA, PageIntro } from "@/components/site";
import { draftPackages } from "@/lib/studio-content";
import "@/components/studio.css";

export const metadata: Metadata = pageMetadata({
  title: "Draft service packages & project estimates",
  description:
    "Review draft scopes for Malaysian business websites, e-commerce, POS, CRM, automation and maintenance. Quotations follow a human scope review.",
  alternates: { canonical: "/pricing" },
},"/pricing");
function Items({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
export default function PricingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Scope first. Clear expectations."
        title="A useful starting point for your project."
        description="Compare draft package scopes, then prepare a brief around your business. A reviewed quotation will define the actual work, delivery assumptions and commercial terms."
      />
      <section
        className="container content-bottom studio-drafts"
        aria-label="Draft service packages"
      >
        <div className="studio-review-note">
          <Badge>Draft · founder review required</Badge>
          <p>
            These packages are planning drafts. Prices have not been approved or
            finalised. No listed scope is a binding offer, and hosting, provider
            charges and optional services are agreed separately before any
            purchase or activation.
          </p>
        </div>
        <div className="studio-package-grid">
          {draftPackages.map((item) => (
            <article
              className="studio-package"
              key={item.id}
              id={item.id}
              data-testid={`studio-package-${item.id}`}
            >
              <span className="eyebrow">Draft service package</span>
              <h2>{item.name}</h2>
              <p className="studio-draft-label">{item.priceLabel}</p>
              <dl>
                <div>
                  <dt>Proposed scope</dt>
                  <dd>
                    <Items items={item.scope} />
                  </dd>
                </div>
                <div>
                  <dt>Revision allowance</dt>
                  <dd>{item.revisionAllowance}</dd>
                </div>
                <div>
                  <dt>Exclusions</dt>
                  <dd>
                    <Items items={item.exclusions} />
                  </dd>
                </div>
                <div>
                  <dt>Delivery assumptions</dt>
                  <dd>{item.deliveryAssumptions}</dd>
                </div>
                <div>
                  <dt>Optional services</dt>
                  <dd>
                    <Items items={item.options} />
                  </dd>
                </div>
              </dl>
              <Link
                href={`/request-quotation?package=${item.id}`}
                className="button secondary"
              >
                Discuss this scope <Icon name="arrow" />
              </Link>
            </article>
          ))}
        </div>
        <div className="studio-review-note" style={{ marginTop: 32 }}>
          <p>
            A useful brief identifies who will use the system, the steps they
            take, the information they need and the constraints you already
            know.{" "}
            <Link href="/faq" className="text-link">
              Read the project FAQ
            </Link>{" "}
            or{" "}
            <Link href="/portfolio#software-demos" className="text-link">
              explore the demonstrations
            </Link>{" "}
            before preparing your request.
          </p>
        </div>
      </section>
      <CTA />
    </>
  );
}
