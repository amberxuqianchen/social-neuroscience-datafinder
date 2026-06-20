"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTIONS = ["fMRI", "friendship", "naturalistic", "theory of mind", "EEG", "social networks"];

export default function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(q: string) {
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    router.push(`/datasets${params}`);
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className="relative"
      >
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search 40+ datasets — e.g. 'naturalistic fMRI', 'social networks'…"
          aria-label="Search datasets"
          className="w-full rounded-xl border border-border bg-surface py-3.5 pl-12 pr-28 text-sm shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          Search
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => go(s)}
            className="rounded-full border border-border px-2.5 py-1 hover:border-brand/50 hover:text-fg"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
