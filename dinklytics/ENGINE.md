# Dinklytics — Proprietary Components (Withheld)

The production systems behind Dinklytics are the business's core intellectual property and are **not** included in this showcase:

- **The assessment pipeline** — order intake (Apps Script endpoint), the serial job queue with its watchdog/recovery supervision, ingest and delivery automation, and the operations runbook.
- **The report engine** — the Python/ReportLab builder that renders the v5 editorial assessment PDF: the "By the Numbers" dashboard, the stroke-by-stroke skill-ladder ratings model, annotated teaching-frame composition, and the guarantee that every printed number matches the analysis ledgers.
- **The upload service internals** — the R2 multipart upload Worker (chunked, resumable, mobile-first) beyond what the public site itself exposes.

What this folder does show: the public storefront page (`docs/cloudflare-site/index.html` — the same markup served at dinklytics.com) and the system narrative in the README. The architecture is described at a system level in the portfolio's [ARCHITECTURE.md](../ARCHITECTURE.md); the live product is the proof.
