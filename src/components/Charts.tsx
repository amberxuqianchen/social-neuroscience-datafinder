import type { FacetCount } from "@/lib/datasets";

/**
 * Tiny, dependency-free chart primitives for the catalog overview page.
 *
 * Everything renders as plain HTML/CSS bars sized from the data, so the charts
 * are server-rendered into the static HTML, theme-aware via the same semantic
 * color tokens as the rest of the site, and add zero JavaScript to the bundle.
 */

type BarColor = "brand" | "accent" | "emerald";

const BAR_BG: Record<BarColor, string> = {
  brand: "bg-brand",
  accent: "bg-accent",
  emerald: "bg-emerald-500",
};

/**
 * A horizontal ranked bar list — best for categorical breakdowns with text
 * labels (modality, topic, species, access). Bars are scaled to the largest
 * value so differences read at a glance.
 */
export function HBarList({
  data,
  color = "brand",
  unit = "datasets",
  max,
}: {
  data: FacetCount[];
  color?: BarColor;
  unit?: string;
  /** Override the scale denominator; defaults to the largest count. */
  max?: number;
}) {
  const scaleMax = max ?? Math.max(1, ...data.map((d) => d.count));

  return (
    <ul className="space-y-2">
      {data.map((d) => {
        const pct = Math.round((d.count / scaleMax) * 100);
        return (
          <li key={d.label} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
            <span className="truncate capitalize text-muted" title={d.label}>
              {d.label}
            </span>
            <span className="relative h-5 overflow-hidden rounded bg-surface-2">
              <span
                className={`absolute inset-y-0 left-0 rounded ${BAR_BG[color]}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
                aria-hidden="true"
              />
            </span>
            <span className="text-right font-medium tabular-nums" aria-label={`${d.count} ${unit}`}>
              {d.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A vertical column chart — best for an ordered series such as the
 * publication-year histogram, where the x-axis is meaningful.
 */
export function ColumnChart({
  data,
  color = "accent",
  unit = "datasets",
}: {
  data: FacetCount[];
  color?: BarColor;
  unit?: string;
}) {
  const scaleMax = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end gap-1.5 overflow-x-auto pb-1" role="img" aria-label={`Distribution by ${unit}`}>
      {data.map((d) => {
        const pct = Math.round((d.count / scaleMax) * 100);
        return (
          <div key={d.label} className="flex min-w-[1.75rem] flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-medium tabular-nums text-muted">{d.count || ""}</span>
            <div
              className={`w-full rounded-t ${BAR_BG[color]} ${d.count === 0 ? "opacity-20" : ""}`}
              style={{ height: `${Math.max((pct / 100) * 120, d.count ? 4 : 2)}px` }}
              title={`${d.label}: ${d.count} ${unit}`}
            />
            <span className="text-[10px] text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
