#!/usr/bin/env python3
"""Split the monolith JSON files into topic artifacts under public/data/.

Phase 1 of the Fincept-inspired data plane (see
goals/emerging-tech-investment-research/files/fincept-architecture-plan-2026-10-21.md).

Reads (never modifies):
    public/universe.json   - the 100 securities (groups = the 'sleeve' field)
    public/research.json   - thesisChecks / earningsUpdates / status / stamps
    public/models.json     - the 16 plan allocations + group (sleeve) labels

Emits (deterministic: sorted keys, universe order for lists):
    public/data/manifest.json
    public/data/scorecard.json        counts mirrored from app.js loadResearchLine()
    public/data/holding/<SLUG>.json  one per security; <SLUG> = ticker uppercased,
                                      non [A-Z0-9.-] runs collapsed to '-'
                                      (exact ticker is inside the file + manifest)
    public/data/group/<sleeve>.json  one per group
    public/data/earnings.json        research.json earningsUpdates, as-is
    public/data/research.json        headline / focus / status / changelog /
                                     stamps — everything the widgets and the
                                     Deep Dives view render from research.json
                                     (Phase 3: lets the site retire monolith
                                     reads entirely in Phase 4)
    public/data/models.json          full copy of models.json

Macro topic: NOT emitted. research.json carries no macro topic fields (no
rates/inflation/regime data) — only a headline and focus blurbs, which are not
macro data. Emitting one would mean inventing data. Recorded skip, 2026-10-21.

Stdlib only. Exit non-zero on any inconsistency in the source data.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DATA = PUBLIC / "data"
PRODUCER = "split_topics.py"
DATE_SEP = " — "  # exactly what app.js splits lastUpdatedET on
VALID_STATUS = {"holds", "watch", "break"}


def load(name):
    with open(PUBLIC / name, encoding="utf-8") as fh:
        return json.load(fh)


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=2, sort_keys=True, ensure_ascii=False)
        fh.write("\n")


def slug(ticker):
    return re.sub(r"[^A-Z0-9.\-]+", "-", ticker.upper()).strip("-")


def main():
    universe = load("universe.json")
    research = load("research.json")
    models = load("models.json")

    securities = universe["securities"]
    thesis = {t["id"]: t for t in research["thesisChecks"]}
    updated_et = research["lastUpdatedET"]

    errors = []
    if len(thesis) != len(research["thesisChecks"]):
        errors.append("duplicate ids in research.thesisChecks")
    for sec in securities:
        if sec["id"] not in thesis:
            errors.append(f"no thesis check for security id {sec['id']}")
    for tid in thesis:
        if tid not in {s["id"] for s in securities}:
            errors.append(f"thesis check id {tid} not in universe")
    if errors:
        for e in errors:
            print("ERROR:", e, file=sys.stderr)
        return 1

    topics = {}

    def add_topic(name, path, obj):
        dump(DATA / path, obj)
        topics[name] = {
            "path": "data/" + path,
            "updatedET": updated_et,
            "producer": PRODUCER,
            "status": "ok",
        }

    # ---- scorecard: mirror app.js loadResearchLine() counting exactly ----
    checks = research["thesisChecks"]
    total = len(checks)
    watch = sum(1 for c in checks if c["status"] == "watch")
    brk = sum(1 for c in checks if c["status"] == "break")
    holds = total - watch - brk  # app.js counts everything else as holds
    add_topic("scorecard", "scorecard.json", {
        "total": total,
        "holds": holds,
        "watch": watch,
        "break": brk,
        "updatedDate": updated_et.split(DATE_SEP)[0],
        "lastUpdatedET": updated_et,
        "lastResearched": research["lastResearched"],
        "statusLine": research["status"],
    })

    # ---- holdings ----
    seen_slugs = {}
    for sec in securities:
        t = thesis[sec["id"]]
        if t["status"] not in VALID_STATUS:
            print(f"ERROR: status {t['status']!r} for {sec['id']} not in "
                  f"{sorted(VALID_STATUS)}", file=sys.stderr)
            return 1
        s = slug(sec["ticker"])
        if s in seen_slugs:
            print(f"ERROR: slug collision {s}: {seen_slugs[s]} vs {sec['ticker']}",
                  file=sys.stderr)
            return 1
        seen_slugs[s] = sec["ticker"]
        holding = {
            "id": sec["id"],
            "ticker": sec["ticker"],
            "name": sec["name"],
            "group": sec["sleeve"],
            "groupLabel": models.get("sleeves", {}).get(sec["sleeve"], {}).get("label"),
            "type": sec["type"],
            "bucket": sec["bucket"],
            "bucketLabel": sec["bucketLabel"],
            "status": t["status"],
            "note": t["note"],
            "thesis": sec["thesis"],
            "keyMetric": sec["keyMetric"],
            "whatWouldChangeMind": sec["whatWouldChangeMind"],
            "bull": sec["bull"],
            "bear": sec["bear"],
            "earnings": sec["earnings"],
            "earningsStatus": sec["earningsStatus"],
            "riskRating": sec["riskRating"],
            "horizonFit": sec["horizonFit"],
            "expenseRatio": sec["expenseRatio"],
            "search": sec["search"],
        }
        add_topic(f"holding:{sec['ticker']}", f"holding/{s}.json", holding)

    # ---- groups (sleeves) ----
    sleeves = models.get("sleeves", {})
    for gkey in sorted(sleeves):
        meta = sleeves[gkey] or {}
        members = [sec["ticker"] for sec in securities if sec["sleeve"] == gkey]
        add_topic(f"group:{gkey}", f"group/{gkey}.json", {
            "id": gkey,
            "label": meta.get("label", gkey),
            "description": meta.get("desc"),
            "members": meta.get("members"),
            "holdings": members,
        })

    # ---- earnings ----
    add_topic("earnings", "earnings.json", {
        "updatedET": updated_et,
        "updates": research.get("earningsUpdates", []),
    })

    # ---- research: headline / focus / changelog (widget + deep-dive source) ----
    add_topic("research", "research.json", {
        "headline": research.get("headline"),
        "focus": research.get("focus", []),
        "status": research.get("status"),
        "changelog": research.get("changelog", []),
        "lastUpdatedET": updated_et,
        "lastResearched": research["lastResearched"],
    })

    # ---- models (full copy, unchanged schema) ----
    add_topic("models", "models.json", models)

    # ---- manifest ----
    dump(DATA / "manifest.json", {
        "version": "1.0",
        "updatedET": updated_et,
        "topics": topics,
    })

    print(f"split_topics: wrote {len(topics)} topics "
          f"({total} holdings: {holds} holds / {watch} watch / {brk} break), "
          f"{len(sleeves)} groups. Macro topic skipped: no macro fields in "
          f"research.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
