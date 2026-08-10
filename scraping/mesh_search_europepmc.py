"""Build a MeSH-heading-based Europe PMC query and reuse search_europepmc's fetch logic.

Query shape per journal (see scraping/mesh_keywords.json for the term lists):
    (JOURNAL:"n1" OR JOURNAL:"n2" ...)
    AND (MESH:("topic1" OR "topic2" ...))
    AND (MESH:("method1" OR "method2" ...))
    AND (data-sharing signal terms)

Unlike search_europepmc.build_query, terms are matched against a paper's own
MEDLINE-assigned MeSH headings (server-side, via the MESH: field), not free text --
so there is no local exact/stem split to build here.
"""

import search_europepmc


def _mesh_clause(entries):
    """Build a single field-scoped MESH:("a" OR "b" OR ...) group.

    Europe PMC's query parser mishandles a *repeated* per-term field prefix
    (`MESH:"a" OR MESH:"b" OR ...`) -- empirically it silently drops terms and
    returns non-monotonic (sometimes smaller) hit counts as more terms are added.
    The field-scoped grouped form below was verified against the live API to combine
    terms correctly (monotonic, matches manually-computed unions)."""
    terms = sorted({t for entry in entries for t in entry.get("mesh_terms", [])})
    quoted = " OR ".join(f'"{t}"' for t in terms)
    return f"MESH:({quoted})"


def build_mesh_query(journal_entry, topics, methods):
    journal_clause = " OR ".join(f'JOURNAL:"{n}"' for n in journal_entry["query_names"])
    topic_clause = _mesh_clause(topics)
    method_clause = _mesh_clause(methods)
    data_clause = " OR ".join(search_europepmc.DATA_SHARING_TERMS)
    return (
        f"({journal_clause})"
        f" AND ({topic_clause})"
        f" AND ({method_clause})"
        f" AND ({data_clause})"
    )


def search_journal(journal_entry, mesh_keywords_data, limit=25, sleep_seconds=1.0, session=None):
    """Same pagination/session behavior as search_europepmc.search_journal, MeSH query."""
    return search_europepmc.search_journal(
        journal_entry,
        mesh_keywords_data,
        limit=limit,
        sleep_seconds=sleep_seconds,
        session=session,
        query_builder=build_mesh_query,
    )


def get_hit_count(journal_entry, mesh_keywords_data, session=None):
    """Same behavior as search_europepmc.get_hit_count, MeSH query."""
    return search_europepmc.get_hit_count(
        journal_entry, mesh_keywords_data, session=session, query_builder=build_mesh_query
    )
