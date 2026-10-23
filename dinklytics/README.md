# Dinklytics — Pickleball Video Assessment Service

A working business at [dinklytics.com](https://dinklytics.com): a player submits match footage, and receives a coach-grade performance report — a "By the Numbers" dashboard, stroke-by-stroke ratings against a defined skill ladder, annotated teaching frames, highlight clips, and a phased development roadmap.

## How it works

1. **Order** — the storefront (a single Cloudflare Worker) takes the order and video link or direct upload.
2. **Intake** — Google Apps Script records the submission and trips the processing pipeline; an intake-reconcile loop cross-checks both channels so no order is ever missed.
3. **Upload** — large videos upload from mobile browsers to Cloudflare R2 via chunked multipart uploads with per-part resume (see `docs/cloudflare-upload/`).
4. **Assessment** — jobs run strictly one at a time from a queue, supervised by a watchdog that resumes a stalled job from its last completed stage. The footage is analyzed frame-by-frame against the Dinklytics skill ladder — never against the player's self-reported level.
5. **Report** — a Python/ReportLab engine renders the v5 editorial PDF (navy + optic-yellow magazine layout, dashboards whose numbers are guaranteed to match the analysis ledgers).
6. **Delivery** — the PDF and clips are archived to Google Drive and emailed to the customer automatically.

## What's in this folder

- `docs/cloudflare-site/index.html` — the public storefront page, the same markup served at dinklytics.com.
- `ENGINE.md` — what is deliberately **not** here: the assessment pipeline, the report engine, and the upload-service internals are the business's core IP and are withheld from this showcase.

Production credentials, deployment identifiers, and all customer data have been removed from this copy.
