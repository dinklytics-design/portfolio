# Don't Waste Your Money — Public Investment Research Site

Don't waste your money. Check the thesis, evidence, and risks — then build your illustrative model. Free forever — no paywall, no sign-up, no email, no upsell.

URL unchanged: https://emerging-tech-research.dinklytics.workers.dev/

Original, polished static site. No build step. No live price fetching. All content as-of Oct 17, 2026 unless noted.

**Educational research only — not personalized financial advice. Not a licensed advisor. Past performance does not guarantee future results.**

## Structure
- `public/index.html` — single-page site: hero, portfolio table, thesis-at-a-glance cards, per-pick detail sections, evidence ledger, methodology, market context, disclaimer
- `public/styles.css` — responsive, accessible styles
- `public/app.js` — ticker strip, filter by bucket, search, risk-first toggle, mobile nav. Static only.
- `wrangler.toml` — Workers Static Assets, `assets = ./public`
- `.github/workflows/deploy.yml` — GitHub Actions → Cloudflare Workers via wrangler-action

## Preview locally
```bash
cd ~/workspace/investor-site/public
python3 -m http.server 8000
# open http://localhost:8000
```
Or: `npx wrangler dev` from `~/workspace/investor-site/` (requires wrangler).

## Deploy (GitHub → Cloudflare)
1. Create a GitHub repo and push this folder (root = this folder, so `wrangler.toml` is at repo root).
2. In GitHub: Settings → Secrets and variables → Actions → add:
   - `CF_API_TOKEN` — Cloudflare API token with Workers Edit permission
   - `CF_ACCOUNT_ID` — Cloudflare Account ID
3. Push to `main` (or run workflow manually). The workflow runs `wrangler deploy`.
4. No secrets are stored in files.

## Content notes
- Portfolio: $10,000 aggressive model — Core $5,000 / Enablers $3,000 / Satellite $2,000.
- Earnings labeled Confirmed vs Estimated, as-of Oct 17, 2026. Verify before acting.
- All copy is original. No text/logos copied from Yahoo/Bloomberg/Seeking Alpha/Fool.

## Daily researcher reruns logic (v3.1+)
Each morning the daily researcher RERUNS the allocation logic — it does not only update research text:
1. Re-check `public/universe.json` + `public/models.json` against the latest evidence (new features, new sleeves, earnings, macro, filings/headlines).
2. If evidence warrants, update `models.json` (sleeve % / pick inclusion) AND `public/research.json` (thesis checks + changelog explaining WHY the model changed). Bump `logicVersion`, set `lastLogicRerun` to today, recompute + verify all sums (every allocation must sum to 100%, tranches must sum to the amount).
3. If no change is warranted, still update `lastResearched` / `lastUpdatedET` and log “Logic re-run: no change” in the changelog.
4. Push BOTH files via the GitHub Contents API (GET for SHA, then PUT base64, branch `main`), then verify: latest Actions run completed + success, and live `research.json` / `models.json` show the new dates.
5. Stay silent in chat unless a thesis breaks, the model materially changes, or the deploy fails.
6. Free-first only: SEC EDGAR, Yahoo Finance, FMP free tier, Alpha Vantage free tier, public browser search, company IR pages. No paid data, no paid MCPs, no paywall. Never put secrets/keys in chat, files, or logs. Never copy headlines/articles verbatim — paraphrase with source-type + date.
7. The site reads `logicVersion` + `lastLogicRerun` from `models.json` and displays “Logic vX — re-run <date>” in the Daily Research section.

## Showcase note

Shown here: the complete front end (the same code served by the live site), the topic schemas, and the data-validation tooling. The research dataset itself — the 100 holding files, thesis scorecard, and allocation-model data — is withheld from this showcase (only the topic manifest remains, as a structural sample). The published research is on the live site.
