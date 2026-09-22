import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { CTA, PageIntro, Principle, ServiceGrid } from "@/components/site";
export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Explore websites, mobile applications, POS, QR ordering, custom software and SaaS for Malaysian SMEs.",
  alternates: { canonical: "/services" },
},"/services");
export default function Services() {
  return (
    <>
      <PageIntro
        eyebrow="Our services"
        title="Good software starts with your business."
        description="A useful website. A smoother workflow. A product idea worth exploring. Start with the outcome, and choose the tools that help you get there."
      />
      <section className="container content-bottom" aria-label="Services">
        <ServiceGrid />
      </section>
      <section className="container content-bottom">
        <div className="section-heading">
          <div>
            <span className="eyebrow">From idea to next step</span>
            <h2>A considered way forward.</h2>
          </div>
        </div>
        <div className="principles-grid">
          <Principle number="01" title="Understand" icon="spark">
            Map the problem, the people and the constraints. Agree on what a
            useful first version should do.
          </Principle>
          <Principle number="02" title="Design & build" icon="code">
            Make the experience tangible, review the details and develop around
            an agreed scope.
          </Principle>
          <Principle number="03" title="Review & evolve" icon="layers">
            Test the core journeys, document the handover and decide on
            improvements using what you learn.
          </Principle>
        </div>
      </section>
      <CTA />
    </>
  );
}
