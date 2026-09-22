import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@kezuvio/ui";
import { CTA, PageIntro } from "@/components/site";
import { studioFaqs } from "@/lib/studio-content";
import { jsonLd } from "@/lib/seo";
import "@/components/studio.css";

export const metadata: Metadata = pageMetadata(
  {
    title: "Website, POS, CRM & automation project FAQ",
    description:
      "Practical answers about website scope, POS systems, CRM, automation, maintenance and quotation planning for Malaysian SMEs.",
    alternates: { canonical: "/faq" },
  },
  "/faq",
);
export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: studioFaqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }),
        }}
      />
      <PageIntro
        eyebrow="A clearer brief starts here"
        title="Questions worth asking before a build."
        description="Practical answers for Malaysian businesses exploring websites and custom software. Use them to define a focused first version and a reviewable quotation."
      />
      <section
        className="container content-bottom studio-faq"
        aria-labelledby="studio-faq-heading"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Scope, delivery and support</span>
            <h2 id="studio-faq-heading">
              Plan the work with clear expectations.
            </h2>
          </div>
          <Link href="/pricing" className="text-link">
            Compare draft packages <Icon name="arrow" />
          </Link>
        </div>
        <div className="studio-faq-list">
          {studioFaqs.map((item) => (
            <details key={item.id} id={item.id}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="studio-review-note">
          <p>
            Tell us where your team works, whether that is Kuala Lumpur, Johor
            Bahru or another Malaysian market, and which languages, devices and
            working hours matter. Location-specific delivery, onsite visits,
            integrations and support arrangements are scoped during review; no
            local office or existing client engagement is implied.
          </p>
        </div>
        <div className="button-row">
          <Link href="/request-quotation" className="button">
            Prepare a quotation brief <Icon name="arrow" />
          </Link>
          <Link href="/portfolio#software-demos" className="button secondary">
            Try the software demonstrations
          </Link>
        </div>
      </section>
      <CTA />
    </>
  );
}
