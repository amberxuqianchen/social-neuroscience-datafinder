"""Validate a candidate dataset dict against data/schema.json.

Candidates from the scraper are necessarily incomplete (fields like `description`,
`sampleSize`, `species` need a human) so this checks *structural* validity --
types, enums, no unknown properties -- on whatever fields are present, and reports
missing required fields separately as a to-do list rather than a hard failure.
A candidate "passes" (`valid: True`) when nothing present violates the schema,
regardless of what's still missing.
"""

import json
from pathlib import Path

from jsonschema import Draft7Validator

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "data" / "schema.json"

_schema_cache = None


def load_schema():
    global _schema_cache
    if _schema_cache is None:
        _schema_cache = json.loads(SCHEMA_PATH.read_text())
    return _schema_cache


def validate_candidate(candidate):
    schema = load_schema()
    required = schema.get("required", [])
    lenient_schema = {**schema, "required": []}

    stripped = {k: v for k, v in candidate.items() if not k.startswith("_")}

    validator = Draft7Validator(lenient_schema)
    errors = sorted(validator.iter_errors(stripped), key=lambda e: list(e.path))
    error_messages = [f"{'.'.join(map(str, e.path)) or '<root>'}: {e.message}" for e in errors]

    missing_required = [
        field for field in required if field not in stripped or stripped[field] in (None, "", [])
    ]

    return {
        "valid": not error_messages,
        "errors": error_messages,
        "missing_required": missing_required,
    }


if __name__ == "__main__":
    import sys

    for path in sys.argv[1:]:
        candidate = json.loads(Path(path).read_text())
        result = validate_candidate(candidate)
        status = "OK" if result["valid"] else "SCHEMA ERRORS"
        print(f"{path}: {status}")
        for err in result["errors"]:
            print(f"  ERROR: {err}")
        if result["missing_required"]:
            print(f"  missing required (needs manual review): {', '.join(result['missing_required'])}")
