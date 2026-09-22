import type { Metadata } from "next";
import { InquiryWorkspace } from "@/components/inquiry-workspace";

export const metadata: Metadata = {
  title: "Inquiry to reviewed proposal · Fictional workflow",
  description:
    "Explore a controlled fictional inquiry, local qualification, quotation draft, human review and internal follow-up using the saved Automation Hub workspace.",
  alternates: { canonical: "/inquiry-workflow" },
  robots: { index: false, follow: false },
};
export default function InquiryWorkflowPage() {
  return <InquiryWorkspace />;
}
