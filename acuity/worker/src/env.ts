// Worker environment bindings.
// DB: D1 database `acuity_jobs` (see schema.sql; create with
//   `wrangler d1 create acuity_jobs` at deploy time).
// HOOK_TOKEN: shared secret for the Hatch hook/agent endpoints
//   (GET /api/jobs/pending, POST /api/jobs/:id/update), sent as header
//   `x-acuity-hook-token`. Set via `wrangler secret put HOOK_TOKEN`.
// AI: Workers AI binding — chat jobs are answered in-worker in seconds.
//   Falls back to the agent queue if Workers AI is unavailable.
// Public endpoints (job creation, GET /api/jobs/:id) need no token — the
// jobId is a random UUID and unguessable.
export interface Env {
  DB: D1Database;
  AI: Ai;
  HOOK_TOKEN?: string;
  // Prototype (env.proto only): queue-driven plan generation.
  // PLAN_QUEUE: queue of { jobId, key } section messages.
  // PLAN_QUEUE_MODE=1: POST /api/jobs inserts plan jobs as 'working' and
  // enqueues section messages instead of leaving them 'pending' for the
  // Hatch agent worker.
  PLAN_QUEUE?: Queue;
  PLAN_QUEUE_MODE?: string;
}
