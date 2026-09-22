import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/site";
import { siteUrl } from "@/lib/content";
import { DevelopmentAnalytics } from "@/components/development-analytics";
import { jsonLd } from "@/lib/seo";
import "../../../packages/brand/tokens.css";
import "../../../packages/brand/base.css";
import "./styles.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kezuvio Labs — Create. Build. Evolve.",
    template: "%s | Kezuvio Labs",
  },
  description:
    "Digital solutions for growing Malaysian businesses. Explore website, mobile app and business software services from the proposed Kezuvio Labs studio.",
  openGraph: {
    type: "website",
    siteName: "Kezuvio Labs",
    title: "Kezuvio Labs — Create. Build. Evolve.",
    description: "Digital Solutions for Growing Businesses.",
    images: [
      {
        url: "/brand/icons/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Kezuvio Labs. Create. Build. Evolve.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/icons/social-preview.png"],
  },
  icons: {
    icon: [
      { url: "/brand/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icons/favicon.ico" },
    ],
    apple: "/brand/icons/icon-180.png",
  },
  robots: process.env.SITE_URL
    ? { index: true, follow: true }
    : { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Kezuvio Labs",
              url: siteUrl,
              description:
                "A proposed Malaysian software studio with fictional interactive product demonstrations.",
            }),
          }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <DevelopmentAnalytics />
      </body>
    </html>
  );
}
