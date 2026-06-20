import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogFacets, getCatalogStats } from "@/lib/datasets";
import { ColumnChart, HBarList } from "@/components/Charts";

export const metadata: Metadata = {
  title: "Catalog Overview",
  description:
    "A bird's-eye view of the social-neuroscience dataset catalog: coverage by modality, social topic, publication year, sample size, access model, and species.",
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function OverviewPage() {
  const stats = getCatalogStats();
  const facets = getCatalogFacets();

  const headline = [
    { value: stats.total.toLocaleString(), label: "Datasets" },
    { value: stats.openAccess.toLocaleString(), label: "Open access" },
    { value: stats.totalParticipants.toLocaleString(), label: "Participants indexed" },
    { value: stats.modalities.toLocaleString(), label: "Modalities" },
    { value: stats.topics.toLocaleString(), label: "Social topics" },
    { value: stats.species.toLocaleString(), label: "Species" },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Catalog Overview</h1>
        <p className="mt-2 text-muted">
          What does the catalog actually cover? These breakdowns are computed at build time from the
          same {stats.total} datasets you can{" "}
          <Link href="/datasets" className="text-brand hover:underline">
            browse and filter
          </Link>
          .
        </p>
      </header>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {headline.map((s) => (
          <Stat key={s.label} value={s.value} label={s.label} />
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Coverage by modality"
          description="A dataset can use several methods, so totals exceed the dataset count."
        >
          <HBarList data={facets.byModality} color="brand" />
        </Panel>

        <Panel
          title="Coverage by social topic"
          description="The constructs each dataset is indexed under — the lens this directory adds."
        >
          <HBarList data={facets.byTopic} color="accent" />
        </Panel>

        <Panel
          title="Sample size"
          description="Participant counts grouped into the directory's filter ranges."
        >
          <HBarList data={facets.bySampleBucket} color="emerald" />
        </Panel>

        <Panel title="Access model" description="How researchers obtain each dataset.">
          <HBarList data={facets.byAccess} color="brand" />
        </Panel>

        {facets.bySpecies.length > 1 && (
          <Panel title="Species" description="Most entries are human, with a few model organisms.">
            <HBarList data={facets.bySpecies} color="accent" />
          </Panel>
        )}

        <Panel
          title={`Publication year (${facets.yearRange[0]}–${facets.yearRange[1]})`}
          description="When the underlying datasets were released."
        >
          <ColumnChart data={facets.byYear} color="brand" />
        </Panel>
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Spot a gap in the coverage?{" "}
        <Link href="/contribute" className="font-medium text-brand hover:underline">
          Contribute a dataset
        </Link>{" "}
        to fill it.
      </p>
    </div>
  );
}
