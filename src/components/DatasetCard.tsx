import Link from "next/link";
import type { Dataset } from "@/lib/types";
import Badge from "./Badge";

function formatSampleSize(n: number) {
  if (!n) return "—";
  return n.toLocaleString();
}

export default function DatasetCard({ dataset }: { dataset: Dataset }) {
  const topModalities = dataset.modality.slice(0, 3);
  const extraModalities = dataset.modality.length - topModalities.length;

  return (
    <Link
      href={`/datasets/${dataset.id}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-all hover:border-brand/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug tracking-tight group-hover:text-brand">
          {dataset.name}
        </h3>
        {dataset.openAccess ? (
          <Badge variant="open" title="Openly accessible">Open</Badge>
        ) : (
          <Badge variant="restricted" title="Requires application or registration">
            {dataset.accessType === "registered" ? "Registered" : "Restricted"}
          </Badge>
        )}
      </div>

      <p className="mt-2 line-clamp-3 text-sm text-muted">{dataset.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {topModalities.map((m) => (
          <Badge key={m} variant="brand">{m}</Badge>
        ))}
        {extraModalities > 0 && <Badge variant="outline">+{extraModalities}</Badge>}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted">Sample</dt>
          <dd className="font-medium">{formatSampleSize(dataset.sampleSize)}</dd>
        </div>
        <div>
          <dt className="text-muted">Species</dt>
          <dd className="font-medium">{dataset.species}</dd>
        </div>
        <div>
          <dt className="text-muted">Year</dt>
          <dd className="font-medium">{dataset.year}</dd>
        </div>
      </dl>
    </Link>
  );
}
