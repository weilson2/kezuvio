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
    "/pricing",
    "/faq",
    "/request-quotation",
    "/demo",
    "/privacy",
    "/terms",
  ].map((p) => ({ url: `${siteUrl}${p}` }));
}
