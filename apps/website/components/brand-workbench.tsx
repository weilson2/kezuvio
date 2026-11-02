"use client";
import { useState } from "react";
import { Badge, Button, Card, Field, Icon } from "@kezuvio/ui";
const colors = [
  ["Indigo", "#6366F1"],
  ["Purple", "#A855F7"],
  ["Cyan", "#06B6D4"],
  ["Navy", "#0F172A"],
  ["Cloud", "#F8FAFC"],
  ["White", "#FFFFFF"],
  ["Ink", "#0B1220"],
  ["Muted", "#64748B"],
];
export function BrandWorkbench() {
  const [layout, setLayout] = useState("horizontal");
  const [treatment, setTreatment] = useState("dark");
  const [copied, setCopied] = useState("");
  const [example, setExample] = useState(false);
  const asset = `/brand/logos/kezuvio-${layout}-${treatment}.svg`;
  return (
    <>
      <nav className="brand-subnav" aria-label="Brand sections">
        <a href="#logo-system">01 Logo system</a>
        <a href="#colors">02 Color</a>
        <a href="#typography">03 Typography</a>
        <a href="#components">04 Components</a>
      </nav>
      <section className="brand-section" id="logo-system">
        <span className="eyebrow">01 / The signature</span>
        <h2>A K with forward intent.</h2>
        <p>
          A steady vertical spine meets two directional arms. Open gaps keep the
          mark clear at small sizes; an indigo-to-cyan spectrum gives the
          digital identity its energy.
        </p>
        <div className="logo-tools">
          <div className="field">
            <label htmlFor="logo-layout">Lockup</label>
            <select
              id="logo-layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
            >
              <option value="horizontal">Horizontal</option>
              <option value="stacked">Stacked</option>
              <option value="icon">Icon only</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="logo-treatment">Treatment</label>
            <select
              id="logo-treatment"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
            >
              <option value="dark">On dark</option>
              <option value="light">On light</option>
              <option value="mono-dark">Monochrome dark</option>
              <option value="mono-light">Monochrome light</option>
            </select>
          </div>
          <a className="button secondary" href={asset} download>
            <Icon name="download" />
            Download SVG
          </a>
        </div>
        <div
          className={`logo-preview ${treatment === "dark" || treatment === "mono-light" ? "preview-dark" : "preview-light"}`}
        >
          <img
            src={asset}
            alt={`Kezuvio ${layout} logo, ${treatment} treatment`}
            width={
              layout === "horizontal" ? 450 : layout === "stacked" ? 330 : 100
            }
            height={
              layout === "horizontal" ? 112 : layout === "stacked" ? 230 : 100
            }
            style={layout === "icon" ? { width: 150 } : undefined}
          />
        </div>
        <p className="field-help" style={{ marginTop: 16 }}>
          Keep a clear space of at least one spine width. Use the icon at 32 px
          or larger. Never stretch, rotate or add effects.
        </p>
      </section>
      <section id="colors" className="brand-section">
        <span className="eyebrow">02 / Color with purpose</span>
        <h2>Grounded. With a little energy.</h2>
        <p>
          Navy and cloud give the system room to breathe. Indigo leads; purple
          and cyan add emphasis. Click a swatch to copy its value. Interface
          text uses accessible semantic variants.
        </p>
        <div className="swatch-grid">
          {colors.map(([name, hex]) => (
            <button
              className="swatch"
              key={name}
              aria-label={`Copy ${name} ${hex}`}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(hex);
                  setCopied(`${name} ${hex} copied.`);
                } catch {
                  setCopied(`Clipboard unavailable. ${name}: ${hex}`);
                }
              }}
            >
              <span className="swatch-color" style={{ background: hex }} />
              <span className="swatch-text">
                <strong>{name}</strong>
                <small>{hex}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="copy-status" role="status">
          {copied}
        </div>
        <p className="notice">
          Primary buttons use #4F46E5 with white in light mode, and #A5A6FF with
          ink in dark mode. Cyan and purple swatches are decorative accents, not
          default small-text colors.
        </p>
      </section>
      <section id="typography" className="brand-section">
        <span className="eyebrow">03 / A clear voice</span>
        <h2>Inter. Human, direct, adaptable.</h2>
        <p>
          Self-hosted, open-source type. Confident headings, comfortable body
          text and restrained captions keep the message clear.
        </p>
        <div className="type-specimen">
          <div>
            <div className="type-aa">Aa</div>
            <span>Inter · 400 / 500 / 600 / 700 / 800</span>
          </div>
          <div className="type-lines">
            <div>
              <small>Display</small>
              <span
                style={{
                  fontSize: "2.5rem",
                  lineHeight: 1.1,
                  letterSpacing: "-.05em",
                  fontWeight: 600,
                }}
              >
                Create. Build. Evolve.
              </span>
            </div>
            <div>
              <small>Heading</small>
              <span style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                Room to grow.
              </span>
            </div>
            <div>
              <small>Body</small>
              <span>Digital Solutions for Growing Businesses.</span>
            </div>
            <div>
              <small>Caption</small>
              <span style={{ fontSize: ".75rem" }}>
                Considered details. Consistent experiences.
              </span>
            </div>
          </div>
        </div>
      </section>
      <section id="components" className="brand-section">
        <span className="eyebrow">04 / The building blocks</span>
        <h2>One language. Many possibilities.</h2>
        <p>
          Shared, semantic React components for the website and future product
          demos. Switch the site theme to review both color systems.
        </p>
        <div className="component-grid">
          <Card>
            <h3>Actions & feedback</h3>
            <Badge>Component specimen</Badge>
            <div className="button-row">
              <Button onClick={() => setExample(true)}>
                Primary action <Icon name="arrow" />
              </Button>
              <Button variant="secondary" onClick={() => setExample(false)}>
                Reset example
              </Button>
              <Button disabled>Unavailable</Button>
            </div>
            <div className="notice" role="status">
              {example
                ? "Action confirmed. This is local component feedback."
                : "Use the primary action to preview a feedback state."}
            </div>
          </Card>
          <Card>
            <h3>Form fields</h3>
            <Field
              id="example-name"
              label="Business name"
              help="A clear label and helpful supporting text."
              placeholder="Your business"
            />
            <Field
              id="example-error"
              label="Email address"
              type="email"
              defaultValue="example"
              error="Example error state: enter a valid email address."
            />
            <p className="field-help" style={{ marginTop: 16 }}>
              These are component specimens, not a submission form.
            </p>
          </Card>
        </div>
        <p className="brand-footer-note field-help">
          Foundation v0.1 · Provisional identity · Brand and trademark review
          remains outstanding.
        </p>
      </section>
    </>
  );
}
