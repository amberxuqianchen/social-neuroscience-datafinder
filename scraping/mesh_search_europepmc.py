"""Search Europe PMC for candidate papers matching a journal + MeSH heading taxonomy.

Self-contained: does not import search_europepmc.py, so the MeSH pipeline has no
dependency on the free-text pipeline's code.

Query shape per journal (see scraping/mesh_keywords.json for the term lists):
    (JOURNAL:"n1" OR JOURNAL:"n2" ...)
    AND (MESH:("topic1" OR "topic2" ...))
    AND (MESH:("method1" OR "method2" ...))
    AND (data-sharing signal terms)

Unlike a free-text query, terms are matched against a paper's own MEDLINE-assigned
MeSH headings (server-side, via the MESH: field), not free text -- so there is no
local exact/stem split to build here.
"""

import time

import requests

EUROPEPMC_SEARCH_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
EUROPEPMC_FULLTEXT_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML"
USER_AGENT = (
    "social-neuroscience-datafinder-scraper/0.1 "
    "(+https://github.com/amberxuqianchen/social-neuroscience-datafinder)"
)

# Heuristic signal that a paper shares its data: known repository names/phrases.
# Deliberately loose recall over precision -- every hit still gets manually reviewed.
DATA_SHARING_TERMS = [
    "openneuro",
    "neurovault",
    "openicpsr",
    "balsa",
    "dryad",
    "zenodo",
    "figshare",
    "\"data availability\"",
    "\"data are available\"",
]

PAGE_SIZE = 25


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
    data_clause = " OR ".join(DATA_SHARING_TERMS)
    return (
        f"({journal_clause})"
        f" AND ({topic_clause})"
        f" AND ({method_clause})"
        f" AND ({data_clause})"
    )


def search_journal(journal_entry, mesh_keywords_data, limit=25, sleep_seconds=1.0, session=None):
    """Return up to `limit` core records for a single journal's combined MeSH query."""
    session = session or requests.Session()
    query = build_mesh_query(journal_entry, mesh_keywords_data["topics"], mesh_keywords_data["methods"])

    results = []
    cursor_mark = "*"
    while len(results) < limit:
        params = {
            "query": query,
            "format": "json",
            "resultType": "core",
            "pageSize": min(PAGE_SIZE, limit - len(results)),
            "cursorMark": cursor_mark,
        }
        response = session.get(
            EUROPEPMC_SEARCH_URL,
            params=params,
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()

        hits = payload.get("resultList", {}).get("result", [])
        results.extend(hits)

        next_cursor = payload.get("nextCursorMark")
        if not hits or not next_cursor or next_cursor == cursor_mark:
            break
        cursor_mark = next_cursor
        time.sleep(sleep_seconds)

    return query, results[:limit]


def get_hit_count(journal_entry, mesh_keywords_data, session=None):
    """Return (query, total_hit_count) for a journal without fetching any full records."""
    session = session or requests.Session()
    query = build_mesh_query(journal_entry, mesh_keywords_data["topics"], mesh_keywords_data["methods"])
    params = {
        "query": query,
        "format": "json",
        "resultType": "idlist",
        "pageSize": 1,
    }
    response = session.get(
        EUROPEPMC_SEARCH_URL,
        params=params,
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    return query, payload.get("hitCount", 0)


def fetch_fulltext(pmcid, session=None):
    """Best-effort fetch of the full-text XML for an open-access PMC article.

    Data-availability statements (and thus dataset links) usually live outside the
    abstract, so this materially improves detection versus scanning abstracts alone.
    Returns "" on any failure -- callers should treat that as "no full text available".
    """
    if not pmcid:
        return ""
    session = session or requests.Session()
    try:
        response = session.get(
            EUROPEPMC_FULLTEXT_URL.format(pmcid=pmcid),
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
    except requests.RequestException:
        return ""
    if response.status_code != 200:
        return ""
    return response.text
