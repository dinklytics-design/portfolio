// Poker Night — shared live tables API (Cloudflare Workers + D1, free tier).
//
// Tables are addressed by unguessable tokens, one per role:
//   host — full control, incl. rotating the edit link
//   edit — co-hosts: full game edits
//   view — watch-only live view
// Tokens travel in the URL hash and the x-game-token header, never in query
// strings, so they stay out of server logs. No accounts, no PII.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// n random bytes -> hex
const rid = (n) => {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
};

function defaultState(name) {
  return {
    name: name || "Poker Night",
    players: [], buyin: 50, seq: 1, stakes: "0.50/1",
    expenses: [], history: [], bankerId: null, payout: "digital",
    paidMoves: [], settled: false,
  };
}

async function getGame(env, id) {
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) return null;
  return env.DB.prepare("SELECT * FROM games WHERE id = ?").bind(id).first();
}

function roleOf(game, token) {
  if (!token || typeof token !== "string") return null;
  if (token === game.host_token) return "host";
  if (token === game.edit_token) return "edit";
  if (token === game.view_token) return "view";
  return null;
}

const tokenOf = (request) => request.headers.get("x-game-token") || "";

async function createGame(request, env) {
  let body = {};
  try { body = await request.json(); } catch { /* empty body ok */ }
  const id = rid(6); // 12 hex chars
  const now = Date.now();
  const seed = body && typeof body.state === "object" && body.state
    ? { ...defaultState(body.name), ...body.state }
    : defaultState(body.name);
  const row = {
    id, rev: 1,
    host_token: rid(20), edit_token: rid(20), view_token: rid(20),
    data: JSON.stringify(seed),
    created_at: now, updated_at: now,
  };
  if (row.data.length > 500_000) return json({ error: "too large" }, 413);
  await env.DB.prepare(
    "INSERT INTO games (id, rev, host_token, edit_token, view_token, data, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(row.id, row.rev, row.host_token, row.edit_token, row.view_token, row.data, row.created_at, row.updated_at).run();
  return json({ id: row.id, rev: 1, hostToken: row.host_token, editToken: row.edit_token, viewToken: row.view_token });
}

async function readGame(request, env, id) {
  const game = await getGame(env, id);
  if (!game) return json({ error: "not found" }, 404);
  const role = roleOf(game, tokenOf(request));
  if (!role) return json({ error: "not found" }, 404); // don't leak existence
  return json({ id: game.id, rev: game.rev, role, data: JSON.parse(game.data) });
}

async function writeGame(request, env, id) {
  const game = await getGame(env, id);
  if (!game) return json({ error: "not found" }, 404);
  const role = roleOf(game, tokenOf(request));
  if (role !== "host" && role !== "edit") return json({ error: "forbidden" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad request" }, 400); }
  if (!body || typeof body.rev !== "number" || typeof body.data !== "object" || !body.data) {
    return json({ error: "bad request" }, 400);
  }
  const raw = JSON.stringify(body.data);
  if (raw.length > 500_000) return json({ error: "too large" }, 413);
  if (body.rev < game.rev) {
    return json({ error: "stale", rev: game.rev, data: JSON.parse(game.data) }, 409);
  }
  const now = Date.now();
  // Compare-and-swap on rev so two editors can't silently clobber each other.
  const r = await env.DB.prepare(
    "UPDATE games SET rev = rev + 1, data = ?, updated_at = ? WHERE id = ? AND rev = ?"
  ).bind(raw, now, id, game.rev).run();
  if (r.meta.changes === 0) {
    const fresh = await getGame(env, id);
    return json({ error: "stale", rev: fresh.rev, data: JSON.parse(fresh.data) }, 409);
  }
  return json({ rev: game.rev + 1 });
}

async function rotateEdit(request, env, id) {
  const game = await getGame(env, id);
  if (!game) return json({ error: "not found" }, 404);
  if (roleOf(game, tokenOf(request)) !== "host") return json({ error: "forbidden" }, 403);
  const editToken = rid(20);
  await env.DB.prepare("UPDATE games SET edit_token = ?, updated_at = ? WHERE id = ?")
    .bind(editToken, Date.now(), id).run();
  return json({ editToken });
}

async function linkTokens(request, env, id) {
  const game = await getGame(env, id);
  if (!game) return json({ error: "not found" }, 404);
  const role = roleOf(game, tokenOf(request));
  if (role === "host") return json({ editToken: game.edit_token, viewToken: game.view_token });
  if (role === "edit") return json({ viewToken: game.view_token });
  return json({ error: "forbidden" }, 403);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/health") return json({ ok: true, app: "poker-tracker" });
    try {
      if (path === "/api/games" && request.method === "POST") return await createGame(request, env);
      const m = path.match(/^\/api\/games\/([A-Za-z0-9_-]{8,32})(\/rotate-edit|\/tokens)?$/);
      if (m) {
        if (m[2] === "/tokens") {
          return request.method === "GET"
            ? await linkTokens(request, env, m[1])
            : json({ error: "method not allowed" }, 405);
        }
        if (m[2]) {
          return request.method === "POST"
            ? await rotateEdit(request, env, m[1])
            : json({ error: "method not allowed" }, 405);
        }
        if (request.method === "GET") return await readGame(request, env, m[1]);
        if (request.method === "PUT") return await writeGame(request, env, m[1]);
        return json({ error: "method not allowed" }, 405);
      }
    } catch (e) {
      return json({ error: "server error" }, 500);
    }
    return new Response("Not found", { status: 404 });
  },
};
