import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Learn — Hands-on Tutorials",
  description:
    "Hands-on tutorials that take you from a dataset in the directory to a real analysis — value-based modeling, model-based fMRI, inter-subject correlation, and social reward across adulthood.",
};

interface Step {
  n: number;
  title: string;
  body: string;
}

interface Tutorial {
  slug: string;
  title: string;
  blurb: string;
  level: string;
  time: string;
  tags: string[];
  image: string;
  imageAlt: string;
  caption: string;
  learn: string[];
  steps: Step[];
  datasets: { id: string; name: string }[];
  /** Path under tutorials/ in the repo. */
  dir: string;
  notebook: string;
}

const TUTORIALS: Tutorial[] = [
  {
    slug: "harm-aversion-fmri",
    title: "Value-Based Modeling from Harm Aversion to fMRI",
    blurb:
      "Start with a moral question — would you hurt someone for money? — and the value-based choice model behind it. Then transfer the same machinery to real, open NARPS loss-aversion data: fit choices, and use each person’s fitted parameter to map value in the brain.",
    level: "Beginner Python",
    time: "~2–3 hours",
    tags: ["Computational modeling", "Model-based fMRI", "Decision making", "Real NARPS data"],
    image: "/tutorials/narps-behavioral-modeling.png",
    imageAlt:
      "Three panels of behavioral modeling on real NARPS choices: the model's accept-probability curve matching observed choices, the distribution of loss-aversion lambda across participants, and per-participant model accuracy exceeding the base rate.",
    caption:
      "Real, executed result: the value-based choice model — the same machinery as harm aversion — fit to 26 NARPS participants' actual choices. It predicts behavior at 92.8% accuracy and recovers each person's loss aversion (λ).",
    learn: [
      "What a computational model of behavior is, and why social neuroscientists use them",
      "The value-based choice model (softmax over subjective value) behind harm and loss aversion",
      "Maximum-likelihood fitting, and checking it works with parameter recovery",
      "Fitting the model to real NARPS choices — and showing it predicts behavior (92.8% accuracy)",
      "Model-based fMRI: turning each person’s fitted parameter into a brain map",
      "Running the full pipeline on a real, open dataset (NARPS) with nilearn",
    ],
    steps: [
      {
        n: 1,
        title: "Learn the model",
        body: "Build the softmax value model (the harm-aversion paradigm) and recover its parameters from simulated choices, so you trust the method before touching real data. numpy + scipy only.",
      },
      {
        n: 2,
        title: "Fit real NARPS choices",
        body: "Fit the same model to 26 real participants’ gamble choices: recover each person’s loss aversion λ and show the model predicts their choices at 92.8% accuracy (pseudo-R² 0.69).",
      },
      {
        n: 3,
        title: "Model-based fMRI on NARPS",
        body: "Model gain and loss, then form the subjective-value map as a λ-weighted contrast of the two — mapping where the brain tracks value. Executed end-to-end on the real dataset.",
      },
    ],
    datasets: [
      { id: "crockett-harm-aversion", name: "Harm Aversion (Crockett)" },
      { id: "narps-mixed-gambles", name: "NARPS — Mixed Gambles" },
    ],
    dir: "harm-aversion-fmri",
    notebook: "harm_aversion_tutorial.ipynb",
  },
  {
    slug: "naturalistic-isc",
    title: "Inter-Subject Correlation on a Naturalistic Movie",
    blurb:
      "When people watch the same socially-rich film, their brains respond in similar, time-locked ways. Measure that shared response — no stimulus model needed — and watch the social brain track a movie full of people.",
    level: "Beginner Python",
    time: "~2 hours",
    tags: ["Naturalistic fMRI", "Inter-subject correlation", "Social brain", "nilearn"],
    image: "/tutorials/partly-cloudy-isc-map.png",
    imageAlt:
      "An inter-subject correlation brain map from 13 participants watching the Partly Cloudy movie: strong synchronization across visual cortex extending into temporal, parietal, and dorsomedial prefrontal (social-brain) regions.",
    caption:
      "Real, executed result: inter-subject correlation across 13 people watching the same movie. Visual cortex synchronizes most, with the social brain (dorsomedial PFC, near the TPJ) close behind.",
    learn: [
      "Why naturalistic stimuli (movies, stories) are powerful for studying the social brain",
      "Inter-subject correlation (ISC) and the standard leave-one-out estimator",
      "Telling a real ISC from noise with a circular-shift permutation test",
      "Running ISC on real fMRI with nilearn: atlas parcellation and region time series",
      "Interpreting high-ISC regions — sensory cortex and the social brain (STS, TPJ, mPFC)",
    ],
    steps: [
      {
        n: 1,
        title: "ISC + leave-one-out",
        body: "Simulate multi-subject movie data and compute leave-one-out ISC, recovering known ground truth. numpy + scipy only.",
      },
      {
        n: 2,
        title: "Test it’s real",
        body: "Build a circular-shift permutation null that destroys cross-subject time-alignment, and test whether the social-region ISC beats it.",
      },
      {
        n: 3,
        title: "Real movie data (executed)",
        body: "Fetch real Partly Cloudy movie fMRI with nilearn, parcellate with the Schaefer atlas, and compute ISC — the brain map shows visual cortex and the social brain (dmPFC, near the TPJ) synchronizing.",
      },
    ],
    datasets: [
      { id: "richardson-partly-cloudy", name: "Partly Cloudy" },
      { id: "grand-budapest-hotel-fmri", name: "Grand Budapest Hotel" },
      { id: "sherlock-fmri", name: "Sherlock" },
    ],
    dir: "naturalistic-isc",
    notebook: "isc_tutorial.ipynb",
  },
  {
    slug: "social-reward-aging",
    title: "Social Reward and Trust Across Adulthood",
    blurb:
      "Use a lifespan social-neuroscience question — do younger and older adults respond differently to friends, strangers, and computer partners? — to learn age-group comparisons, partner effects, and one first-level friend-versus-stranger fMRI GLM.",
    level: "Beginner/intermediate Python",
    time: "~2–4 hours",
    tags: ["Aging", "Trust game", "Social reward", "fMRI GLM"],
    image: "/tutorials/social-reward-trust-aging.png",
    imageAlt:
      "Two-panel tutorial figure showing simulated trust-game behavior by partner type for younger and older adults, plus model estimates for partner and age-by-partner effects.",
    caption:
      "Runnable teaching demo: younger and older adults make trust-game decisions with computer, stranger, and friend partners. The real-data workflow applies the same structure to OpenNeuro ds005123, with an optional friend > stranger GLM.",
    learn: [
      "How to turn lifespan aging into a social-neuroscience question",
      "Quantifying partner effects in trust-game behavior: friend, stranger, and computer",
      "Testing age-group-by-partner interactions with a transparent linear model",
      "Mapping BIDS event files into social regressors for nilearn",
      "Running one first-level fMRI GLM for a friend > stranger contrast",
    ],
    steps: [
      {
        n: 1,
        title: "Build the behavioral model",
        body: "Run a no-download trust-game demo, plot age group by partner type, and estimate partner plus age-by-partner effects with numpy, pandas, and scipy.",
      },
      {
        n: 2,
        title: "Apply it to OpenNeuro ds005123",
        body: "Download the social reward events, infer partner labels, summarize younger and older adults' trust behavior, and reuse the same model on real task files.",
      },
      {
        n: 3,
        title: "Run one social GLM",
        body: "Use BIDS events as regressors in nilearn and compute a simple friend > stranger contrast for one trust-task run.",
      },
    ],
    datasets: [
      { id: "social-reward-decision-making", name: "Social Reward Across the Lifespan" },
      { id: "hcp-aging-aabc", name: "HCP-Aging / AABC" },
      { id: "cam-can", name: "Cam-CAN" },
    ],
    dir: "social-reward-aging",
    notebook: "social_reward_tutorial.ipynb",
  },
];

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
