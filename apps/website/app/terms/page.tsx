import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";
export const metadata: Metadata = pageMetadata({
  title: "Website terms",
  description:
    "Draft information about the provisional Kezuvio brand, concept portfolio and enquiry preview.",
  alternates: { canonical: "/terms" },
},"/terms");
export default function Terms() {
  return (
    <>
      <PageIntro
        eyebrow="Website information"
        title="A clear starting point."
        description="These draft notes explain the current website’s purpose. Final terms need the confirmed operator, service arrangements and appropriate review before public launch."
      />
      <article className="container prose content-bottom">
        <p className="notice legal-draft">
          Draft for review · 31 October 2026 · Not a project agreement.
        </p>
        <h2>A proposed studio</h2>
        <p>
          Kezuvio Labs is a provisional brand for a proposed Malaysian software
          development studio. The website describes intended services and does
          not assert legal registration, trademark clearance, awards or client
          outcomes.
        </p>
        <h2>Concepts and demonstrations</h2>
        <p>
          Portfolio items are independent design studies using fictional names
          and illustrative data. They are not client projects or functioning
          applications. The separate demo portal offers interactive sample
          workflows with fictional data. All payments, refunds and notifications
          are simulated. The workspaces expire and are not suitable for actual
          business records, real reservations, tax invoices or accounting.
        </p>
        <h2>Enquiries and project scope</h2>
        <p>
          Preparing a local enquiry does not send a message, reserve a service
          or create a project agreement. Any future project requires a
          separately agreed scope, price, schedule, responsibilities and support
          terms.
        </p>
        <h2>Third-party tools and future features</h2>
        <p>
          Hardware support, payment processing, accounting compliance and
          integrations are not verified by this website. These requirements need
          separate assessment and testing for each project.
        </p>
        <h2>Contact availability</h2>
        <p>
          Public contact details are pending. See{" "}
          <Link href="/contact">the contact page</Link> for the available
          enquiry preparation tools and{" "}
          <Link href="/privacy">privacy information</Link> for how they handle
          data.
        </p>
      </article>
    </>
  );
}
