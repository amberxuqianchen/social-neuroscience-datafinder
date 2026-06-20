"use client";

import { useEffect, useRef, useState } from "react";
import type { Dataset } from "@/lib/types";
import { datasetsToCsv, datasetsToJson } from "@/lib/export";

/** Trigger a client-side file download from an in-memory string. */
function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Export control for the directory. Downloads whatever the user is currently
 * looking at (filters and search applied), so an export is a reproducible slice
 * of the catalog — and links to the full static JSON endpoint for programmatic
 * use.
 */
export default function ExportButtons({ datasets }: { datasets: Dataset[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = datasets.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium hover:bg-surface-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path d="M5 21h14" />
        </svg>
        Export
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
        >
          <button
            role="menuitem"
            onClick={() => {
              download("social-neuroscience-datasets.csv", datasetsToCsv(datasets), "text/csv");
              setOpen(false);
            }}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-2"
          >
            Download CSV
            <span className="text-xs text-muted">{count} rows</span>
          </button>
          <button
            role="menuitem"
            onClick={() => {
              download("social-neuroscience-datasets.json", datasetsToJson(datasets), "application/json");
              setOpen(false);
            }}
            className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-left text-sm hover:bg-surface-2"
          >
            Download JSON
            <span className="text-xs text-muted">{count} entries</span>
          </button>
          <a
            role="menuitem"
            href="/catalog.json"
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-between border-t border-border px-4 py-2.5 text-left text-sm hover:bg-surface-2"
          >
            Full catalog API
            <span className="text-xs text-muted">/catalog.json ↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
