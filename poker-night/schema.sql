-- Poker Night shared tables (Cloudflare D1, free tier).
-- One row per table; the full game state lives in `data` as JSON.
-- Access is by unguessable tokens: host (full control + link management),
-- edit (co-hosts), view (watch-only). Tokens travel in the URL hash and the
-- x-game-token header — never in query strings, so they stay out of logs.
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  rev INTEGER NOT NULL DEFAULT 1,
  host_token TEXT NOT NULL,
  edit_token TEXT NOT NULL,
  view_token TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_games_updated ON games(updated_at);
