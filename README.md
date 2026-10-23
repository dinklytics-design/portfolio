# Project Portfolio

Selected software products — each one designed, built, tested, and deployed end-to-end with an AI engineering agent implementing under a product owner's direction, on a modern serverless stack.

**How these products get built:** the owner directs the product and architecture; the AI agent writes the code, runs the tests, and ships it. The delivery pipeline is fully automated: agent workspace → GitHub (API-driven pushes, GitHub Actions) → Cloudflare (Workers, D1, R2, KV, Queues, Workers AI). The model is documented in [ARCHITECTURE.md](ARCHITECTURE.md).

## Projects

| Project | What it is | Stack | Live |
|---|---|---|---|
| [Dinklytics](dinklytics/) | Pickleball video assessment service — customers submit match footage and receive a coach-grade, magazine-style PDF performance report | Cloudflare Worker storefront, Google Apps Script intake, R2 multipart uploads, Python/ReportLab report engine, Drive delivery | [dinklytics.com](https://dinklytics.com) |
| [Acuity](acuity/) | Tax and wealth planning app — a deterministic rules engine (current-year IRS figures) computes the plan; an LLM writes the narrative only from engine-verified numbers | React + TypeScript SPA, Cloudflare Worker API, D1 job queue, Workers AI (Llama 3.3 70B) | [acuity-dev.dinklytics.workers.dev](https://acuity-dev.dinklytics.workers.dev) |
| [Poker Night](poker-night/) | Home poker cash-game tracker — buy-ins, chip validation, minimized settle-up with payment deep links, lifetime leaderboard | Single-page app, Cloudflare Workers + D1 shared live tables with token-scoped share links, Capacitor iOS build | [poker-tracker.dinklytics.workers.dev](https://poker-tracker.dinklytics.workers.dev) |
| [Harvest Church CMS](harvest-church-cms/) | WordPress-style CMS for a church website — ~160 editable fields, roles, members-only pages, invite registration, version history, OWASP-hardened auth | Single Cloudflare Worker, KV content store, PBKDF2 password hashing, full security-header/CSP suite | [harvest-church.dinklytics.workers.dev](https://harvest-church.dinklytics.workers.dev) |
| [Don't Waste Your Money](investor-research/) | Educational investment-research site — 100 holdings researched on a twice-daily cycle, plain-language by design | Static site on Cloudflare, topic-file data layer with schema validation, scheduled research pipeline | [emerging-tech-research.dinklytics.workers.dev](https://emerging-tech-research.dinklytics.workers.dev) |
| [SiteScout](sitescout/) | Audit and scoring engine that finds businesses with outdated websites and ranks redesign prospects | Python scoring engine, PageSpeed/Places enrichment, synthetic-fixture test suite | — |

## Engineering themes across the portfolio

- **Agent-driven delivery** — code, tests, and deploys executed by an AI agent under the owner's direction; zero-touch GitHub Actions pipelines.
- **Serverless-first on Cloudflare** — Workers for compute, D1 for SQL, R2 for blob/video storage, KV for content, Queues for long-running jobs, Workers AI for inference. No servers to babysit; most of this runs on free tiers.
- **Deterministic core, AI surface** — where correctness matters (tax math, assessment ratings, payment settles), a rules engine computes and the AI only explains.
- **Security as a feature** — fail-closed auth, rate limiting, hashed credentials, CSP, and live end-to-end verification before anything is called done.

## Notes on this repository

These are clean showcase copies of production codebases. This showcase is intentionally anonymous: it contains no personal names, contact details, or employer information. Credentials, API keys, account/database identifiers, customer data, and operational asset IDs have been removed or replaced with placeholders — that is why a few configuration values read `YOUR_...`. Sample content uses fictitious names.

The core engines are also intentionally withheld — the Dinklytics assessment pipeline and report builder, the Acuity tax rules engine and AI prompts, the Harvest CMS implementation, the SiteScout scoring rubric, and the investor site's full research dataset. What remains is enough to evidence the work (architecture, interfaces, data models, test rigor, and the live products themselves), not to clone it. Each project folder notes what was held back.
