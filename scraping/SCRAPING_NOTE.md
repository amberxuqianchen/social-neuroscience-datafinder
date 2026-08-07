Be careful when using the note!! The explanation if from developer's understanding and does not necessarily correspond to the truth.

# August-06-2026
- For now, we only focus on papers that have shared their data
- API: use Europe PMC, which covers all 23 listed journals
- Ran a small batch: 
    - 36 papers in Social Neuroscience, SCAN, Communications Psychology. 16 dataset links found
- Coordinate with Amber
    - update schema.json using the current scraping rules
    - However, `src/lib/constants.ts`, `src/lib/types.ts` currently have hardcoded Modality/Topic unions. Need to update as well. The functionality of `constants` and `types` is to catch the error in user contributed to the repo (e.g., correct a trailing space with fmri: 'fmri ')
    - Also need to update the 83 existing files using the old modality and topic values
- Stem-prefix applied only to long/unique/low-collision terms: emotion, empath/sympath, alexithymia, internaliz/externaliz, interocept, adolescen/child/infan, pharmacol/psychopharmacol, electroencephalog/magnetoencephalog, lesion, relationship, jealous, prosocial, intergroup, teach/creativ, learn/attention, language, tactile. Kept exact-only where a prefix would over-match: affect (verb sense), stress/environment/poverty (generic academic phrasing), culture ("cultured cells"), touch ("a touching tribute"), surprise (discourse marker), self, AI/acronyms, and — per your own example — anything like "art" stays a full exact phrase (art perception), never bare.
- added a dry-run feature. Usage:
    - python run_pipeline.py --dry-run            # all 23 journals
- python run_pipeline.py --dry-run --journals "SCAN,Nature Neuroscience"
- I think the current keyword matching is not ideal since SANS only return me 6 papers. a lot of key words are: e.g., brain regions
- There's a standard keyword format: MeSh Headinglist, they're assigned by human indexers at NLM as part of MEDLINE cataloguing, which happens after a paper is published
- Issues of using MeSH: recent papers (2025-2026) often doesn't have MeSH, but 2020-21 are fine. Frontiers in Human Neuroscience doesn't as well