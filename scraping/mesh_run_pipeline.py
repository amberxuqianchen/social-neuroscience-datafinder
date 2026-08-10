"""Orchestrate the MeSH-heading-based scraping pipeline: search -> extract -> validate -> write.

Journals are reused from scraping/keywords.json (one source of truth for the 23-journal
list); topic/method terms come from scraping/mesh_keywords.json (see MeSH_SCAN_SN.txt for
how those terms were curated).

Usage:
    python mesh_run_pipeline.py --dry-run
    python mesh_run_pipeline.py --journals "SCAN,Social Neuroscience" --limit 20
"""

import argparse
import json
import re
import time
from pathlib import Path

import requests

from mesh_extract_candidate import build_mesh_candidate
from mesh_search_europepmc import get_hit_count, search_journal
from run_pipeline import load_existing_dois, load_keywords, select_journals, write_review_csv
from search_europepmc import fetch_fulltext
from validate_candidate import validate_candidate

SCRAPING_DIR = Path(__file__).resolve().parent
DEFAULT_KEYWORDS_PATH = SCRAPING_DIR / "keywords.json"
DEFAULT_MESH_KEYWORDS_PATH = SCRAPING_DIR / "mesh_keywords.json"
DEFAULT_OUT_DIR = SCRAPING_DIR / "mesh_candidates"
DEFAULT_REVIEW_CSV = SCRAPING_DIR / "mesh_review.csv"


def dry_run(journal_names, sleep_seconds, keywords_path, mesh_keywords_path):
    """Print each selected journal's total MeSH-query hit count -- no records fetched,
    nothing written -- so you can see how much MeSH coverage each journal actually has."""
    keywords_data = load_keywords(keywords_path)
    mesh_keywords_data = load_keywords(mesh_keywords_path)
    journals = select_journals(keywords_data, journal_names)
    session = requests.Session()

    print(f"{'journal':<40} {'hits':>8}")
    print("-" * 49)
    total = 0
    for i, journal_entry in enumerate(journals):
        _, hit_count = get_hit_count(journal_entry, mesh_keywords_data, session=session)
        print(f"{journal_entry['name']:<40} {hit_count:>8}")
        total += hit_count
        if i < len(journals) - 1:
            time.sleep(sleep_seconds)
    print("-" * 49)
    print(f"{'total':<40} {total:>8}")


def run(journal_names, limit, fetch_fulltext_flag, sleep_seconds, keywords_path, mesh_keywords_path, out_dir, review_csv):
    keywords_data = load_keywords(keywords_path)
    mesh_keywords_data = load_keywords(mesh_keywords_path)
    journals = select_journals(keywords_data, journal_names)
    out_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    seen_dois = load_existing_dois(out_dir)

    for journal_entry in journals:
        query, hits = search_journal(
            journal_entry, mesh_keywords_data, limit=limit, sleep_seconds=sleep_seconds, session=session
        )
        print(f"[{journal_entry['name']}] query: {query}")
        print(f"[{journal_entry['name']}] {len(hits)} hit(s)")

        for record in hits:
            doi = record.get("doi")
            if doi and doi in seen_dois:
                continue

            fulltext_text = None
            if fetch_fulltext_flag and record.get("pmcid") and record.get("isOpenAccess") == "Y":
                raw_xml = fetch_fulltext(record["pmcid"], session=session)
                if raw_xml:
                    fulltext_text = re.sub(r"<[^>]+>", " ", raw_xml)
                time.sleep(sleep_seconds)

            candidate = build_mesh_candidate(record, journal_entry, mesh_keywords_data, fulltext_text=fulltext_text)
            result = validate_candidate(candidate)
            candidate["_meta"]["schema_check"] = result

            out_path = out_dir / f"{candidate['id']}.json"
            if out_path.exists():
                disambiguator = (doi or str(candidate["_meta"].get("pmid")) or "x").replace("/", "_")
                out_path = out_dir / f"{candidate['id']}-{disambiguator}.json"
            out_path.write_text(json.dumps(candidate, indent=2))

            if doi:
                seen_dois.add(doi)

            status = "OK" if result["valid"] else "SCHEMA ERRORS"
            missing = ", ".join(result["missing_required"]) or "none"
            print(f"  -> {out_path.name} [{status}; missing required: {missing}]")

    write_review_csv(out_dir, review_csv)
    print(f"\nWrote review sheet: {review_csv}")


def parse_args():
    parser = argparse.ArgumentParser(description="Scrape candidate social-neuroscience datasets using a MeSH-heading-based query.")
    parser.add_argument(
        "--journals", type=str, default="", help="Comma-separated journal names matching scraping/keywords.json. Default: all."
    )
    parser.add_argument("--limit", type=int, default=25, help="Max results per journal.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print each selected journal's total Europe PMC hit count and exit -- no records fetched, nothing written.",
    )
    parser.add_argument("--no-fulltext", action="store_true", help="Skip full-text fetch; scan title/abstract only.")
    parser.add_argument("--sleep", type=float, default=1.0, help="Seconds to sleep between API requests.")
    parser.add_argument("--keywords-path", type=Path, default=DEFAULT_KEYWORDS_PATH, help="Journals source (unchanged from the free-text pipeline).")
    parser.add_argument("--mesh-keywords-path", type=Path, default=DEFAULT_MESH_KEYWORDS_PATH, help="MeSH topics/methods source.")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--review-csv", type=Path, default=DEFAULT_REVIEW_CSV)
    return parser.parse_args()


def main():
    args = parse_args()
    journal_names = [n for n in args.journals.split(",") if n.strip()]

    if args.dry_run:
        dry_run(
            journal_names=journal_names,
            sleep_seconds=args.sleep,
            keywords_path=args.keywords_path,
            mesh_keywords_path=args.mesh_keywords_path,
        )
        return

    run(
        journal_names=journal_names,
        limit=args.limit,
        fetch_fulltext_flag=not args.no_fulltext,
        sleep_seconds=args.sleep,
        keywords_path=args.keywords_path,
        mesh_keywords_path=args.mesh_keywords_path,
        out_dir=args.out_dir,
        review_csv=args.review_csv,
    )


if __name__ == "__main__":
    main()
