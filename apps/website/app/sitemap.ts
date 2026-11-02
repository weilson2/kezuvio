import type { MetadataRoute } from "next";
import { services, siteUrl } from "@/lib/content";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
    "/portfolio",
    "/about",
    "/contact",
    "/demo",
    "/privacy",
    "/terms",
  ].map((p) => ({ url: `${siteUrl}${p}` }));
}
