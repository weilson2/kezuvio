import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Icon } from "@kezuvio/ui";
import { concepts } from "@/lib/content";
import { CTA, PageIntro, ProductVisual } from "@/components/site";
export const metadata: Metadata = {
  title: "Concept portfolio",
  description:
    "Independent interface studies in booking, restaurant ordering and SME tools. Concept work, not client projects.",
  alternates: { canonical: "/portfolio" },
};
function BookingArt() {
  return (
    <div
      className="mini-booking"
      role="img"
      aria-label="Ruang workspace booking interface concept with fictional availability"
    >
      <div aria-hidden="true">
        <div className="mini-title">ruang.</div>
        <p>Space for your next good idea.</p>
        <div className="room-illustration" />
        <strong>The Studio Room</strong>
        <p>4 people · A quiet space to focus</p>
        <div className="mini-slots">
          <span>09:00 AM</span>
          <span>11:00 AM</span>
          <span>02:00 PM</span>
        </div>
        <div className="mini-action">Booking preview</div>
      </div>
    </div>
  );
}
function OrderingArt() {
  return (
    <div
      className="mini-ordering"
      role="img"
      aria-label="Saji restaurant menu interface concept with fictional items"
    >
      <div aria-hidden="true">
        <div className="mini-title">saji.</div>
        <p>Something good is on the menu.</p>
        {[
          ["◒", "Nasi lemak", "RM 12.00"],
          ["☕", "Kopi susu", "RM 6.00"],
          ["◓", "Kaya toast", "RM 5.00"],
        ].map(([icon, name, price]) => (
          <div className="food-row" key={name}>
            <span className="food-symbol">{icon}</span>
            <div>
              <strong>{name}</strong>
              <small>{price}</small>
            </div>
            <span>+</span>
          </div>
        ))}
        <div className="mini-action">Order preview · Table 04</div>
      </div>
    </div>
  );
}
export default function Portfolio() {
  return (
    <>
      <PageIntro
        eyebrow="Independent concept work"
        title="A little imagination. A practical direction."
        description="Interface studies exploring how everyday business tools could look and feel. These are original design concepts, not delivered client projects or working applications."
      />
      <section
        className="container content-bottom concept-list"
        aria-label="Concept portfolio"
      >
        {concepts.map((c) => (
          <article
            className="concept-row"
            id={c.name.toLowerCase()}
            key={c.name}
          >
            <div
              className={`concept-art ${c.type === "booking" ? "booking-art" : c.type === "ordering" ? "ordering-art" : ""}`}
            >
              {c.type === "booking" ? (
                <BookingArt />
              ) : c.type === "ordering" ? (
                <OrderingArt />
              ) : (
                <ProductVisual compact type="dashboard" />
              )}
            </div>
            <div className="concept-copy">
              <Badge>Independent concept · Fictional data</Badge>
              <h2>{c.name}</h2>
              <h3>{c.category}</h3>
              <p>{c.description}</p>
              <p className="field-help">
                Visual study only. Explore the separate demo portal for interactive sample workflows.
              </p>
              <Link className="text-link" href="/contact">
                Discuss a similar idea <Icon name="arrow" />
              </Link>
              <div className="tag-row">
                {c.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
      <CTA />
    </>
  );
}
