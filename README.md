# Social Neuroscience DataFinder

A free, searchable directory of datasets for the study of the social brain.

**🔍 Website: <https://social-neuroscience-datafinder.vercel.app/>**

## About

After decades of research, social neuroscience—the study of the neural mechanisms underlying everyday social perception, interaction, and decision-making—has developed a substantial empirical foundation. Numerous datasets have been generated to support this work, yet they remain fragmented across repositories, individual studies, and supplementary materials, making relevant datasets difficult to discover and access.

**Social Neuroscience DataFinder** brings them together in one place. Researchers, students, and teachers can search the directory and filter it by:

- Data type (for example, fMRI, EEG, or behavioral data)
- Study design (for example, task-based, resting-state, or naturalistic)
- Topic (for example, empathy, theory of mind, or social networks)
- Sample size and species
- Whether the study followed people over time
- Whether the data are open access
- Whether social-network data are available

The project is open to everyone. The catalog is stored in a public repository, and anyone can suggest a new dataset or a correction.

## What the site offers

- **A curated catalog.** The directory lists more than 90 datasets, each with a description, a link to the data, and a citation. It includes large repositories such as OpenNeuro, DANDI, NeuroVault, the Human Connectome Project, ABCD, and UK Biobank. It also includes datasets built for social neuroscience, such as the friendship-network fMRI study, Courtois NeuroMod, Narratives, and Sherlock.
- **Fast search.** Search and filters respond immediately in the browser.
- **Catalog overview.** Charts show how the datasets are spread across data types, topics, and study designs.
- **Learn.** Step-by-step tutorials, with notebooks and code, show how to analyze datasets from the catalog.
- **Export.** The full catalog can be downloaded as JSON or CSV. It is also available at [`/catalog.json`](https://social-neuroscience-datafinder.vercel.app/catalog.json). Each dataset page includes structured data so that Google Dataset Search can index it.
- **Light and dark display modes.** The layout adapts to phones, tablets, and computers.

## How to use the site

Open the site in any web browser. No installation or account is needed.

1. Go to the [directory](https://social-neuroscience-datafinder.vercel.app/datasets).
2. Type a keyword or choose filters to narrow the list.
3. Select a dataset to see its details and follow the link to the source.

When you use a dataset, please cite the original authors.

## How to add a dataset

Each dataset is stored as one JSON file. No web development skills are needed.

1. Fork and clone this repository.
2. Create a file named `data/datasets/<your-id>.json` that follows the schema in `data/schema.json`.
3. Run `npm run build` to check that the file is valid.
4. Open a pull request that links to the source of the dataset.

The [Contribute page](https://social-neuroscience-datafinder.vercel.app/contribute) has an annotated example. [`CONTRIBUTING.md`](CONTRIBUTING.md) has the full guide.

### Checking a contribution

Before opening a pull request, run these commands to confirm that the file is valid and the site builds:

```bash
git clone https://github.com/amberxuqianchen/social-neuroscience-datafinder.git
cd social-neuroscience-datafinder
npm install
npm run build   # fails if a dataset file is invalid
npm run lint    # checks code style
```

## Data format

Each dataset file contains the following required fields. The file `data/schema.json` defines the format in full, and `src/lib/types.ts` holds the matching TypeScript type.

```jsonc
{
  "id": "human-connectome-project",       // unique lowercase name; matches the file name
  "name": "Human Connectome Project — Young Adult",
  "description": "…",                      // at least 20 characters
  "modality": ["fMRI", "Diffusion MRI"],  // how the data were measured
  "topics": ["Theory of Mind", "Emotion"],// what the study is about
  "sampleSize": 1206,
  "species": "Human",
  "longitudinal": false,
  "openAccess": true,
  "url": "https://…",
  "citation": "Author A et al. (Year). Title. Journal.",
  "year": 2013
}
```

Optional fields are `shortName`, `paradigm`, `accessType`, `socialNetworkData`, `downloadUrl`, `repository`, `doi`, `publications`, `tags`, and `featured`.

Three fields describe a dataset from different angles:

- `modality` states how the data were measured.
- `paradigm` states the design of the task or stimulus.
- `topics` states the subject of the study.

For example, a movie-watching fMRI study uses `"modality": ["fMRI"]` and `"paradigm": ["Naturalistic"]`.

| Field        | Allowed values |
| ------------ | -------------- |
| `modality`   | `Neuroimaging (general)`, `fMRI`, `MRI`, `EEG`, `MEG`, `iEEG`, `fNIRS`, `Psychophysiology`, `Electrophysiology`, `Calcium Imaging`, `Connectomics`, `Genotyping/Hormone/Neurotransmitter`, `Eye Tracking`, `Structural MRI`, `Diffusion MRI`, `Behavioral`, `Social Network` |
| `paradigm`   | `Naturalistic`, `Task-based`, `Resting-state`, `Hyperscanning` |
| `topics`     | `Social Cognition`, `Close Relationship`, `Social Networks`, `Moral Judgment`, `Intergroup Processes`, `Competition`, `Empathy`, `Theory of Mind`, `Impression Formation`, `Self and Identity`, `Culture`, `Decision Making`, `Communication`, `Emotion`, `Social Perception`, `Social Interaction`, `Memory`, `Developmental Psychology`, `Clinical Psychology`, `Cognition`, `Learning`, `Public Health`, `Reward`, `Prosocial Behavior` |
| `accessType` | `open`, `registered`, `restricted` |

Values are case-sensitive and must match exactly. To add a new value, update the `enum` in `data/schema.json`, the matching type in `src/lib/types.ts`, and the list in `src/lib/constants.ts`.

The site reads all dataset files when it is built and includes them in the finished pages. No database is used.

## Technology

| Part      | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | Next.js 14 (App Router)                       |
| Language  | TypeScript (strict mode)                      |
| Styling   | Tailwind CSS                                  |
| Data      | JSON files checked against a JSON Schema      |
| Rendering | Static site generation                        |
| Hosting   | Vercel, or any static hosting service         |

Every page, including one page per dataset, is created in advance when the site is built. This keeps the site fast and inexpensive to host.

## Project structure

```
.
├── data/
│   ├── datasets/            # One JSON file per dataset
│   ├── schema.json          # Rules that every dataset file must follow
│   └── resources.json       # Tools and reading for the Resources page
├── tutorials/               # Notebooks, code, and results for the Learn pages
├── scraping/                # Europe PMC / MeSH pipeline for finding candidate datasets
├── public/                  # Static files, such as tutorial figures
├── src/
│   ├── app/                 # Site pages (Next.js App Router)
│   ├── components/          # Navbar, Footer, DatasetCard, DatasetExplorer, Charts, and others
│   └── lib/
│       ├── types.ts         # Dataset data model
│       ├── constants.ts     # Allowed values and site settings
│       ├── datasets.ts      # Loads the data and computes catalog statistics
│       ├── export.ts        # JSON and CSV export
│       ├── structured-data.ts # schema.org Dataset markup
│       └── tutorials.ts     # Tutorial content
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## Deployment

The site runs on Vercel at <https://social-neuroscience-datafinder.vercel.app/> and needs no special configuration. It can also be exported as a static bundle for other hosts, such as GitHub Pages, Netlify, or Amazon S3. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for instructions.

## Roadmap

Planned additions include:

- Links between datasets and the papers that use them
- Ratings and "used by" counts
- Benchmark tasks
- Links to related code repositories
- Guided dataset submission
- A versioned public API (the static [`/catalog.json`](https://social-neuroscience-datafinder.vercel.app/catalog.json) export already exists)
- AI-assisted dataset discovery

The site is built so that each of these can be added without major changes. The `/about` page gives more detail.

## License

The project is released under the [MIT License](LICENSE). The dataset information comes from public sources. Please cite the original authors when you use any dataset listed here. The project has no affiliation with the repositories or studies it lists.
