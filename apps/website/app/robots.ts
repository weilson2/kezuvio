import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content";
export default function robots(): MetadataRoute.Robots {
  return process.env.SITE_URL
    ? {
        rules: { userAgent: "*", allow: "/", disallow: "/brand" },
        sitemap: `${siteUrl}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
