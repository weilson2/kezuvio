import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata(
  {
    title: "Kezuvio Labs — Websites, software & practical demos",
    description:
      "Explore website, POS, CRM and supervised automation workflows for Malaysian SMEs, with six fictional software demonstrations.",
    alternates: { canonical: "/" },
  },
  "/",
);
import { Icon } from "@kezuvio/ui";
import { CTA, ProductVisual, ServiceGrid } from "@/components/site";
import { StudioSummary } from "@/components/studio-showcase";
export default function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            Independent thinking. Practical software.
          </span>
          <h1>
            Create.
            <br />
            Build.{" "}
            <span className="evolve">
              Evolve.
              <svg viewBox="0 0 300 16" aria-hidden="true">
                <path d="M4 11Q140-5 292 7" />
              </svg>
            </span>
          </h1>
          <p className="hero-description">
            Digital solutions for
            <br className="desktop-break" />{" "}
            <strong>growing businesses.</strong>
          </p>
          <p className="hero-subtext">
            From your first website to the systems behind your everyday work.
            Thoughtfully built for Malaysian SMEs.
          </p>
          <div className="button-row">
            <Link href="/contact" className="button">
              Get a Free Consultation <Icon name="arrow" />
            </Link>
            <Link href="/demo" className="button secondary">
              Explore Our Demos <Icon name="arrow" />
            </Link>
          </div>
          <div className="hero-note">
            <span /> Built with purpose. Designed to grow.
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit-label">
            <span className="orbit-dot" /> IDEAS INTO EVERYDAY TOOLS
          </div>
          <ProductVisual />
          <div className="floating-card">
            <span className="floating-icon">
              <Icon name="check" />
            </span>
            <div>
              Less busywork.
              <br />
              <strong>More room to grow.</strong>
            </div>
          </div>
          <div className="visual-caption">
            <span className="tiny-cross">+</span> Interface concept ·
            Illustrative data <span>01 / ALUR</span>
          </div>
        </div>
      </section>
      <div className="capability-strip">
        <div className="container">
          <span>
            One studio.
            <br />
            <strong>Connected possibilities.</strong>
          </span>
          <span>Websites</span>
          <i />
          <span>Mobile apps</span>
          <i />
          <span>Business systems</span>
          <i />
          <span>SaaS & automation</span>
          <Icon name="spark" />
        </div>
      </div>
      <section className="section container" id="services">
        <div className="section-heading">
          <div>
            <span className="eyebrow">What we can build</span>
            <h2>
              The right tools.
              <br />
              <span className="muted">For your next chapter.</span>
            </h2>
          </div>
          <Link href="/services" className="text-link">
            Explore all services <Icon name="arrow" />
          </Link>
        </div>
        <ServiceGrid />
      </section>
      <StudioSummary />
      <section className="approach-section">
        <div className="container approach-grid">
          <div>
            <span className="eyebrow">Built around your business</span>
            <h2>
              Technology should
              <br />
              make work feel
              <br />
              <span className="muted">a little simpler.</span>
            </h2>
            <Link href="/about" className="text-link">
              Meet the idea behind Kezuvio <Icon name="arrow" />
            </Link>
          </div>
          <div className="approach-list">
            {[
              [
                "01",
                "Start with the real problem",
                "We begin with your workflow, your customers and the friction you want to remove.",
              ],
              [
                "02",
                "Make every interaction count",
                "Clear interfaces and purposeful features help people get things done with less effort.",
              ],
              [
                "03",
                "Leave room to evolve",
                "A focused first version and maintainable foundations make the next step easier.",
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A glimpse of what’s possible</span>
            <h2>Ideas, made tangible.</h2>
          </div>
          <Link href="/portfolio" className="text-link">
            Explore concept work <Icon name="arrow" />
          </Link>
        </div>
        <div className="home-concept">
          <div className="concept-art">
            <ProductVisual compact />
          </div>
          <div className="concept-copy">
            <span className="badge">Independent concept · Not client work</span>
            <h3>
              Alur
              <br />A clearer view of your business.
            </h3>
            <p>
              An interface study bringing everyday business information into one
              considered workspace.
            </p>
            <Link href="/portfolio#alur" className="text-link">
              View the concept <Icon name="arrow" />
            </Link>
            <div className="tag-row">
              <span>Interface design</span>
              <span>SME tools</span>
            </div>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
