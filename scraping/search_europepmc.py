"""Search Europe PMC for candidate papers matching a journal + the keyword taxonomy.

Query shape per journal (see scraping/keywords.json for the term lists):
    (JOURNAL:"n1" OR JOURNAL:"n2" ...)
    AND (topic1 OR topic2 OR ...)
    AND (method1 OR method2 ...)
    AND (data-sharing signal terms)

One query per journal, not a cartesian product over every topic/method pair.
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


def _quote(term):
    return f'"{term}"' if " " in term or "-" in term else term


def _keyword_clause(entries):
    """Build an OR clause from an entry list's `search_terms` (quoted exact) and
    `stems` (rendered as `stem*` wildcards, matching the local prefix-match behavior
    in extract_candidate.py's `_stem_pattern`)."""
    terms = sorted({t for entry in entries for t in entry.get("search_terms", [])})
    stems = sorted({s for entry in entries for s in entry.get("stems", [])})
    return " OR ".join([_quote(t) for t in terms] + [f"{s}*" for s in stems])


def build_query(journal_entry, topics, methods):
    journal_clause = " OR ".join(f'JOURNAL:"{n}"' for n in journal_entry["query_names"])
    topic_clause = _keyword_clause(topics)
    method_clause = _keyword_clause(methods)
    data_clause = " OR ".join(DATA_SHARING_TERMS)
    return (
        f"({journal_clause})"
        f" AND ({topic_clause})"
        f" AND ({method_clause})"
        f" AND ({data_clause})"
    )


def search_journal(journal_entry, keywords_data, limit=25, sleep_seconds=1.0, session=None):
    """Return up to `limit` core records for a single journal's combined query."""
    session = session or requests.Session()
    query = build_query(journal_entry, keywords_data["topics"], keywords_data["methods"])

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


def get_hit_count(journal_entry, keywords_data, session=None):
    """Return (query, total_hit_count) for a journal without fetching any full records.

    Cheap way to size up a journal (e.g. SCAN has 1000+ hits, Social Neuroscience has 6)
    before picking a --limit for the real run.
    """
    session = session or requests.Session()
    query = build_query(journal_entry, keywords_data["topics"], keywords_data["methods"])
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
