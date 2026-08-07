"""Orchestrate the scraping pipeline: search -> extract -> validate -> write candidates.

Usage:
    python run_pipeline.py --journals "Social Neuroscience,SCAN,Communications Psychology" --limit 20
    python run_pipeline.py                      # all journals, default limit
"""

import argparse
import csv
import json
import re
import time
from pathlib import Path

import requests

from extract_candidate import build_candidate
from search_europepmc import fetch_fulltext, get_hit_count, search_journal
from validate_candidate import validate_candidate

SCRAPING_DIR = Path(__file__).resolve().parent
DEFAULT_KEYWORDS_PATH = SCRAPING_DIR / "keywords.json"
DEFAULT_OUT_DIR = SCRAPING_DIR / "candidates"
DEFAULT_REVIEW_CSV = SCRAPING_DIR / "review.csv"


def load_keywords(path):
    return json.loads(Path(path).read_text())


def select_journals(keywords_data, names):
    if not names:
        return keywords_data["journals"]
    wanted = {n.strip().lower() for n in names}
    selected = [j for j in keywords_data["journals"] if j["name"].lower() in wanted]
    missing = wanted - {j["name"].lower() for j in selected}
    if missing:
        raise SystemExit(f"Unknown journal name(s), check scraping/keywords.json: {sorted(missing)}")
    return selected


def load_existing_dois(out_dir):
    seen = set()
    if not out_dir.exists():
        return seen
    for path in out_dir.glob("*.json"):
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            continue
        if data.get("doi"):
            seen.add(data["doi"])
    return seen


def dry_run(journal_names, sleep_seconds, keywords_path):
    """Print each selected journal's total Europe PMC hit count -- no records fetched,
    nothing written -- so you can pick a sensible --limit before the real run."""
    keywords_data = load_keywords(keywords_path)
    journals = select_journals(keywords_data, journal_names)
    session = requests.Session()

    print(f"{'journal':<40} {'hits':>8}")
    print("-" * 49)
    total = 0
    for i, journal_entry in enumerate(journals):
        _, hit_count = get_hit_count(journal_entry, keywords_data, session=session)
        print(f"{journal_entry['name']:<40} {hit_count:>8}")
        total += hit_count
        if i < len(journals) - 1:
            time.sleep(sleep_seconds)
    print("-" * 49)
    print(f"{'total':<40} {total:>8}")


def run(journal_names, limit, fetch_fulltext_flag, sleep_seconds, keywords_path, out_dir, review_csv):
    keywords_data = load_keywords(keywords_path)
    journals = select_journals(keywords_data, journal_names)
    out_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    seen_dois = load_existing_dois(out_dir)

    for journal_entry in journals:
        query, hits = search_journal(
            journal_entry, keywords_data, limit=limit, sleep_seconds=sleep_seconds, session=session
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

            candidate = build_candidate(record, journal_entry, keywords_data, fulltext_text=fulltext_text)
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


def write_review_csv(out_dir, review_csv):
    rows = []
    for path in sorted(out_dir.glob("*.json")):
        data = json.loads(path.read_text())
        meta = data.get("_meta", {})
        schema_check = meta.get("schema_check", {})
        rows.append(
            {
                "file": path.name,
                "status": "pending",
                "name": data.get("name", ""),
                "journal": meta.get("journal_matched", ""),
                "year": data.get("year", ""),
                "doi": data.get("doi", ""),
                "repository": data.get("repository", ""),
                "dataset_url": data.get("url", ""),
                "topics": ";".join(data.get("topics", [])),
                "modality": ";".join(data.get("modality", [])),
                "tags": ";".join(data.get("tags", [])),
                "used_fulltext": meta.get("used_fulltext", False),
                "schema_valid": schema_check.get("valid", False),
                "missing_required": ";".join(schema_check.get("missing_required", [])),
            }
        )

    if not rows:
        return
    with open(review_csv, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def parse_args():
    parser = argparse.ArgumentParser(description="Scrape candidate social-neuroscience datasets from journal papers.")
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
    parser.add_argument("--keywords-path", type=Path, default=DEFAULT_KEYWORDS_PATH)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--review-csv", type=Path, default=DEFAULT_REVIEW_CSV)
    return parser.parse_args()


def main():
    args = parse_args()
    journal_names = [n for n in args.journals.split(",") if n.strip()]

    if args.dry_run:
        dry_run(journal_names=journal_names, sleep_seconds=args.sleep, keywords_path=args.keywords_path)
        return

    run(
        journal_names=journal_names,
        limit=args.limit,
        fetch_fulltext_flag=not args.no_fulltext,
        sleep_seconds=args.sleep,
        keywords_path=args.keywords_path,
        out_dir=args.out_dir,
        review_csv=args.review_csv,
    )


if __name__ == "__main__":
    main()
