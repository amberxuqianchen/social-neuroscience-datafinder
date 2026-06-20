import type { Dataset } from "./types";

/**
 * Serialization helpers for exporting the catalog (or a filtered slice of it).
 *
 * Kept browser-free and pure so they can run at build time (the static
 * `/catalog.json` endpoint) or in the client (the directory's export buttons).
 */

/** Columns emitted in the CSV, in order. */
const CSV_COLUMNS: { key: keyof Dataset; header: string }[] = [
  { key: "id", header: "id" },
  { key: "name", header: "name" },
  { key: "shortName", header: "short_name" },
  { key: "description", header: "description" },
  { key: "modality", header: "modality" },
  { key: "topics", header: "topics" },
  { key: "sampleSize", header: "sample_size" },
  { key: "species", header: "species" },
  { key: "longitudinal", header: "longitudinal" },
  { key: "openAccess", header: "open_access" },
  { key: "accessType", header: "access_type" },
  { key: "socialNetworkData", header: "social_network_data" },
  { key: "year", header: "year" },
  { key: "repository", header: "repository" },
  { key: "url", header: "url" },
  { key: "downloadUrl", header: "download_url" },
  { key: "doi", header: "doi" },
  { key: "citation", header: "citation" },
  { key: "tags", header: "tags" },
];

/** Render a single value as a CSV cell, escaping per RFC 4180. */
function csvCell(value: unknown): string {
  let text: string;
  if (value == null) text = "";
  else if (Array.isArray(value)) text = value.join("; ");
  else if (typeof value === "boolean") text = value ? "true" : "false";
  else text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Convert datasets to a CSV string with a header row. */
export function datasetsToCsv(datasets: Dataset[]): string {
  const header = CSV_COLUMNS.map((c) => c.header).join(",");
  const rows = datasets.map((d) =>
    CSV_COLUMNS.map((c) => csvCell(d[c.key])).join(",")
  );
  return [header, ...rows].join("\r\n");
}

/** Convert datasets to a pretty-printed JSON string. */
export function datasetsToJson(datasets: Dataset[]): string {
  return JSON.stringify(datasets, null, 2);
}
