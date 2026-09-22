import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { AccountingWorkspace } from "@/components/labs/accounting-workspace";

export const metadata: Metadata = pageMetadata({
  title: "Accounting Cloud · Journal and reporting workspace",
  description:
    "Explore balanced double-entry accounting, invoices, reports and inventory with fictional Malaysian SME data.",
  robots: { index: false, follow: false },
},"/demo/accounting-cloud");

export default function AccountingPage() {
  return <AccountingWorkspace />;
}
