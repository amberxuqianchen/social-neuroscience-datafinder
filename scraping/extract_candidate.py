"""Turn a raw Europe PMC record into a draft dataset candidate shaped like data/schema.json.

Only fields extractable with reasonable confidence from title/abstract/journal metadata
are filled in. Everything else is left out and listed under `_needs_review` so a human
knows exactly what to check before promoting the candidate into data/datasets/.
"""

import re

# Known dataset-repository domains -> canonical repository label used in dataset JSON.
REPOSITORY_PATTERNS = [
    (r"openneuro\.org/datasets/(ds\d+)", "OpenNeuro"),
    (r"neurovault\.org/collections/(\w+)", "NeuroVault"),
    (r"osf\.io/(\w+)", "OSF"),
    (r"datadryad\.org/[\w./-]+", "Dryad"),
    (r"zenodo\.org/record[s]?/(\d+)", "Zenodo"),
    (r"figshare\.com/[\w./-]+", "figshare"),
    (r"openicpsr\.org/[\w./-]+", "openICPSR"),
    (r"balsa\.wustl\.edu/[\w./-]+", "BALSA"),
    (r"nda\.nih\.gov/[\w./-]+", "NDA"),
]

URL_RE = re.compile(r"https?://[^\s)\]}\"',;]+", re.IGNORECASE)


def slugify(title, max_words=6):
    words = re.findall(r"[a-z0-9]+", title.lower())
    return "-".join(words[:max_words]) or "untitled-dataset"


def find_repository_link(text):
    """Return (repository, url) for the first known-repository URL found in text, else (None, None)."""
    if not text:
        return None, None
    for url in URL_RE.findall(text):
        for pattern, repo_name in REPOSITORY_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                return repo_name, url.rstrip(".,)")
    return None, None


_TERM_PATTERN_CACHE = {}


def _term_pattern(term):
    """Exact word/phrase match -- term must appear as its own whole word(s)."""
    pattern = _TERM_PATTERN_CACHE.get(term)
    if pattern is None:
        pattern = re.compile(r"\b" + re.escape(term) + r"\b", re.IGNORECASE)
        _TERM_PATTERN_CACHE[term] = pattern
    return pattern


def _stem_pattern(stem):
    """Prefix match -- stem must start a word, any further word chars are accepted.

    Only used for `stems` entries in keywords.json, which are hand-picked to be long
    and unique enough that the prefix won't false-positive on unrelated words (e.g.
    "empath" -> empathy/empathic/empathize/empathetic, but never "art" -> article/artery).
    """
    pattern = _TERM_PATTERN_CACHE.get(("stem", stem))
    if pattern is None:
        pattern = re.compile(r"\b" + re.escape(stem) + r"\w*", re.IGNORECASE)
        _TERM_PATTERN_CACHE[("stem", stem)] = pattern
    return pattern


def match_keywords(text, entries, schema_key):
    """Match a list of keyword entries (topics or methods) against text.

    `search_terms` are matched exactly (whole word/phrase, not bare substring, so short
    acronyms like "AI" or "PET" don't false-positive inside "available"/"carpet").
    `stems` are matched as word-initial prefixes (e.g. "empath" also catches "empathic",
    "empathize", "empathetic" -- variants an exact match would miss).

    Returns (schema_values, tags) where schema_values are enum-mapped hits (data/schema.json
    topics/modality) and tags are the raw labels for hits that have no clean enum mapping.
    """
    if not text:
        return [], []
    schema_values = set()
    tags = set()
    for entry in entries:
        exact_hit = any(_term_pattern(term).search(text) for term in entry.get("search_terms", []))
        stem_hit = any(_stem_pattern(stem).search(text) for stem in entry.get("stems", []))
        if not (exact_hit or stem_hit):
            continue
        mapped = entry.get(schema_key) or []
        if mapped:
            schema_values.update(mapped)
        else:
            tags.add(entry["raw_label"])
    return sorted(schema_values), sorted(tags)


def build_candidate(record, journal_entry, keywords_data, fulltext_text=None):
    """Build a schema.json-shaped draft.

    `url`/`downloadUrl`/`repository` describe the *dataset* (per the CONTRIBUTING.md
    template, these point at the data itself, e.g. an OpenNeuro dataset page) --
    not the paper. The paper is captured via `citation`/`doi`/`publications`.
    Fields that can't be inferred from title/abstract/full text (description,
    sampleSize, species, longitudinal, accessType, socialNetworkData, ...) are left
    out entirely rather than guessed, and listed in `_needs_review`.
    """
    title = (record.get("title") or "").rstrip(".")
    abstract = record.get("abstractText") or ""
    doi = record.get("doi")
    year = record.get("pubYear")
    # Topic/method matching stays scoped to title+abstract: full text includes references,
    # funding statements, and other cited studies, which caused generic single-word terms
    # (e.g. "self", "learning", "identity") to false-positive-match unrelated papers.
    abstract_text = " ".join([title, abstract])
    # Repository/dataset-link detection benefits from full text: data-availability
    # statements pointing at OpenNeuro/OSF/etc. are rarely in the abstract itself.
    fulltext_search_text = " ".join([abstract_text, fulltext_text or ""])

    topic_values, topic_tags = match_keywords(abstract_text, keywords_data["topics"], "schema_topics")
    method_values, method_tags = match_keywords(abstract_text, keywords_data["methods"], "schema_modality")
    repository, dataset_url = find_repository_link(fulltext_search_text)

    candidate = {
        "id": slugify(title),
        "name": title,
        "modality": method_values,
        "topics": topic_values,
        "citation": f"{record.get('authorString', '')} ({year}). {title}. {journal_entry['name']}.",
        "doi": doi,
        "year": int(year) if year else None,
        "tags": sorted(set(topic_tags) | set(method_tags)),
        "featured": False,
    }
    if repository:
        candidate["repository"] = repository
    if dataset_url:
        candidate["url"] = dataset_url
        candidate["downloadUrl"] = dataset_url
    if doi:
        candidate["publications"] = [
            {"title": title, "url": f"https://doi.org/{doi}", "year": int(year) if year else None}
        ]

    candidate["_meta"] = {
        "source": "europepmc",
        "pmid": record.get("pmid"),
        "pmcid": record.get("pmcid"),
        "journal_matched": journal_entry["name"],
        "matched_topic_tags": topic_tags,
        "matched_method_tags": method_tags,
        "used_fulltext": bool(fulltext_text),
        "has_repository_link": repository is not None,
    }

    always_manual = [
        "description",
        "shortName",
        "sampleSize",
        "species",
        "longitudinal",
        "accessType",
        "socialNetworkData",
    ]
    missing_required = [
        field
        for field in (
            "description",
            "modality",
            "topics",
            "sampleSize",
            "species",
            "longitudinal",
            "openAccess",
            "url",
            "citation",
            "year",
        )
        if not candidate.get(field)
    ]
    needs_review = sorted(set(always_manual) | set(missing_required))
    needs_review.append(
        "dataset link not found in abstract/full text -- search manually"
        if not dataset_url
        else "confirm dataset link, repository name, and accessType against source"
    )
    candidate["_needs_review"] = needs_review

    return candidate
