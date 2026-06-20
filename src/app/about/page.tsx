import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About & Roadmap",
  description:
    "The mission, principles, and roadmap behind Social Neuroscience DataFinder — an open dataset directory.",
};

const ROADMAP = [
  {
    phase: "Now — v1",
    status: "shipped",
    items: [
      "Curated starter catalog of 20+ datasets",
      "Client-side keyword search and multi-filter directory",
      "Catalog overview with coverage visualizations",
      "Machine-readable export (JSON / CSV) and schema.org structured data for Google Dataset Search",
      "Static, fast, free-to-host site (no backend)",
      "Community contributions via GitHub pull requests",
    ],
  },
  {
    phase: "Next",
    status: "planned",
    items: [
      "Papers-linked-to-datasets graph and reverse citation lookup",
      "Dataset ratings and 'used by' counts",
      "Benchmark tasks associated with datasets",
      "Links to companion code repositories",
    ],
  },
  {
    phase: "Later",
    status: "exploring",
    items: [
      "User submissions through a guided web form (PR-backed)",
      "Versioned public REST API with query parameters",
      "AI-assisted dataset discovery and natural-language search",
      "Federated metadata sync with OpenNeuro, DANDI, and NEMAR",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="mt-2 text-muted">
          Social Neuroscience DataFinder is an open, community-maintained directory of datasets for
          studying the social brain.
        </p>
      </header>

      <section className="prose-academic space-y-4 text-fg/90">
        <h2 className="text-xl font-semibold tracking-tight">Mission</h2>
        <p>
          Social neuroscience sits at the intersection of many methods — fMRI, EEG, MEG, fNIRS,
          behavior, and social-network science — and its data is correspondingly scattered. Newcomers
          and experts alike lose time rediscovering the same resources. Our mission is to make the
          field&apos;s data <strong>findable</strong>: one searchable place that indexes datasets by the
          social constructs and methods researchers actually care about.
        </p>

        <h2 className="text-xl font-semibold tracking-tight">Principles</h2>
        <p>
          We model this resource on the best of open science — OpenNeuro, DANDI, NEMAR, Papers With
          Code, and community &ldquo;awesome lists.&rdquo; That means open metadata, transparent
          curation, version-controlled contributions, and proper credit to original dataset authors. We
          host no data ourselves; we point you to it and describe it consistently.
        </p>

        <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
        <p>
          Every dataset is a plain JSON file validated against a shared schema and baked into a fully
          static site at build time. There is no database and no server to maintain, which keeps the
          project fast, cheap to host, and easy to fork. Search and filtering run entirely in your
          browser.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Roadmap</h2>
        <p className="mt-1 text-sm text-muted">
          The architecture is intentionally designed so each of the following can be added without
          rewrites.
        </p>
        <div className="mt-6 space-y-6">
          {ROADMAP.map((stage) => (
            <div key={stage.phase} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{stage.phase}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    stage.status === "shipped"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : stage.status === "planned"
                        ? "bg-brand/10 text-brand"
                        : "bg-surface-2 text-muted"
                  }`}
                >
                  {stage.status}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {stage.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-dashed border-border p-6 text-center">
        <h2 className="text-lg font-semibold">Help build it</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          This directory is only as good as its community. Add a dataset, fix metadata, or suggest a
          feature.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/contribute" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90">
            Contribute a dataset
          </Link>
          <Link href="/datasets" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">
            Browse the directory
          </Link>
        </div>
      </section>
    </div>
  );
}
