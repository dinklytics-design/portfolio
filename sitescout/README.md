# SiteScout — Website Audit & Scoring Engine

Phase 1 of an agent-run service that finds local businesses whose websites are costing them customers, and ranks them as redesign prospects. ("SiteScout" is an internal codename.)

## What it does

- **Audit** — fetches a business's site and evaluates it: platform/CMS detection, mobile readiness, performance signals, and PageSpeed Insights enrichment through staged data collection (cheap signals first, expensive calls only for candidates that pass).
- **Score** — a deterministic scoring engine combines an *outdated score* (how badly the site needs work), *feasibility* (which rebuild path fits — a redesign inside the business's existing CMS vs. a custom front end), and *ROI* signals into a single ranked verdict with plain-language reasons a non-technical owner can understand.
- **Validate** — the engine was validated against real-world Orlando businesses across the quality spectrum (modern WordPress, aging static sites, hosted builders), with confidence bands that downgrade a verdict when audit data is incomplete rather than guessing.

## Showcase note

The scoring rubric, the audit implementation, and the test fixtures are the service's core IP and are withheld from this showcase — the methodology above and the validation story are the evidence; the live pipeline is the proof. Prospect data and outreach machinery were never part of this repository.
