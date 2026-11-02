import Link from "next/link";
import { BrandLogo, Icon, type IconName } from "@kezuvio/ui";
import { services } from "@/lib/content";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Link href="/" aria-label="Kezuvio Labs home">
            <BrandLogo />
          </Link>
          <p>Digital Solutions for Growing Businesses.</p>
          <span className="footer-small">
            A proposed software studio in Malaysia.
          </span>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/services">Services</Link>
          <Link href="/portfolio">Concept portfolio</Link>
          <Link href="/about">About the studio</Link>
        </div>
        <div>
          <h3>Start a conversation</h3>
          <Link href="/contact">
            Plan your project <span aria-hidden="true">↗</span>
          </Link>
          <Link href="/demo">Demo availability</Link>
          <Link href="/brand">Brand foundation</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getUTCFullYear()} Kezuvio Labs · Provisional brand
        </span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>Create. Build. Evolve.</span>
        </div>
      </div>
    </footer>
  );
}
export function CTA() {
  return (
    <section className="container cta-section">
      <div>
        <span className="eyebrow">Your next chapter</span>
        <h2>
          Have an idea?
          <br />
          Let’s give it shape.
        </h2>
        <p>
          Start with a conversation about your business,
          <br className="desktop-break" /> your challenges and what comes next.
        </p>
      </div>
      <Link className="button" href="/contact">
        Get a Free Consultation <Icon name="arrow" />
      </Link>
      <div className="cta-decoration" aria-hidden="true">
        ↗
      </div>
    </section>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-intro container">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p className="lead">{description}</p>
    </section>
  );
}
export function ServiceGrid() {
  return (
    <div className="service-grid">
      {services.map((s, i) => (
        <Link
          href={`/services/${s.slug}`}
          className="service-card"
          key={s.slug}
        >
          <div className="service-top">
            <span className="icon-box">
              <Icon name={s.icon} />
            </span>
            <span className="service-number">0{i + 1}</span>
          </div>
          <h3>{s.title}</h3>
          <p>{s.description}</p>
          <span className="service-more">
            Explore service <Icon name="arrow" />
          </span>
        </Link>
      ))}
    </div>
  );
}
export function Principle({
  number,
  title,
  children,
  icon,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  icon: IconName;
}) {
  return (
    <article className="principle">
      <div className="principle-top">
        <span>{number}</span>
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
export function ProductVisual({
  compact = false,
  type = "dashboard",
}: {
  compact?: boolean;
  type?: string;
}) {
  return (
    <div
      className={`product-visual ${compact ? "compact" : ""} visual-${type}`}
      aria-label={`${type === "booking" ? "Ruang booking" : type === "ordering" ? "Saji ordering" : "Alur business dashboard"} interface concept. All data is fictional.`}
      role="img"
    >
      <div className="product-window" aria-hidden="true">
        <div className="product-sidebar">
          <div className="product-brand">
            <span className="product-brand-icon">a</span>alur
            <span className="product-brand-dot">.</span>
          </div>
          <div className="product-workspace">
            <span className="workspace-avatar">K</span>
            <div>
              Sample workspace<small>Illustrative data</small>
            </div>
          </div>
          <div className="product-menu active">
            <Icon name="layers" /> Overview
          </div>
          <div className="product-menu">
            <Icon name="pos" /> Transactions
          </div>
          <div className="product-menu">
            <Icon name="web" /> Products
          </div>
          <div className="product-menu">
            <Icon name="phone" /> Customers
          </div>
          <div className="product-menu">
            <Icon name="code" /> Reports
          </div>
          <div className="product-sidebar-bottom">
            <span className="avatar">A</span>Alex Tan <span>⌄</span>
          </div>
        </div>
        <div className="product-main">
          <div className="product-toolbar">
            <span>
              Workspace / <b>Overview</b>
            </span>
            <span className="mini-avatar">A</span>
          </div>
          <div className="product-heading">
            <div>
              <h3>A clearer picture.</h3>
              <p>Here’s your business at a glance.</p>
            </div>
            <span className="product-period">This month ⌄</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>Total revenue</span>
              <strong>
                RM 12,840<span>.00</span>
              </strong>
              <small>Sample data</small>
            </div>
            <div>
              <span>Orders</span>
              <strong>128</strong>
              <small>Sample data</small>
            </div>
            <div>
              <span>Customers</span>
              <strong>86</strong>
              <small>Sample data</small>
            </div>
          </div>
          <div className="chart-panel">
            <div className="chart-heading">
              <b>Revenue overview</b>
              <span>
                <i /> Revenue
              </span>
            </div>
            <div className="chart">
              <div className="chart-labels">
                <span>12k</span>
                <span>8k</span>
                <span>4k</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 480 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient
                    id={`area-${compact ? "small" : "large"}-${type}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop stopColor="#6366f1" stopOpacity=".25" />
                    <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 115C25 115 35 84 65 90S105 115 135 80S180 100 215 65S250 85 285 55S330 80 360 42S410 55 440 24S470 34 480 12V140H0Z"
                  fill={`url(#area-${compact ? "small" : "large"}-${type})`}
                />
                <path
                  d="M0 115C25 115 35 84 65 90S105 115 135 80S180 100 215 65S250 85 285 55S330 80 360 42S410 55 440 24S470 34 480 12"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <div className="chart-dates">
              <span>01 Oct</span>
              <span>07 Oct</span>
              <span>14 Oct</span>
              <span>21 Oct</span>
              <span>28 Oct</span>
            </div>
          </div>
          <div className="recent-table">
            <b>Recent activity</b>
            <div>
              <span className="activity-icon">
                <Icon name="check" />
              </span>
              <span>
                Order #1028<small>Sample transaction</small>
              </span>
              <strong>RM 128.00</strong>
              <span className="status-pill">Completed</span>
            </div>
            <div>
              <span className="activity-icon">
                <Icon name="check" />
              </span>
              <span>
                Order #1027<small>Sample transaction</small>
              </span>
              <strong>RM 64.00</strong>
              <span className="status-pill">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
