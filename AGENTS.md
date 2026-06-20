## Imported Claude Cowork project instructions

You are an expert full-stack engineer, UX designer, information architect, and computational neuroscientist.

Build a production-quality website called "Social Neuroscience DataFinder".

The goal is to create the most comprehensive, searchable, community-driven directory of datasets relevant to social neuroscience.

This is NOT a personal website. It is a public research resource similar in spirit to OpenNeuro, Papers With Code, NeuroVault, and Awesome Lists.

TECHNICAL STACK

Use:

- Next.js (latest App Router)
    
- TypeScript
    
- Tailwind CSS
    
- Static generation whenever possible
    
- Responsive design
    
- Dark/light mode
    
- GitHub-friendly project structure
    
- Deployable on Vercel
    
- No backend required initially
    

The project should run locally with:

npm install  
npm run dev

DESIGN GOALS

The website should feel:

- modern
    
- academic
    
- data-centric
    
- professional
    
- fast
- easy to navigate
    

Avoid:

- generic personal website templates
    
- blog-focused layouts
    
- excessive animations
    
- marketing-style landing pages
    

Think:

- Papers With Code
    
- OpenNeuro
    
- Hugging Face Datasets
    
- Allen Brain Atlas
    

CORE MISSION

Researchers frequently struggle to discover datasets relevant to social neuroscience.

Create a searchable database that helps users discover datasets based on but not limited to:

- modality
    
- species
    
- social behavior domain
    
- sample size
    
- longitudinal design
    
- open access status
    
- neuroimaging modality
    
- social network data availability
    

DATASET CATEGORIES

Include support for:

1. fMRI
    
2. EEG
    
3. MEG
    
4. iEEG
    
5. fNIRS
    
6. Behavioral
    
7. Social network datasets
    
8. Multimodal datasets
    
9. Developmental datasets
    
10. Naturalistic datasets
    

SOCIAL NEUROSCIENCE TOPICS

Each dataset can be tagged with but not limited to:

- social cognition
    
- friendship
    
- social networks
    
- moral judgment
    
- cooperation
    
- competition
    
- empathy
    
- theory of mind
    
- impression formation
    
- social learning
    
- group behavior
    
- identity
    
- culture
    
- decision making
    
- communication
    
- collective behavior
    

REQUIRED PAGES

1. Home
    

Contains:

- mission statement
    
- featured datasets
    
- statistics
    
- newest datasets
    
- dataset categories
    
- search bar
    

2. Dataset Directory
    

Searchable/filterable dataset catalog.

Filters:

- modality
    
- topic
    
- sample size
    
- open access
    
- longitudinal
    
- species
    

3. Individual Dataset Page
    

Display:

- title
    
- summary
    
- modality
    
- sample size
    
- links
    
- citation
    
- associated publications
    
- download location
    
- tags
    

4. Resources
    

Include:

- tutorials
    
- preprocessing resources
    
- BIDS resources
    
- OpenNeuro resources
    
- data sharing resources
    

5. Contribute
    

Explain how users can contribute new datasets via GitHub pull requests.

6. About
    

Mission and roadmap.

SEARCH FUNCTIONALITY

Implement:

- keyword search
    
- tag filtering
    
- modality filtering
    
- topic filtering
    

Search should be fast and entirely client-side.

DATA MODEL

Store datasets as structured JSON files.

Example fields:

{  
"name": "",  
"description": "",  
"modality": [],  
"topics": [],  
"sampleSize": 0,  
"species": "",  
"longitudinal": false,  
"openAccess": true,  
"url": "",  
"citation": "",  
"year": 0  
}

INITIAL CONTENT

Before generating the website, search online and collect metadata from major neuroscience repositories and social neuroscience resources.

Include at minimum:

- OpenNeuro
    
- NeuroVault
    
- DANDI
    
- Human Connectome Project
    
- ABCD Study
    
- UK Biobank Imaging
    
- NIMH Data Archive
    
- NEMAR
    
- Allen Brain Observatory
    
- MICrONS
    
- International Brain Laboratory
    

Also identify social neuroscience-specific datasets whenever possible.

Create realistic example entries based on publicly available metadata.

REFERENCES TO RESEARCH

Use the structure and ideas from major neuroscience repositories:

- OpenNeuro
    
- DANDI
    
- NEMAR
    
- NIH BRAIN data ecosystem
    

Generate a curated starter database.

FUTURE EXTENSIONS

Architect the code so that future versions can support:

- user submissions
    
- API access
    
- dataset ratings
    
- benchmark tasks
    
- code repositories
    
- papers linked to datasets
    
- AI-assisted dataset discovery
    

OUTPUT

1. Generate the complete project structure.
    
2. Generate all source code.
    
3. Generate dataset schema.
    
4. Generate sample data.
    
5. Generate README.md.
    
6. Generate deployment instructions.
    
7. Explain how to deploy to GitHub and Vercel.
    
8. Explain how future contributors can add datasets.
    
9. Explain all design decisions.
    
10. Do not stop after creating mockups. Produce working code.
