# Social Neuroscience DataFinder

> A searchable, community-driven directory of datasets relevant to **social neuroscience**.
>
> 🌐 **Live site: <https://social-neuroscience-datafinder.vercel.app/>**

A public research resource — in the spirit of [OpenNeuro](https://openneuro.org/), [Papers With Code](https://paperswithcode.com/), [NeuroVault](https://neurovault.org/), and community "awesome lists" — that helps researchers discover brain and behavioral datasets for studying the social brain. Search and filter by modality, paradigm, social-neuroscience topic, sample size, species, longitudinal design, open-access status, and social-network data availability.

This is **not** a personal website. It is an open, version-controlled catalog that anyone can contribute to via a pull request.

---

## ✨ Features

- **90+ curated datasets** with real, sourced metadata — major repositories and resources (OpenNeuro, DANDI, NEMAR, NeuroVault, NIMH Data Archive, HCP, ABCD, UK Biobank, Healthy Brain Network, Cam-CAN, Allen Brain Observatory, IBL, MICrONS) plus social-neuroscience-specific and naturalistic datasets (the friendship-network fMRI study, Courtois NeuroMod, Naturalistic Neuroimaging Database, Narratives, Sherlock, SPACETOP, and more).
- **Instant client-side search & filtering** — keyword search plus filters for modality, paradigm, topic, sample size, species, open access, longitudinal design, and social-network data. No backend, no network round-trips.
- **Catalog overview** — coverage charts across modalities, topics, and paradigms.
- **Learn** — hands-on tutorials (with notebooks and code) that analyze datasets from the catalog.
- **Export** — download the catalog as JSON / CSV, fetch it at [`/catalog.json`](https://social-neuroscience-datafinder.vercel.app/catalog.json), and rely on schema.org structured data for Google Dataset Search.
- **Static generation** — every page (including one per dataset) is pre-rendered at build time for speed and free hosting.
- **Dark / light mode** with no flash on load.
- **Responsive, data-centric, academic design** built with Tailwind CSS.
- **Contribution model = one JSON file per dataset**, validated against a shared JSON Schema.

## 🧱 Tech stack

| Layer        | Choice                                  |
| ------------ | --------------------------------------- |
| Framework    | Next.js 14 (App Router)                 |
| Language     | TypeScript (strict)                     |
| Styling      | Tailwind CSS (semantic CSS-variable tokens) |
| Data         | Static JSON files validated by JSON Schema |
| Rendering    | Static Site Generation (SSG)            |
| Hosting      | Vercel (zero-config) or any static host |

## 🚀 Using the site

The site is live at **<https://social-neuroscience-datafinder.vercel.app/>** — no installation needed. Browse the [directory](https://social-neuroscience-datafinder.vercel.app/datasets), or see the [Contribute page](https://social-neuroscience-datafinder.vercel.app/contribute) to add a dataset.

### Validating a contribution

Before opening a pull request, confirm your JSON parses and the site builds:

```bash
git clone https://github.com/amberxuqianchen/social-neuroscience-datafinder.git
cd social-neuroscience-datafinder
npm install
npm run build   # production build (static) — fails if a dataset file is malformed
npm run lint    # ESLint
```

## 📁 Project structure

```
.
├── data/
│   ├── datasets/            # One JSON file per dataset (the database)
│   │   ├── human-connectome-project.json
│   │   ├── abcd-study.json
│   │   └── …
│   ├── schema.json          # JSON Schema all dataset files must satisfy
│   └── resources.json       # Curated tools & reading for the Resources page
├── tutorials/               # Notebooks, code, and results for the Learn pages
├── scraping/                # Europe PMC / MeSH pipeline for finding candidate datasets
├── public/                  # Static assets (tutorial figures)
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx                 # Home
│   │   ├── datasets/page.tsx        # Directory (search + filter)
│   │   ├── datasets/[slug]/page.tsx # Individual dataset (static per dataset)
│   │   ├── overview/page.tsx        # Catalog coverage charts
│   │   ├── learn/                   # Tutorials index + [slug] pages
│   │   ├── catalog.json/route.ts    # Static machine-readable export of the catalog
│   │   ├── resources/page.tsx
│   │   ├── contribute/page.tsx
│   │   ├── about/page.tsx
│   │   ├── sitemap.ts, robots.ts
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/          # Navbar, Footer, DatasetCard, DatasetExplorer, Charts, ExportButtons, …
│   └── lib/
│       ├── types.ts         # The Dataset data model
│       ├── constants.ts     # Controlled vocabularies & site config
│       ├── datasets.ts      # Build-time data loader & catalog stats
│       ├── export.ts        # JSON / CSV export helpers
│       ├── structured-data.ts # schema.org Dataset JSON-LD
│       └── tutorials.ts     # Learn-page tutorial content
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## 🗃️ Data model

Each dataset is a JSON file in `data/datasets/`. See [`data/schema.json`](data/schema.json) for the authoritative schema and `src/lib/types.ts` for the TypeScript type. Required fields:

```jsonc
{
  "id": "human-connectome-project",       // unique lowercase slug, matches the filename
  "name": "Human Connectome Project — Young Adult",
  "description": "…",                      // at least 20 characters
  "modality": ["fMRI", "Diffusion MRI"],  // HOW the data were measured (controlled vocabulary)
  "topics": ["Theory of Mind", "Emotion"],// study topics (controlled vocabulary, Title Case)
  "sampleSize": 1206,
  "species": "Human",
  "longitudinal": false,
  "openAccess": true,
  "url": "https://…",
  "citation": "Author A et al. (Year). Title. Journal.",
  "year": 2013
}
```

Optional fields: `shortName`, `paradigm`, `accessType`, `socialNetworkData`, `downloadUrl`, `repository`, `doi`, `publications`, `tags`, and `featured`.

**Modality, paradigm, and topics are separate.** `modality` is the measurement method only; the stimulus/task design goes in `paradigm`, and the subject matter in `topics`. For example, a movie-watching fMRI study is `"modality": ["fMRI"]` with `"paradigm": ["Naturalistic"]`.

| Field      | Allowed values |
| ---------- | -------------- |
| `modality` | `Neuroimaging (general)`, `fMRI`, `MRI`, `EEG`, `MEG`, `iEEG`, `fNIRS`, `Psychophysiology`, `Electrophysiology`, `Calcium Imaging`, `Connectomics`, `Genotyping/Hormone/Neurotransmitter`, `Eye Tracking`, `Structural MRI`, `Diffusion MRI`, `Behavioral`, `Social Network` |
| `paradigm` | `Naturalistic`, `Task-based`, `Resting-state`, `Hyperscanning` |
| `topics`   | `Social Cognition`, `Close Relationship`, `Social Networks`, `Moral Judgment`, `Intergroup Processes`, `Competition`, `Empathy`, `Theory of Mind`, `Impression Formation`, `Self and Identity`, `Culture`, `Decision Making`, `Communication`, `Emotion`, `Social Perception`, `Social Interaction`, `Memory`, `Developmental Psychology`, `Clinical Psychology`, `Cognition`, `Learning`, `Public Health`, `Reward`, `Prosocial Behavior` |
| `accessType` | `open`, `registered`, `restricted` |

Values are case-sensitive and must match exactly. To add a new value, update the `enum` in `data/schema.json` **and** the matching union in `src/lib/types.ts` / list in `src/lib/constants.ts`.

The loader reads every file at build time and bakes the whole catalog into the static site — there is no database.

## 🤝 Contributing a dataset

Adding a dataset means adding **one JSON file** — no web-development knowledge required.

1. Fork and clone the repo.
2. Create `data/datasets/<your-id>.json` following `data/schema.json`.
3. Run `npm run build` to confirm everything compiles and your file parses (see [Validating a contribution](#validating-a-contribution)).
4. Open a pull request linking to the dataset's source.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide and the [`/contribute` page](https://social-neuroscience-datafinder.vercel.app/contribute) for an annotated example.

## ☁️ Deployment

The site is deployed on **Vercel** at <https://social-neuroscience-datafinder.vercel.app/>. It deploys with zero configuration; it can also be exported to a fully static bundle for any static host (GitHub Pages, Netlify, S3, etc.). Step-by-step instructions are in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## 🧭 Roadmap

The architecture is intentionally designed so each of these can be added without rewrites: papers-linked-to-datasets, dataset ratings & "used by" counts, benchmark tasks, linked code repositories, guided user submissions, a versioned public REST API (a static [`/catalog.json`](https://social-neuroscience-datafinder.vercel.app/catalog.json) export already exists), and AI-assisted dataset discovery. See the `/about` page.

## 📄 License

Released under the [MIT License](LICENSE). Dataset metadata is curated from public sources — **please cite the original authors** when using any dataset listed here. This project is not affiliated with the repositories or studies it indexes.
