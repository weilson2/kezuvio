import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@kezuvio/ui";
import { PageIntro } from "@/components/site";
import { ContactForm } from "@/components/contact-form";
export const metadata: Metadata = pageMetadata({
  title: "Prepare a quotation brief",
  description:
    "Prepare a local project brief for a website, POS, CRM or automation scope. Draft packages require founder review.",
  alternates: { canonical: "/request-quotation" },
},"/request-quotation");
export default function RequestQuotation() {
  return (
    <>
      <PageIntro
        eyebrow="Scope before quotation"
        title="Turn a useful idea into a clear brief."
        description="Describe the workflow, audience, timing and constraints. This local preview prepares a brief you can copy or download; it sends no message."
      />
      <section className="container content-bottom contact-grid">
        <aside className="contact-aside">
          <h2>Agree the work before the price.</h2>
          <p><Link href="/inquiry-workflow">Rehearse the inquiry and proposal workflow</Link> using fictional .test details and human review.</p>
          <p>
            Package scopes are discussion drafts. A reviewed quotation should
            name deliverables, revisions, dependencies, exclusions, acceptance
            checks and support.
          </p>
          <p>
            Use sample information while the studio's communication and
            data-handling arrangements are being prepared.
          </p>
          <p>
            <Link href="/pricing">Review draft packages</Link> ·{" "}
            <Link href="/faq">Read common questions</Link>
          </p>
          <p className="notice">
            No purchase, booking or engagement is created by preparing this
            brief.
          </p>
        </aside>
        <Card>
          <ContactForm email="" />
        </Card>
      </section>
    </>
  );
}
