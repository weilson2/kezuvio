import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { PropertyWorkspace } from "@/components/labs/property-workspace";

export const metadata: Metadata = pageMetadata({
  title: "Property CRM · Listings and sales workspace",
  description:
    "Manage fictional Malaysian property listings, leads, viewings and follow-ups in a local demo workspace.",
  robots: { index: false, follow: false },
},"/demo/property-crm");

export default function PropertyPage() {
  return <PropertyWorkspace />;
}
