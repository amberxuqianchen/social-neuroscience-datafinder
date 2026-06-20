import type { MetadataRoute } from "next";
import { getAllDatasetIds } from "@/lib/datasets";
import { SITE } from "@/lib/constants";
import { TUTORIALS } from "@/lib/tutorials";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/datasets", "/overview", "/learn", "/resources", "/contribute", "/about"].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
  }));

  const datasetRoutes = getAllDatasetIds().map((id) => ({
    url: `${SITE.url}/datasets/${id}`,
    lastModified: new Date(),
  }));

  const tutorialRoutes = TUTORIALS.map((tutorial) => ({
    url: `${SITE.url}/learn/${tutorial.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...datasetRoutes, ...tutorialRoutes];
}
