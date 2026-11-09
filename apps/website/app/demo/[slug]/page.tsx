import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demos } from "@/lib/demo/catalog";
import { DemoWorkspace } from "@/components/demos/workspace";
import "../demo.css";
export function generateStaticParams() {
  return demos
    .filter((d) => d.slug !== "cafe-pos")
    .map((d) => ({ slug: d.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const demo = demos.find((d) => d.slug === slug);
  return {
    title: demo ? `${demo.name} — Interactive demo` : "Demo not found",
    description: demo?.description,
    robots: { index: false, follow: false },
  };
}
export default async function Demo({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!demos.some((d) => d.slug === slug)) notFound();
  return <DemoWorkspace slug={slug} />;
}
