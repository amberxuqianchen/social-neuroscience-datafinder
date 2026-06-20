import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TUTORIALS, type Tutorial } from "@/lib/tutorials";

export const metadata: Metadata = {
  title: "Learn — Hands-on Tutorials",
  description:
    "Hands-on tutorials that take you from a dataset in the directory to a real analysis — value-based modeling, model-based fMRI, inter-subject correlation, and social reward across adulthood.",
};


function TutorialCard({ t, reverse }: { t: Tutorial; reverse: boolean }) {
  return (
    <article id={t.slug} className="scroll-mt-20 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Text */}
        <div className={`p-6 sm:p-8 ${reverse ? "lg:order-2" : ""}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
              {t.level}
            </span>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-muted">
              {t.time}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="mt-3 text-muted">{t.blurb}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {t.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/learn/${t.slug}`}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Read the tutorial →
            </Link>
            <Link
              href={`/learn/${t.slug}#notebook`}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              Notebook file
            </Link>
            <Link
              href={`/learn/${t.slug}#code-files`}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              Code files
            </Link>
          </div>
        </div>

        {/* Figure */}
        <div
          className={`flex flex-col justify-center border-t border-border bg-surface-2 p-6 sm:p-8 lg:border-t-0 ${
            reverse ? "lg:order-1 lg:border-r" : "lg:border-l"
          }`}
        >
          <Image
            src={t.image}
            alt={t.imageAlt}
            width={1200}
            height={480}
            className="h-auto w-full rounded-lg border border-border bg-white"
          />
          <p className="mt-3 text-xs text-muted">{t.caption}</p>
        </div>
      </div>

      {/* Learn + steps */}
      <div className="grid gap-8 border-t border-border p-6 sm:p-8 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            What you&apos;ll learn
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {t.learn.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-0.5 text-brand">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Three steps
          </h3>
          <ol className="mt-3 space-y-3">
            {t.steps.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-fg">
                  {s.n}
                </span>
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <p className="mt-0.5 text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Datasets used */}
      <div className="border-t border-border p-6 sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Datasets used in this tutorial
        </h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {t.datasets.map((d) => (
            <Link
              key={d.id}
              href={`/datasets/${d.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-brand/50 hover:text-brand"
            >
              {d.name} →
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Learn</h1>
        <p className="mt-2 text-muted">
          Finding a dataset is the first step — the next is doing something with it. These
          hands-on tutorials take you from a dataset in the directory to a real analysis you can
          run yourself. Each pairs a runnable, tested core with code for a real open dataset.
        </p>
        <p className="mt-3 text-sm text-muted">
          New here? Each card is tagged by depth. A gentle path is{" "}
          <a href="#social-reward-aging" className="text-brand hover:underline">Social Reward &amp; Trust</a>{" "}
          (Beginner) →{" "}
          <a href="#naturalistic-isc" className="text-brand hover:underline">Inter-Subject Correlation</a>{" "}
          (Beginner → Intermediate) →{" "}
          <a href="#harm-aversion-fmri" className="text-brand hover:underline">Value-Based Modeling</a>{" "}
          (Intermediate).
        </p>
      </header>

      {/* Tutorial index */}
      <nav className="mb-8 flex flex-wrap gap-2">
        {TUTORIALS.map((t) => (
          <a
            key={t.slug}
            href={`#${t.slug}`}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted hover:border-brand/50 hover:text-fg"
          >
            {t.title.split(" ").slice(0, 4).join(" ")}…
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {TUTORIALS.map((t, i) => (
          <TutorialCard key={t.slug} t={t} reverse={i % 2 === 1} />
        ))}
      </div>

      {/* More to come */}
      <section className="mt-10 rounded-xl border border-dashed border-border p-6 text-center">
        <h2 className="text-lg font-semibold">More tutorials coming</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Have an idea for a hands-on walkthrough — EEG of social interaction, social-network
          analysis, hyperscanning? Suggestions and contributions are welcome.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/contribute"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            Contribute
          </Link>
          <Link
            href="/datasets"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Browse datasets
          </Link>
        </div>
      </section>
    </div>
  );
}
