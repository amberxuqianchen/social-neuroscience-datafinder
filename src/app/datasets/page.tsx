import type { Metadata } from "next";
import { getAllDatasets } from "@/lib/datasets";
import { MODALITIES } from "@/lib/constants";
import type { Modality } from "@/lib/types";
import DatasetExplorer from "@/components/DatasetExplorer";

export const metadata: Metadata = {
  title: "Dataset Directory",
  description:
    "Search and filter social-neuroscience datasets by modality, topic, sample size, species, longitudinal design, and open-access status.",
};

interface PageProps {
  searchParams: { q?: string; modality?: string };
}

export default function DatasetsPage({ searchParams }: PageProps) {
  const datasets = getAllDatasets();
  const initialQuery = searchParams.q ?? "";
  const modalityParam = searchParams.modality;
  const initialModality = MODALITIES.includes(modalityParam as Modality)
    ? (modalityParam as Modality)
    : undefined;

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dataset Directory</h1>
        <p className="mt-2 max-w-2xl text-muted">
          {datasets.length} curated datasets relevant to social neuroscience. Search by keyword and
          combine filters — everything runs instantly in your browser.
        </p>
      </header>
      <DatasetExplorer
        datasets={datasets}
        initialQuery={initialQuery}
        initialModality={initialModality}
      />
    </div>
  );
}
