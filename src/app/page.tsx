import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import {
  getAllDatasets,
  getCatalogStats,
  getFeaturedDatasets,
  getNewestDatasets,
} from "@/lib/datasets";
import { catalogJsonLd, websiteJsonLd } from "@/lib/structured-data";
import DatasetCard from "@/components/DatasetCard";
import HomeSearch from "@/components/HomeSearch";
import JsonLd from "@/components/JsonLd";

export default function HomePage() {
  const stats = getCatalogStats();
  const featured = getFeaturedDatasets(4);
  const newest = getNewestDatasets(6);
  const allDatasets = getAllDatasets();

  const statItems = [
    { label: "Datasets", value: stats.total },
    { label: "Open access", value: stats.openAccess },
    { label: "Modalities", value: stats.modalities },
    { label: "Social topics", value: stats.topics },
    { label: "Longitudinal", value: stats.longitudinal },
    { label: "Species", value: stats.species },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={catalogJsonLd(allDatasets)} />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-surface to-bg">
        <div className="mx-auto flex max-w-content flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            Open · Community-driven · {stats.total} datasets and growing
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Discover datasets for{" "}
            <span className="text-brand">social neuroscience</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted sm:text-lg">
            A comprehensive, searchable directory of brain and behavioral datasets relevant to how we
            think about, connect with, and influence one another — from naturalistic fMRI to social
            networks, EEG, and beyond.
          </p>
          <div className="mt-8 flex w-full flex-col items-center">
            <HomeSearch />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/datasets"
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Browse all datasets
            </Link>
            <Link
              href="/contribute"
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              Contribute a dataset
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-surface p-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold tracking-tight">Why this exists</h2>
            <p className="mt-3 text-muted">
              Researchers entering social neuroscience repeatedly struggle to find data that fits their
              question. Relevant datasets are scattered across dozens of repositories, described in
              inconsistent ways, and rarely indexed by the social constructs that matter — friendship,
              cooperation, theory of mind, group behavior. This directory aggregates that metadata into
              one fast, filterable catalog so you can spend less time hunting and more time analyzing.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {statItems.slice(0, 6).map((s) => (
              <div key={s.label} className="rounded-xl bg-surface-2 p-3 text-center">
                <div className="text-2xl font-bold text-brand">{s.value}</div>
                <div className="mt-1 text-[11px] leading-tight text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-content px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Browse by category</h2>
          <Link href="/datasets" className="text-sm font-medium text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.modality}
              href={`/datasets?modality=${encodeURIComponent(c.modality)}`}
              className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand/50"
            >
              <div className="text-sm font-semibold group-hover:text-brand">{c.label}</div>
              <div className="mt-1 text-xs text-muted">{c.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Featured datasets</h2>
          <Link href="/datasets" className="text-sm font-medium text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((d) => (
            <DatasetCard key={d.id} dataset={d} />
          ))}
        </div>
      </section>

      {/* Newest */}
      <section className="mx-auto max-w-content px-4 pb-4 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recently added</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {newest.map((d) => (
            <DatasetCard key={d.id} dataset={d} />
          ))}
        </div>
      </section>
    </>
  );
}
