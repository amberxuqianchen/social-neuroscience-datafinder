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
- Switch to MeSH-based pipeline: first, currate the keywords from SCAN and Social Neuroscience; then use these keywords to search from those 23 journals
- Done: curated real MeSH headings from ~500 SCAN + Social Neuroscience papers (Europe PMC `meshHeadingList`, `core` result type) into `MeSH_SCAN_SN.txt` / `mesh_keywords.json` (topics + methods, no stemmer needed since MeSH is already exact controlled vocabulary). New pipeline: `mesh_search_europepmc.py` + `mesh_extract_candidate.py` + `mesh_run_pipeline.py`, reusing `search_europepmc.py`'s pagination/session/fulltext logic and `run_pipeline.py`'s journal loading + review CSV writer.
- Gotcha: Europe PMC's `MESH:` field query silently mis-combines a *repeated* per-term field prefix (`MESH:"a" OR MESH:"b"` returns non-monotonic, sometimes-smaller hit counts as more terms are added). Fixed by using one field-scoped group instead: `MESH:("a" OR "b" OR ...)`.
- Confirmed via hit-count spot checks: PET, TMS, tDCS, DTI, iEEG (all in `keywords.json`'s free-text `methods` list) have combined hit counts of 0-1 across SCAN + Social Neuroscience's MeSH indexing -- dropped from the MeSH methods list rather than carried over unverified.
- Small real batch: `--journals "SCAN,Social Neuroscience" --limit 20` -> 11 hits in SCAN (0 in Social Neuroscience once the data-sharing-terms filter is applied), written to `mesh_candidates/` + `mesh_review.csv`.
- !! If this works, mark current `keywords.json` as outdated
- Mesh pipeline overview
    - Counts:
    - 210 distinct MeSH descriptor names pulled from the ~500 SCAN + Social Neuroscience papers (Europe PMC meshHeadingList,
    across 5 batches spanning 2010–2023)
    - 115 kept in MeSH_SCAN_SN.txt
    - 95 excluded: demographic boilerplate, statistical terms, brain anatomy terms (shall we keep it???), country/group terms, Generic experimental-procedure terms (list attached below), low-frequency items (list attached below)

    **Generic experimental-procedure terms**
        Acoustic Stimulation
        Adaptation, Psychological
        Anticipation, Psychological
        Auditory Perception
        Behavior
        Conflict, Psychological
        Cues
        Extinction, Psychological
        Functional Laterality
        Intention
        Models, Psychological
        Motor Activity
        Movement
        Perception
        Photic Stimulation
        Psychological Distance
        Psychomotor Performance
        Punishment
        Rest
    **Low frequency items**
        Sex Offenses
        Mathematics
        Love
        Stroop Test
        Illusions
        Hobbies
        Leisure Activities
        Mirror Neurons
        Cognitive Neuroscience
        Neurosciences
        Computational Biology
        Pattern Recognition, Visual

# August
- Log progress. Next: 
    1. pull up those terms: Generic experimental-procedure terms (nearly universal, no topical signal), e.g., Photic Stimulation, Acoustic Stimulation, Motor Activity
    2. Confirm if one-off/single-occurence curiosities are terms that only occur once
    3. are those 95 terms all in @scraping/mesh_keywords.json? 
    4. report the terms that is currently not in @data/schema.json `enum`
    5. In the new pipeline, are you matching papers' title, keyword, and abstract, or just keywords?
- Remove three more method-keywords: "Machine Learning", "Neural Networks, Computer" - they are not indicators for neuroscience