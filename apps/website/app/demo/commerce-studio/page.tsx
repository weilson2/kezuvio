import type { Metadata } from "next";
import { CommerceWorkspace } from "@/components/labs/commerce-workspace";

export const metadata: Metadata = {
  title: "Commerce Studio · Shop and seller demo",
  description:
    "Explore a fictional shop, manage products and inventory, and follow simulated orders through fulfilment.",
  robots: { index: false, follow: false },
};

export default function CommercePage() {
  return <CommerceWorkspace />;
}
