"use client";

import { useMemo, useState } from "react";
import type { Dataset, Modality, Topic } from "@/lib/types";
import { MODALITIES, SAMPLE_SIZE_BUCKETS, TOPICS } from "@/lib/constants";
import DatasetCard from "./DatasetCard";
import ExportButtons from "./ExportButtons";

type SortKey = "year" | "sample" | "name";

interface Props {
  datasets: Dataset[];
  /** Pre-populate the keyword search (e.g. from a homepage query). */
  initialQuery?: string;
  /** Pre-select a modality filter (e.g. from a category card link). */
  initialModality?: Modality;
}

/**
 * Fully client-side search and filtering over the in-memory catalog. Because
 * the entire dataset list is small and statically bundled, every keystroke and
 * filter recomputes instantly with no network requests.
 */
export default function DatasetExplorer({ datasets, initialQuery = "", initialModality }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedModalities, setSelectedModalities] = useState<Set<Modality>>(
    initialModality ? new Set([initialModality]) : new Set()
  );
  const [selectedTopics, setSelectedTopics] = useState<Set<Topic>>(new Set());
  const [sizeBucket, setSizeBucket] = useState<string>("any");
  const [openOnly, setOpenOnly] = useState(false);
  const [longitudinalOnly, setLongitudinalOnly] = useState(false);
  const [socialNetworkOnly, setSocialNetworkOnly] = useState(false);
  const [species, setSpecies] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("year");
  const [showFilters, setShowFilters] = useState(false);

  const speciesOptions = useMemo(
    () => Array.from(new Set(datasets.map((d) => d.species))).sort(),
    [datasets]
  );

  // Only show topics/modalities that actually occur in the catalog.
  const availableModalities = useMemo(() => {
    const present = new Set(datasets.flatMap((d) => d.modality));
    return MODALITIES.filter((m) => present.has(m));
  }, [datasets]);

  const availableTopics = useMemo(() => {
    const present = new Set(datasets.flatMap((d) => d.topics));
    return TOPICS.filter((t) => present.has(t));
  }, [datasets]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bucket = SAMPLE_SIZE_BUCKETS.find((b) => b.id === sizeBucket) ?? SAMPLE_SIZE_BUCKETS[0];

    const filtered = datasets.filter((d) => {
      if (q) {
        const haystack = [
          d.name,
          d.shortName ?? "",
          d.description,
          d.citation,
          d.repository ?? "",
          d.species,
          d.modality.join(" "),
          d.topics.join(" "),
          (d.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (selectedModalities.size > 0 && !d.modality.some((m) => selectedModalities.has(m))) {
        return false;
      }
      if (selectedTopics.size > 0 && !d.topics.some((t) => selectedTopics.has(t))) {
        return false;
      }
      if (d.sampleSize < bucket.min || d.sampleSize > bucket.max) return false;
      if (openOnly && !d.openAccess) return false;
      if (longitudinalOnly && !d.longitudinal) return false;
      if (socialNetworkOnly && !d.socialNetworkData) return false;
      if (species !== "all" && d.species !== species) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "year") sorted.sort((a, b) => b.year - a.year);
    else if (sort === "sample") sorted.sort((a, b) => b.sampleSize - a.sampleSize);
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [
    datasets,
    query,
    selectedModalities,
    selectedTopics,
    sizeBucket,
    openOnly,
    longitudinalOnly,
    socialNetworkOnly,
    species,
    sort,
  ]);

  function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function clearAll() {
    setQuery("");
    setSelectedModalities(new Set());
    setSelectedTopics(new Set());
    setSizeBucket("any");
    setOpenOnly(false);
    setLongitudinalOnly(false);
    setSocialNetworkOnly(false);
    setSpecies("all");
  }

  const activeFilterCount =
    selectedModalities.size +
    selectedTopics.size +
    (sizeBucket !== "any" ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (longitudinalOnly ? 1 : 0) +
    (socialNetworkOnly ? 1 : 0) +
    (species !== "all" ? 1 : 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Filter sidebar */}
      <aside
        className={`${
          showFilters ? "block" : "hidden"
        } space-y-6 lg:block lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2 scroll-thin`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Filters</h2>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs font-medium text-brand hover:underline">
              Clear ({activeFilterCount})
            </button>
          )}
        </div>

        <FilterGroup title="Access & design">
          <CheckRow label="Open access only" checked={openOnly} onChange={() => setOpenOnly((v) => !v)} />
          <CheckRow label="Longitudinal only" checked={longitudinalOnly} onChange={() => setLongitudinalOnly((v) => !v)} />
          <CheckRow label="Has social-network data" checked={socialNetworkOnly} onChange={() => setSocialNetworkOnly((v) => !v)} />
        </FilterGroup>

        <FilterGroup title="Sample size">
          <div className="space-y-1.5">
            {SAMPLE_SIZE_BUCKETS.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-fg">
                <input
                  type="radio"
                  name="size"
                  checked={sizeBucket === b.id}
                  onChange={() => setSizeBucket(b.id)}
                  className="accent-brand"
                />
                {b.label}
              </label>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Species">
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
          >
            <option value="all">All species</option>
            {speciesOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Modality">
          <div className="flex flex-wrap gap-1.5">
            {availableModalities.map((m) => {
              const active = selectedModalities.has(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleSet(selectedModalities, m, setSelectedModalities)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    active ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted hover:text-fg"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup title="Topic">
          <div className="flex flex-wrap gap-1.5">
            {availableTopics.map((t) => {
              const active = selectedTopics.has(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleSet(selectedTopics, t, setSelectedTopics)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    active ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-fg"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      </aside>

      {/* Results column */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search datasets by name, topic, modality, citation…"
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm"
              aria-label="Search datasets"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium lg:hidden"
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
              aria-label="Sort results"
            >
              <option value="year">Newest first</option>
              <option value="sample">Largest sample</option>
              <option value="name">Name (A–Z)</option>
            </select>
            <ExportButtons datasets={results} />
          </div>
        </div>

        <p className="mt-4 text-sm text-muted">
          Showing <span className="font-semibold text-fg">{results.length}</span> of {datasets.length} datasets
        </p>

        {results.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="font-medium">No datasets match your filters.</p>
            <button onClick={clearAll} className="mt-3 text-sm font-medium text-brand hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((d) => (
              <DatasetCard key={d.id} dataset={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-fg">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand" />
      {label}
    </label>
  );
}
