import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllDatasetIds, getDatasetById, getRelatedDatasets } from "@/lib/datasets";
import { datasetJsonLd } from "@/lib/structured-data";
import Badge from "@/components/Badge";
import DatasetCard from "@/components/DatasetCard";
import JsonLd from "@/components/JsonLd";

interface PageProps {
  params: { slug: string };
}

// Statically generate one page per dataset at build time.
export function generateStaticParams() {
  return getAllDatasetIds().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const dataset = getDatasetById(params.slug);
  if (!dataset) return { title: "Dataset not found" };
  return {
    title: dataset.name,
    description: dataset.description.slice(0, 155),
  };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-3 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="col-span-2 font-medium">{children}</dd>
    </div>
  );
}

export default function DatasetPage({ params }: PageProps) {
  const dataset = getDatasetById(params.slug);
  if (!dataset) notFound();

  const related = getRelatedDatasets(dataset.id, 3);

  const accessLabel = dataset.openAccess
    ? "Open access"
    : dataset.accessType === "registered"
      ? "Registered access"
      : "Restricted access";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={datasetJsonLd(dataset)} />
      <nav className="mb-6 text-sm text-muted">
        <Link href="/datasets" className="hover:text-fg">← Back to directory</Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {dataset.shortName && <Badge variant="outline">{dataset.shortName}</Badge>}
            {dataset.repository && <Badge>{dataset.repository}</Badge>}
            {dataset.openAccess ? (
              <Badge variant="open">{accessLabel}</Badge>
            ) : (
              <Badge variant="restricted">{accessLabel}</Badge>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{dataset.name}</h1>
        </div>
        <a
          href={dataset.url}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          Visit dataset →
        </a>
      </div>

      <p className="mt-6 text-base leading-relaxed text-fg/90">{dataset.description}</p>

      {/* Modalities & topics */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Modalities</h2>
          <div className="flex flex-wrap gap-1.5">
            {dataset.modality.map((m) => (
              <Badge key={m} variant="brand">{m}</Badge>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Social topics</h2>
          <div className="flex flex-wrap gap-1.5">
            {dataset.topics.length ? (
              dataset.topics.map((t) => (
                <Badge key={t} variant="accent">{t}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata table */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Details</h2>
        <dl>
          <Row label="Sample size">{dataset.sampleSize ? dataset.sampleSize.toLocaleString() : "Repository / varies"}</Row>
          <Row label="Species">{dataset.species}</Row>
          <Row label="Longitudinal">{dataset.longitudinal ? "Yes" : "No"}</Row>
          <Row label="Social-network data">{dataset.socialNetworkData ? "Yes" : "No"}</Row>
          <Row label="Access">{accessLabel}</Row>
          <Row label="Year">{dataset.year}</Row>
          {dataset.repository && <Row label="Repository">{dataset.repository}</Row>}
          {dataset.doi && (
            <Row label="DOI">
              <a
                href={`https://doi.org/${dataset.doi}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-brand hover:underline"
              >
                {dataset.doi}
              </a>
            </Row>
          )}
        </dl>
      </div>

      {/* Links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={dataset.url}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          Dataset homepage
        </a>
        {dataset.downloadUrl && dataset.downloadUrl !== dataset.url && (
          <a
            href={dataset.downloadUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Download / repository
          </a>
        )}
      </div>

      {/* Citation */}
      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Citation</h2>
        <blockquote className="rounded-lg border-l-4 border-brand bg-surface-2 p-4 font-mono text-sm leading-relaxed">
          {dataset.citation}
        </blockquote>
      </div>

      {/* Associated publications */}
      {dataset.publications && dataset.publications.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Associated publications
          </h2>
          <ul className="space-y-2">
            {dataset.publications.map((p) => (
              <li key={p.url}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm text-brand hover:underline"
                >
                  {p.title}
                </a>
                {p.year ? <span className="text-sm text-muted"> ({p.year})</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {dataset.tags && dataset.tags.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {dataset.tags.map((t) => (
              <Badge key={t} variant="default">#{t}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Related datasets */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Related datasets
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((d) => (
              <DatasetCard key={d.id} dataset={d} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 rounded-xl border border-dashed border-border p-5 text-sm text-muted">
        Spotted an error or have an update?{" "}
        <a
          href="https://github.com/amberxuqianchen/social-neuroscience-datafinder/issues/new"
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-brand hover:underline"
        >
          Open an issue or pull request
        </a>{" "}
        — every entry is community-maintained.
      </div>
    </div>
  );
}
