#!/usr/bin/env python3
"""Validate the topic artifacts under public/data/ against schemas/ + cross-checks.

Phase 0 gate of the Fincept-inspired data plane. If this exits non-zero, the
publish step must NOT ship public/data/** — last-known-good files stand.

Checks:
  1. Every file under public/data/ validates against its schema in schemas/
     (manifest, scorecard, holding, group, earnings, macro, deepdive-index,
     deepdive). data/models.json is a verbatim copy of public/models.json and
     is checked for parse + allocations presence instead.
  2. Every holding topic's ticker exists in public/universe.json, and every
     security in universe.json has exactly one holding topic.
  3. scorecard counts equal the counts computed from the holding topics AND
     the counts recomputed from public/research.json thesisChecks using the
     exact counting app.js uses (watch / break / else holds).
  4. Manifest entries match files on disk both ways: every entry's path
     exists, and every file under public/data/ is listed (manifest itself
     excepted).
  5. Group topics: every member ticker exists in universe.json, and group
     membership matches the securities' group field exactly.

The schema checker is a small purpose-built subset of JSON Schema (type,
required, properties, additionalProperties, items, enum, minimum) so this
script runs on stdlib alone, including inside the research cron environment.

Exit 0 = all good. Exit 1 = failures printed, one per line.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DATA = PUBLIC / "data"
SCHEMAS = ROOT / "schemas"

FAILURES = []


def fail(msg):
    FAILURES.append(msg)


def load_json(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:  # noqa: BLE001
        fail(f"{path.relative_to(ROOT)}: cannot parse JSON: {exc}")
        return None


def type_ok(value, tname):
    if tname == "object":
        return isinstance(value, dict)
    if tname == "array":
        return isinstance(value, list)
    if tname == "string":
        return isinstance(value, str)
    if tname == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if tname == "number":
        return (isinstance(value, (int, float)) and not isinstance(value, bool))
    if tname == "boolean":
        return isinstance(value, bool)
    if tname == "null":
        return value is None
    return True


def check(value, schema, where):
    """Purpose-built subset JSON Schema check. Appends failures."""
    t = schema.get("type")
    if t is not None:
        types = t if isinstance(t, list) else [t]
        if not any(type_ok(value, x) for x in types):
            fail(f"{where}: expected type {t}, got {type(value).__name__}")
            return
    if "enum" in schema and value not in schema["enum"]:
        fail(f"{where}: {value!r} not in enum {schema['enum']}")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            fail(f"{where}: {value} below minimum {schema['minimum']}")
    if isinstance(value, dict):
        for req in schema.get("required", []):
            if req not in value:
                fail(f"{where}: missing required field {req!r}")
        props = schema.get("properties", {})
        addl = schema.get("additionalProperties", True)
        for key, val in value.items():
            if key in props:
                check(val, props[key], f"{where}.{key}")
            elif isinstance(addl, dict):
                check(val, addl, f"{where}.{key}")
            elif addl is False:
                fail(f"{where}: unexpected field {key!r}")
    if isinstance(value, list) and isinstance(schema.get("items"), dict):
        for i, item in enumerate(value):
            check(item, schema["items"], f"{where}[{i}]")


def schema_for(relpath):
    """Map a path under public/data/ to its schema name, or None."""
    parts = relpath.parts
    if relpath.name == "manifest.json":
        return "manifest"
    if relpath.name == "scorecard.json":
        return "scorecard"
    if relpath.name == "earnings.json":
        return "earnings"
    if relpath.name == "research.json" and len(parts) == 1:
        return "research"
    if relpath.name == "macro.json":
        return "macro"
    if relpath.name == "models.json":
        return None  # verbatim copy; checked separately
    if len(parts) >= 2 and parts[-2] == "holding":
        return "holding"
    if len(parts) >= 2 and parts[-2] == "group":
        return "group"
    if len(parts) >= 2 and parts[-2] == "deepdive":
        return "deepdive-index" if relpath.name == "index.json" else "deepdive"
    return "unknown"


def main():
    if not DATA.is_dir():
        fail("public/data/ does not exist — run tools/split_topics.py first")
        return report()

    schemas = {}
    for name in ("manifest", "scorecard", "holding", "group", "earnings",
                 "research", "macro", "deepdive-index", "deepdive"):
        s = load_json(SCHEMAS / f"{name}.schema.json")
        if s is not None:
            schemas[name] = s

    files = sorted(p for p in DATA.rglob("*.json"))
    parsed = {}
    for path in files:
        rel = path.relative_to(DATA)
        obj = load_json(path)
        if obj is None:
            continue
        parsed[str(rel)] = obj
        sname = schema_for(rel)
        if sname == "unknown":
            fail(f"data/{rel}: no schema mapping for this file")
        elif sname is not None:
            check(obj, schemas[sname], f"data/{rel}")
        else:  # data/models.json — verbatim copy check
            src = load_json(PUBLIC / "models.json")
            if src is not None and obj != src:
                fail("data/models.json: differs from public/models.json "
                     "(must be a verbatim copy)")
            if not isinstance(obj, dict) or "allocations" not in obj:
                fail("data/models.json: missing 'allocations'")

    # ---- cross-checks ----
    universe = load_json(PUBLIC / "universe.json")
    research = load_json(PUBLIC / "research.json")
    manifest = parsed.get("manifest.json")

    if universe is not None:
        tickers = {s["ticker"] for s in universe["securities"]}
        by_group = {}
        for s in universe["securities"]:
            by_group.setdefault(s["sleeve"], []).append(s["ticker"])

        holdings = {k: v for k, v in parsed.items() if k.startswith("holding/")}
        seen_tickers = []
        for rel, h in sorted(holdings.items()):
            if h.get("ticker") not in tickers:
                fail(f"data/{rel}: ticker {h.get('ticker')!r} not in universe.json")
            seen_tickers.append(h.get("ticker"))
        if sorted(seen_tickers) != sorted(tickers):
            fail(f"holding topics cover {len(seen_tickers)} tickers, "
                 f"universe has {len(tickers)} — sets differ")

        for rel, g in sorted(parsed.items()):
            if not rel.startswith("group/"):
                continue
            want = by_group.get(g.get("id"), [])
            if sorted(g.get("holdings", [])) != sorted(want):
                fail(f"data/{rel}: holdings do not match universe group "
                     f"{g.get('id')!r} membership")
            for t in g.get("holdings", []):
                if t not in tickers:
                    fail(f"data/{rel}: member ticker {t!r} not in universe.json")

        # scorecard vs holding topics vs research.json (app.js counting)
        sc = parsed.get("scorecard.json")
        if sc is not None:
            def counts(items):
                total = len(items)
                watch = sum(1 for x in items if x["status"] == "watch")
                brk = sum(1 for x in items if x["status"] == "break")
                return total, total - watch - brk, watch, brk
            got = (sc.get("total"), sc.get("holds"), sc.get("watch"), sc.get("break"))
            from_holdings = counts(list(holdings.values()))
            if got != from_holdings:
                fail(f"scorecard counts {got} != holding-topic counts "
                     f"{from_holdings}")
            if research is not None:
                from_research = counts(research["thesisChecks"])
                if got != from_research:
                    fail(f"scorecard counts {got} != research.json counts "
                         f"{from_research}")

    # manifest <-> disk, both ways
    if manifest is not None:
        listed = {}
        for name, entry in (manifest.get("topics") or {}).items():
            listed[entry.get("path")] = name
            if not entry.get("path") or not (PUBLIC / entry["path"]).is_file():
                fail(f"manifest topic {name!r}: path {entry.get('path')!r} "
                     f"missing on disk")
        for rel in parsed:
            if rel == "manifest.json":
                continue
            if "data/" + rel not in listed:
                fail(f"data/{rel}: on disk but not listed in manifest")

    return report()


def report():
    if FAILURES:
        print(f"validate_topics: FAILED ({len(FAILURES)} problem(s))")
        for f in FAILURES:
            print(" -", f)
        return 1
    print("validate_topics: OK — all topic files valid, cross-checks pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
