# Social Neuroscience DataFinder

> The most comprehensive, searchable, community-driven directory of datasets relevant to **social neuroscience**.

A public research resource — in the spirit of [OpenNeuro](https://openneuro.org/), [Papers With Code](https://paperswithcode.com/), [NeuroVault](https://neurovault.org/), and community "awesome lists" — that helps researchers discover brain and behavioral datasets for studying the social brain. Search and filter by modality, social-neuroscience topic, sample size, species, longitudinal design, open-access status, and social-network data availability.

This is **not** a personal website. It is an open, version-controlled catalog that anyone can contribute to via a pull request.

---

## ✨ Features

- **25+ curated datasets** with real, sourced metadata (OpenNeuro, DANDI, NEMAR, NeuroVault, HCP, ABCD, UK Biobank, Healthy Brain Network, Cam-CAN, Allen Brain Observatory, IBL, MICrONS, and social-neuroscience-specific datasets such as the friendship-network fMRI study, CNeuroMod, the Naturalistic Neuroimaging Database, and more).
- **Instant client-side search & filtering** — keyword search plus filters for modality, topic, sample size, species, open access, longitudinal design, and social-network data. No backend, no network round-trips.
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

## 🚀 Quick start

```bash
git clone https://github.com/amberxuqianchen/social-neuroscience-datafinder.git
cd social-neuroscience-datafinder
npm install
npm run dev
```

Open <http://localhost:3000>.

### Other scripts

```bash
npm run build   # production build (static)
npm run start   # serve the production build
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
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx                 # Home
│   │   ├── datasets/page.tsx        # Directory (search + filter)
│   │   ├── datasets/[slug]/page.tsx # Individual dataset (static per dataset)
│   │   ├── resources/page.tsx
│   │   ├── contribute/page.tsx
│   │   ├── about/page.tsx
│   │   ├── sitemap.ts
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/          # Navbar, Footer, DatasetCard, DatasetExplorer, …
│   └── lib/
│       ├── types.ts         # The Dataset data model
│       ├── constants.ts     # Controlled vocabularies & site config
│       └── datasets.ts      # Build-time data loader & catalog stats
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## 🗃️ Data model

Each dataset is a JSON file in `data/datasets/`. See [`data/schema.json`](data/schema.json) for the authoritative schema and `src/lib/types.ts` for the TypeScript type. Required fields:

```jsonc
{
  "id": "human-connectome-project",      // unique lowercase slug
  "name": "Human Connectome Project — Young Adult",
  "description": "…",
  "modality": ["fMRI", "Diffusion MRI"], // controlled vocabulary
  "topics": ["theory of mind", "emotion"],// controlled vocabulary
  "sampleSize": 1206,
  "species": "Human",
  "longitudinal": false,
  "openAccess": true,
  "url": "https://…",
  "citation": "Author A et al. (Year). Title. Journal.",
  "year": 2013
}
```

Optional enrichments include `shortName`, `accessType`, `socialNetworkData`, `downloadUrl`, `repository`, `doi`, `publications`, `tags`, and `featured`. The loader reads every file at build time and bakes the whole catalog into the static site — there is no database.

## 🤝 Contributing a dataset

Adding a dataset means adding **one JSON file** — no web-development knowledge required.

1. Fork and clone the repo.
2. Create `data/datasets/<your-id>.json` following `data/schema.json`.
3. Run `npm run build` to confirm everything compiles and your file parses.
4. Open a pull request linking to the dataset's source.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide and the `/contribute` page in the running site for an annotated example.

## ☁️ Deployment

This project deploys to **Vercel** with zero configuration; it also exports to a fully static bundle for any static host (GitHub Pages, Netlify, S3, etc.). Step-by-step instructions are in [`DEPLOYMENT.md`](DEPLOYMENT.md).

## 🧭 Roadmap

The architecture is intentionally designed so each of these can be added without rewrites: papers-linked-to-datasets, dataset ratings & "used by" counts, benchmark tasks, linked code repositories, guided user submissions, a public JSON/REST API, and AI-assisted dataset discovery. See the `/about` page.

## 📄 License

Released under the [MIT License](LICENSE). Dataset metadata is curated from public sources — **please cite the original authors** when using any dataset listed here. This project is not affiliated with the repositories or studies it indexes.
