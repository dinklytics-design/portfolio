# Acuity — Proprietary Components (Withheld)

Acuity's value lives in its computation layer, which is **not** included in this showcase:

- **The rules engine** — the deterministic tax and wealth-planning engine: current-year IRS reference data, federal/state tax computation, retirement and Roth-conversion strategy coordination, HSA and charitable planning logic.
- **The AI layer** — the plan-generation and chat pipelines, the advisor persona and guardrails, and the grounding machinery that forces the model to narrate only engine-verified numbers.
- **The engine test suites** — hundreds of scenario checks against IRS-published figures (they would reveal the strategy logic in detail).

What this folder does show: the complete React front end (wizard, results dashboards, PDF export), the Worker API wiring (`worker/src/index.ts` — routing, auth, rate limiting), the D1 data model (`worker/schema.sql`), and the shared types and schemas that define the interface between the two. The engine sits behind that interface; the live dev build is the proof it works.
