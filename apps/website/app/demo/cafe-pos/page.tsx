import type { Metadata } from "next";
import { CafeWorkspace } from "@/components/labs/cafe-workspace";

export const metadata: Metadata = {
  title: "Saji Café · Integrated POS demo",
  description:
    "Try a fictional café workflow from table ordering to kitchen, cashier, inventory and sales reports.",
  robots: { index: false, follow: false },
};

export default function CafePage() {
  return <CafeWorkspace />;
}
