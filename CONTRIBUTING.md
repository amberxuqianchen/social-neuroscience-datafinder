# Contributing

Thank you for helping build the social-neuroscience dataset directory! This project grows entirely through community contributions, and the most valuable contribution is **adding or correcting a dataset**.

## Ways to contribute

- **Add a dataset** — the main way the catalog grows.
- **Fix metadata** — correct a sample size, citation, link, or tag.
- **Improve the site** — UI, accessibility, performance, docs.
- **Propose vocabulary** — suggest a new modality or topic term.

---

## Adding a dataset

Every dataset is a single JSON file in `data/datasets/`. No web-development knowledge is required.

### 1. Set up

```bash
git clone https://github.com/amberxuqianchen/social-neuroscience-datafinder.git
cd social-neuroscience-datafinder
npm install
```

The site itself is live at <https://social-neuroscience-datafinder.vercel.app/>; you don't need to run it locally to contribute.

### 2. Create the file

Create `data/datasets/<your-id>.json`. The `id` must be a **unique, lowercase, hyphenated slug** and should match the filename (e.g. `my-dataset.json` → `"id": "my-dataset"`).

Use this template:

```json
{
  "id": "my-new-dataset",
  "name": "My New Social Neuroscience Dataset",
  "shortName": "MND",
  "description": "A clear 2–4 sentence summary of what the dataset contains and why it is relevant to social neuroscience.",
  "modality": ["fMRI"],
  "topics": ["Social Cognition", "Theory of Mind"],
  "paradigm": ["Naturalistic"],
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
}
```

### 3. Follow the controlled vocabularies

`modality`, `paradigm`, `topics`, and `accessType` must use the allowed values defined in [`data/schema.json`](data/schema.json) (mirrored in `src/lib/types.ts` and `src/lib/constants.ts`). Values are **case-sensitive** and must match exactly. If a value you need is missing, add it to the schema's `enum`, the union type in `src/lib/types.ts`, and the list in `src/lib/constants.ts`, and explain why in your PR.

Keep the three axes separate:

- `modality` — how the data were **measured**.
- `paradigm` — the **stimulus / task design** (optional).
- `topics` — the **subject matter or study population**.

For example, a movie-watching fMRI study is `"modality": ["fMRI"]` + `"paradigm": ["Naturalistic"]`, not `"modality": ["fMRI", "Naturalistic"]`.

**Modalities:** `Neuroimaging (general)`, `fMRI`, `MRI`, `EEG`, `MEG`, `iEEG`, `fNIRS`, `Psychophysiology`, `Electrophysiology`, `Calcium Imaging`, `Connectomics`, `Genotyping/Hormone/Neurotransmitter`, `Eye Tracking`, `Structural MRI`, `Diffusion MRI`, `Behavioral`, `Social Network`.

**Paradigms:** `Naturalistic`, `Task-based`, `Resting-state`, `Hyperscanning`.

**Topics:** `Social Cognition`, `Close Relationship`, `Social Networks`, `Moral Judgment`, `Intergroup Processes`, `Competition`, `Empathy`, `Theory of Mind`, `Impression Formation`, `Self and Identity`, `Culture`, `Decision Making`, `Communication`, `Emotion`, `Social Perception`, `Social Interaction`, `Memory`, `Developmental Psychology`, `Clinical Psychology`, `Cognition`, `Learning`, `Public Health`, `Reward`, `Prosocial Behavior`.

**Access types:** `open`, `registered`, `restricted`.

### 4. Curation guidelines

- Prefer datasets with clear social-neuroscience relevance and a citable source.
- Write **neutral, factual** descriptions; avoid promotional language.
- `sampleSize` = number of participants. Use `0` for repositories/platforms that aggregate many studies (e.g. OpenNeuro itself).
- `openAccess: true` means data is downloadable without restriction; use `accessType` (`open` / `registered` / `restricted`) for nuance.
- Always credit original authors in `citation`, and include a `doi` when one exists.

### 5. Validate and open a PR

```bash
npm run build   # confirms the site compiles and your JSON parses
npm run lint
```

Then push your branch and open a pull request that links to the dataset source so reviewers can verify the metadata. Once merged, your dataset appears on the site automatically — the loader picks up every file in `data/datasets/`.

## Code style

- TypeScript is strict; keep it type-clean (`npm run lint` and the build must pass).
- Components are small and focused; data access lives in `src/lib/`.
- Prefer Server Components; mark interactive components with `"use client"`.

## Code of conduct

Be respectful and constructive. We welcome contributors of all backgrounds and experience levels.
