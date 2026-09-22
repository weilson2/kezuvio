import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { InteriorWorkspace } from "@/components/labs/interior-workspace";

export const metadata: Metadata = pageMetadata({
  title: "Interior 3D Studio · Room design workspace",
  description:
    "Configure a fictional room with original 3D furniture, materials, saved layouts and illustrative MYR pricing.",
  robots: { index: false, follow: false },
},"/demo/interior-3d");

export default function InteriorPage() {
  return <InteriorWorkspace />;
}
