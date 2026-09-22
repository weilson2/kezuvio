import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";
import { ContactForm } from "@/components/contact-form";
import { Card, Icon } from "@kezuvio/ui";
import { contactEmail, whatsapp } from "@/lib/content";
export const metadata: Metadata = pageMetadata({
  title: "Start a conversation",
  description:
    "Prepare a project enquiry for Kezuvio Labs. Tell us about your business and the digital tools you have in mind.",
  alternates: { canonical: "/contact" },
},"/contact");
export default function Contact() {
  return (
    <>
      <PageIntro
        eyebrow="Let’s talk"
        title="Every useful thing starts with a conversation."
        description="Tell us where your business is today and what you would like to make possible. You don’t need a technical specification to begin."
      />
      <section className="container content-bottom contact-grid">
        <aside className="contact-aside">
          <h2>A little context goes a long way.</h2>
          <p><Link href="/inquiry-workflow">Try the fictional inquiry-to-proposal workflow</Link> to explore qualification, human review and follow-up without sending messages.</p>
          <p>
            Explore <Link href="/pricing">draft service packages</Link>, read
            the <Link href="/faq">FAQ</Link> or{" "}
            <Link href="/request-quotation">prepare a quotation brief</Link>{" "}
            before deciding on scope.
          </p>
          <p>
            Share the problem you want to solve, the people who will use it and
            any timing or budget considerations. A focused starting point helps
            shape a useful next step.
          </p>
          {contactEmail ? (
            <a className="text-link" href={`mailto:${contactEmail}`}>
              {contactEmail}
              <Icon name="arrow" />
            </a>
          ) : (
            <p className="notice">
              Public contact details will be added when the studio is ready to
              receive enquiries. You can prepare and save your brief below.
            </p>
          )}
          {whatsapp && (
            <a
              className="text-link"
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Start a WhatsApp conversation <Icon name="arrow" />
            </a>
          )}
          <div className="contact-steps">
            <p>
              <span>01</span>Describe the business need.
            </p>
            <p>
              <span>02</span>Note what a good outcome looks like.
            </p>
            <p>
              <span>03</span>Keep your brief for a future conversation.
            </p>
          </div>
        </aside>
        <Card>
          <ContactForm email={contactEmail} />
        </Card>
      </section>
    </>
  );
}
