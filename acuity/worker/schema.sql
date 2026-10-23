-- Acuity async job queue (Hatch agent worker pattern).
-- The Worker creates jobs; a Hatch hook polls /api/jobs/pending and wakes the
-- agent worker; the agent POSTs results back to /api/jobs/:id/update.

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,            -- 'plan' | 'chat' | 'parse401k'
  input_json TEXT NOT NULL,      -- zod-validated input payload
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | working | done | error
  result_json TEXT,              -- accumulated result (sections/summary/reply/parsed)
  error TEXT,
  created_at INTEGER NOT NULL,   -- epoch ms
  updated_at INTEGER NOT NULL    -- epoch ms
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs (status, created_at);

-- Abuse protection: D1-backed sliding-window rate limiter (see index.ts).
-- One row per (endpoint, client IP); rows are cheap and pruned lazily.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,          -- e.g. 'rl:chat:1.2.3.4'
  window_start INTEGER NOT NULL, -- epoch ms of current window
  count INTEGER NOT NULL
);
