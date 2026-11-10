import type { Metadata } from "next";
import { AutomationWorkspace } from "@/components/labs/automation-workspace";

export const metadata: Metadata = {
  title: "Automation Hub · Inquiry to reviewed quotation",
  description:
    "Explore fictional inquiries, explainable local analysis, reviewed quotations and an interactive workflow queue. Nothing is sent externally.",
  robots: { index: false, follow: false },
};

export default function AutomationPage() {
  return <AutomationWorkspace />;
}
