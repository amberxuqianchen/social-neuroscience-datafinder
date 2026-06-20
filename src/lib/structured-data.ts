/**
 * schema.org / JSON-LD builders.
 *
 * Emitting `Dataset` structured data is the single most important thing this
 * directory can do for its stated mission — *findability*. Google Dataset
 * Search and other crawlers index `schema.org/Dataset` markup, so every dataset
 * page advertises itself in a machine-readable way that surfaces it far beyond
 * this site. The home page additionally declares the catalog as a `DataCatalog`
 * and a searchable `WebSite`.
 *
 * These builders return plain objects; render them with the `<JsonLd>`
 * component, which serializes them into a `<script type="application/ld+json">`.
 */

import { SITE } from "./constants";
import type { Dataset } from "./types";

/** Canonical URL of a dataset's detail page on this site. */
export function datasetPageUrl(dataset: Dataset): string {
  return `${SITE.url}/datasets/${dataset.id}`;
}

/** A `schema.org/Dataset` description of a single catalog entry. */
export function datasetJsonLd(dataset: Dataset): Record<string, unknown> {
  const keywords = Array.from(
    new Set([...dataset.topics, ...dataset.modality, ...(dataset.tags ?? [])])
  );

  const sameAs = Array.from(
    new Set(
      [dataset.url, dataset.downloadUrl, dataset.doi ? `https://doi.org/${dataset.doi}` : undefined].filter(
        (u): u is string => Boolean(u)
      )
    )
  );

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: dataset.name,
    alternateName: dataset.shortName,
    description: dataset.description,
    url: datasetPageUrl(dataset),
    sameAs,
    keywords,
    datePublished: String(dataset.year),
    isAccessibleForFree: dataset.openAccess,
    citation: dataset.citation,
    measurementTechnique: dataset.modality,
    variableMeasured: dataset.topics,
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: SITE.name,
      url: SITE.url,
    },
  };

  if (dataset.doi) {
    jsonLd.identifier = `https://doi.org/${dataset.doi}`;
  }

  if (dataset.repository) {
    jsonLd.creator = { "@type": "Organization", name: dataset.repository };
    jsonLd.publisher = { "@type": "Organization", name: dataset.repository };
  }

  if (dataset.downloadUrl) {
    jsonLd.distribution = [
      {
        "@type": "DataDownload",
        contentUrl: dataset.downloadUrl,
        ...(dataset.repository ? { name: dataset.repository } : {}),
      },
    ];
  }

  if (dataset.publications && dataset.publications.length > 0) {
    jsonLd.subjectOf = dataset.publications.map((p) => ({
      "@type": "ScholarlyArticle",
      name: p.title,
      url: p.url,
      ...(p.year ? { datePublished: String(p.year) } : {}),
    }));
  }

  // Drop undefined values so the emitted JSON stays clean.
  for (const key of Object.keys(jsonLd)) {
    if (jsonLd[key] === undefined) delete jsonLd[key];
  }

  return jsonLd;
}

/** A `DataCatalog` describing the whole directory, listing its datasets. */
export function catalogJsonLd(datasets: Dataset[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    keywords: ["social neuroscience", "datasets", "neuroimaging", "open data"],
    dataset: datasets.map((d) => ({
      "@type": "Dataset",
      name: d.name,
      description: d.description.slice(0, 160),
      url: datasetPageUrl(d),
    })),
  };
}

/** A `WebSite` with a `SearchAction` so engines expose a sitelinks searchbox. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/datasets?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
