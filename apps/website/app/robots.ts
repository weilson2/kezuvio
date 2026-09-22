import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content";
import { privateIndexPaths } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return process.env.SITE_URL
    ? {
        rules: { userAgent: "*", allow: "/", disallow: privateIndexPaths },
        sitemap: `${siteUrl}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: ["/", ...privateIndexPaths] } };
}
