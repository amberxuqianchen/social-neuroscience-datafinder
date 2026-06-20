import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Add a dataset to the social-neuroscience directory by opening a GitHub pull request. Every entry is a single JSON file.",
};

const EXAMPLE = `{
  "id": "my-new-dataset",
  "name": "My New Social Neuroscience Dataset",
  "shortName": "MND",
  "description": "A clear 2–4 sentence summary of what the dataset contains and why it is relevant to social neuroscience.",
  "modality": ["fMRI", "Naturalistic"],
  "topics": ["social cognition", "theory of mind"],
  "sampleSize": 64,
  "species": "Human",
  "longitudinal": false,
  "openAccess": true,
  "accessType": "open",
  "socialNetworkData": false,
  "url": "https://openneuro.org/datasets/dsXXXXXX",
  "downloadUrl": "https://openneuro.org/datasets/dsXXXXXX",
  "repository": "OpenNeuro",
  "citation": "Author A, Author B (2024). Title. Journal, vol, pages.",
  "doi": "10.xxxx/xxxxx",
  "year": 2024,
  "tags": ["keyword", "another-keyword"],
  "featured": false
}`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-12">
      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
        {n}
      </span>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-1 text-sm text-muted">{children}</div>
    </li>
  );
}

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Contribute a dataset</h1>
        <p className="mt-2 text-muted">
          This directory grows through community contributions. Adding a dataset means adding one small
          JSON file — no web development required. We review every pull request for accuracy.
        </p>
      </header>

      <ol className="space-y-8">
        <Step n={1} title="Fork the repository">
          Fork{" "}
          <a href={SITE.repo} target="_blank" rel="noreferrer noopener" className="text-brand hover:underline">
            the GitHub repository
          </a>{" "}
          and clone your fork locally.
        </Step>
        <Step n={2} title="Create a dataset file">
          Add a new file at <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">data/datasets/&lt;your-id&gt;.json</code>{" "}
          following the schema below. The <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">id</code>{" "}
          must be a unique, lowercase, hyphenated slug.
        </Step>
        <Step n={3} title="Validate against the schema">
          Your entry must conform to{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">data/schema.json</code>. Run{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">npm run build</code> locally to
          confirm the site compiles and your file parses.
        </Step>
        <Step n={4} title="Open a pull request">
          Push your branch and open a PR. Describe the dataset and link to its source so reviewers can
          verify the metadata. Once merged, your dataset appears automatically — no further steps needed.
        </Step>
      </ol>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">Required fields</h2>
        <p className="mt-2 text-sm text-muted">
          The following fields are required for every entry: <code className="font-mono text-xs">id</code>,{" "}
          <code className="font-mono text-xs">name</code>, <code className="font-mono text-xs">description</code>,{" "}
          <code className="font-mono text-xs">modality</code>, <code className="font-mono text-xs">topics</code>,{" "}
          <code className="font-mono text-xs">sampleSize</code>, <code className="font-mono text-xs">species</code>,{" "}
          <code className="font-mono text-xs">longitudinal</code>, <code className="font-mono text-xs">openAccess</code>,{" "}
          <code className="font-mono text-xs">url</code>, <code className="font-mono text-xs">citation</code>, and{" "}
          <code className="font-mono text-xs">year</code>. Everything else is optional enrichment.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">Example entry</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed scroll-thin">
          <code className="font-mono">{EXAMPLE}</code>
        </pre>
      </section>

      <section className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Curation guidelines</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>• Prefer datasets with a clear social-neuroscience relevance and a citable source.</li>
          <li>• Use the controlled vocabularies for <code className="font-mono text-xs">modality</code> and <code className="font-mono text-xs">topics</code> (see the schema). Propose new terms in your PR if needed.</li>
          <li>• Write neutral, factual descriptions; avoid promotional language.</li>
          <li>• Record <code className="font-mono text-xs">sampleSize</code> as the number of participants (use 0 for repositories that aggregate many studies).</li>
          <li>• Always credit original authors in <code className="font-mono text-xs">citation</code>.</li>
        </ul>
        <a
          href={`${SITE.repo}/blob/main/CONTRIBUTING.md`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          Read the full contribution guide →
        </a>
      </section>
    </div>
  );
}
