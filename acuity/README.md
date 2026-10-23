# Acuity — Tax & Wealth Planning App

A financial-planning application that produces a full, personalized tax and wealth plan: retirement strategy, Roth conversion analysis, HSA and charitable planning, and an honest financial-independence target.

**Live (dev):** [acuity-dev.dinklytics.workers.dev](https://acuity-dev.dinklytics.workers.dev)

## Design principle: the engine computes, the AI explains

Large language models are unreliable calculators, so Acuity never lets one do math. A deterministic **rules engine** computes every figure from current-year IRS data (brackets, limits, thresholds — verified against IRS sources), and the AI layer writes the narrative strictly from the engine's findings, with its key numbers injected as labeled ground truth.

## Architecture

- `client/` — the complete React + TypeScript single-page app (wizard, results dashboards, PDF export).
- `worker/` — Cloudflare Worker API backed by D1. Plans are generated asynchronously through a **queue** (section-by-section, ~minutes end-to-end); chat runs in-Worker on **Workers AI** (Llama 3.3 70B) with a deterministic rules-based fallback, so chat never hard-fails. Shown here: the API wiring (`src/index.ts`), the D1 data model (`schema.sql`), and the shared types/schemas.
- The rules engine itself, the IRS reference data, the strategy logic, and the AI prompts are proprietary and withheld — see `ENGINE.md`.

## Security posture

Fail-closed 401s on protected routes, UUID job identifiers, public job reads that never expose raw inputs, per-IP rate limits (chat / plan / parse each capped), parameterized D1 queries throughout, schema-validated updates, and CI pinned to action SHAs with Dependabot.

Account and database identifiers in `worker/wrangler.toml` are placeholders in this showcase copy.
