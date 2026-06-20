import { getAllDatasets } from "@/lib/datasets";
import { SITE } from "@/lib/constants";

/**
 * Machine-readable export of the entire catalog, emitted as a static
 * `/catalog.json` file at build time. This is the seed of the project's planned
 * public API: anyone can fetch the whole dataset index in one request, no
 * scraping required.
 */
export const dynamic = "force-static";

export function GET() {
  const datasets = getAllDatasets();

  return Response.json(
    {
      name: SITE.name,
      description: SITE.description,
      homepage: SITE.url,
      license: "MIT (catalog metadata); cite original authors for each dataset.",
      count: datasets.length,
      datasets,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
