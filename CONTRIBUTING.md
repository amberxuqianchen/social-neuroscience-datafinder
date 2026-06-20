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
npm run dev   # optional: preview locally at http://localhost:3000
```

### 2. Create the file

Create `data/datasets/<your-id>.json`. The `id` must be a **unique, lowercase, hyphenated slug** and should match the filename (e.g. `my-dataset.json` → `"id": "my-dataset"`).

Use this template:

```json
{
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
}
```

### 3. Follow the controlled vocabularies

`modality` and `topics` must use the allowed values defined in [`data/schema.json`](data/schema.json) (and `src/lib/constants.ts`). If a value you need is missing, add it to **both** the schema's `enum` and the corresponding union type in `src/lib/types.ts` and explain why in your PR.

**Modalities:** `fMRI`, `EEG`, `MEG`, `iEEG`, `fNIRS`, `Behavioral`, `Social Network`, `Multimodal`, `Developmental`, `Naturalistic`, `Electrophysiology`, `Calcium Imaging`, `Connectomics`, `Genetics`, `Eye Tracking`, `Structural MRI`, `Diffusion MRI`.

**Topics:** `social cognition`, `friendship`, `social networks`, `moral judgment`, `cooperation`, `competition`, `empathy`, `theory of mind`, `impression formation`, `social learning`, `group behavior`, `identity`, `culture`, `decision making`, `communication`, `collective behavior`, `emotion`, `face perception`, `social interaction`, `naturalistic viewing`, `memory`, `development`, `aging`, `mental health`.

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
