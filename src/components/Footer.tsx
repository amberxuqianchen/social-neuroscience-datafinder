import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-semibold">{SITE.name}</p>
            <p className="mt-2 max-w-sm text-sm text-muted">{SITE.description}</p>
            <p className="mt-3 text-xs text-muted">
              An open, community-maintained resource. Not affiliated with the listed repositories.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/datasets" className="hover:text-fg">Dataset Directory</Link></li>
              <li><Link href="/overview" className="hover:text-fg">Catalog Overview</Link></li>
              <li><Link href="/learn" className="hover:text-fg">Learn (Tutorials)</Link></li>
              <li><Link href="/resources" className="hover:text-fg">Resources</Link></li>
              <li><Link href="/contribute" className="hover:text-fg">Contribute</Link></li>
              <li><Link href="/about" className="hover:text-fg">About & Roadmap</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Project</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><a href={SITE.repo} target="_blank" rel="noreferrer noopener" className="hover:text-fg">GitHub Repository</a></li>
              <li><a href="/catalog.json" target="_blank" rel="noreferrer noopener" className="hover:text-fg">Catalog JSON (API)</a></li>
              <li><a href={`${SITE.repo}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer noopener" className="hover:text-fg">Contribution Guide</a></li>
              <li><a href={`${SITE.repo}/issues`} target="_blank" rel="noreferrer noopener" className="hover:text-fg">Suggest a Dataset</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs text-muted">
          <p>
            Released under the MIT License. Dataset metadata is curated from public sources; please cite the
            original authors when using any dataset.
          </p>
        </div>
      </div>
    </footer>
  );
}
