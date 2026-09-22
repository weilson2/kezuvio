import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site";
export const metadata: Metadata = pageMetadata({
  title: "Privacy information",
  description:
    "How the local Kezuvio website preview handles enquiry details and theme preferences.",
  alternates: { canonical: "/privacy" },
},"/privacy");
export default function Privacy() {
  return (
    <>
      <PageIntro
        eyebrow="Website information"
        title="Privacy, in plain language."
        description="This notice describes the current local website preview. It must be updated with the operator’s details and actual hosting and enquiry arrangements before public launch."
      />
      <article className="container prose content-bottom">
        <p className="notice legal-draft">
          Draft for review · 31 October 2026 · No claim of legal or regulatory
          compliance.
        </p>
        <h2>Your enquiry stays on your device</h2>
        <p>
          The enquiry form validates the information you enter in your browser
          and creates a text brief. It does not submit your name, email or
          project details to a server. The information remains in the page’s
          memory until you reload or leave the page.
        </p>
        <p>
          Downloading a brief saves a file on your device. Copying it uses your
          clipboard. If a contact email is configured, opening an email draft
          hands the text to your email application; sending it is a separate
          action you control.
        </p>
        <h2>Fictional demo workspaces</h2>
        <p>The interactive demonstrations use an essential, HTTP-only session cookie named “kezuvio-demo”. It identifies a randomly generated workspace on this server and expires after one hour. Demo changes are held in server memory and are removed on expiry, reset or restart. Different browser sessions have separate data; tabs in the same session share a workspace.</p>
        <p>Use fictional information only. No real card details, payment credentials or customer records are required. Staff and manager roles are selectable demonstrations, not real account identities. Request limits and session tokens protect the sample actions. Technical hosting logs may contain request information when deployed.</p>
        <h2>Theme preference</h2>
        <p>
          The site uses browser local storage under the key “kezuvio-theme” to
          remember your light or dark theme. You can clear it through your
          browser’s site-data settings. This preference is not sent to an
          analytics service.
        </p>
        <h2>Fonts, analytics and links</h2>
        <p>
          Fonts and brand assets are served with the site. This implementation
          does not include advertising trackers, analytics scripts or marketing
          cookies. Any future hosting provider may process request information;
          its actual practices must be assessed and described before launch.
        </p>
        <p>
          Email and WhatsApp links, when configured, open a separate service
          whose own privacy terms apply. Avoid putting sensitive personal
          information in a project brief.
        </p>
        <h2>Questions and future changes</h2>
        <p>
          Operator and privacy contact details have not yet been supplied. They
          must be added before collecting enquiries. See the{" "}
          <Link href="/contact">contact page</Link> for current availability.
        </p>
      </article>
    </>
  );
}
