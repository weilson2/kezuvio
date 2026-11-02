import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kezuvio Labs",
    short_name: "Kezuvio",
    description: "Digital Solutions for Growing Businesses.",
    start_url: "/",
    display: "browser",
    background_color: "#F8FAFC",
    theme_color: "#6366F1",
    icons: [
      {
        src: "/brand/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
