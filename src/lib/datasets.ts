import fs from "node:fs";
import path from "node:path";
import { SAMPLE_SIZE_BUCKETS } from "./constants";
import type { CatalogStats, Dataset } from "./types";

/**
 * Server-side data access layer.
 *
 * Datasets live as individual JSON files under `data/datasets/`. We read them
 * with `fs` at build time so the whole catalog is statically baked into the
 * site — there is no runtime database. This keeps contributions simple (one
 * file = one pull request) and the site fast and free to host.
 *
 * These functions must only be called from Server Components / build-time code.
 */

const DATASETS_DIR = path.join(process.cwd(), "data", "datasets");

let cache: Dataset[] | null = null;

/** Load and validate every dataset JSON file, sorted by year (newest first). */
export function getAllDatasets(): Dataset[] {
  if (cache) return cache;

  const files = fs
    .readdirSync(DATASETS_DIR)
    .filter((f) => f.endsWith(".json"));

  const datasets = files.map((file) => {
    const raw = fs.readFileSync(path.join(DATASETS_DIR, file), "utf-8");
    const data = JSON.parse(raw) as Dataset;
    if (!data.id) {
      throw new Error(`Dataset file ${file} is missing required "id" field.`);
    }
    return data;
  });

  datasets.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
  cache = datasets;
  return datasets;
}

/** Look up a single dataset by its slug id. */
export function getDatasetById(id: string): Dataset | undefined {
  return getAllDatasets().find((d) => d.id === id);
}

/** All slugs — used by `generateStaticParams` for static dataset pages. */
export function getAllDatasetIds(): string[] {
  return getAllDatasets().map((d) => d.id);
}

/** Curated featured datasets for the homepage rail (falls back to newest). */
export function getFeaturedDatasets(limit = 4): Dataset[] {
  const all = getAllDatasets();
  const featured = all.filter((d) => d.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** The N most recently published datasets. */
export function getNewestDatasets(limit = 6): Dataset[] {
  return getAllDatasets().slice(0, limit);
}

/**
 * Datasets most similar to `id`, ranked by overlap of social topics (weighted
 * highest, since they capture the research question), then shared modalities,
 * then matching species. Used for the "Related datasets" discovery rail.
 */
export function getRelatedDatasets(id: string, limit = 3): Dataset[] {
  const all = getAllDatasets();
  const target = all.find((d) => d.id === id);
  if (!target) return [];

  const targetTopics = new Set(target.topics);
  const targetModalities = new Set(target.modality);

  const scored = all
    .filter((d) => d.id !== id)
    .map((d) => {
      const sharedTopics = d.topics.filter((t) => targetTopics.has(t)).length;
      const sharedModalities = d.modality.filter((m) => targetModalities.has(m)).length;
      const sameSpecies = d.species === target.species ? 1 : 0;
      const sharedSocial = target.socialNetworkData && d.socialNetworkData ? 1 : 0;
      const score = sharedTopics * 3 + sharedModalities * 2 + sameSpecies + sharedSocial;
      return { dataset: d, score };
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.dataset.year - a.dataset.year ||
        a.dataset.name.localeCompare(b.dataset.name)
    );

  return scored.slice(0, limit).map((s) => s.dataset);
}

/** A labelled count, used by the catalog overview charts. */
export interface FacetCount {
  label: string;
  count: number;
}

/** Distribution breakdowns of the whole catalog, for the overview page. */
export interface CatalogFacets {
  byModality: FacetCount[];
  byTopic: FacetCount[];
  bySpecies: FacetCount[];
  byAccess: FacetCount[];
  bySampleBucket: FacetCount[];
  byYear: FacetCount[];
  yearRange: [number, number];
}

function tally(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return counts;
}

function toSortedFacets(counts: Map<string, number>): FacetCount[] {
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * Compute the catalog-wide distributions powering the overview page. All counts
 * are derived from the same static catalog the rest of the site reads, so the
 * page stays a pure build-time render with no client computation.
 */
export function getCatalogFacets(): CatalogFacets {
  const all = getAllDatasets();

  const byModality = toSortedFacets(tally(all.flatMap((d) => d.modality)));
  const byTopic = toSortedFacets(tally(all.flatMap((d) => d.topics)));
  const bySpecies = toSortedFacets(tally(all.map((d) => d.species)));

  const accessOf = (d: Dataset) =>
    d.openAccess ? "Open" : d.accessType === "registered" ? "Registered" : "Restricted";
  const accessOrder = ["Open", "Registered", "Restricted"];
  const accessCounts = tally(all.map(accessOf));
  const byAccess = accessOrder
    .filter((label) => accessCounts.has(label))
    .map((label) => ({ label, count: accessCounts.get(label) ?? 0 }));

  // Sample-size buckets, reusing the directory's controlled ranges (skip "any").
  const bySampleBucket = SAMPLE_SIZE_BUCKETS.filter((b) => b.id !== "any").map((b) => ({
    label: b.label,
    count: all.filter((d) => d.sampleSize >= b.min && d.sampleSize <= b.max).length,
  }));

  // Publication-year histogram, ascending and gap-filled so the axis is continuous.
  const years = all.map((d) => d.year).filter((y) => Number.isFinite(y));
  const minYear = years.length ? Math.min(...years) : 0;
  const maxYear = years.length ? Math.max(...years) : 0;
  const yearCounts = tally(all.map((d) => String(d.year)));
  const byYear: FacetCount[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    byYear.push({ label: String(y), count: yearCounts.get(String(y)) ?? 0 });
  }

  return {
    byModality,
    byTopic,
    bySpecies,
    byAccess,
    bySampleBucket,
    byYear,
    yearRange: [minYear, maxYear],
  };
}

/** Compute aggregate statistics for the homepage counters. */
export function getCatalogStats(): CatalogStats {
  const all = getAllDatasets();
  const modalities = new Set<string>();
  const topics = new Set<string>();
  const species = new Set<string>();
  let openAccess = 0;
  let longitudinal = 0;
  let totalParticipants = 0;

  for (const d of all) {
    d.modality.forEach((m) => modalities.add(m));
    d.topics.forEach((t) => topics.add(t));
    species.add(d.species);
    if (d.openAccess) openAccess += 1;
    if (d.longitudinal) longitudinal += 1;
    totalParticipants += d.sampleSize || 0;
  }

  return {
    total: all.length,
    openAccess,
    longitudinal,
    modalities: modalities.size,
    topics: topics.size,
    totalParticipants,
    species: species.size,
  };
}
