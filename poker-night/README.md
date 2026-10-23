# Poker Night — Buy-In & Settle-Up Tracker

A mobile-first tracker for home poker cash games: seat players, record buy-ins and rebuys, validate chip counts at cash-out, split shared expenses, and settle the night with the fewest possible payments.

**Live:** [poker-tracker.dinklytics.workers.dev](https://poker-tracker.dinklytics.workers.dev)

## Highlights

- **Shared live tables** — every table is a cloud session on Cloudflare Workers + D1. The host shares a link; players join with role-scoped tokens (host / edit / view) carried in the URL fragment so they never touch server logs. Open tables poll for live sync, writes are revision-checked to resolve conflicts, and a read-only live view lets anyone follow the game.
- **Real game flow** — mid-game cash-outs with a full table chip-count sheet, departure and re-seating, per-expense participant pickers, and per-player payment handles with Venmo / Cash App / PayPal deep-link Pay buttons.
- **Settlement** — an In/Out/Net ledger and a minimized-payment settle-up you can mark paid and copy straight into the group chat, plus a shareable "Night Recap" champion card.
- **Memory** — lifetime leaderboard (net, ROI, best night) and full past-games history in local storage; the app also works fully offline as a single table on one phone.
- **Native build** — the same web app ships to iOS with Capacitor (`capacitor.config.json`, `README-IOS.md`).

## Layout

- `public/` — the single-page app (no build step, no dependencies).
- `src/` — the Worker API for shared tables (create / read / update, token rotation).
- `schema.sql` — the D1 schema. `wrangler.toml` uses placeholder identifiers in this copy.
