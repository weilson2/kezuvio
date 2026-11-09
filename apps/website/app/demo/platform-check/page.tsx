import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PlatformCheck } from "@/components/labs/platform-shell";

export const metadata = {
  title: "Shared platform check",
  robots: { index: false, follow: false },
};

export default async function PlatformCheckPage() {
  await connection();
  if (process.env.LABS_ACCEPTANCE_MODE !== "1") notFound();
  return <PlatformCheck />;
}
