import type { Metadata } from "next";
import resources from "@/data/resources.json";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Tutorials, preprocessing pipelines, BIDS guides, repositories, and data-sharing best practices for social neuroscience.",
};

interface ResourceLink {
  name: string;
  url: string;
  blurb: string;
}
interface ResourceCategory {
  id: string;
  title: string;
  description: string;
  links: ResourceLink[];
}

export default function ResourcesPage() {
  const categories = resources.categories as ResourceCategory[];

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="mt-2 text-muted">
          Curated tools and references for working with social-neuroscience data — from raw
          acquisition through analysis, standardization, and responsible sharing.
        </p>
      </header>

      {/* Quick jump */}
      <nav className="mb-10 flex flex-wrap gap-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted hover:border-brand/50 hover:text-fg"
          >
            {c.title}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {categories.map((cat) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">{cat.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{cat.description}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand/50"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium group-hover:text-brand">{link.name}</h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden="true">
                      <path d="M7 17 17 7M7 7h10v10" />
                    </svg>
                  </div>
                  <p className="mt-2 text-sm text-muted">{link.blurb}</p>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
