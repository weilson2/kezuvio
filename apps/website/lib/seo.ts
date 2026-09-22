import type { Metadata } from "next";
export const privateIndexPaths = [
  "/api/",
  "/demo/",
  "/operations",
  "/inquiry-workflow",
  "/brand",
];
export function pageMetadata(metadata: Metadata, path: string): Metadata {
  const title =
    typeof metadata.title === "string"
      ? metadata.title
      : "Kezuvio Labs — Create. Build. Evolve.";
  const description =
    metadata.description ??
    "Explore practical websites, business software and six fictional workflow demonstrations from a proposed Malaysian studio.";
  const images = [
    {
      url: "/brand/icons/social-preview.png",
      width: 1200,
      height: 630,
      alt: "Kezuvio Labs. Create. Build. Evolve.",
    },
  ];
  return {
    ...metadata,
    description,
    alternates: { ...metadata.alternates, canonical: path },
    openGraph: {
      type: "website",
      siteName: "Kezuvio Labs",
      title,
      description,
      url: path,
      images,
      ...metadata.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/brand/icons/social-preview.png"],
      ...metadata.twitter,
    },
    ...(privateIndexPaths.some((prefix) => path.startsWith(prefix))
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
export function jsonLd(value: unknown) {
  return (JSON.stringify(value) ?? "null").replace(/</g, "\\u003c");
}
