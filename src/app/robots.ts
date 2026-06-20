import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

/**
 * Tell crawlers everything is fair game and point them at the sitemap. For a
 * directory whose whole purpose is discoverability, we want full indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
