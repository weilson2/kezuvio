import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { CTA, PageIntro, Principle } from "@/components/site";
import Link from "next/link";
import "@/components/studio.css";
export const metadata: Metadata = pageMetadata({
  title: "About the studio",
  description:
    "The idea behind Kezuvio Labs: thoughtful digital tools for growing Malaysian businesses.",
  alternates: { canonical: "/about" },
},"/about");
export default function About() {
  return (
    <>
      <PageIntro
        eyebrow="The idea behind Kezuvio"
        title="Small beginnings. Thoughtful ambition."
        description="Kezuvio Labs is a proposed software development studio with a simple focus: making useful digital tools more approachable for growing Malaysian businesses."
      />
      <section className="container about-story">
        <div>
          <span className="eyebrow">Create. Build. Evolve.</span>
          <h2>
            Ideas become useful
            <br />
            when they meet
            <br />
            the everyday.
          </h2>
          <p>
            A shop finding its first customers online. A café simplifying
            orders. A team replacing a difficult spreadsheet. These are the
            kinds of problems we want to help solve.
          </p>
          <p>
            Our direction is practical: listen carefully, design clearly and
            build a foundation that can grow with the business.
          </p>
        </div>
        <div className="about-mark">
          <img
            src="/brand/logos/kezuvio-icon-dark.svg"
            alt="Kezuvio geometric K mark"
            width="100"
            height="100"
          />
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">What guides the work</span>
            <h2>Clarity is a good starting point.</h2>
          </div>
        </div>
        <div className="principles-grid">
          <Principle number="01" title="People before features" icon="phone">
            Choose functionality around the person doing the work. Make the
            important things easy to understand.
          </Principle>
          <Principle number="02" title="Purpose in the details" icon="spark">
            From a button label to a system boundary, make choices that serve a
            real need.
          </Principle>
          <Principle number="03" title="Space to grow" icon="layers">
            Build a focused first version with clear documentation and
            maintainable components.
          </Principle>
        </div>
        <p className="notice" style={{ marginTop: 40 }}>
          Kezuvio Labs is a provisional brand. This site presents the studio’s
          intended services and independent design concepts; it does not claim
          company registration, trademark clearance or a client track record.
        </p>
      </section>
      <section
        className="section container studio-approach"
        aria-labelledby="studio-working-method"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">From an idea to a working flow</span>
            <h2 id="studio-working-method">Make the work reviewable.</h2>
          </div>
        </div>
        <div className="studio-approach-grid">
          <article>
            <span className="eyebrow">01 / Understand</span>
            <h3>Start with a clear brief.</h3>
            <p>
              Map the people, decisions and information involved in a workflow.
              A useful first release has an agreed scope, explicit exclusions
              and observable acceptance criteria.
            </p>
          </article>
          <article>
            <span className="eyebrow">02 / Demonstrate</span>
            <h3>Show the actual interaction.</h3>
            <p>
              Our six software demonstrations let you explore ordering, sales,
              quotations, property leads, accounting and room design with
              fictional data. They make product conversations more concrete.
            </p>
            <Link href="/portfolio#software-demos" className="text-link">
              Explore working demonstrations
            </Link>
          </article>
          <article>
            <span className="eyebrow">03 / Review</span>
            <h3>Keep people in the decision.</h3>
            <p>
              Review a working increment, its test evidence and known
              limitations before committing to the next release. Real
              integrations, commercial terms and launch arrangements need their
              own review.
            </p>
            <Link href="/request-quotation" className="text-link">
              Prepare a project brief
            </Link>
          </article>
        </div>
      </section>
      <CTA />
    </>
  );
}
