"""Turn a raw Europe PMC record into a draft dataset candidate, matched via MeSH headings.

Same candidate shape as extract_candidate.build_candidate -- reuses its slugify() and
find_repository_link() directly -- but topic/method matching is exact set membership
against the record's own `meshHeadingList`, not regex over title/abstract text. Since
the Europe PMC query itself already filters server-side on MESH:"...", every hit
returned is guaranteed to have at least one qualifying heading.
"""

from extract_candidate import find_repository_link, slugify


def _record_mesh_terms(record):
    heading_list = (record.get("meshHeadingList") or {}).get("meshHeading") or []
    return {h.get("descriptorName", "") for h in heading_list if h.get("descriptorName")}


def match_mesh_keywords(record_mesh_terms, entries, schema_key):
    """Match a list of mesh_keywords.json entries (topics or methods) against a record's
    own indexed MeSH headings.

    Returns (schema_values, tags, matched_headings) where schema_values are enum-mapped
    hits (data/schema.json topics/modality), tags are entry labels with no clean enum
    mapping, and matched_headings are the actual MeSH descriptor names that hit (for
    review transparency).
    """
    schema_values = set()
    tags = set()
    matched_headings = set()
    for entry in entries:
        hit = record_mesh_terms & set(entry.get("mesh_terms", []))
        if not hit:
            continue
        matched_headings.update(hit)
        mapped = entry.get(schema_key) or []
        if mapped:
            schema_values.update(mapped)
        else:
            tags.add(entry["label"])
    return sorted(schema_values), sorted(tags), sorted(matched_headings)


def build_mesh_candidate(record, journal_entry, mesh_keywords_data, fulltext_text=None):
    """Build a schema.json-shaped draft from a MeSH-matched Europe PMC record.

    Mirrors extract_candidate.build_candidate's candidate shape and _needs_review logic.
    """
    title = (record.get("title") or "").rstrip(".")
    abstract = record.get("abstractText") or ""
    doi = record.get("doi")
    year = record.get("pubYear")
    record_mesh_terms = _record_mesh_terms(record)

    # Repository/dataset-link detection benefits from full text: data-availability
    # statements pointing at OpenNeuro/OSF/etc. are rarely in the abstract itself.
    fulltext_search_text = " ".join([title, abstract, fulltext_text or ""])

    topic_values, topic_tags, topic_headings = match_mesh_keywords(
        record_mesh_terms, mesh_keywords_data["topics"], "schema_topics"
    )
    method_values, method_tags, method_headings = match_mesh_keywords(
        record_mesh_terms, mesh_keywords_data["methods"], "schema_modality"
    )
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
        "source": "europepmc-mesh",
        "pmid": record.get("pmid"),
        "pmcid": record.get("pmcid"),
        "journal_matched": journal_entry["name"],
        "matched_topic_tags": topic_tags,
        "matched_method_tags": method_tags,
        "matched_mesh_headings": sorted(set(topic_headings) | set(method_headings)),
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
