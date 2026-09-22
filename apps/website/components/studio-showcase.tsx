import Image from "next/image";
import Link from "next/link";
import { Badge, Icon } from "@kezuvio/ui";
import { studioProducts } from "@/lib/studio-content";
import "./studio.css";

export function StudioShowcase() {
  return (
    <section
      className="section container studio-showcase"
      id="software-demos"
      aria-labelledby="studio-demos-heading"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">Explore the working product</span>
          <h2 id="studio-demos-heading">Six workflows, ready to try.</h2>
        </div>
        <Link href="/demo" className="text-link">
          Open the demo portal <Icon name="arrow" />
        </Link>
      </div>
      <div className="studio-review-note">
        <Badge>Independent demonstrations</Badge>
        <p>
          These screenshots show the actual local applications. Use fictional
          information only. Payments and messages are simulated, staff roles are
          selectable examples, and every product has its own saved visitor
          workspace and reset.
        </p>
      </div>
      <div className="studio-product-grid">
        {studioProducts.map((product) => (
          <article
            className="studio-product-card"
            key={product.slug}
            id={`product-${product.slug}`}
            data-testid={`studio-product-${product.slug}`}
          >
            <Link
              className="studio-product-preview"
              href={`/demo/${product.slug}`}
              aria-label={`Explore ${product.name}`}
            >
              <Image
                src={product.screenshot}
                width={1440}
                height={850}
                sizes="(max-width: 900px) 100vw, 50vw"
                alt={`${product.name} screenshot showing the fictional ${product.category.toLowerCase()} workspace.`}
              />
            </Link>
            <div className="studio-product-body">
              <span className="eyebrow">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.overview}</p>
              <ul className="studio-features">
                {product.features.map((feature) => (
                  <li key={feature}>
                    <Icon name="check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <dl className="studio-product-details">
                <div>
                  <dt>Who this workflow is for</dt>
                  <dd>{product.audience.join(". ")}.</dd>
                </div>
              </dl>
              <details className="studio-product-limits">
                <summary>Demo limitations</summary>
                <ul>
                  {product.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </details>
              <Link
                href={`/services/${product.serviceSlug}`}
                className="text-link"
              >
                Explore the related service <Icon name="arrow" />
              </Link>
              <div className="button-row">
                <Link href={`/demo/${product.slug}`} className="button">
                  Try Live Demo <Icon name="arrow" />
                </Link>
                <Link
                  href={`/request-quotation?service=${product.serviceSlug}&product=${product.slug}`}
                  className="button secondary"
                >
                  Request Quotation
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StudioSummary() {
  const featured = studioProducts[0];
  return (
    <section
      className="section container studio-summary"
      aria-labelledby="studio-summary-heading"
    >
      <div className="studio-summary-grid">
        <div>
          <span className="eyebrow">See the workflow for yourself</span>
          <h2 id="studio-summary-heading">From ordering to room design.</h2>
          <p>
            Explore six interactive studio demonstrations with fictional
            Malaysian business data. Follow an order, move a lead, inspect a
            journal or shape a room before discussing the system your team
            needs.
          </p>
          <ul className="studio-product-links">
            {studioProducts.map((product) => (
              <li key={product.slug}>
                <Link href={`/demo/${product.slug}`}>{product.name}</Link>
              </li>
            ))}
          </ul>
          <div className="button-row">
            <Link href="/portfolio#software-demos" className="button">
              Explore the software portfolio <Icon name="arrow" />
            </Link>
            <Link href="/request-quotation" className="text-link">
              Prepare a project brief <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <div>
          <Link
            className="studio-summary-image"
            style={{ display: "block" }}
            href={`/demo/${featured.slug}`}
          >
            <Image
              src={featured.screenshot}
              width={1440}
              height={850}
              sizes="(max-width: 900px) 100vw, 50vw"
              alt="Cafe POS demonstration showing fictional menu items, orders and workspace controls."
            />
          </Link>
          <p className="studio-draft-label" style={{ marginTop: 12 }}>
            Actual demo screenshot · fictional data · simulated payments
          </p>
        </div>
      </div>
    </section>
  );
}
