#!/usr/bin/env node
/* Harness-test the built Harvest CMS worker against an in-memory mock KV.
   Never touches production KV, the real admin password, or the network.
   Usage: node harness.mjs
*/
import { readFileSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const WORKER_PATH = new URL("./dist/harvest-church-worker.js", import.meta.url).pathname;
const COPY = "/tmp/hc-harness-worker.mjs";
writeFileSync(COPY, readFileSync(WORKER_PATH, "utf-8"));
const worker = (await import(COPY)).default;

const store = new Map();
// Pre-slim worker: static assets are embedded in the worker script (ASSETS map)
// or inlined in the templates — the worker never reads asset:* KV keys.
// The mock KV starts empty (test sections seed their own keys below).
const env = {
  CMS_KV: {
    async get(k, type) {
      if (!store.has(k)) return null;
      const v = store.get(k);
      if (type === "arrayBuffer") {
        if (v instanceof ArrayBuffer) return v;
        if (typeof v === "string") return new TextEncoder().encode(v).buffer;
        if (Buffer.isBuffer(v)) return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength);
        return new TextEncoder().encode(String(v)).buffer;
      }
      return typeof v === "string" ? v : v.toString("utf-8");
    },
    async put(k, v) { store.set(k, v); },
    async delete(k) { store.delete(k); },
    async list(opts = {}) {
      const prefix = opts.prefix || "";
      const names = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      return { keys: names.map((name) => ({ name })), list_complete: true, cursor: null };
    },
  },
};

let passed = 0, failed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${extra}`); }
}

/* CSRF bookkeeping for the hardened worker: session cookie pair -> token.
   An explicit x-csrf-token in extraHeaders always wins (security tests
   use that to send wrong tokens on purpose). */
const csrfByCookie = new Map();
function csrfRemember(cookiePair, json) {
  if (cookiePair && json && typeof json.csrfToken === "string" && json.csrfToken) {
    csrfByCookie.set(cookiePair, json.csrfToken);
  }
}
function csrfPairFrom(setCookie, fallbackCookie) {
  const m = (setCookie || "").match(/(?:session|site_session)=[^;]+/);
  return m ? m[0] : (fallbackCookie || "");
}
async function req(path, method = "GET", body = undefined, cookie = "", extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers["cookie"] = cookie;
  if (method === "POST" && cookie && csrfByCookie.has(cookie) && !("x-csrf-token" in headers)) {
    headers["x-csrf-token"] = csrfByCookie.get(cookie);
  }
  const r = new Request("https://test.invalid" + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await worker.fetch(r, env);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  const setCookie = res.headers.get("set-cookie") || "";
  csrfRemember(csrfPairFrom(setCookie, cookie), json);
  return { status: res.status, text, json, setCookie, contentType: res.headers.get("content-type") || "" };
}
async function reqBytes(path) {
  const r = new Request("https://test.invalid" + path, { method: "GET" });
  const res = await worker.fetch(r, env);
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, bytes: buf, contentType: res.headers.get("content-type") || "" };
}
function deepCloneForHarness(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

console.log("== public routes (no session) ==");
let r = await req("/");
check("GET / -> 200", r.status === 200);
check("GET / renders default hero headline", r.text.includes("You belong here."));
check("GET / renders default church name", r.text.includes("Harvest Church"));
check("REGRESSION router inserts view HTML raw (not escaped)", r.text.includes('main.innerHTML = `<div class="view">${ROUTES[route]()}</div>`') && !r.text.includes("escRich(ROUTES") && !r.text.includes("escHtml(ROUTES"));
r = await req("/admin");
check("GET /admin -> 200", r.status === 200);
check("GET /admin has pages list (new WP admin UI)", r.text.includes("pages-list"));
check("GET /admin loads from WP API", r.text.includes("/api/wp/pages") || r.text.includes("/api/wp/dashboard"));
check("GET /admin has role picker", r.text.includes("new-user-role"));
check("GET /admin has My account card", r.text.includes("My account"));
check("GET /admin mentions subscriber role", r.text.includes("subscriber"));
check("GET /admin wires own-password change", r.text.includes("/api/users/me/password"));
check("GET /admin wires role change", r.text.includes("/api/users/role"));
check("GET /admin has notice banner", r.text.includes('id="notice"'));
check("GET /admin auth-wrap visible by default (blank-page regression guard)", r.text.includes('<div id="auth-wrap" class="wrap">'));
check("GET /admin login form visible by default (blank-page regression guard)", r.text.includes('<form id="login-form" class="card"'));
check("GET /admin init catches boot failures", r.text.includes("Could not reach the server"));
check("GET /admin media label states ~150 KB + URL option (Fix A)", r.text.includes("Upload a file (under 150 KB") && r.text.includes("use the image URL option instead"));
check("GET /admin media label has no 1.2 MB claim (Fix A)", !r.text.includes("Upload a file (under 1.2 MB)"));
check("GET /admin per-field image label states ~150 KB + URL option (leftover fix)", r.text.includes("Upload image (under 150 KB") && r.text.includes("use an image URL instead"));
check("GET /admin per-field image label has no 1.2 MB claim (leftover fix)", !r.text.includes("Upload image (under 1.2 MB)"));
check("GET /admin client-side image checks use 150 KB threshold (leftover fix)", r.text.includes("150 * 1000") && !r.text.includes("1.2 * 1024 * 1024"));
check("GET /admin wires showNotice", r.text.includes("showNotice"));
check("GET /admin save confirmation", r.text.includes("Changes saved"));
r = await req("/api/content");
check("GET /api/content -> {} when empty", r.status === 200 && JSON.stringify(r.json) === "{}");
r = await req("/api/merged");
check("GET /api/merged -> 200", r.status === 200);
check("merged hero.headline default", r.json?.hero?.headline === "You belong here.");
check("merged home.serviceHead.heading", r.json?.home?.serviceHead?.heading === "Service times & location");
check("merged home.intents length 5", Array.isArray(r.json?.home?.intents) && r.json.home.intents.length === 5);
check("Members: logged-out merged deletes house-churches keys (no DEFAULTS leak)", r.json?.houseChurches?.groups === undefined && r.json?.houseChurches?.heading === undefined);
check("merged visit.faqs length 5", Array.isArray(r.json?.visit?.faqs) && r.json.visit.faqs.length === 5);
check("merged about.beliefs length 11", Array.isArray(r.json?.about?.beliefs) && r.json.about.beliefs.length === 11);
check("merged ministries.teams length 7", Array.isArray(r.json?.ministries?.teams) && r.json.ministries.teams.length === 7);
check("merged nav length 5", Array.isArray(r.json?.nav) && r.json.nav.length === 5);
check("merged seo.title", r.json?.seo?.title === "Harvest Church · Winter Garden, Florida");
check("merged church.logo empty (built-in)", r.json?.church?.logo === "");
check("merged has NO base64 blob", !JSON.stringify(r.json).includes("data:image/png;base64"));
check("merged church.serviceTimes is array", JSON.stringify(r.json?.church?.serviceTimes) === '["8:30 AM","10:30 AM"]');

console.log("== embedded static assets (pre-slim worker) ==");
// Big assets are inlined/embedded: font + logos as data-URIs in the site
// HTML, QR encoder vendored in the admin HTML, icons + manifest in the
// worker's embedded ASSETS map. No KV asset routes exist.
r = await req("/");
check("Site HTML: font inlined as data-URI", r.text.includes("data:font/woff2;base64"));
check("Site HTML: logo inlined as data-URI", r.text.includes("data:image/png;base64,"));
check("Site HTML: no KV font route", !r.text.includes("/font.woff2"));
check("Site HTML: no KV dark-logo route", !r.text.includes("/harvest-logo-dark.png"));
r = await req("/admin");
check("Admin HTML: QR encoder vendored inlined", r.text.includes("BEGIN VENDORED QR ENCODER") && r.text.includes("END VENDORED QR ENCODER"));
check("Admin HTML: QR encoder NOT lazy-loaded", !r.text.includes("ensureQREncoder") && !r.text.includes("/qr-encoder.js"));
check("Admin HTML: no typeof-qrcode guard (encoder always present)", !r.text.includes('typeof qrcode === "undefined"'));
check("Admin HTML: no await-encoder call", !r.text.includes("await ensureQREncoder()"));
// Every embedded asset route: 200 + exact Content-Type + byte-identical body.
const assetExpect = [
  ["/harvest-logo.png", "image/png", "assets/harvest-logo.png"],
  ["/harvest-icon.png", "image/png", "assets/harvest-icon.png"],
  ["/icon-192.png", "image/png", "assets/icon-192.png"],
  ["/icon-512.png", "image/png", "assets/icon-512.png"],
  ["/apple-touch-icon.png", "image/png", "assets/apple-touch-icon.png"],
];
for (const [route, ctype, file] of assetExpect) {
  const got = await reqBytes(route);
  const want = readFileSync(new URL("./" + file, import.meta.url).pathname);
  check(`GET ${route} -> 200 ${ctype} + byte-identical`, got.status === 200 && got.contentType.startsWith(ctype) && got.bytes.equals(want), `status=${got.status} ct=${got.contentType} len=${got.bytes.length}/${want.length}`);
}
{
  const m = await req("/manifest.webmanifest");
  let mJson = null; try { mJson = JSON.parse(m.text); } catch {}
  check("GET /manifest.webmanifest -> 200 manifest+json", m.status === 200 && m.contentType.startsWith("application/manifest+json") && mJson?.name === "Harvest Church" && mJson?.icons?.length === 2);
}
// Slim-only routes do not exist pre-slim: they fall back to the site HTML
// (SPA fallback), never 404.
for (const route of ["/font.woff2", "/harvest-logo-dark.png", "/qr-encoder.js"]) {
  const fb = await req(route);
  check(`GET ${route} -> falls back to site HTML (no such route pre-slim)`, fb.status === 200 && fb.text.includes("You belong here."));
}

console.log("== header logo: never squish (phone screenshot 2026-10-17) ==");
r = await req("/");
check("Header: brand never shrinks on mobile header", r.text.includes(".brand { flex-shrink: 0; }"));
check("Header: brand logo exempt from global img max-width clamp", r.text.includes(".brand-logo { max-width: none; }"));
check("Header: narrow screens use a smaller true-aspect logo height", r.text.includes("@media (max-width: 640px)") && r.text.includes(".brand-logo { height: 30px; }"));
check("Header: narrow screens hide only the 'Members — ' prefix (full label above 640px)", r.text.includes('class="site-auth-members"') && r.text.includes(".site-auth-members { display: none; }"));
check("Header: no fixed width on the logo (aspect can never re-distort)", !r.text.includes(".brand-logo { width:") && !/\.brand-logo\s*\{[^}]*width:\s*\d/.test(r.text));

console.log("== auth required for writes ==");
r = await req("/api/content", "POST", { "hero.headline": "Nope" });
check("POST /api/content without session -> 401", r.status === 401);

console.log("== throwaway setup + login (mock KV only) ==");
r = await req("/api/setup-status");
check("setupRequired true on empty KV", r.json?.setupRequired === true);
r = await req("/api/setup", "POST", { username: "harness", password: "Harness-Test-123!" });
check("POST /api/setup -> 200", r.status === 200, JSON.stringify(r.json));
const setupCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
check("setup sets session cookie", setupCookie.startsWith("session="));
r = await req("/api/login", "POST", { username: "harness", password: "wrong-password-1!" });
check("login with wrong password -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "harness", password: "Harness-Test-123!" });
check("login with throwaway password -> 200", r.status === 200);
const cookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
check("login sets session cookie", cookie.startsWith("session="));
r = await req("/api/session", "GET", undefined, cookie);
check("GET /api/session authenticated", r.status === 200 && r.json?.username === "harness");

console.log("== save scalar -> merged reflects it ==");
r = await req("/api/content", "POST", { "hero.headline": "Harness headline" }, cookie);
check("POST scalar save -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/content");
check("GET /api/content returns stored override", r.json?.["hero.headline"] === "Harness headline");
r = await req("/api/merged");
check("merged hero.headline updated", r.json?.hero?.headline === "Harness headline");
check("merged hero.ctaText still default", r.json?.hero?.ctaText === "Plan Your Visit");

console.log("== save repeater array -> merged reflects it ==");
const newTimes = [
  { icon: "sun", title: "Alpha Service", text: "Sundays · 8:30 AM — harness edit" },
  { icon: "moon", title: "Wednesday Nights", text: "7:00 PM — prayer" },
];
r = await req("/api/content", "POST", { meetingTimes: newTimes }, cookie);
check("POST repeater save -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("merged meetingTimes replaced", JSON.stringify(r.json?.meetingTimes) === JSON.stringify(newTimes));

console.log("== save stringlist -> merged reflects it ==");
r = await req("/api/content", "POST", { "welcome.gatherings": ["Alpha · 8:30 AM", "Omega · 10:30 AM", "Harness option"] }, cookie);
check("POST stringlist save -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("merged welcome.gatherings updated", JSON.stringify(r.json?.welcome?.gatherings) === '["Alpha · 8:30 AM","Omega · 10:30 AM","Harness option"]');

console.log("== null deletes an override (revert to default) ==");
r = await req("/api/content", "POST", { "hero.headline": null }, cookie);
check("POST null delete -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("merged hero.headline back to default", r.json?.hero?.headline === "You belong here.");
r = await req("/api/content");
check("stored override key removed", !("hero.headline" in (r.json || {})));

console.log("== alias: canonical wins over legacy alias ==");
r = await req("/api/content", "POST", { "footer.churchName": "Alias Name" }, cookie);
check("POST alias save -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("merged church.name follows alias", r.json?.church?.name === "Alias Name");
r = await req("/api/content", "POST", { "church.name": "Canonical Name" }, cookie);
check("POST canonical save -> 200", r.status === 200);
r = await req("/api/merged");
check("merged church.name: canonical wins", r.json?.church?.name === "Canonical Name");

console.log("== alias transform: serve.opportunities -> ministries.teams ==");
r = await req("/api/content", "POST", { "serve.opportunities": "Facilities — Caring for the building\nWorship — Leading worship" }, cookie);
check("POST teams-transform alias -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("merged ministries.teams transformed", JSON.stringify(r.json?.ministries?.teams) === JSON.stringify([
  { icon: "heart", title: "Facilities", text: "Caring for the building" },
  { icon: "heart", title: "Worship", text: "Leading worship" },
]));

console.log("== validation rejects bad payloads ==");
r = await req("/api/content", "POST", { "bogus.key": "x" }, cookie);
check("unknown key -> 400", r.status === 400, JSON.stringify(r.json));
r = await req("/api/content", "POST", { "hero.headline": 123 }, cookie);
check("non-string scalar -> 400", r.status === 400);
r = await req("/api/content", "POST", { "hero.headline": "x".repeat(2001) }, cookie);
check("oversized scalar -> 400", r.status === 400);
r = await req("/api/content", "POST", { "hero.image": "http://example.com/x.png" }, cookie);
check("bad image URL scheme -> 400", r.status === 400);
r = await req("/api/content", "POST", { "hero.ctaLink": "javascript:alert(1)" }, cookie);
check("bad url scheme -> 400", r.status === 400);
r = await req("/api/content", "POST", { "meetingTimes": [{ icon: "sun", title: "T", text: "x", bogus: 1 }] }, cookie);
check("repeater unknown sub-field -> 400", r.status === 400, JSON.stringify(r.json));
r = await req("/api/content", "POST", { "meetingTimes": "not-an-array" }, cookie);
check("repeater non-array -> 400", r.status === 400);
r = await req("/api/content", "POST", { "welcome.gatherings": "not-an-array" }, cookie);
check("stringlist non-array -> 400", r.status === 400);
r = await req("/api/content", "POST", { "houseChurches.groups": [{ name: "X", tags: "not-an-array" }] }, cookie);
check("tags non-array -> 400", r.status === 400);
r = await req("/api/content", "POST", { "houseChurches.groups": [{ name: "X", tags: ["families"], img: "ftp://x/y.png" }] }, cookie);
check("repeater bad image scheme -> 400", r.status === 400);
// Oversized body -> 413 (raw request, bypass JSON helper)
{
  const big = new Request("https://test.invalid/api/content", {
    method: "POST",
    headers: { "content-type": "application/json", cookie, "x-csrf-token": csrfByCookie.get(cookie) || "" },
    body: JSON.stringify({ "hero.headline": "x".repeat(200001) }),
  });
  const res = await worker.fetch(big, env);
  check("oversized body -> 413", res.status === 413, `got ${res.status}`);
}

console.log("== reset deletes all overrides ==");
r = await req("/api/reset", "POST", {}, cookie);
check("POST /api/reset -> 200", r.status === 200);
r = await req("/api/content");
check("GET /api/content -> {} after reset", JSON.stringify(r.json) === "{}");
r = await req("/api/merged");
check("merged back to defaults after reset", r.json?.hero?.headline === "You belong here." && r.json?.church?.name === "Harvest Church" && Array.isArray(r.json?.meetingTimes) && r.json.meetingTimes.length === 6);

console.log("== revision history ==");
r = await req("/api/history");
check("GET /api/history without session -> 401", r.status === 401);
r = await req("/api/history", "GET", undefined, cookie);
check("GET /api/history with session -> 200", r.status === 200);
const hist0 = r.json?.history || [];
check("history has 8 entries from earlier writes", hist0.length === 8, `got ${hist0.length}`);
check("history newest-first by savedAt", hist0.every((e, i) => i === 0 || hist0[i - 1].savedAt >= e.savedAt));
check("newest entry is the reset", JSON.stringify(hist0[0]?.changedKeys) === '["__reset__"]');
check("history list items have no snapshot bodies", hist0.every((e) => !("snapshot" in e)));
check("history list items have id/savedAt/changedKeys", hist0.every((e) => typeof e.id === "string" && typeof e.savedAt === "string" && Array.isArray(e.changedKeys)));

// No-op saves create no entry: empty payload + null-delete of an absent key.
r = await req("/api/content", "POST", {}, cookie);
check("POST empty payload -> 200, unchanged", r.status === 200 && r.json?.unchanged === true);
r = await req("/api/content", "POST", { "hero.headline": null }, cookie);
check("POST null-delete of absent key -> 200, unchanged", r.status === 200 && r.json?.unchanged === true);
r = await req("/api/history", "GET", undefined, cookie);
check("no-op saves created no history entry", (r.json?.history || []).length === 8, `got ${(r.json?.history || []).length}`);

// Save A then B; restoring the B-save entry brings back A.
r = await req("/api/content", "POST", { "hero.headline": "Version A" }, cookie);
check("save Version A -> 200", r.status === 200);
r = await req("/api/content", "POST", { "hero.headline": "Version B" }, cookie);
check("save Version B -> 200", r.status === 200);
r = await req("/api/history", "GET", undefined, cookie);
check("two saves -> 10 entries", (r.json?.history || []).length === 10, `got ${(r.json?.history || []).length}`);
const entryB = (r.json?.history || [])[0];
check("newest entry touched hero.headline", (entryB?.changedKeys || []).includes("hero.headline"));
r = await req("/api/restore", "POST", { id: entryB.id }, cookie);
check("restore B-save entry -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/content");
check("content back to Version A after restore", r.json?.["hero.headline"] === "Version A");
r = await req("/api/history", "GET", undefined, cookie);
check("restore created its own __restore__ entry", (r.json?.history || []).length === 11 && JSON.stringify((r.json.history || [])[0]?.changedKeys) === '["__restore__"]');
// Restoring the same entry again is a no-op (already at its snapshot).
r = await req("/api/restore", "POST", { id: entryB.id }, cookie);
check("restore same entry again -> 200, unchanged", r.status === 200 && r.json?.unchanged === true);
r = await req("/api/history", "GET", undefined, cookie);
check("no-op restore created no entry", (r.json?.history || []).length === 11, `got ${(r.json?.history || []).length}`);
// Restore errors.
r = await req("/api/restore", "POST", { id: "9999999999999-deadbeef" });
check("restore without session -> 401", r.status === 401);
r = await req("/api/restore", "POST", { id: "9999999999999-deadbeef" }, cookie);
check("restore unknown id -> 404", r.status === 404);
r = await req("/api/restore", "POST", { id: "../../admin-pass" }, cookie);
check("restore malformed id -> 404", r.status === 404);
r = await req("/api/restore", "POST", {}, cookie);
check("restore missing id -> 404", r.status === 404);

// Retention: 35 more saves prune history to 30.
for (let i = 0; i < 35; i++) {
  await req("/api/content", "POST", { "hero.headline": "v" + i }, cookie);
}
r = await req("/api/history", "GET", undefined, cookie);
check("history pruned to 30 entries", (r.json?.history || []).length === 30, `got ${(r.json?.history || []).length}`);
check("oldest entries pruned (no __reset__ entry left)", !(r.json?.history || []).some((e) => (e.changedKeys || []).includes("__reset__")));

// Reset snapshots first, then a second reset on empty state is a no-op.
r = await req("/api/reset", "POST", {}, cookie);
check("reset with content -> 200", r.status === 200);
r = await req("/api/content");
check("content {} after reset", JSON.stringify(r.json) === "{}");
r = await req("/api/history", "GET", undefined, cookie);
const countAfterReset = (r.json?.history || []).length;
check("reset created a __reset__ entry", (r.json?.history || [])[0]?.changedKeys?.includes("__reset__"));
r = await req("/api/reset", "POST", {}, cookie);
check("second reset on empty state -> 200", r.status === 200);
r = await req("/api/history", "GET", undefined, cookie);
check("reset on empty state created no entry", (r.json?.history || []).length === countAfterReset, `got ${(r.json?.history || []).length}`);

console.log("== users ==");
r = await req("/api/me");
check("GET /api/me without session -> 401", r.status === 401);
r = await req("/api/me", "GET", undefined, cookie);
check("GET /api/me with session -> owner username + administrator role", r.status === 200 && r.json?.username === "harness" && r.json?.role === "administrator");
r = await req("/api/users");
check("GET /api/users without session -> 401", r.status === 401);
r = await req("/api/users", "GET", undefined, cookie);
check("GET /api/users -> 200", r.status === 200);
check("users list has owner only (administrator + isOwner)", (r.json?.users || []).length === 1 && r.json.users[0].username === "harness" && r.json.users[0].role === "administrator" && r.json.users[0].isOwner === true);
check("users list exposes no salts/hashes", !JSON.stringify(r.json).includes("salt") && !JSON.stringify(r.json).includes("hash"));
r = await req("/api/users", "POST", { username: "helper1", password: "Helper-Pass-123!" });
check("POST /api/users without session -> 401", r.status === 401);
r = await req("/api/users", "POST", { username: "helper1", password: "Helper-Pass-123!" }, cookie);
check("create helper1 -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/users", "POST", { username: "helper1", password: "Helper-Pass-123!" }, cookie);
check("duplicate username -> 400", r.status === 400);
r = await req("/api/users", "POST", { username: "HELPER1", password: "Helper-Pass-123!" }, cookie);
check("duplicate case-variant -> 400", r.status === 400);
r = await req("/api/users", "POST", { username: "HARNESS", password: "Helper-Pass-123!" }, cookie);
check("duplicate owner name -> 400", r.status === 400);
r = await req("/api/users", "POST", { username: "helper2", password: "weak" }, cookie);
check("weak password -> 400", r.status === 400);
r = await req("/api/users", "POST", { username: "x", password: "Helper-Pass-123!" }, cookie);
check("invalid username -> 400", r.status === 400);
r = await req("/api/login", "POST", { username: "helper1", password: "Helper-Pass-123!" });
check("login as helper1 -> 200", r.status === 200, JSON.stringify(r.json));
const helperCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
check("helper login sets session cookie", helperCookie.startsWith("session="));
r = await req("/api/login", "POST", { username: "helper1", password: "Wrong-Pass-123!" });
check("helper login wrong password -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "HELPER1", password: "Helper-Pass-123!" });
check("helper login is case-insensitive, returns canonical username", r.status === 200 && r.json?.username === "helper1");
r = await req("/api/users", "GET", undefined, helperCookie);
check("users list as helper1 (Editor) -> 403", r.status === 403);
r = await req("/api/content", "POST", { "hero.headline": "Helper edit" }, helperCookie);
check("helper (Editor) can save content", r.status === 200);
r = await req("/api/content", "POST", { "hero.headline": null }, cookie);
check("owner reverts helper edit", r.status === 200);
// Change password.
r = await req("/api/users/password", "POST", { username: "helper1", newPassword: "Helper-New-123!" });
check("password change without session -> 401", r.status === 401);
r = await req("/api/users/password", "POST", { username: "helper1", newPassword: "Helper-New-123!" }, cookie);
check("change helper1 password -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "helper1", password: "Helper-Pass-123!" });
check("old helper1 password -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "helper1", password: "Helper-New-123!" });
check("new helper1 password -> 200", r.status === 200);
r = await req("/api/users/password", "POST", { username: "harness", newPassword: "Owner-New-123!" }, cookie);
check("change owner password -> 400", r.status === 400);
r = await req("/api/users/password", "POST", { username: "ghost", newPassword: "Ghost-Pass-123!" }, cookie);
check("change unknown user password -> 404", r.status === 404);
r = await req("/api/users/password", "POST", { username: "helper1", newPassword: "weak" }, cookie);
check("change to weak password -> 400", r.status === 400);
r = await req("/api/login", "POST", { username: "harness", password: "Harness-Test-123!" });
check("owner login still works after rejected owner pw change", r.status === 200);
// Delete.
r = await req("/api/users", "POST", { username: "helper2", password: "Helper2-Pass-123!" }, cookie);
check("create helper2 -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "helper2", password: "Helper2-Pass-123!" });
const helper2Cookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/users/delete", "POST", { username: "helper2" }, helper2Cookie);
check("delete as Editor -> 403", r.status === 403);
r = await req("/api/users/delete", "POST", { username: "helper1" });
check("delete without session -> 401", r.status === 401);
r = await req("/api/users/delete", "POST", { username: "harness" }, cookie);
check("delete owner -> 400", r.status === 400);
r = await req("/api/users/delete", "POST", { username: "ghost" }, cookie);
check("delete unknown user -> 404", r.status === 404);
r = await req("/api/users/delete", "POST", {}, cookie);
check("delete missing username -> 400", r.status === 400);
r = await req("/api/users/delete", "POST", { username: "helper2" }, cookie);
check("owner deletes helper2 -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "helper2", password: "Helper2-Pass-123!" });
check("deleted user cannot log in -> 401", r.status === 401);
r = await req("/api/users", "GET", undefined, helper2Cookie);
check("deleted user's old session -> 401", r.status === 401);
r = await req("/api/users", "GET", undefined, cookie);
check("users list back to owner + helper1", (r.json?.users || []).length === 2);

console.log("== email-style usernames ==");
r = await req("/api/users", "POST", { username: "member@example.com", password: "Mich-Pass-123!" }, cookie);
check("create email-style username -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/users", "POST", { username: "member@example.com", password: "Mich-Pass-123!" }, cookie);
check("duplicate email case-variant -> 400", r.status === 400);
r = await req("/api/login", "POST", { username: "member@example.com", password: "Mich-Pass-123!" });
check("login as email-style username -> 200", r.status === 200);
r = await req("/api/users", "POST", { username: "bad name", password: "Mich-Pass-123!" }, cookie);
check("username with space -> 400", r.status === 400);
r = await req("/api/users/delete", "POST", { username: "member@example.com" }, cookie);
check("owner deletes email user -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "member@example.com", password: "Mich-Pass-123!" });
check("deleted email user cannot log in -> 401", r.status === 401);

console.log("== roles ==");
// Legacy entry: an admin-users record with NO role field must default to Administrator.
{
  const salt = "legacy-salt-123456";
  const hash = createHash("sha256").update(salt + ":" + "Legacy-Pass-123!").digest("hex");
  const users = JSON.parse(store.get("admin-users") || "{}");
  users.legacy1 = { salt, hash, createdAt: new Date().toISOString() };
  store.set("admin-users", JSON.stringify(users));
}
r = await req("/api/login", "POST", { username: "legacy1", password: "Legacy-Pass-123!" });
check("legacy user (no role field) can log in", r.status === 200);
const legacyCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/me", "GET", undefined, legacyCookie);
check("legacy user defaults to administrator role", r.status === 200 && r.json?.role === "administrator");
r = await req("/api/users", "GET", undefined, legacyCookie);
check("legacy administrator can list users", r.status === 200);
// Create users with explicit roles + one with no role (defaults to editor).
r = await req("/api/users", "POST", { username: "viewer1", password: "Viewer-Pass-123!", role: "viewer" }, cookie);
check("create viewer1 with legacy viewer role -> 200 mapped to subscriber", r.status === 200 && r.json?.role === "subscriber");
r = await req("/api/users", "POST", { username: "editor1", password: "Editor-Pass-123!", role: "editor" }, cookie);
check("create editor1 -> 200", r.status === 200 && r.json?.role === "editor");
r = await req("/api/users", "POST", { username: "admin1", password: "Admin-Pass-123!", role: "administrator" }, cookie);
check("create admin1 -> 200", r.status === 200 && r.json?.role === "administrator");
r = await req("/api/users", "POST", { username: "defrole", password: "Defrole-Pass-123!" }, cookie);
check("create without role -> 200", r.status === 200);
r = await req("/api/users", "GET", undefined, cookie);
check("default role for new user is editor", (r.json?.users || []).find((u) => u.username === "defrole")?.role === "editor");
r = await req("/api/users", "POST", { username: "badrole", password: "Badrole-Pass-123!", role: "superuser" }, cookie);
check("create with invalid role -> 400", r.status === 400);
r = await req("/api/login", "POST", { username: "viewer1", password: "Viewer-Pass-123!" });
const viewerCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Pass-123!" });
let editorCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/login", "POST", { username: "admin1", password: "Admin-Pass-123!" });
const adminCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/me", "GET", undefined, viewerCookie);
check("GET /api/me as viewer -> role subscriber (WP mapping)", r.status === 200 && r.json?.role === "subscriber");
r = await req("/api/me", "GET", undefined, editorCookie);
check("GET /api/me as editor -> role editor", r.status === 200 && r.json?.role === "editor");
// Viewer: reads OK, all writes + user management forbidden.
r = await req("/api/merged", "GET", undefined, viewerCookie);
check("viewer can read merged", r.status === 200);
r = await req("/api/history", "GET", undefined, viewerCookie);
check("viewer can read history", r.status === 200);
r = await req("/api/content", "POST", { "hero.headline": "Viewer edit" }, viewerCookie);
check("viewer save -> 403", r.status === 403);
r = await req("/api/reset", "POST", {}, viewerCookie);
check("viewer reset -> 403", r.status === 403);
r = await req("/api/restore", "POST", { id: "bogus" }, viewerCookie);
check("viewer restore -> 403", r.status === 403);
r = await req("/api/users", "GET", undefined, viewerCookie);
check("viewer list users -> 403", r.status === 403);
r = await req("/api/users", "POST", { username: "vx", password: "Vx-Pass-12345!" }, viewerCookie);
check("viewer create user -> 403", r.status === 403);
r = await req("/api/users/password", "POST", { username: "editor1", newPassword: "Editor-X-123!" }, viewerCookie);
check("viewer change other's password -> 403", r.status === 403);
r = await req("/api/users/delete", "POST", { username: "editor1" }, viewerCookie);
check("viewer delete user -> 403", r.status === 403);
r = await req("/api/users/role", "POST", { username: "editor1", role: "viewer" }, viewerCookie);
check("viewer change role -> 403", r.status === 403);
// Editor: can write content + restore, but no user management.
r = await req("/api/content", "POST", { "hero.headline": "Editor edit" }, editorCookie);
check("editor can save content", r.status === 200);
r = await req("/api/users", "GET", undefined, editorCookie);
check("editor list users -> 403", r.status === 403);
r = await req("/api/users", "POST", { username: "ex", password: "Ex-Pass-12345!" }, editorCookie);
check("editor create user -> 403", r.status === 403);
r = await req("/api/users/role", "POST", { username: "viewer1", role: "editor" }, editorCookie);
check("editor change role -> 403", r.status === 403);
r = await req("/api/users/delete", "POST", { username: "viewer1" }, editorCookie);
check("editor delete user -> 403", r.status === 403);
r = await req("/api/history", "GET", undefined, editorCookie);
check("editor can read history", r.status === 200);
{
  const entry = (r.json?.history || [])[0];
  check("history has an entry from editor save", !!entry);
  r = await req("/api/restore", "POST", { id: entry.id }, editorCookie);
  check("editor can restore", r.status === 200);
}
// Role changes: demote editor1 -> viewer, verify loss of write access, restore.
// Hardening (2026-10-20): a role change signs the account out everywhere,
// so the demoted user's old session is dead (401), and a fresh sign-in as
// a viewer gets the role-based 403 on save.
r = await req("/api/users/role", "POST", { username: "editor1", role: "viewer" }, cookie);
check("owner demotes editor1 to viewer -> 200", r.status === 200);
r = await req("/api/content", "POST", { "hero.headline": "Demoted edit" }, editorCookie);
check("demoted user's old session revoked -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Pass-123!" });
check("demoted editor re-login -> 200", r.status === 200);
editorCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/content", "POST", { "hero.headline": "Demoted edit" }, editorCookie);
check("demoted user save -> 403", r.status === 403);
r = await req("/api/users/role", "POST", { username: "editor1", role: "editor" }, cookie);
check("owner restores editor1 to editor -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Pass-123!" });
editorCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/content", "POST", { "hero.headline": "Reinstated edit" }, editorCookie);
check("reinstated editor can save again", r.status === 200);
// Role-change guards.
r = await req("/api/users/role", "POST", { username: "harness", role: "viewer" });
check("role change without session -> 401", r.status === 401);
r = await req("/api/users/role", "POST", { username: "harness", role: "editor" }, cookie);
check("cannot change owner role -> 400", r.status === 400);
r = await req("/api/users/role", "POST", { username: "harness", role: "editor" }, adminCookie);
check("additional admin cannot change owner role -> 400", r.status === 400);
r = await req("/api/users/role", "POST", { username: "admin1", role: "editor" }, adminCookie);
check("cannot change own role -> 400", r.status === 400);
r = await req("/api/users/role", "POST", { username: "ghost", role: "editor" }, cookie);
check("role change unknown user -> 404", r.status === 404);
r = await req("/api/users/role", "POST", { username: "editor1", role: "superuser" }, cookie);
check("role change invalid role -> 400", r.status === 400);
r = await req("/api/users/role", "POST", { username: "editor1" }, cookie);
check("role change missing role -> 400", r.status === 400);
// Additional administrator can manage users (but not the owner).
r = await req("/api/users", "POST", { username: "adminmade", password: "Adminmade-123!", role: "viewer" }, adminCookie);
check("additional admin can create user -> 200", r.status === 200);
r = await req("/api/users/password", "POST", { username: "editor1", newPassword: "Editor-ByAdmin-1!" }, adminCookie);
check("additional admin can change another user's password -> 200", r.status === 200);
// Hardening (2026-10-20): an admin password reset signs the account out
// everywhere, so the editor's pre-reset session must be dead now.
r = await req("/api/me", "GET", undefined, editorCookie);
check("admin password reset kills target's old session -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-ByAdmin-1!" });
check("editor re-login with admin-set password -> 200", r.status === 200);
editorCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/users/password", "POST", { username: "harness", newPassword: "Owner-ByAdmin-1!" }, adminCookie);
check("additional admin cannot change owner password -> 400", r.status === 400);
r = await req("/api/users/delete", "POST", { username: "adminmade" }, adminCookie);
check("additional admin can delete user -> 200", r.status === 200);
// Own-password change: any role, current password required.
r = await req("/api/users/me/password", "POST", { currentPassword: "Wrong-Pass-123!", newPassword: "Editor-Own-123!" }, editorCookie);
check("own password change wrong current -> 401", r.status === 401);
r = await req("/api/users/me/password", "POST", { currentPassword: "Editor-ByAdmin-1!", newPassword: "weak" }, editorCookie);
check("own password change weak new -> 400", r.status === 400);
r = await req("/api/users/me/password", "POST", { newPassword: "Editor-Own-123!" }, editorCookie);
check("own password change missing current -> 400", r.status === 400);
r = await req("/api/users/me/password", "POST", { currentPassword: "Editor-ByAdmin-1!", newPassword: "Editor-Own-123!" }, editorCookie);
check("editor changes own password -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-ByAdmin-1!" });
check("editor old password after own change -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Own-123!" });
check("editor new password after own change -> 200", r.status === 200);
r = await req("/api/users/me/password", "POST", { currentPassword: "Viewer-Pass-123!", newPassword: "Viewer-Own-123!" }, viewerCookie);
check("viewer changes own password -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "viewer1", password: "Viewer-Own-123!" });
check("viewer new password works", r.status === 200);
r = await req("/api/users/me/password", "POST", { currentPassword: "x", newPassword: "y" });
check("own password change without session -> 401", r.status === 401);
// Owner changes their own password, then changes it back (keeps later tests stable).
r = await req("/api/users/me/password", "POST", { currentPassword: "Harness-Test-123!", newPassword: "Harness-Own-123!" }, cookie);
check("owner changes own password -> 200", r.status === 200);
r = await req("/api/login", "POST", { username: "harness", password: "Harness-Test-123!" });
check("owner old password after own change -> 401", r.status === 401);
r = await req("/api/login", "POST", { username: "harness", password: "Harness-Own-123!" });
check("owner new password after own change -> 200", r.status === 200);
r = await req("/api/users/me/password", "POST", { currentPassword: "Harness-Own-123!", newPassword: "Harness-Test-123!" }, cookie);
check("owner password restored to original", r.status === 200);
r = await req("/api/login", "POST", { username: "harness", password: "Harness-Test-123!" });
check("owner original password works again", r.status === 200);

console.log("== logout kills session ==");
r = await req("/api/logout", "POST", {}, cookie);
check("POST /api/logout -> 200", r.status === 200);
r = await req("/api/content", "POST", { "hero.headline": "After logout" }, cookie);
check("POST after logout -> 401", r.status === 401);


console.log("== WP: lazy migration from old keys (fresh store) ==");
{
  const store2 = new Map();
  const env2 = {
    CMS_KV: {
      async get(k, type) {
        if (!store2.has(k)) return null;
        const v = store2.get(k);
        if (type === "arrayBuffer") {
          if (typeof v === "string") return new TextEncoder().encode(v).buffer;
          if (Buffer.isBuffer(v)) return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength);
          return v;
        }
        return typeof v === "string" ? v : v.toString("utf-8");
      },
      async put(k, v) { store2.set(k, v); },
      async delete(k) { store2.delete(k); },
      async list(opts = {}) {
        const prefix = opts.prefix || "";
        const names = [...store2.keys()].filter((k) => k.startsWith(prefix)).sort();
        return { keys: names.map((name) => ({ name })), list_complete: true, cursor: null };
      },
    },
  };
  async function req2(path, method = "GET", body = undefined, cookie = "", extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (cookie) headers["cookie"] = cookie;
    if (method === "POST" && cookie && csrfByCookie.has(cookie) && !("x-csrf-token" in headers)) {
      headers["x-csrf-token"] = csrfByCookie.get(cookie);
    }
    const r2 = new Request("https://test.invalid" + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const res = await worker.fetch(r2, env2);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    const setCookie = res.headers.get("set-cookie") || "";
    csrfRemember(csrfPairFrom(setCookie, cookie), json);
    return { status: res.status, text, json, setCookie };
  }
  const sha = (salt, pw) => createHash("sha256").update(salt + ":" + pw).digest("hex");
  const oldSiteContent = JSON.stringify({
    "hero.headline": "Migrated Headline",
    "church.name": "Migrated Church",
    meetingTimes: [{ icon: "sun", title: "M1", text: "T1" }],
    "news.items": [
      { icon: "star", title: "Migrated News 1", text: "First news" },
      { icon: "heart", title: "Migrated News 2", text: "Second news" },
    ],
  });
  const oldHist1 = JSON.stringify({ id: "1000000000000-aaaa0001", savedAt: "2026-10-01T00:00:00.000Z", changedKeys: ["hero.headline"], snapshot: { "hero.headline": "Old A" } });
  const oldHist2 = JSON.stringify({ id: "1000000001000-bbbb0002", savedAt: "2026-10-02T00:00:00.000Z", changedKeys: ["__reset__"], snapshot: {} });
  const oldPass = JSON.stringify({ username: "siteowner", salt: "owner-salt-0001", hash: sha("owner-salt-0001", "Owner-Pass-123!") });
  const oldUsers = JSON.stringify({
    viewerUser: { salt: "v-salt-0001", hash: sha("v-salt-0001", "Viewer-Pass-123!"), createdAt: "2026-10-01T00:00:00.000Z", role: "viewer" },
    legacyUser: { salt: "l-salt-0001", hash: sha("l-salt-0001", "Legacy-Pass-123!"), createdAt: "2026-10-01T00:00:00.000Z" },
    editorUser: { salt: "e-salt-0001", hash: sha("e-salt-0001", "Editor-Pass-123!"), createdAt: "2026-10-01T00:00:00.000Z", role: "editor" },
  });
  store2.set("site-content", oldSiteContent);
  store2.set("history:1000000000000-aaaa0001", oldHist1);
  store2.set("history:1000000001000-bbbb0002", oldHist2);
  store2.set("admin-pass", oldPass);
  store2.set("admin-users", oldUsers);
  store2.set("setup-done", "1");
  const oldSnapshot = new Map(store2);

  r = await req2("/api/merged");
  check("migration: merged hero.headline from old site-content", r.status === 200 && r.json?.hero?.headline === "Migrated Headline");
  check("migration: merged church.name from old site-content", r.json?.church?.name === "Migrated Church");
  check("migration: merged meetingTimes from old site-content", JSON.stringify(r.json?.meetingTimes) === JSON.stringify([{ icon: "sun", title: "M1", text: "T1" }]));
  // News is members-only: logged-out merged must NOT include the items;
  // a privileged (admin-session) merged must.
  check("migration: logged-out merged excludes news.items (members-only)", Array.isArray(r.json?.news?.items) && r.json.news.items.length === 0);
  r = await req2("/api/login", "POST", { username: "siteowner", password: "Owner-Pass-123!" });
  const migOwnerEarly = (r.setCookie.match(/session=[^;]+/) || [""])[0];
  r = await req2("/api/merged", "GET", undefined, migOwnerEarly);
  check("migration: news items -> posts, order preserved (first original = first)", Array.isArray(r.json?.news?.items) && r.json.news.items.length === 2 && r.json.news.items[0].title === "Migrated News 1" && r.json.news.items[1].title === "Migrated News 2");
  check("migration: news icons preserved in postmeta", r.json?.news?.items?.[0]?.icon === "star" && r.json?.news?.items?.[1]?.icon === "heart");
  // Visibility defaults applied once: the two canonical posts + their blocks are members.
  check("migration: visibility defaults flag set", store2.get("wp_visibility_defaults") === "1");
  check("migration: page-house-churches + page-news _visibility=members", (() => { try { const m = JSON.parse(store2.get("wp_postmeta") || "{}"); return m["page-house-churches"]?._visibility === "members" && m["page-news"]?._visibility === "members"; } catch { return false; } })());
  check("migration: blocks inside members pages are members", (() => { try { const p = JSON.parse(store2.get("wp_posts") || "{}"); const blocks = [...(p["page-house-churches"]?.post_content || []), ...(p["page-news"]?.post_content || [])]; return blocks.length > 0 && blocks.every((b) => b.visibility === "members"); } catch { return false; } })());
  check("migration: wp_migrated=1", store2.get("wp_migrated") === "1");
  check("migration: wp_posts exists with pages + news posts", (() => { try { const p = JSON.parse(store2.get("wp_posts") || "{}"); return !!p["page-home"] && !!p["post-news-0"] && !!p["post-news-1"] && p["page-home"].post_type === "page" && p["post-news-0"].terms.categories.includes("News"); } catch { return false; } })());
  check("migration: Site Settings -> wp_options", (() => { try { const o = JSON.parse(store2.get("wp_options") || "{}"); return o["church.name"] === "Migrated Church" && o.timezone_string === "America/New_York"; } catch { return false; } })());
  check("migration: news.items stripped from News page blocks", (() => { try { const p = JSON.parse(store2.get("wp_posts") || "{}"); const blocks = p["page-news"]?.post_content || []; return !JSON.stringify(blocks).includes("news.items"); } catch { return false; } })());
  // Old keys byte-untouched.
  let untouched = true;
  for (const [k, v] of oldSnapshot) { if (store2.get(k) !== v) untouched = false; }
  check("migration: old keys byte-untouched", untouched);
  // Idempotent: second request leaves wp_posts identical.
  const wpBefore = store2.get("wp_posts");
  r = await req2("/api/merged");
  check("migration idempotent: second request same merged", r.json?.hero?.headline === "Migrated Headline");
  check("migration idempotent: wp_posts byte-identical after 2nd request", store2.get("wp_posts") === wpBefore);
  check("migration: old keys still untouched after 2nd request", [...oldSnapshot].every(([k, v]) => store2.get(k) === v));
  // History -> revisions.
  r = await req2("/api/history", "GET", undefined, "");
  check("migration: history without session -> 401", r.status === 401);
  r = await req2("/api/login", "POST", { username: "siteowner", password: "Owner-Pass-123!" });
  check("migration: owner login with same password works", r.status === 200, JSON.stringify(r.json));
  const migOwner = (r.setCookie.match(/session=[^;]+/) || [""])[0];
  r = await req2("/api/history", "GET", undefined, migOwner);
  check("migration: history has 2 migrated revisions", (r.json?.history || []).length === 2, `got ${(r.json?.history || []).length}`);
  check("migration: revision ids keep history: prefix, newest first", (r.json?.history || [])[0]?.id === "history:1000000001000-bbbb0002" && (r.json?.history || [])[1]?.id === "history:1000000000000-aaaa0001");
  check("migration: revision changedKeys preserved", JSON.stringify((r.json?.history || [])[1]?.changedKeys) === '["hero.headline"]');
  r = await req2("/api/login", "POST", { username: "viewerUser", password: "Viewer-Pass-123!" });
  check("migration: viewer user login works", r.status === 200);
  const migViewer = (r.setCookie.match(/session=[^;]+/) || [""])[0];
  r = await req2("/api/me", "GET", undefined, migViewer);
  check("migration: viewer -> subscriber role", r.status === 200 && r.json?.role === "subscriber");
  r = await req2("/api/login", "POST", { username: "legacyUser", password: "Legacy-Pass-123!" });
  check("migration: legacy no-role user login works", r.status === 200);
  const migLegacy = (r.setCookie.match(/session=[^;]+/) || [""])[0];
  r = await req2("/api/me", "GET", undefined, migLegacy);
  check("migration: legacy no-role -> administrator", r.status === 200 && r.json?.role === "administrator");
  r = await req2("/api/login", "POST", { username: "editorUser", password: "Editor-Pass-123!" });
  check("migration: editor user login works", r.status === 200);
  r = await req2("/api/users", "GET", undefined, migOwner);
  check("migration: users list shows 4 users with mapped roles", (r.json?.users || []).length === 4 && (r.json.users || []).find((u) => u.username === "viewerUser")?.role === "subscriber" && (r.json.users || []).find((u) => u.username === "legacyUser")?.role === "administrator");
  // Restore a migrated revision (legacy snapshot) + undo.
  r = await req2("/api/restore", "POST", { id: "history:1000000000000-aaaa0001" }, migOwner);
  check("migration: restore legacy revision -> 200", r.status === 200, JSON.stringify(r.json));
  r = await req2("/api/merged");
  check("migration: restored snapshot sets hero.headline to Old A", r.json?.hero?.headline === "Old A");
  check("migration: restored snapshot reverts church.name to default", r.json?.church?.name === "Harvest Church");
  r = await req2("/api/history", "GET", undefined, migOwner);
  check("migration: restore created __restore__ undo entry", (r.json?.history || [])[0]?.changedKeys?.includes("__restore__"));
  const undoId = (r.json?.history || [])[0]?.id;
  r = await req2("/api/restore", "POST", { id: undoId }, migOwner);
  check("migration: undo restore -> 200", r.status === 200);
  r = await req2("/api/merged");
  check("migration: undo brings back Migrated Headline", r.json?.hero?.headline === "Migrated Headline");
  // Reset on migrated store: seeds defaults, does NOT re-migrate.
  r = await req2("/api/reset", "POST", {}, migOwner);
  check("migration store: reset -> 200", r.status === 200);
  check("migration store: wp_migrated=reset", store2.get("wp_migrated") === "reset");
  r = await req2("/api/merged");
  check("migration store: after reset merged is defaults (no re-migration)", r.json?.hero?.headline === "You belong here." && r.json?.church?.name === "Harvest Church");
  check("migration store: wp_migrated stays reset after seed", store2.get("wp_migrated") === "reset");
  check("migration store: old site-content still untouched after reset", store2.get("site-content") === oldSiteContent);
  r = await req2("/api/content");
  check("migration store: content {} after reset", JSON.stringify(r.json) === "{}");
  check("migration store: re-seeded pages keep members visibility after reset", (() => { try { const m = JSON.parse(store2.get("wp_postmeta") || "{}"); return m["page-house-churches"]?._visibility === "members" && m["page-news"]?._visibility === "members"; } catch { return false; } })());
}

console.log("== WP: 5-role capability matrix ==");
// Re-login as owner (main store owner cookie was logged out above).
r = await req("/api/login", "POST", { username: "harness", password: "Harness-Test-123!" });
check("WP: owner re-login -> 200", r.status === 200);
const wpOwner = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/users", "POST", { username: "author1", password: "Author-Pass-123!", role: "author" }, wpOwner);
check("WP: create author1 -> 200", r.status === 200 && r.json?.role === "author");
r = await req("/api/users", "POST", { username: "contrib1", password: "Contrib-Pass-123!", role: "contributor" }, wpOwner);
check("WP: create contrib1 -> 200", r.status === 200 && r.json?.role === "contributor");
r = await req("/api/users", "POST", { username: "sub1", password: "Sub-Pass-123456!", role: "subscriber" }, wpOwner);
check("WP: create sub1 -> 200", r.status === 200 && r.json?.role === "subscriber");
r = await req("/api/users", "POST", { username: "badrole2", password: "Badrole-Pass-123!", role: "superuser" }, wpOwner);
check("WP: create with invalid role -> 400", r.status === 400);
r = await req("/api/login", "POST", { username: "author1", password: "Author-Pass-123!" });
const wpAuthor = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/login", "POST", { username: "contrib1", password: "Contrib-Pass-123!" });
const wpContrib = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/login", "POST", { username: "sub1", password: "Sub-Pass-123456!" });
const wpSub = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Own-123!" });
const wpEditor = (r.setCookie.match(/session=[^;]+/) || [""])[0];
const roleCookies = { administrator: wpOwner, editor: wpEditor, author: wpAuthor, contributor: wpContrib, subscriber: wpSub };
for (const [role, ck] of Object.entries(roleCookies)) {
  r = await req("/api/wp/me", "GET", undefined, ck);
  check(`WP: /api/wp/me as ${role} -> role ${role}`, r.status === 200 && r.json?.role === role);
  r = await req("/api/wp/dashboard", "GET", undefined, ck);
  check(`WP: dashboard read as ${role} -> 200`, r.status === 200 && r.json?.counts && Array.isArray(r.json?.activity));
  r = await req("/api/wp/pages", "GET", undefined, ck);
  check(`WP: pages list read as ${role} -> 200`, r.status === 200 && Array.isArray(r.json?.posts));
  r = await req("/api/history", "GET", undefined, ck);
  check(`WP: history read as ${role} -> 200`, r.status === 200);
  r = await req("/api/wp/options", "GET", undefined, ck);
  check(`WP: options GET as ${role} -> ${role === "administrator" ? 200 : 403}`, role === "administrator" ? r.status === 200 : r.status === 403);
  r = await req("/api/wp/options", "POST", { options: {} }, ck);
  check(`WP: options POST as ${role} -> ${role === "administrator" ? 200 : 403}`, role === "administrator" ? r.status === 200 : r.status === 403);
  r = await req("/api/wp/revisions/does-not-exist/restore", "POST", {}, ck);
  check(`WP: revision restore bogus id as ${role} -> ${["administrator", "editor"].includes(role) ? 404 : 403}`, ["administrator", "editor"].includes(role) ? r.status === 404 : r.status === 403);
  r = await req("/api/restore", "POST", { id: "does-not-exist" }, ck);
  check(`WP: old restore bogus id as ${role} -> ${["administrator", "editor", "author"].includes(role) ? 404 : 403}`, ["administrator", "editor", "author"].includes(role) ? r.status === 404 : r.status === 403);
  r = await req("/api/content", "POST", {}, ck);
  check(`WP: old content save as ${role} -> ${["administrator", "editor", "author"].includes(role) ? 200 : 403}`, ["administrator", "editor", "author"].includes(role) ? r.status === 200 : r.status === 403);
  if (role === "administrator") {
    check("WP: reset as administrator -> skipped (destructive, tested later)", true);
  } else {
    r = await req("/api/reset", "POST", {}, ck);
    check(`WP: reset as ${role} -> 403`, r.status === 403);
  }
  // Media upload gating (successes create attachments; cleaned up below).
  r = await req("/api/wp/media", "POST", { url: "https://example.com/matrix-" + role + ".png", title: "Matrix " + role }, ck);
  if (["administrator", "editor", "author"].includes(role)) check(`WP: media upload as ${role} -> 200`, r.status === 200 && typeof r.json?.id === "string");
  else check(`WP: media upload as ${role} -> 403`, r.status === 403);
  // Quick-draft gating (successes create drafts; cleaned up below).
  r = await req("/api/wp/quick-draft", "POST", { title: "Matrix " + role, content: "x" }, ck);
  if (role === "subscriber") check(`WP: quick-draft as ${role} -> 403`, r.status === 403);
  else check(`WP: quick-draft as ${role} -> 200`, r.status === 200 && typeof r.json?.id === "string");
}
// Clean up matrix media + quick-drafts (as admin).
{
  r = await req("/api/wp/media", "GET", undefined, wpOwner);
  for (const a of (r.json?.attachments || [])) {
    if (String(a.post_title || "").startsWith("Matrix ")) await req("/api/wp/media/" + a.id + "/delete", "POST", {}, wpOwner);
  }
  r = await req("/api/wp/posts?status=draft", "GET", undefined, wpOwner);
  for (const p of (r.json?.posts || [])) {
    if (String(p.post_title || "").startsWith("Matrix ")) await req("/api/wp/posts/" + p.id + "/delete", "POST", {}, wpOwner);
  }
}
check("WP: matrix cleanup removed test attachments/drafts", true);

console.log("== WP: contributor draft-only ==");
r = await req("/api/wp/pages", "POST", { post_title: "Contrib Publish Try", post_content: [], post_status: "publish" }, wpContrib);
check("WP: contributor publish page -> 403", r.status === 403);
r = await req("/api/wp/pages", "POST", { post_title: "Contrib Draft", post_content: [], post_status: "draft" }, wpContrib);
check("WP: contributor create draft page -> 200", r.status === 200 && typeof r.json?.id === "string");
const contribDraftId = r.json?.id;
r = await req("/api/wp/pages/" + contribDraftId, "POST", { post_title: "Contrib Draft v2" }, wpContrib);
check("WP: contributor update own draft -> 200", r.status === 200);
r = await req("/api/wp/pages/" + contribDraftId, "POST", { post_status: "publish" }, wpContrib);
check("WP: contributor publish own draft -> 403", r.status === 403);
r = await req("/api/wp/pages/" + contribDraftId, "POST", { post_status: "trash" }, wpContrib);
check("WP: contributor trash -> 403", r.status === 403);
r = await req("/api/wp/pages/" + contribDraftId + "/trash", "POST", {}, wpContrib);
check("WP: contributor trash endpoint -> 403", r.status === 403);
r = await req("/api/wp/pages/" + contribDraftId + "/delete", "POST", {}, wpOwner);
check("WP: admin deletes contrib draft -> 200", r.status === 200);
// Contributor cannot touch a published post.
r = await req("/api/wp/pages", "POST", { post_title: "Published For Contrib", post_content: [], post_status: "publish" }, wpOwner);
check("WP: admin creates published page for contrib test", r.status === 200);
const pubForContrib = r.json?.id;
r = await req("/api/wp/pages/" + pubForContrib, "POST", { post_title: "Contrib Edit Published" }, wpContrib);
check("WP: contributor update published page -> 403", r.status === 403);
r = await req("/api/wp/pages/" + pubForContrib, "POST", { post_title: "Contrib Autosave", autosave: true }, wpContrib);
check("WP: contributor autosave on published page -> 200 (autosave is draft-like, edit cap only)", r.status === 200, `got ${r.status}`);
r = await req("/api/wp/pages/" + pubForContrib, "GET", undefined, wpOwner);
check("WP: contributor autosave leaves published untouched", r.json?.post?.post_title === "Published For Contrib" && r.json?.autosave !== null);
r = await req("/api/wp/pages/" + pubForContrib + "/delete", "POST", {}, wpOwner);
check("WP: admin deletes published test page", r.status === 200);

console.log("== WP: drafts never affect merged/content ==");
r = await req("/api/wp/pages", "POST", { post_title: "Draft Home Override", post_content: [{ block: "Hero", fields: { "hero.headline": "Draft Headline" } }], post_status: "draft" }, wpOwner);
check("WP: create draft page with hero override -> 200", r.status === 200);
const draftHomeId = r.json?.id;
r = await req("/api/merged");
check("WP: draft does not affect merged hero.headline", r.json?.hero?.headline !== "Draft Headline");
r = await req("/api/content");
check("WP: draft does not appear in content diff", !("hero.headline" in (r.json || {})) || r.json?.["hero.headline"] !== "Draft Headline");
r = await req("/api/wp/posts", "POST", { post_title: "Draft News Item", post_content: [{ block: "body", fields: { body: "Draft news body" } }], post_status: "draft", terms: { categories: ["News"] } }, wpOwner);
check("WP: create draft News post -> 200", r.status === 200);
const draftNewsId = r.json?.id;
r = await req("/api/merged");
check("WP: draft News post does not affect news.items", !(r.json?.news?.items || []).some((it) => it.title === "Draft News Item"));
r = await req("/api/wp/pages/" + draftHomeId + "/delete", "POST", {}, wpOwner);
check("WP: delete draft page", r.status === 200);
r = await req("/api/wp/posts/" + draftNewsId + "/delete", "POST", {}, wpOwner);
check("WP: delete draft news post", r.status === 200);

console.log("== WP: non-canonical pages never feed the live site ==");
r = await req("/api/wp/pages", "POST", { post_title: "Second Visit Page", post_name: "visit-2", post_content: [{ block: "Headline", fields: { "visit.headline": "Hijack Headline" } }], post_status: "publish" }, wpOwner);
check("WP: create published non-canonical Visit-template page -> 200", r.status === 200);
const secondVisitId = r.json?.id;
check("WP: non-canonical page id is not page-visit", secondVisitId && secondVisitId !== "page-visit");
r = await req("/api/merged");
check("WP: non-canonical page does not hijack live Visit headline", r.json?.visit?.headline !== "Hijack Headline");
r = await req("/api/wp/pages?status=publish", "GET", undefined, wpOwner);
check("WP: non-canonical page still listed in Pages", (r.json?.posts || []).some((p) => p.id === secondVisitId));
r = await req("/api/wp/pages/" + secondVisitId + "/delete", "POST", {}, wpOwner);
check("WP: delete non-canonical page", r.status === 200);

console.log("== WP: autosave flow ==");
r = await req("/api/wp/pages", "POST", { post_title: "Autosave Test", post_content: [{ block: "Hero", fields: { "hero.headline": "Autosave Original" } }], post_status: "publish" }, wpOwner);
check("WP: create published autosave-test page", r.status === 200);
const autoPageId = r.json?.id;
r = await req("/api/wp/pages/" + autoPageId, "POST", { post_content: [{ block: "Hero", fields: { "hero.headline": "Autosave Edited" } }], autosave: true }, wpOwner);
check("WP: autosave save -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/wp/pages/" + autoPageId, "GET", undefined, wpOwner);
check("WP: published post untouched by autosave", JSON.stringify(r.json?.post?.post_content || []).includes("Autosave Original") && !JSON.stringify(r.json?.post?.post_content || []).includes("Autosave Edited"));
check("WP: autosave record present with edited content", JSON.stringify(r.json?.autosave?.post_content || []).includes("Autosave Edited"));
r = await req("/api/wp/pages/" + autoPageId, "POST", { post_content: [{ block: "Hero", fields: { "hero.headline": "Autosave Edited" } }], post_status: "publish" }, wpOwner);
check("WP: publish applies autosave content -> 200", r.status === 200);
r = await req("/api/wp/pages/" + autoPageId, "GET", undefined, wpOwner);
check("WP: publish deleted autosave", r.json?.autosave === null);
check("WP: published content now edited", JSON.stringify(r.json?.post?.post_content || []).includes("Autosave Edited"));
r = await req("/api/wp/pages/" + autoPageId + "/delete", "POST", {}, wpOwner);
check("WP: delete autosave-test page", r.status === 200);

console.log("== WP: trash / restore / delete + _pre_trash_status ==");
r = await req("/api/wp/pages", "POST", { post_title: "Trash Test", post_content: [], post_status: "publish" }, wpOwner);
check("WP: create trash-test page", r.status === 200);
const trashPageId = r.json?.id;
r = await req("/api/wp/pages/" + trashPageId + "/trash", "POST", {}, wpOwner);
check("WP: trash page -> 200", r.status === 200);
r = await req("/api/wp/pages?status=trash", "GET", undefined, wpOwner);
check("WP: trashed page listed under trash", (r.json?.posts || []).some((p) => p.id === trashPageId));
r = await req("/api/wp/pages/" + trashPageId, "GET", undefined, wpOwner);
check("WP: _pre_trash_status=publish stored", r.json?.post?.post_status === "trash" && r.json?.post?.meta?._pre_trash_status === "publish");
r = await req("/api/wp/pages/" + trashPageId + "/restore", "POST", {}, wpOwner);
check("WP: restore page -> 200", r.status === 200);
r = await req("/api/wp/pages/" + trashPageId, "GET", undefined, wpOwner);
check("WP: restored to publish, _pre_trash_status cleared", r.json?.post?.post_status === "publish" && !("_pre_trash_status" in (r.json?.post?.meta || {})));
r = await req("/api/wp/pages/" + trashPageId + "/restore", "POST", {}, wpOwner);
check("WP: restore non-trashed -> 400", r.status === 400);
r = await req("/api/wp/pages/" + trashPageId + "/delete", "POST", {}, wpOwner);
check("WP: permanent delete page -> 200", r.status === 200);
r = await req("/api/wp/pages/" + trashPageId, "GET", undefined, wpOwner);
check("WP: deleted page -> 404", r.status === 404);
r = await req("/api/wp/pages/does-not-exist", "GET", undefined, wpOwner);
check("WP: unknown page -> 404", r.status === 404);
r = await req("/api/wp/pages/does-not-exist/trash", "POST", {}, wpOwner);
check("WP: trash unknown page -> 404", r.status === 404);

console.log("== WP: media ==");
r = await req("/api/wp/media", "POST", { url: "https://example.com/photo.png", title: "Test Photo", alt: "Alt text", caption: "Cap" }, wpOwner);
check("WP: media upload https -> 200", r.status === 200 && typeof r.json?.id === "string");
const mediaId = r.json?.id;
r = await req("/api/wp/media", "POST", { url: "http://example.com/bad.png" }, wpOwner);
check("WP: media upload http -> 400", r.status === 400);
r = await req("/api/wp/media", "POST", { url: "data:image/png;base64,iVBORw0KGgo=" }, wpOwner);
check("WP: media upload data-URI -> 200", r.status === 200);
const mediaDataId = r.json?.id;
r = await req("/api/wp/media", "GET", undefined, wpOwner);
check("WP: media list includes uploads with mime", (r.json?.attachments || []).some((a) => a.id === mediaId && a.meta?.url === "https://example.com/photo.png" && a.meta?.mime === "image/png" && a.meta?.alt === "Alt text"));
r = await req("/api/wp/media/" + mediaId, "POST", { title: "Renamed", alt: "New alt" }, wpOwner);
check("WP: media update -> 200", r.status === 200);
r = await req("/api/wp/media", "GET", undefined, wpOwner);
check("WP: media update reflected", (r.json?.attachments || []).some((a) => a.id === mediaId && a.post_title === "Renamed" && a.meta?.alt === "New alt"));
r = await req("/api/wp/media/" + mediaId + "/trash", "POST", {}, wpOwner);
check("WP: media trash -> 200", r.status === 200);
r = await req("/api/wp/media/" + mediaId + "/restore", "POST", {}, wpOwner);
check("WP: media restore -> inherit", r.status === 200);
r = await req("/api/wp/media/" + mediaId + "/delete", "POST", {}, wpOwner);
check("WP: media delete -> 200", r.status === 200);
r = await req("/api/wp/media/" + mediaDataId + "/delete", "POST", {}, wpOwner);
check("WP: media data-URI delete -> 200", r.status === 200);
r = await req("/api/wp/media/does-not-exist/delete", "POST", {}, wpOwner);
check("WP: media delete unknown -> 404", r.status === 404);

console.log("== WP: posts CRUD + News assembly ==");
r = await req("/api/wp/terms", "GET", undefined, wpOwner);
check("WP: terms list has News category", (r.json?.categories || []).some((c) => c.name === "News"));
const newsCountBefore = ((r.json?.categories || []).find((c) => c.name === "News") || {}).count || 0;
r = await req("/api/wp/posts", "POST", { post_title: "WP News Test", post_content: [{ block: "body", fields: { body: "WP news body" } }], post_status: "publish", terms: { categories: ["News"] } }, wpOwner);
check("WP: create published News post -> 200", r.status === 200 && typeof r.json?.id === "string");
const wpNewsId = r.json?.id;
r = await req("/api/merged", "GET", undefined, wpOwner);
check("WP: News assembly includes WP post (icon news fallback)", (r.json?.news?.items || []).some((it) => it.title === "WP News Test" && it.text === "WP news body" && it.icon === "news"));
r = await req("/api/wp/posts?category=News", "GET", undefined, wpOwner);
check("WP: posts list category=News includes it", (r.json?.posts || []).some((p) => p.id === wpNewsId));
r = await req("/api/wp/terms", "GET", undefined, wpOwner);
check("WP: News count incremented", ((r.json?.categories || []).find((c) => c.name === "News") || {}).count === newsCountBefore + 1);
r = await req("/api/wp/posts/" + wpNewsId, "POST", { post_title: "WP News Test v2", post_content: [{ block: "body", fields: { body: "WP news body v2" } }] }, wpOwner);
check("WP: update News post -> 200", r.status === 200);
r = await req("/api/merged", "GET", undefined, wpOwner);
check("WP: News assembly reflects update", (r.json?.news?.items || []).some((it) => it.title === "WP News Test v2" && it.text === "WP news body v2"));
r = await req("/api/wp/posts/" + wpNewsId + "/trash", "POST", {}, wpOwner);
check("WP: trash News post -> 200", r.status === 200);
r = await req("/api/merged", "GET", undefined, wpOwner);
check("WP: trashed News post leaves news.items", !(r.json?.news?.items || []).some((it) => it.title === "WP News Test v2"));
r = await req("/api/wp/posts/" + wpNewsId + "/restore", "POST", {}, wpOwner);
check("WP: restore News post -> 200", r.status === 200);
r = await req("/api/merged", "GET", undefined, wpOwner);
check("WP: restored News post back in news.items", (r.json?.news?.items || []).some((it) => it.title === "WP News Test v2"));
r = await req("/api/wp/posts/" + wpNewsId + "/delete", "POST", {}, wpOwner);
check("WP: delete News post -> 200", r.status === 200);
r = await req("/api/wp/terms", "POST", { kind: "category", name: "Events" }, wpOwner);
check("WP: create category Events -> 200", r.status === 200);
r = await req("/api/wp/terms", "GET", undefined, wpOwner);
check("WP: Events category listed", (r.json?.categories || []).some((c) => c.name === "Events"));
r = await req("/api/wp/terms", "POST", { kind: "tag", name: "Sunday" }, wpOwner);
check("WP: create tag Sunday -> 200", r.status === 200);
r = await req("/api/wp/terms", "POST", { kind: "bogus", name: "X" }, wpOwner);
check("WP: create term bad kind -> 400", r.status === 400);
r = await req("/api/wp/terms", "POST", { kind: "category", name: "Events" }, wpContrib);
check("WP: contributor create term -> 403", r.status === 403);

console.log("== WP: per-page revisions + restore undoable ==");
r = await req("/api/wp/pages", "POST", { post_title: "Revision Test", post_content: [{ block: "Hero", fields: { "hero.headline": "Rev v1" } }], post_status: "publish" }, wpOwner);
check("WP: create revision-test page", r.status === 200);
const revPageId = r.json?.id;
r = await req("/api/wp/pages/" + revPageId, "POST", { post_content: [{ block: "Hero", fields: { "hero.headline": "Rev v2" } }] }, wpOwner);
check("WP: update to v2 -> 200", r.status === 200);
r = await req("/api/wp/revisions?post_id=" + revPageId, "GET", undefined, wpOwner);
check("WP: one per-page revision after v2", (r.json?.revisions || []).length === 1, `got ${(r.json?.revisions || []).length}`);
check("WP: revision changedKeys includes hero.headline", (r.json?.revisions || [])[0]?.changedKeys?.includes("hero.headline"));
const revId = (r.json?.revisions || [])[0]?.id;
r = await req("/api/wp/pages/" + revPageId, "POST", { post_content: [{ block: "Hero", fields: { "hero.headline": "Rev v3" } }] }, wpOwner);
check("WP: update to v3 -> 200", r.status === 200);
r = await req("/api/wp/revisions?post_id=" + revPageId, "GET", undefined, wpOwner);
check("WP: two per-page revisions after v3", (r.json?.revisions || []).length === 2);
r = await req("/api/wp/revisions/" + revId + "/restore", "POST", {}, wpOwner);
check("WP: restore v1 revision -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/wp/pages/" + revPageId, "GET", undefined, wpOwner);
check("WP: page back to v1 after restore", JSON.stringify(r.json?.post?.post_content || []).includes("Rev v1"));
r = await req("/api/wp/revisions?post_id=" + revPageId, "GET", undefined, wpOwner);
check("WP: restore created undo revision (3 total)", (r.json?.revisions || []).length === 3, `got ${(r.json?.revisions || []).length}`);
check("WP: newest per-page revision is __restore__", (r.json?.revisions || [])[0]?.changedKeys?.includes("__restore__"));
const undoRevId = (r.json?.revisions || [])[0]?.id;
r = await req("/api/wp/revisions/" + undoRevId + "/restore", "POST", {}, wpOwner);
check("WP: undo restore -> 200", r.status === 200);
r = await req("/api/wp/pages/" + revPageId, "GET", undefined, wpOwner);
check("WP: undo brings back v3", JSON.stringify(r.json?.post?.post_content || []).includes("Rev v3"));
r = await req("/api/wp/revisions/" + undoRevId + "/restore", "POST", {}, wpOwner);
check("WP: restoring same undo again -> unchanged", r.status === 200 && r.json?.unchanged === true);
r = await req("/api/wp/revisions/does-not-exist/restore", "POST", {}, wpOwner);
check("WP: restore unknown revision -> 404", r.status === 404);
r = await req("/api/wp/dashboard", "GET", undefined, wpOwner);
check("WP: dashboard activity has 5 or fewer entries", Array.isArray(r.json?.activity) && r.json.activity.length <= 5);
check("WP: dashboard counts shape", r.json?.counts?.pages && r.json?.counts?.posts && typeof r.json?.counts?.media === "number" && typeof r.json?.counts?.users === "number");
r = await req("/api/wp/pages/" + revPageId + "/delete", "POST", {}, wpOwner);
check("WP: delete revision-test page", r.status === 200);
r = await req("/api/wp/revisions?post_id=" + revPageId, "GET", undefined, wpOwner);
check("WP: deleting page deletes its revisions", (r.json?.revisions || []).length === 0);

console.log("== WP: options + old content news replace ==");
r = await req("/api/wp/options", "POST", { options: { "church.name": "Options Church" } }, wpOwner);
check("WP: options POST church.name -> 200", r.status === 200);
r = await req("/api/merged");
check("WP: options change reflected in merged", r.json?.church?.name === "Options Church");
r = await req("/api/wp/options", "POST", { options: { "bogus.opt": 1 } }, wpOwner);
check("WP: options POST unknown key -> 400", r.status === 400);
r = await req("/api/content", "POST", { "news.items": [{ icon: "star", title: "Replaced 1", text: "R1" }, { icon: "heart", title: "Replaced 2", text: "R2" }] }, wpOwner);
check("WP: old content news.items replace -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged", "GET", undefined, wpOwner);
check("WP: merged news.items replaced", JSON.stringify((r.json?.news?.items || []).map((it) => it.title)) === '["Replaced 1","Replaced 2"]');
check("WP: replaced news icons preserved", (r.json?.news?.items || [])[0]?.icon === "star");
r = await req("/api/merged");
check("WP: logged-out merged still excludes replaced news.items", JSON.stringify(r.json?.news?.items) === "[]");
r = await req("/api/wp/posts?category=News&status=publish", "GET", undefined, wpOwner);
check("WP: News posts replaced (2 published)", (r.json?.posts || []).length === 2);

console.log("== WP: admin-UI compat (blank image/url + autosave terms) ==");
r = await req("/api/wp/options", "POST", { options: { "church.logo": "", "church.logoDark": "", "church.mapsUrl": "", "church.donateUrl": "" } }, wpOwner);
check("WP: options save with blank image/url -> 200 (admin sends full sets)", r.status === 200, JSON.stringify(r.json));
r = await req("/api/wp/options", "GET", undefined, wpOwner);
check("WP: blank image/url stored as empty strings", r.json?.options?.["church.logo"] === "" && r.json?.options?.["church.mapsUrl"] === "");
r = await req("/api/wp/pages", "POST", { post_title: "Blank Img Page", post_content: [{ block: "Hero", fields: { "hero.image": "", "hero.headline": "Blank Img Test" } }], post_status: "draft" }, wpOwner);
check("WP: page save with blank hero.image -> 200", r.status === 200, JSON.stringify(r.json));
const blankImgPageId = r.json?.id;
r = await req("/api/wp/pages/" + blankImgPageId, "GET", undefined, wpOwner);
check("WP: blank hero.image round-trips", JSON.stringify(r.json?.post?.post_content || []).includes('"hero.image":""'));
r = await req("/api/wp/pages/" + blankImgPageId + "/delete", "POST", {}, wpOwner);
check("WP: delete blank-img page", r.status === 200);
r = await req("/api/wp/posts", "POST", { post_title: "Autosave Terms", post_content: [{ block: "body", fields: { body: "v1" } }], post_status: "publish", terms: { categories: ["News"] } }, wpOwner);
check("WP: create autosave-terms post", r.status === 200);
const autoTermsId = r.json?.id;
r = await req("/api/wp/posts/" + autoTermsId, "POST", { post_content: [{ block: "body", fields: { body: "v2" } }], terms: { categories: ["Events"] }, autosave: true }, wpOwner);
check("WP: post autosave with terms -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/wp/posts/" + autoTermsId, "GET", undefined, wpOwner);
check("WP: autosave carries terms", JSON.stringify(r.json?.autosave?.terms || {}) .includes("Events"));
check("WP: published post untouched by terms autosave", (r.json?.post?.terms?.categories || []).includes("News") && !(r.json?.post?.terms?.categories || []).includes("Events"));
r = await req("/api/wp/revisions?post_id=" + autoTermsId, "GET", undefined, wpOwner);
check("WP: autosave excluded from revisions list", (r.json?.revisions || []).length === 0);
r = await req("/api/wp/posts/" + autoTermsId + "/delete", "POST", {}, wpOwner);
check("WP: delete autosave-terms post", r.status === 200);

console.log("== WP: reset -> defaults + site-wide revision ==");
r = await req("/api/content", "POST", { "hero.headline": "Pre-reset Marker" }, wpOwner);
check("WP: marker save before reset", r.status === 200);
r = await req("/api/reset", "POST", {}, wpOwner);
check("WP: reset -> 200", r.status === 200);
check("WP: wp_migrated=reset after reset", store.get("wp_migrated") === "reset");
r = await req("/api/content");
check("WP: content {} after reset", JSON.stringify(r.json) === "{}");
r = await req("/api/merged");
check("WP: merged defaults after reset", r.json?.hero?.headline === "You belong here." && r.json?.church?.name === "Harvest Church");
r = await req("/api/history", "GET", undefined, wpOwner);
check("WP: reset created __reset__ site-wide revision", (r.json?.history || [])[0]?.changedKeys?.includes("__reset__"));
check("WP: wp_migrated stays reset (no re-migration)", store.get("wp_migrated") === "reset");
r = await req("/api/wp/pages", "GET", undefined, wpOwner);
check("WP: pages re-seeded after reset", (r.json?.posts || []).some((p) => p.id === "page-home"));
r = await req("/api/history", "GET", undefined, wpOwner);
const histLenBeforeSecondReset = (r.json?.history || []).length;
r = await req("/api/reset", "POST", {}, wpOwner);
check("WP: second reset on defaults -> 200", r.status === 200);
r = await req("/api/history", "GET", undefined, wpOwner);
check("WP: second reset on defaults created no new entry", (r.json?.history || []).length === histLenBeforeSecondReset, `got ${(r.json?.history || []).length} vs ${histLenBeforeSecondReset}`);

console.log("== Members: visibility on pages/posts/blocks ==");
// Pages list/get carry top-level visibility; canonical members pages are members by default.
r = await req("/api/wp/pages", "GET", undefined, wpOwner);
check("Members: pages list includes visibility", (r.json?.posts || []).some((p) => p.id === "page-house-churches" && p.visibility === "members") && (r.json?.posts || []).some((p) => p.id === "page-news" && p.visibility === "members") && (r.json?.posts || []).some((p) => p.id === "page-home" && p.visibility === "public"));
r = await req("/api/wp/pages/page-house-churches", "GET", undefined, wpOwner);
check("Members: page get includes visibility=members", r.json?.post?.visibility === "members");
r = await req("/api/wp/pages/page-home", "GET", undefined, wpOwner);
check("Members: public page get includes visibility=public", r.json?.post?.visibility === "public");
// Create with visibility + invalid visibility.
r = await req("/api/wp/pages", "POST", { post_title: "Vis Page", post_content: [{ block: "Hero", fields: { "hero.headline": "Vis v1" } }], post_status: "draft", visibility: "members" }, wpOwner);
check("Members: create page with visibility=members -> 200", r.status === 200 && typeof r.json?.id === "string");
const visPageId = r.json?.id;
r = await req("/api/wp/pages/" + visPageId, "GET", undefined, wpOwner);
check("Members: created page visibility round-trips", r.json?.post?.visibility === "members");
r = await req("/api/wp/pages", "POST", { post_title: "Bad Vis", post_content: [], visibility: "secret" }, wpOwner);
check("Members: create with invalid visibility -> 400", r.status === 400);
r = await req("/api/wp/pages/" + visPageId, "POST", { visibility: "public" }, wpOwner);
check("Members: update visibility -> 200", r.status === 200);
r = await req("/api/wp/pages/" + visPageId, "GET", undefined, wpOwner);
check("Members: updated visibility round-trips", r.json?.post?.visibility === "public");
r = await req("/api/wp/pages/" + visPageId, "POST", { visibility: "nobody" }, wpOwner);
check("Members: update with invalid visibility -> 400", r.status === 400);
// Visibility-only update is a real change (not a no-op) and is revisioned on published posts.
r = await req("/api/wp/pages/" + visPageId, "POST", { post_status: "publish" }, wpOwner);
check("Members: publish vis page -> 200", r.status === 200);
r = await req("/api/wp/pages/" + visPageId, "POST", { visibility: "members" }, wpOwner);
check("Members: visibility-only update on published page -> 200, not unchanged", r.status === 200 && r.json?.unchanged !== true);
r = await req("/api/wp/revisions?post_id=" + visPageId, "GET", undefined, wpOwner);
check("Members: visibility change created a revision", (r.json?.revisions || []).length === 1 && (r.json?.revisions || [])[0]?.changedKeys?.includes("visibility"));
const visRevId = (r.json?.revisions || [])[0]?.id;
r = await req("/api/wp/revisions/" + visRevId + "/restore", "POST", {}, wpOwner);
check("Members: restore revision restores visibility", r.status === 200);
r = await req("/api/wp/pages/" + visPageId, "GET", undefined, wpOwner);
check("Members: visibility back to public after restore", r.json?.post?.visibility === "public");
r = await req("/api/wp/pages/" + visPageId + "/delete", "POST", {}, wpOwner);
check("Members: delete vis page", r.status === 200);
// Block visibility: validate + preserve through save/get.
r = await req("/api/wp/posts", "POST", { post_title: "Block Vis Post", post_content: [{ block: "body", fields: { body: "secret body" }, visibility: "members" }], post_status: "draft" }, wpOwner);
check("Members: create post with members block -> 200", r.status === 200 && typeof r.json?.id === "string");
const blockVisPostId = r.json?.id;
r = await req("/api/wp/posts/" + blockVisPostId, "GET", undefined, wpOwner);
check("Members: block visibility round-trips on get", r.json?.post?.post_content?.[0]?.visibility === "members");
r = await req("/api/wp/posts", "POST", { post_title: "Bad Block Vis", post_content: [{ block: "body", fields: { body: "x" }, visibility: "hidden" }] }, wpOwner);
check("Members: invalid block visibility -> 400", r.status === 400);
r = await req("/api/wp/posts/" + blockVisPostId + "/delete", "POST", {}, wpOwner);
check("Members: delete block-vis post", r.status === 200);
// Posts list/get carry visibility too.
r = await req("/api/wp/posts", "POST", { post_title: "Vis Post", post_content: [{ block: "body", fields: { body: "b" } }], post_status: "draft", visibility: "members" }, wpOwner);
check("Members: create post with visibility=members -> 200", r.status === 200);
const visPostId = r.json?.id;
r = await req("/api/wp/posts", "GET", undefined, wpOwner);
check("Members: posts list includes visibility", (r.json?.posts || []).some((p) => p.id === visPostId && p.visibility === "members"));
r = await req("/api/wp/posts/" + visPostId, "GET", undefined, wpOwner);
check("Members: post get includes visibility", r.json?.post?.visibility === "members");
r = await req("/api/wp/posts/" + visPostId + "/delete", "POST", {}, wpOwner);
check("Members: delete vis post", r.status === 200);

console.log("== Members: server-side stripping ==");
// Owner-style overrides on public fields stay visible logged-out; members content does not.
r = await req("/api/content", "POST", { "church.serviceTimes": ["8:30 AM", "10:30 AM", "12:30 PM"], "footer.connectHeading": "Connects" }, wpOwner);
check("Members: save owner-style overrides -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("Members: logged-out merged keeps public overrides (serviceTimes 12:30, Connects)", JSON.stringify(r.json?.church?.serviceTimes) === '["8:30 AM","10:30 AM","12:30 PM"]' && r.json?.footer?.connectHeading === "Connects");
check("Members: logged-out merged excludes news.items", JSON.stringify(r.json?.news?.items) === "[]");
check("Members: logged-out merged excludes house-churches overrides (defaults)", r.json?.houseChurches?.heading !== "HARNESS-MEMBERS-ONLY");
r = await req("/api/content");
check("Members: logged-out content diff excludes news.items key", !("news.items" in (r.json || {})));
check("Members: logged-out content diff keeps public overrides", r.json?.["church.serviceTimes"]?.includes("12:30 PM") && r.json?.["footer.connectHeading"] === "Connects");
check("Members: logged-out content diff has NO house-churches keys", !Object.keys(r.json || {}).some((k) => k.startsWith("houseChurches.")));
// House-churches override must be invisible logged-out, visible privileged.
r = await req("/api/content", "POST", { "houseChurches.heading": "HARNESS-MEMBERS-ONLY" }, wpOwner);
check("Members: save house-churches override -> 200", r.status === 200);
r = await req("/api/merged");
check("Members: logged-out merged hides house-churches override", r.json?.houseChurches?.heading !== "HARNESS-MEMBERS-ONLY");
check("Members: logged-out merged has NO house-churches keys at all (deleted, not defaults)", r.json?.houseChurches?.groups === undefined && r.json?.houseChurches?.heading === undefined);
r = await req("/api/merged", "GET", undefined, wpOwner);
check("Members: privileged merged shows house-churches override + news + all 19 groups", r.json?.houseChurches?.heading === "HARNESS-MEMBERS-ONLY" && Array.isArray(r.json?.news?.items) && r.json.news.items.length > 0 && Array.isArray(r.json?.houseChurches?.groups) && r.json.houseChurches.groups.length === 19);
r = await req("/api/content", "GET", undefined, wpOwner);
check("Members: privileged content diff shows house-churches override", r.json?.["houseChurches.heading"] === "HARNESS-MEMBERS-ONLY");
r = await req("/api/content", "POST", { "houseChurches.heading": null }, wpOwner);
check("Members: revert house-churches override", r.status === 200);
// Block-level stripping: a members block on a public page hides its fields when logged out.
r = await req("/api/wp/pages/page-home", "GET", undefined, wpOwner);
const homeBlocksOrig = deepCloneForHarness(r.json?.post?.post_content || []);
const homeBlocks = deepCloneForHarness(r.json?.post?.post_content || []);
const heroBlock = homeBlocks.find((b) => b.block === "Hero");
if (heroBlock) { heroBlock.visibility = "members"; heroBlock.fields["hero.headline"] = "HARNESS-BLOCK-MEMBERS"; }
r = await req("/api/wp/pages/page-home", "POST", { post_content: homeBlocks }, wpOwner);
check("Members: save Home with members Hero block -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/merged");
check("Members: logged-out merged hides members-block headline", r.json?.hero?.headline !== "HARNESS-BLOCK-MEMBERS");
check("Members: logged-out merged deletes members-block key (not defaults)", r.json?.hero?.headline === undefined);
r = await req("/api/merged", "GET", undefined, wpOwner);
check("Members: privileged merged shows members-block headline", r.json?.hero?.headline === "HARNESS-BLOCK-MEMBERS");
// Legacy save preserves block visibility (rebuilds blocks from flat keys).
r = await req("/api/content", "POST", { "hero.ctaText": "Harness CTA" }, wpOwner);
check("Members: legacy save alongside members block -> 200", r.status === 200);
r = await req("/api/wp/pages/page-home", "GET", undefined, wpOwner);
check("Members: legacy save preserved Hero block visibility", (r.json?.post?.post_content || []).find((b) => b.block === "Hero")?.visibility === "members");
r = await req("/api/content", "POST", { "hero.ctaText": null }, wpOwner);
check("Members: revert legacy CTA edit", r.status === 200);
// Restore Home to its pre-test blocks.
r = await req("/api/wp/pages/page-home", "POST", { post_content: homeBlocksOrig }, wpOwner);
check("Members: restore Home blocks", r.status === 200);
r = await req("/api/merged");
check("Members: Home headline back to default after restore", r.json?.hero?.headline === "You belong here.");

console.log("== Members: member role ==");
r = await req("/api/users", "POST", { username: "member1", password: "Member-Pass-123!", role: "member" }, wpOwner);
check("Members: create member1 with role member -> 200", r.status === 200 && r.json?.role === "member", JSON.stringify(r.json));
r = await req("/api/users", "GET", undefined, wpOwner);
check("Members: users list includes member1 as member", (r.json?.users || []).some((u) => u.username === "member1" && u.role === "member"));
r = await req("/api/login", "POST", { username: "member1", password: "Member-Pass-123!" });
check("Members: admin login as member -> 403 with site message", r.status === 403 && r.json?.error === "Members sign in on the church website, not here.", JSON.stringify(r.json));
check("Members: member admin login sets NO admin session", !(r.setCookie || "").includes("session="));
r = await req("/api/login", "POST", { username: "member1", password: "Wrong-Pass-123!" });
check("Members: member admin login wrong password -> 401 (not 403)", r.status === 401);
r = await req("/api/users/role", "POST", { username: "editor1", role: "member" }, wpOwner);
check("Members: role-change to member accepted", r.status === 200 && r.json?.role === "member");
r = await req("/api/users/role", "POST", { username: "editor1", role: "editor" }, wpOwner);
check("Members: role-change member back to editor", r.status === 200);
r = await req("/api/users", "POST", { username: "badmember", password: "Badmember-123!", role: "superuser" }, wpOwner);
check("Members: invalid role still 400", r.status === 400);

console.log("== Members: site auth ==");
r = await req("/api/site/me");
check("Site: /api/site/me logged out -> loggedIn:false, no role", r.status === 200 && r.json?.loggedIn === false && !("role" in (r.json || {})));
r = await req("/api/site/login", "POST", { username: "member1", password: "Wrong-Pass-123!" });
check("Site: login wrong password -> 401 same message", r.status === 401 && r.json?.error === "Invalid username or password.");
r = await req("/api/site/login", "POST", { username: "ghostmember", password: "Whatever-123!" });
check("Site: login unknown user -> 401 same message", r.status === 401 && r.json?.error === "Invalid username or password.");
r = await req("/api/site/login", "POST", { username: "member1", password: "Member-Pass-123!" });
check("Site: member login -> 200", r.status === 200 && r.json?.ok === true && r.json?.username === "member1");
const siteCookie = (r.setCookie.match(/site_session=[^;]+/) || [""])[0];
check("Site: login sets site_session cookie with flags", siteCookie.startsWith("site_session=") && (r.setCookie || "").includes("HttpOnly") && (r.setCookie || "").includes("SameSite=Lax") && (r.setCookie || "").includes("Path=/"));
r = await req("/api/site/me", "GET", undefined, siteCookie);
check("Site: /api/site/me with site session -> loggedIn:true, username only", r.status === 200 && r.json?.loggedIn === true && r.json?.username === "member1" && !("role" in (r.json || {})) && !("hash" in (r.json || {})));
r = await req("/api/site/me", "GET", undefined, "site_session=bogus-token");
check("Site: /api/site/me with bogus token -> loggedIn:false", r.status === 200 && r.json?.loggedIn === false);
r = await req("/api/site/login", "POST", { username: "MEMBER1", password: "Member-Pass-123!" });
check("Site: login case-insensitive username", r.status === 200 && r.json?.username === "member1");
r = await req("/api/site/login", "POST", { username: "harness", password: "Harness-Test-123!" });
check("Site: admin-role user can also site-login", r.status === 200);
const siteAdminCookie = (r.setCookie.match(/site_session=[^;]+/) || [""])[0];
r = await req("/api/site/me", "GET", undefined, siteAdminCookie);
check("Site: admin site session sees me", r.json?.loggedIn === true && r.json?.username === "harness");
// Site session grants NO admin access.
r = await req("/api/wp/pages", "GET", undefined, siteCookie);
check("Site: site session alone -> admin API 401", r.status === 401);
r = await req("/api/me", "GET", undefined, siteCookie);
check("Site: site session alone -> /api/me 401", r.status === 401);
// Member cannot change own password; admin can.
r = await req("/api/users/me/password", "POST", { currentPassword: "Member-Pass-123!", newPassword: "Member-Own-123!" }, siteCookie);
check("Site: member own-password change via site session -> 401 (no admin session)", r.status === 401);
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Own-123!" });
const editorCookie2 = (r.setCookie.match(/session=[^;]+/) || [""])[0];
r = await req("/api/users/role", "POST", { username: "editor1", role: "member" }, wpOwner);
check("Members: demote editor1 to member for own-password test", r.status === 200);
// editorCookie2 was a member-to-be's admin session: the demotion to
// member revoked it (hardening), so the endpoint now answers 401 — the
// session is gone entirely, which is stricter than the old 400.
r = await req("/api/users/me/password", "POST", { currentPassword: "Editor-Own-123!", newPassword: "Member-Own-123!" }, editorCookie2);
check("Members: demoted member's stale admin session revoked -> 401", r.status === 401);
r = await req("/api/users/password", "POST", { username: "editor1", newPassword: "Member-Admin-123!" }, wpOwner);
check("Members: admin CAN change a member password -> 200", r.status === 200);
r = await req("/api/site/login", "POST", { username: "editor1", password: "Member-Admin-123!" });
check("Members: member new password works on site login", r.status === 200);
r = await req("/api/users/role", "POST", { username: "editor1", role: "editor" }, wpOwner);
check("Members: restore editor1 to editor", r.status === 200);
r = await req("/api/users/password", "POST", { username: "editor1", newPassword: "Editor-Own-123!" }, wpOwner);
check("Members: restore editor1 password", r.status === 200);
// The role + password restores above revoked editor1's admin sessions
// (hardening); refresh the shared editorCookie for later sections.
r = await req("/api/login", "POST", { username: "editor1", password: "Editor-Own-123!" });
check("Members: editor1 re-login after restores -> 200", r.status === 200);
editorCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
// Site logout kills the site session only.
r = await req("/api/site/logout", "POST", {}, siteCookie);
check("Site: logout -> 200 + clears cookie", r.status === 200 && r.json?.ok === true && (r.setCookie || "").includes("site_session=") && (r.setCookie || "").includes("Max-Age=0"));
r = await req("/api/site/me", "GET", undefined, siteCookie);
check("Site: me after logout -> loggedIn:false", r.json?.loggedIn === false);
r = await req("/api/site/logout", "POST", {});
check("Site: logout without cookie -> 200", r.status === 200);

console.log("== Members: calendar + directory ==");
// Admin endpoints require an admin session (401 logged-out, 401 site-session-only).
r = await req("/api/wp/events");
check("Cal: GET /api/wp/events without session -> 401", r.status === 401);
r = await req("/api/wp/directory");
check("Cal: GET /api/wp/directory without session -> 401", r.status === 401);
// Site endpoints require membership (401 logged-out).
r = await req("/api/site/calendar");
check("Cal: GET /api/site/calendar logged out -> 401 Members only.", r.status === 401 && r.json?.error === "Members only.");
r = await req("/api/site/directory");
check("Cal: GET /api/site/directory logged out -> 401 Members only.", r.status === 401 && r.json?.error === "Members only.");
// Create events (meta + top-level field shapes).
r = await req("/api/wp/events", "POST", { post_title: "Bad Date Event", meta: { date: "2026-13-40" }, post_status: "publish" }, wpOwner);
check("Cal: create event bad date -> 400", r.status === 400);
r = await req("/api/wp/events", "POST", { post_title: "No Date Event", post_status: "publish" }, wpOwner);
check("Cal: create event missing date -> 400", r.status === 400);
r = await req("/api/wp/events", "POST", { post_title: "Christmas Service", meta: { date: "2026-12-25", time: "10:30 AM", location: "Gym", description: "Candlelight" }, post_status: "publish" }, wpOwner);
check("Cal: create event (meta shape) -> 200", r.status === 200 && typeof r.json?.id === "string");
const ev1 = r.json?.id;
r = await req("/api/wp/events", "POST", { post_title: "New Year Prayer", date: "2027-01-01", time: "7:00 PM", post_status: "publish" }, wpOwner);
check("Cal: create event (top-level fields) -> 200", r.status === 200 && typeof r.json?.id === "string");
const ev2 = r.json?.id;
r = await req("/api/wp/events", "POST", { post_title: "Draft Event", meta: { date: "2027-02-01" }, post_status: "draft" }, wpOwner);
check("Cal: create draft event -> 200", r.status === 200);
const evDraft = r.json?.id;
r = await req("/api/wp/events/" + ev1, "GET", undefined, wpOwner);
check("Cal: event get flattens meta onto record", r.json?.event?.id === ev1 && r.json?.event?.date === "2026-12-25" && r.json?.event?.time === "10:30 AM" && r.json?.event?.location === "Gym" && r.json?.event?.description === "Candlelight" && r.json?.event?.meta?.date === "2026-12-25");
r = await req("/api/wp/events", "GET", undefined, wpOwner);
check("Cal: events list has all 3, newest-first by post_date", (r.json?.events || []).length === 3);
r = await req("/api/wp/events?q=christmas", "GET", undefined, wpOwner);
check("Cal: events list q filter", (r.json?.events || []).length === 1 && (r.json?.events || [])[0]?.id === ev1);
r = await req("/api/wp/events?status=draft", "GET", undefined, wpOwner);
check("Cal: events list status filter", (r.json?.events || []).length === 1 && (r.json?.events || [])[0]?.id === evDraft);
r = await req("/api/wp/events/" + ev1, "POST", { meta: { date: "not-a-date" } }, wpOwner);
check("Cal: update event bad date -> 400", r.status === 400);
r = await req("/api/wp/events/" + ev1, "POST", { meta: { time: "11:00 AM" } }, wpOwner);
check("Cal: update event time -> 200", r.status === 200);
r = await req("/api/wp/events/" + ev1, "GET", undefined, wpOwner);
check("Cal: updated time persists, date untouched", r.json?.event?.time === "11:00 AM" && r.json?.event?.date === "2026-12-25");
// Directory entries.
r = await req("/api/wp/directory", "POST", { post_title: "Jane Doe", meta: { phone: "555-0100", email: "not-an-email", house_church: "North Group" }, post_status: "publish" }, wpOwner);
check("Dir: create entry bad email -> 400", r.status === 400);
r = await req("/api/wp/directory", "POST", { post_title: "Jane Doe", meta: { phone: "555-0100", email: "jane@example.com", house_church: "North Group", photo: "https://example.com/jane.png" }, post_status: "publish" }, wpOwner);
check("Dir: create entry (meta shape) -> 200", r.status === 200 && typeof r.json?.id === "string");
const dir1 = r.json?.id;
r = await req("/api/wp/directory", "POST", { post_title: "Aaron Smith", phone: "555-0200", email: "aaron@example.com", post_status: "publish" }, wpOwner);
check("Dir: create entry (top-level fields) -> 200", r.status === 200);
const dir2 = r.json?.id;
r = await req("/api/wp/directory/" + dir1, "GET", undefined, wpOwner);
check("Dir: entry get flattens meta onto record + name/status aliases", r.json?.entry?.name === "Jane Doe" && r.json?.entry?.status === "publish" && r.json?.entry?.post_title === "Jane Doe" && r.json?.entry?.post_status === "publish" && r.json?.entry?.phone === "555-0100" && r.json?.entry?.email === "jane@example.com" && r.json?.entry?.house_church === "North Group" && r.json?.entry?.photo === "https://example.com/jane.png");
r = await req("/api/wp/directory", "GET", undefined, wpOwner);
check("Dir: entries list has 2", (r.json?.entries || []).length === 2);
r = await req("/api/wp/directory/" + dir1, "POST", { phone: "555-0101" }, wpOwner);
check("Dir: update entry phone -> 200", r.status === 200);
r = await req("/api/wp/directory/" + dir1, "GET", undefined, wpOwner);
check("Dir: updated phone persists", r.json?.entry?.phone === "555-0101");
// Admin UI sends title/name + status (not post_title/post_status) —
// the API must accept those aliases and return them on read.
r = await req("/api/wp/events", "POST", { title: "Admin Shape Event", status: "draft", date: "2027-03-01", time: "6:00 PM", location: "Lobby", description: "From admin" }, wpOwner);
check("Cal: create event (admin title/status shape) -> 200", r.status === 200 && typeof r.json?.id === "string");
const evAdmin = r.json?.id;
r = await req("/api/wp/events/" + evAdmin, "GET", undefined, wpOwner);
check("Cal: admin-shape event read returns title/status aliases", r.json?.event?.title === "Admin Shape Event" && r.json?.event?.status === "draft" && r.json?.event?.post_title === "Admin Shape Event" && r.json?.event?.post_status === "draft");
r = await req("/api/wp/events/" + evAdmin, "POST", { title: "Admin Shape Event Renamed", status: "publish", date: "2027-03-02" }, wpOwner);
check("Cal: update event (admin title/status shape) -> 200", r.status === 200);
r = await req("/api/wp/events/" + evAdmin, "GET", undefined, wpOwner);
check("Cal: admin-shape event update persists title/status", r.json?.event?.title === "Admin Shape Event Renamed" && r.json?.event?.status === "publish" && r.json?.event?.date === "2027-03-02");
r = await req("/api/wp/events/" + evAdmin + "/delete", "POST", {}, wpOwner);
check("Cal: delete admin-shape event -> 200", r.status === 200);
r = await req("/api/wp/directory", "POST", { name: "Admin Shape Person", status: "draft", phone: "555-0300", email: "adminshape@example.com", house_church: "South Group", photo: "https://example.com/admin.png" }, wpOwner);
check("Dir: create entry (admin name/status shape) -> 200", r.status === 200 && typeof r.json?.id === "string");
const dirAdmin = r.json?.id;
r = await req("/api/wp/directory/" + dirAdmin, "GET", undefined, wpOwner);
check("Dir: admin-shape entry read returns name/status aliases", r.json?.entry?.name === "Admin Shape Person" && r.json?.entry?.status === "draft" && r.json?.entry?.post_title === "Admin Shape Person" && r.json?.entry?.post_status === "draft");
r = await req("/api/wp/directory/" + dirAdmin, "POST", { name: "Admin Shape Renamed", status: "publish" }, wpOwner);
check("Dir: update entry (admin name/status shape) -> 200", r.status === 200);
r = await req("/api/wp/directory/" + dirAdmin, "GET", undefined, wpOwner);
check("Dir: admin-shape entry update persists name/status", r.json?.entry?.name === "Admin Shape Renamed" && r.json?.entry?.status === "publish");
r = await req("/api/wp/directory/" + dirAdmin + "/delete", "POST", {}, wpOwner);
check("Dir: delete admin-shape entry -> 200", r.status === 200);
// Site endpoints: logged-out 401; member sees published only, sorted; admin session also works.
r = await req("/api/site/login", "POST", { username: "member1", password: "Member-Pass-123!" });
const memberSite = (r.setCookie.match(/site_session=[^;]+/) || [""])[0];
r = await req("/api/site/calendar", "GET", undefined, memberSite);
check("Cal: site calendar as member -> 200, published only, date ascending", r.status === 200 && JSON.stringify((r.json?.events || []).map((e) => e.title)) === '["Christmas Service","New Year Prayer"]' && (r.json?.events || [])[0]?.date === "2026-12-25" && (r.json?.events || [])[0]?.status === "publish");
r = await req("/api/site/calendar", "GET", undefined, wpOwner);
check("Cal: site calendar as admin session -> 200", r.status === 200 && (r.json?.events || []).length === 2);
r = await req("/api/site/directory", "GET", undefined, memberSite);
check("Dir: site directory as member -> 200, name ascending", r.status === 200 && JSON.stringify((r.json?.entries || []).map((e) => e.name)) === '["Aaron Smith","Jane Doe"]' && (r.json?.entries || [])[0]?.phone === "555-0200");
r = await req("/api/site/directory", "GET", undefined, wpOwner);
check("Dir: site directory as admin session -> 200", r.status === 200 && (r.json?.entries || []).length === 2);
// Directory + calendar NEVER leak into merged/content, even privileged.
r = await req("/api/merged", "GET", undefined, wpOwner);
check("Cal/Dir: privileged merged never includes directory/calendar", !JSON.stringify(r.json).includes("Jane Doe") && !JSON.stringify(r.json).includes("555-0101") && !JSON.stringify(r.json).includes("Christmas Service"));
r = await req("/api/content", "GET", undefined, wpOwner);
check("Cal/Dir: privileged content never includes directory/calendar", !JSON.stringify(r.json).includes("Jane Doe") && !JSON.stringify(r.json).includes("Christmas Service"));
r = await req("/api/merged");
check("Cal/Dir: logged-out merged never includes directory/calendar", !JSON.stringify(r.json).includes("Jane Doe") && !JSON.stringify(r.json).includes("Christmas Service"));
// Trash / restore / delete for events + directory.
r = await req("/api/wp/events/" + ev1 + "/trash", "POST", {}, wpOwner);
check("Cal: trash event -> 200", r.status === 200);
r = await req("/api/site/calendar", "GET", undefined, memberSite);
check("Cal: trashed event leaves site calendar", !(r.json?.events || []).some((e) => e.id === ev1));
r = await req("/api/wp/events/" + ev1, "GET", undefined, wpOwner);
check("Cal: trashed event keeps _pre_trash_status", r.json?.event?.post_status === "trash" && r.json?.event?.meta?._pre_trash_status === "publish");
r = await req("/api/wp/events/" + ev1 + "/restore", "POST", {}, wpOwner);
check("Cal: restore event -> 200", r.status === 200);
r = await req("/api/wp/events/" + ev1, "GET", undefined, wpOwner);
check("Cal: restored event publish, _pre_trash_status cleared", r.json?.event?.post_status === "publish" && !("_pre_trash_status" in (r.json?.event?.meta || {})));
r = await req("/api/wp/events/" + evDraft + "/delete", "POST", {}, wpOwner);
check("Cal: delete draft event -> 200", r.status === 200);
r = await req("/api/wp/events/" + evDraft, "GET", undefined, wpOwner);
check("Cal: deleted event -> 404", r.status === 404);
r = await req("/api/wp/directory/" + dir2 + "/trash", "POST", {}, wpOwner);
check("Dir: trash entry -> 200", r.status === 200);
r = await req("/api/site/directory", "GET", undefined, memberSite);
check("Dir: trashed entry leaves site directory", !(r.json?.entries || []).some((e) => e.id === dir2));
r = await req("/api/wp/directory/" + dir2 + "/restore", "POST", {}, wpOwner);
check("Dir: restore entry -> 200", r.status === 200);
r = await req("/api/wp/directory/" + dir2 + "/delete", "POST", {}, wpOwner);
check("Dir: delete entry -> 200", r.status === 200);
r = await req("/api/wp/directory/" + dir2, "GET", undefined, wpOwner);
check("Dir: deleted entry -> 404", r.status === 404);
// Cleanup remaining fixtures.
r = await req("/api/wp/events/" + ev1 + "/delete", "POST", {}, wpOwner);
check("Cal: delete event fixture", r.status === 200);
r = await req("/api/wp/events/" + ev2 + "/delete", "POST", {}, wpOwner);
check("Cal: delete event fixture 2", r.status === 200);
r = await req("/api/wp/directory/" + dir1 + "/delete", "POST", {}, wpOwner);
check("Dir: delete entry fixture", r.status === 200);
r = await req("/api/site/logout", "POST", {}, memberSite);
check("Cal/Dir: member site logout", r.status === 200);
r = await req("/api/site/calendar", "GET", undefined, memberSite);
check("Cal: calendar 401 after site logout", r.status === 401);

console.log("== Members: image / upload verification (a-d) ==");
// (a) Media Library upload: data-URI <=1.2MB AND https URL; storage + response shape.
r = await req("/api/wp/media", "POST", { url: "https://example.com/members-photo.png", title: "Members Photo", alt: "Alt text", caption: "Cap" }, wpOwner);
check("(a) media upload https -> {ok,id}", r.status === 200 && r.json?.ok === true && typeof r.json?.id === "string");
const mediaHttpsId2 = r.json?.id;
r = await req("/api/wp/media", "POST", { url: "data:image/png;base64,iVBORw0KGgo=" }, wpOwner);
check("(a) media upload data-URI -> {ok,id}", r.status === 200 && typeof r.json?.id === "string");
const mediaDataId2 = r.json?.id;
r = await req("/api/wp/media", "GET", undefined, wpOwner);
check("(a) media list stores attachment post + url/alt/caption/mime", (r.json?.attachments || []).some((a) => a.id === mediaHttpsId2 && a.meta?.url === "https://example.com/members-photo.png" && a.meta?.alt === "Alt text" && a.meta?.caption === "Cap" && a.meta?.mime === "image/png"));
check("(a) media list stores data-URI attachment with image mime", (r.json?.attachments || []).some((a) => a.id === mediaDataId2 && (a.meta?.url || "").startsWith("data:image/png") && a.meta?.mime === "image/png"));
{
  const big = new Request("https://test.invalid/api/wp/media", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: wpOwner, "x-csrf-token": csrfByCookie.get(wpOwner) || "" },
    body: JSON.stringify({ url: "data:image/png;base64," + "A".repeat(1258291) }),
  });
  const res = await worker.fetch(big, env);
  // NOTE: the global 200KB JSON body cap fires first (413) — the media
  // handler's own 1.2MB data-URI cap is unreachable via JSON today
  // (pre-existing behavior, unchanged by this workstream).
  check("(a) media upload oversized data-URI -> 413 (global body cap)", res.status === 413, `got ${res.status}`);
}
{ // Fix A threshold bracket: ~140 KB file (data-URI) fits under the 200,000-char
  // body cap -> 200; ~160 KB file exceeds it -> 413. Measured max file
  // bytes fitting ≈ 149,967 (body exactly 200,000 chars), so "under 150 KB" is accurate.
  const b64_140k = "A".repeat(Math.ceil(140 * 1024 / 3) * 4);
  r = await req("/api/wp/media", "POST", { url: "data:image/png;base64," + b64_140k, title: "Threshold 140K" }, wpOwner);
  check("(F1) media upload ~140 KB file (data-URI) -> 200", r.status === 200 && typeof r.json?.id === "string", `got ${r.status}`);
  const thresholdId = r.json?.id;
  const b64_160k = "A".repeat(Math.ceil(160 * 1024 / 3) * 4);
  r = await req("/api/wp/media", "POST", { url: "data:image/png;base64," + b64_160k, title: "Threshold 160K" }, wpOwner);
  check("(F1) media upload ~160 KB file (data-URI) -> 413", r.status === 413, `got ${r.status}`);
  if (thresholdId) { r = await req("/api/wp/media/" + thresholdId + "/delete", "POST", {}, wpOwner); check("(F1) delete threshold fixture", r.status === 200); }
}
r = await req("/api/wp/media/" + mediaHttpsId2 + "/delete", "POST", {}, wpOwner);
check("(a) delete https media fixture", r.status === 200);
r = await req("/api/wp/media/" + mediaDataId2 + "/delete", "POST", {}, wpOwner);
check("(a) delete data-URI media fixture", r.status === 200);
// (b) Image field in page editor: hero.image survives save -> assembly -> /api/merged.
r = await req("/api/wp/pages/page-home", "GET", undefined, wpOwner);
const homeForImg = deepCloneForHarness(r.json?.post?.post_content || []);
const homeImgOrig = deepCloneForHarness(homeForImg);
const heroForImg = homeForImg.find((b) => b.block === "Hero");
if (heroForImg) heroForImg.fields["hero.image"] = "https://example.com/hero-harness.png";
r = await req("/api/wp/pages/page-home", "POST", { post_content: homeForImg }, wpOwner);
check("(b) save page with hero.image -> 200", r.status === 200, JSON.stringify(r.json));
r = await req("/api/wp/pages/page-home", "GET", undefined, wpOwner);
check("(b) hero.image round-trips on page get", (r.json?.post?.post_content || []).find((b) => b.block === "Hero")?.fields?.["hero.image"] === "https://example.com/hero-harness.png");
r = await req("/api/merged", "GET", undefined, wpOwner);
check("(b) hero.image appears in privileged /api/merged", r.json?.hero?.image === "https://example.com/hero-harness.png");
r = await req("/api/wp/pages/page-home", "POST", { post_content: homeImgOrig }, wpOwner);
check("(b) restore Home blocks after image test", r.status === 200);
// (c) Logo upload (Church Settings): options logo survives and appears in /api/merged.
r = await req("/api/wp/options", "GET", undefined, wpOwner);
const logoOrig = r.json?.options?.["church.logo"];
r = await req("/api/wp/options", "POST", { options: { "church.logo": "https://example.com/logo-harness.png" } }, wpOwner);
check("(c) save church.logo via options -> 200", r.status === 200);
r = await req("/api/wp/options", "GET", undefined, wpOwner);
check("(c) church.logo persists in options", r.json?.options?.["church.logo"] === "https://example.com/logo-harness.png");
r = await req("/api/merged", "GET", undefined, wpOwner);
check("(c) church.logo appears in /api/merged", r.json?.church?.logo === "https://example.com/logo-harness.png");
r = await req("/api/wp/options", "POST", { options: { "church.logo": logoOrig === undefined ? "" : logoOrig } }, wpOwner);
check("(c) restore church.logo", r.status === 200);
// (d) Featured image: meta._thumbnail_id persists and is returned on get.
r = await req("/api/wp/media", "POST", { url: "https://example.com/featured.png", title: "Featured" }, wpOwner);
const featMediaId = r.json?.id;
r = await req("/api/wp/pages", "POST", { post_title: "Featured Page", post_content: [], post_status: "draft", meta: { _thumbnail_id: featMediaId } }, wpOwner);
check("(d) create page with meta._thumbnail_id -> 200", r.status === 200 && typeof r.json?.id === "string");
const featPageId = r.json?.id;
r = await req("/api/wp/pages/" + featPageId, "GET", undefined, wpOwner);
check("(d) _thumbnail_id returned on page get", r.json?.post?.meta?._thumbnail_id === featMediaId);
r = await req("/api/wp/pages/" + featPageId, "POST", { post_title: "Featured Page v2" }, wpOwner);
check("(d) update page keeps _thumbnail_id", r.status === 200);
r = await req("/api/wp/pages/" + featPageId, "GET", undefined, wpOwner);
check("(d) _thumbnail_id survives update", r.json?.post?.meta?._thumbnail_id === featMediaId);
r = await req("/api/wp/posts", "POST", { post_title: "Featured Post", post_content: [{ block: "body", fields: { body: "x" } }], post_status: "draft", meta: { _thumbnail_id: featMediaId } }, wpOwner);
const featPostId = r.json?.id;
r = await req("/api/wp/posts/" + featPostId, "GET", undefined, wpOwner);
check("(d) _thumbnail_id returned on post get", r.json?.post?.meta?._thumbnail_id === featMediaId);
r = await req("/api/wp/pages/" + featPageId + "/delete", "POST", {}, wpOwner);
check("(d) delete featured page", r.status === 200);
r = await req("/api/wp/posts/" + featPostId + "/delete", "POST", {}, wpOwner);
check("(d) delete featured post", r.status === 200);
r = await req("/api/wp/media/" + featMediaId + "/delete", "POST", {}, wpOwner);
check("(d) delete featured media", r.status === 200);
// Cleanup: member account + owner-style overrides from this section.
r = await req("/api/users/delete", "POST", { username: "member1" }, wpOwner);
check("Members: owner deletes member1", r.status === 200);
r = await req("/api/content", "POST", { "church.serviceTimes": null, "footer.connectHeading": null }, wpOwner);
check("Members: revert owner-style overrides", r.status === 200);
r = await req("/api/merged");
check("Members: overrides reverted (defaults back)", JSON.stringify(r.json?.church?.serviceTimes) === '["8:30 AM","10:30 AM"]');
console.log("== Members: invite-link self-registration ==");
r = await req("/");
check("Site: register page markup present", r.text.includes("site-register-form") && r.text.includes("Join as a member"));
check("Site: NO public Sign Up link to #/register", !r.text.includes('href="#/register"'));
r = await req("/admin");
check("Admin: Members group section present", r.text.includes("Members group") && r.text.includes("members-list"));
check("Admin: invite endpoints wired", r.text.includes("/api/site/invite/regenerate") && r.text.includes("/api/site/members"));
check("Admin: invite QR canvas + Download/Print wired", r.text.includes('id="invite-qr-canvas"') && r.text.includes("invite-qr-download-btn") && r.text.includes("invite-qr-print-btn"));
check("Admin: QR encoder vendored inlined, not lazy-loaded", r.text.includes("BEGIN VENDORED QR ENCODER") && !r.text.includes("ensureQREncoder") && !r.text.includes("/qr-encoder.js"));
check("Admin: QR uses error correction H", r.text.includes('qrcode(0, "H")'));
check("Admin: QR center logo is the Harvest icon, not the full logo", r.text.includes('inviteQRLogoImg.src = "/harvest-icon.png"') && !r.text.includes('inviteQRLogoImg.src = "/harvest-logo.png"'));
check("Admin: QR logo uses the icon's natural aspect ratio", r.text.includes("naturalHeight / inviteQRLogoImg.naturalWidth"));
r = await req("/harvest-icon.png");
check("GET /harvest-icon.png -> 200 image/png", r.status === 200 && r.contentType.startsWith("image/png") && (r.text.length > 1000));
r = await req("/harvest-logo.png");
check("GET /harvest-logo.png -> 200 image/png", r.status === 200 && r.contentType.startsWith("image/png") && (r.text.length > 1000));
r = await req("/api/site/invite");
check("GET /api/site/invite without session -> 401", r.status === 401);
r = await req("/api/site/invite", "GET", undefined, editorCookie);
check("GET /api/site/invite as editor -> 403", r.status === 403);
r = await req("/api/site/invite/regenerate", "POST", {}, editorCookie);
check("POST /api/site/invite/regenerate as editor -> 403", r.status === 403);
r = await req("/api/site/members", "GET", undefined, editorCookie);
check("GET /api/site/members as editor -> 403", r.status === 403);
r = await req("/api/site/invite/toggle", "POST", { enabled: false }, wpOwner);
check("POST /api/site/invite/toggle before any code -> 400", r.status === 400 && /Generate an invite link/i.test(r.json?.error || ""));
const badRegBody = { code: "not-a-real-code", name: "Bad Code", email: "bad@example.com", username: "badcode1", password: "Badcode-Pass-123!", confirmPassword: "Badcode-Pass-123!" };
r = await req("/api/site/register", "POST", badRegBody, "", { "x-forwarded-for": "203.0.113.1" });
check("Register: bad code -> generic error, no field leaks", r.status === 400 && r.json?.error === "This invite link isn't valid." && !r.json?.errors);
r = await req("/api/site/invite/regenerate", "POST", {}, wpOwner);
check("POST /api/site/invite/regenerate as owner -> 200 + inviteUrl", r.status === 200 && typeof r.json?.inviteUrl === "string" && r.json.inviteUrl.includes("/#/register?code="), JSON.stringify(r.json));
const inviteUrl1 = r.json?.inviteUrl || "";
const inviteCode1 = inviteUrl1.split("code=")[1] || "";
check("Regenerate: code is 64 hex chars (32 bytes)", /^[0-9a-f]{64}$/.test(inviteCode1));
r = await req("/api/site/invite", "GET", undefined, wpOwner);
check("GET /api/site/invite: status only, never the code/URL", r.status === 200 && r.json?.hasCode === true && r.json?.enabled === true && !("inviteUrl" in (r.json || {})) && !("code" in (r.json || {})));
r = await req("/api/site/invite/check", "POST", { code: inviteCode1 }, "", { "x-forwarded-for": "203.0.113.2" });
check("Invite check: valid code -> true", r.status === 200 && r.json?.valid === true);
r = await req("/api/site/invite/check", "POST", { code: "0000000000000000000000000000000000000000000000000000000000000000" }, "", { "x-forwarded-for": "203.0.113.3" });
check("Invite check: wrong code -> false", r.status === 200 && r.json?.valid === false);
const regBody = { code: inviteCode1, name: "Reggie Member", email: "Reggie@Example.com", username: "reggie1", password: "Reggie-Pass-123!", confirmPassword: "Reggie-Pass-123!" };
r = await req("/api/site/register", "POST", regBody, "", { "x-forwarded-for": "203.0.113.10" });
check("Register: success -> 200 + site session cookie", r.status === 200 && r.json?.ok === true && r.json?.username === "reggie1" && (r.setCookie || "").includes("site_session="), JSON.stringify(r.json));
const reggieSiteCookie = (r.setCookie.match(/site_session=[^;]+/) || [""])[0];
r = await req("/api/site/me", "GET", undefined, reggieSiteCookie);
check("Register: new member auto-logged-in (site/me)", r.status === 200 && r.json?.loggedIn === true && r.json?.username === "reggie1");
r = await req("/api/merged", "GET", undefined, reggieSiteCookie);
check("Register: new member sees members-only merged content", Array.isArray(r.json?.houseChurches?.groups) && r.json.houseChurches.groups.length > 0);
r = await req("/api/login", "POST", { username: "reggie1", password: "Reggie-Pass-123!" });
check("Register: new member CANNOT reach /admin (403)", r.status === 403 && /church website/i.test(r.json?.error || ""));
r = await req("/api/site/members", "GET", undefined, wpOwner);
const reggieEntry = (r.json?.members || []).find((m) => m.username === "reggie1");
check("Members list: self-registered member appears with email/name/via", !!reggieEntry && reggieEntry.email === "reggie@example.com" && reggieEntry.displayName === "Reggie Member" && reggieEntry.registeredVia === "invite" && reggieEntry.provider === "password" && !("hash" in (reggieEntry || {})) && !("salt" in (reggieEntry || {})));
// Role injection: client-sent role must be ignored — always member.
r = await req("/api/site/register", "POST", { code: inviteCode1, name: "Sneaky", email: "sneaky@example.com", username: "sneaky1", password: "Sneaky-Pass-123!", confirmPassword: "Sneaky-Pass-123!", role: "administrator" }, "", { "x-forwarded-for": "203.0.113.11" });
check("Register: role injection ignored -> 200", r.status === 200 && r.json?.username === "sneaky1");
r = await req("/api/login", "POST", { username: "sneaky1", password: "Sneaky-Pass-123!" });
check("Register: injected-role account still a member (admin login 403)", r.status === 403);
r = await req("/api/site/register", "POST", { ...regBody, email: "other@example.com" }, "", { "x-forwarded-for": "203.0.113.12" });
check("Register: duplicate username -> field error", r.status === 400 && r.json?.errors?.username === "That username already exists.");
r = await req("/api/site/register", "POST", { ...regBody, username: "reggie2", email: "REGGIE@example.com" }, "", { "x-forwarded-for": "203.0.113.13" });
check("Register: duplicate email (case-insensitive) -> field error", r.status === 400 && r.json?.errors?.email === "That email is already registered.");
r = await req("/api/site/register", "POST", { ...regBody, username: "reggie3", email: "reggie3@example.com", password: "short", confirmPassword: "short" }, "", { "x-forwarded-for": "203.0.113.14" });
check("Register: weak password -> field error", r.status === 400 && /12 characters/.test(r.json?.errors?.password || ""));
r = await req("/api/site/register", "POST", { ...regBody, username: "reggie4", email: "not-an-email", password: "Reggie-Pass-123!", confirmPassword: "Reggie-Pass-123!" }, "", { "x-forwarded-for": "203.0.113.15" });
check("Register: bad email -> field error", r.status === 400 && r.json?.errors?.email === "Enter a valid email address.");
r = await req("/api/site/register", "POST", { ...regBody, username: "bad name", email: "badname@example.com", password: "Reggie-Pass-123!", confirmPassword: "Reggie-Pass-123!" }, "", { "x-forwarded-for": "203.0.113.16" });
check("Register: bad username -> field error", r.status === 400 && /Username must be/.test(r.json?.errors?.username || ""));
r = await req("/api/site/register", "POST", { ...regBody, username: "reggie5", email: "reggie5@example.com", password: "Reggie-Pass-123!", confirmPassword: "Different-Pass-123!" }, "", { "x-forwarded-for": "203.0.113.17" });
check("Register: password mismatch -> field error", r.status === 400 && r.json?.errors?.confirmPassword === "Passwords do not match.");
// Disabled registration: code checks fail generically, then re-enable.
r = await req("/api/site/invite/toggle", "POST", { enabled: false }, wpOwner);
check("Invite toggle: disable -> 200 enabled:false", r.status === 200 && r.json?.enabled === false);
r = await req("/api/site/invite/check", "POST", { code: inviteCode1 }, "", { "x-forwarded-for": "203.0.113.18" });
check("Invite check: disabled -> false", r.status === 200 && r.json?.valid === false);
r = await req("/api/site/register", "POST", { ...regBody, username: "reggie6", email: "reggie6@example.com" }, "", { "x-forwarded-for": "203.0.113.19" });
check("Register: disabled -> generic error", r.status === 400 && r.json?.error === "This invite link isn't valid.");
r = await req("/api/site/invite/toggle", "POST", { enabled: true }, wpOwner);
check("Invite toggle: re-enable -> 200 enabled:true", r.status === 200 && r.json?.enabled === true);
r = await req("/api/site/invite/check", "POST", { code: inviteCode1 }, "", { "x-forwarded-for": "203.0.113.20" });
check("Invite check: re-enabled -> true again", r.status === 200 && r.json?.valid === true);
// Regeneration: old code dies, new code works.
r = await req("/api/site/invite/regenerate", "POST", {}, wpOwner);
check("Regenerate #2 -> 200 + different URL", r.status === 200 && typeof r.json?.inviteUrl === "string" && r.json.inviteUrl !== inviteUrl1);
const inviteUrl2 = r.json?.inviteUrl || "";
const inviteCode2 = inviteUrl2.split("code=")[1] || "";
r = await req("/api/site/register", "POST", { ...regBody, username: "reggie7", email: "reggie7@example.com", code: inviteCode1 }, "", { "x-forwarded-for": "203.0.113.21" });
check("Register: old code after regenerate -> generic error", r.status === 400 && r.json?.error === "This invite link isn't valid.");
r = await req("/api/site/register", "POST", { code: inviteCode2, name: "New Code", email: "newcode@example.com", username: "newcode1", password: "Newcode-Pass-123!", confirmPassword: "Newcode-Pass-123!" }, "", { "x-forwarded-for": "203.0.113.22" });
check("Register: new code after regenerate -> 200", r.status === 200 && r.json?.username === "newcode1");
// Rate limit: attempts (11 bad-code tries on one IP -> 429 on the 11th).
let rateAttemptStatus = 0;
for (let i = 0; i < 11; i++) {
  r = await req("/api/site/register", "POST", badRegBody, "", { "x-forwarded-for": "203.0.113.50" });
  rateAttemptStatus = r.status;
}
check("Register: attempt rate limit trips -> 429", rateAttemptStatus === 429);
// Rate limit: successes (6th success on one IP -> 429).
let rateSuccessStatuses = [];
for (let i = 0; i < 6; i++) {
  r = await req("/api/site/register", "POST", { code: inviteCode2, name: "Rate " + i, email: "rate" + i + "@example.com", username: "rateuser" + i, password: "Rate-Pass-123!", confirmPassword: "Rate-Pass-123!" }, "", { "x-forwarded-for": "203.0.113.60" });
  rateSuccessStatuses.push(r.status);
}
check("Register: success rate limit (5 ok, 6th 429)", JSON.stringify(rateSuccessStatuses) === "[200,200,200,200,200,429]", JSON.stringify(rateSuccessStatuses));
// Remove member: sessions invalidated, login dead.
r = await req("/api/users/delete", "POST", { username: "reggie1" }, wpOwner);
check("Members: owner removes self-registered member", r.status === 200);
r = await req("/api/site/me", "GET", undefined, reggieSiteCookie);
check("Members: removed member's site session invalidated", r.status === 200 && r.json?.loggedIn === false);
r = await req("/api/site/login", "POST", { username: "reggie1", password: "Reggie-Pass-123!" });
check("Members: removed member cannot log in", r.status === 401);
// Admin-created members keep working and appear in the group roster.
r = await req("/api/users", "POST", { username: "adminmade-member", password: "Adminmade-Pass-123!", role: "member" }, wpOwner);
check("Members: admin-created member still works", r.status === 200);
r = await req("/api/site/members", "GET", undefined, wpOwner);
check("Members list: admin-created member appears (registeredVia null)", (r.json?.members || []).some((m) => m.username === "adminmade-member" && (m.registeredVia === null || m.registeredVia === undefined)));
r = await req("/api/site/login", "POST", { username: "adminmade-member", password: "Adminmade-Pass-123!" });
check("Members: admin-created member site login works", r.status === 200);
// Cleanup test accounts (keep the harness store tidy).
for (const u of ["sneaky1", "newcode1", "adminmade-member", "rateuser0", "rateuser1", "rateuser2", "rateuser3", "rateuser4"]) {
  r = await req("/api/users/delete", "POST", { username: u }, wpOwner);
  check("Register cleanup: delete " + u, r.status === 200);
}

console.log("== Members: invite QR code (shipped encoder, decode-verified) ==");
// The QR center logo is the cropped Harvest icon asset (orange rounded
// square, white corners). Verify the shipped asset file itself: valid
// PNG, small (icons are embedded in the worker script),
// near-square palette PNG, no blue-gray remnant implied by palette.
const iconBuf = readFileSync(new URL("./assets/harvest-icon.png", import.meta.url).pathname);
check("QR icon asset: valid PNG signature", iconBuf[0] === 0x89 && iconBuf[1] === 0x50 && iconBuf[2] === 0x4e && iconBuf[3] === 0x47);
const iconW = iconBuf.readUInt32BE(16), iconH = iconBuf.readUInt32BE(20);
check("QR icon asset: 160x156 near-square", iconW === 160 && iconH === 156, `${iconW}x${iconH}`);
check("QR icon asset: palette PNG (color type 3)", iconBuf[25] === 3, `colorType=${iconBuf[25]}`);
check("QR icon asset: <= 20 KB", iconBuf.length <= 20 * 1024, `${iconBuf.length} bytes`);
// Extract the EXACT encoder vendored into the served /admin page
// (BEGIN/END VENDORED QR ENCODER) and run it.
const adminHtml = await req("/admin");
check("QR: encoder markers present in served /admin", adminHtml.text.includes("/* BEGIN VENDORED QR ENCODER */") && adminHtml.text.includes("/* END VENDORED QR ENCODER */"));
const qrStart = adminHtml.text.indexOf("/* BEGIN VENDORED QR ENCODER */");
const qrEnd = adminHtml.text.indexOf("/* END VENDORED QR ENCODER */") + "/* END VENDORED QR ENCODER */".length;
const qrcodeFactory = (new Function(adminHtml.text.slice(qrStart, qrEnd) + "; return qrcode;"))();
function qrGrid(url) {
  const qr = qrcodeFactory(0, "H");
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const grid = [];
  for (let y = 0; y < n; y++) {
    const row = [];
    for (let x = 0; x < n; x++) row.push(qr.isDark(y, x));
    grid.push(row);
  }
  return { n, grid };
}
function qrPixels(url) {
  const { n, grid } = qrGrid(url);
  const quiet = 4, px = 8;
  const size = (n + quiet * 2) * px;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mx = Math.floor(x / px) - quiet, my = Math.floor(y / px) - quiet;
      const dark = mx >= 0 && mx < n && my >= 0 && my < n && grid[my][mx];
      const i = (y * size + x) * 4;
      const v = dark ? 0 : 255;
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  // White icon box, mirroring the browser overlay (icon ~20% of QR width
  // + padding, icon's natural aspect ratio). The icon is opaque with
  // white corners, so the box occlusion matches what the browser draws.
  const logoW = Math.round(size * 0.20);
  const logoH = Math.round(logoW * iconH / iconW);
  const pad = Math.max(6, Math.round(logoW * 0.09));
  const boxW = logoW + pad * 2, boxH = logoH + pad * 2;
  const bx = Math.round((size - boxW) / 2), by = Math.round((size - boxH) / 2);
  for (let y = by; y < by + boxH; y++) {
    for (let x = bx; x < bx + boxW; x++) {
      const i = (y * size + x) * 4;
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}
const require = createRequire(import.meta.url);
const jsQR = require("./test-vendor/jsqr-1.4.0/jsQR.js");
const qrTestUrl = "https://harvest-church.dinklytics.workers.dev/#/register?code=" + "b".repeat(64);
const qrA = qrGrid(qrTestUrl);
check("QR: encoder produces a valid-size grid for an invite URL", qrA.n >= 21 && qrA.n <= 177 && qrA.grid.length === qrA.n);
check("QR: finder pattern present (top-left)", qrA.grid[0][0] === true && qrA.grid[0][6] === true && qrA.grid[6][0] === true && qrA.grid[6][6] === true && qrA.grid[1][1] === false);
const decodedA = jsQR(qrPixels(qrTestUrl).data, qrPixels(qrTestUrl).width, qrPixels(qrTestUrl).height);
check("QR: decodes to exactly the invite URL (with icon-box occlusion)", !!decodedA && decodedA.data === qrTestUrl, decodedA ? decodedA.data : "no decode");
const qrB = qrGrid("https://harvest-church.dinklytics.workers.dev/#/register?code=" + "c".repeat(64));
check("QR: different code -> different modules", JSON.stringify(qrA.grid) !== JSON.stringify(qrB.grid));
const decodedLive1 = jsQR(qrPixels(inviteUrl1).data, qrPixels(inviteUrl1).width, qrPixels(inviteUrl1).height);
check("QR: live regenerated invite URL #1 decodes exactly", !!decodedLive1 && decodedLive1.data === inviteUrl1);
const decodedLive2 = jsQR(qrPixels(inviteUrl2).data, qrPixels(inviteUrl2).width, qrPixels(inviteUrl2).height);
check("QR: live regenerated invite URL #2 decodes exactly (QR changes on regenerate)", !!decodedLive2 && decodedLive2.data === inviteUrl2 && inviteUrl1 !== inviteUrl2);



console.log("== Security hardening (2026-10-20) ==");
// --- Security headers + CSP on every surface ---
async function rawReq(path, opts = {}) {
  const res = await worker.fetch(new Request("https://test.invalid" + path, opts), env);
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}
{
  const home = await rawReq("/");
  const csp = home.headers.get("content-security-policy") || "";
  const scriptSrc = (csp.split(";").find((d) => d.trim().startsWith("script-src")) || "");
  check("SEC headers: site has CSP with hash-based script-src", scriptSrc.includes("'sha256-") && !scriptSrc.includes("unsafe-inline") && csp.includes("frame-ancestors 'self'"), csp.slice(0, 160));
  check("SEC headers: site HSTS + nosniff + frame protection", (home.headers.get("strict-transport-security") || "").includes("max-age=") && home.headers.get("x-content-type-options") === "nosniff" && !!home.headers.get("x-frame-options"));
  const admH = await rawReq("/admin");
  check("SEC headers: admin frame deny", admH.headers.get("x-frame-options") === "DENY");
  const adm = await rawReq("/admin");
  const acsp = adm.headers.get("content-security-policy") || "";
  check("SEC headers: admin has CSP (hash, no unsafe-inline script)", acsp.includes("script-src 'self' 'sha256-") && acsp.includes("object-src 'none'"), acsp.slice(0, 120));
  const apiRes = await rawReq("/api/content");
  check("SEC headers: API JSON also carries nosniff + CSP default", apiRes.headers.get("x-content-type-options") === "nosniff" && (apiRes.headers.get("content-security-policy") || "").includes("default-src 'none'"));
  const notFound = await rawReq("/no-such-page-xyz");
  check("SEC headers: 404 page carries headers too", notFound.headers.get("x-content-type-options") === "nosniff");
}
// --- Method allowlist ---
{
  const res = await worker.fetch(new Request("https://test.invalid/api/content", { method: "DELETE" }), env);
  check("SEC methods: DELETE -> 405", res.status === 405, "got " + res.status);
}
// --- CSRF gate ---
{
  const noTok = await rawReq("/api/content", { method: "POST", headers: { "content-type": "application/json", cookie: wpOwner }, body: "{}" });
  check("SEC csrf: authenticated POST without token -> 403", noTok.status === 403, "got " + noTok.status);
  r = await req("/api/content", "POST", { "hero.headline": "csrf bad" }, wpOwner, { "x-csrf-token": "bogus-token" });
  check("SEC csrf: wrong token -> 403", r.status === 403, "got " + r.status);
  const goodTok = csrfByCookie.get(wpOwner) || "";
  const cross = await rawReq("/api/content", { method: "POST", headers: { "content-type": "application/json", cookie: wpOwner, "x-csrf-token": goodTok, origin: "https://evil.example" }, body: "{}" });
  check("SEC csrf: cross-site Origin with valid token -> 403", cross.status === 403, "got " + cross.status);
  const sfs = await rawReq("/api/content", { method: "POST", headers: { "content-type": "application/json", cookie: wpOwner, "x-csrf-token": goodTok, "sec-fetch-site": "cross-site" }, body: "{}" });
  check("SEC csrf: Sec-Fetch-Site cross-site -> 403", sfs.status === 403, "got " + sfs.status);
  const plain = await rawReq("/api/content", { method: "POST", headers: { "content-type": "text/plain", cookie: wpOwner, "x-csrf-token": goodTok }, body: "{}" });
  check("SEC csrf: non-JSON POST content-type -> 415", plain.status === 415, "got " + plain.status);
  r = await req("/api/content", "POST", { "hero.headline": "csrf ok" }, wpOwner);
  check("SEC csrf: valid token POST still works -> 200", r.status === 200, "got " + r.status);
  r = await req("/api/content", "POST", { "hero.headline": null }, wpOwner);
  check("SEC csrf: cleanup revert -> 200", r.status === 200);
}
// --- Session fixation: a planted cookie must never be adopted ---
{
  const res = await worker.fetch(new Request("https://test.invalid/api/login", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "session=planted-token-000" },
    body: JSON.stringify({ username: "harness", password: "Harness-Test-123!" }),
  }), env);
  const sc = res.headers.get("set-cookie") || "";
  check("SEC fixation: login mints a fresh token, planted one ignored", res.status === 200 && sc.includes("session=") && !sc.includes("planted-token-000"), sc.slice(0, 60));
  await res.text();
}
// --- Stored-markup rejection on save (all roles) + benign subset allowed ---
{
  r = await req("/api/content", "POST", { "hero.headline": "<script>alert(1)</script>" }, wpOwner);
  check("SEC markup: <script> in a CMS field -> 400", r.status === 400, "got " + r.status);
  r = await req("/api/content", "POST", { "hero.headline": "x onerror=alert(1)" }, wpOwner);
  check("SEC markup: event-handler text -> 400", r.status === 400, "got " + r.status);
  r = await req("/api/content", "POST", { "hero.headline": "Welcome <b>home</b><br>friend" }, wpOwner);
  check("SEC markup: benign <b>/<br> still saves -> 200", r.status === 200, "got " + r.status);
  r = await req("/api/content", "POST", { "hero.headline": null }, wpOwner);
  check("SEC markup: cleanup revert -> 200", r.status === 200);
}
// --- Legacy password hash upgrades to PBKDF2 on login; legacy keys untouched ---
{
  const usersRaw = store.get("wp_users");
  const users = JSON.parse(usersRaw);
  const salt = "c0ffee00c0ffee00c0ffee00c0ffee00";
  users["legacysec"] = { salt, hash: createHash("sha256").update(salt + ":" + "Legacy-Sec-123!").digest("hex"), createdAt: "2024-01-01T00:00:00.000Z", role: "editor", email: "", displayName: "Legacy Sec" };
  store.set("wp_users", JSON.stringify(users));
  const legacyBefore = store.get("admin-pass");
  r = await req("/api/login", "POST", { username: "legacysec", password: "Legacy-Sec-123!" });
  check("SEC pbkdf2: legacy-hash user can still log in -> 200", r.status === 200, "got " + r.status);
  const after = JSON.parse(store.get("wp_users"))["legacysec"];
  check("SEC pbkdf2: record upgraded to v2 PBKDF2-SHA512/150k", after && after.v === 2 && after.algo === "pbkdf2-sha512" && after.iter === 150000 && typeof after.salt === "string" && after.salt.length === 64);
  check("SEC pbkdf2: legacy admin-pass key byte-untouched by upgrade", store.get("admin-pass") === legacyBefore);
  r = await req("/api/login", "POST", { username: "legacysec", password: "Wrong-Pass-123!" }, "", { "x-forwarded-for": "203.0.113.99" });
  check("SEC pbkdf2: wrong password against v2 record -> 401", r.status === 401, "got " + r.status);
  r = await req("/api/users/delete", "POST", { username: "legacysec" }, wpOwner);
  check("SEC cleanup: delete legacysec", r.status === 200);
}
// --- Brute-force lockout (dedicated account + IP so nothing else trips) ---
{
  r = await req("/api/users", "POST", { username: "lockme", password: "Lockme-Pass-123!", role: "editor" }, wpOwner);
  check("SEC lockout setup: create lockme", r.status === 200, "got " + r.status);
  const ipHdr = { "x-forwarded-for": "198.51.100.7" };
  let last = null;
  for (let i = 0; i < 10; i++) {
    last = await req("/api/login", "POST", { username: "lockme", password: "Wrong-Pass-123!" }, "", ipHdr);
  }
  check("SEC lockout: 10th failure still plain 401", last.status === 401, "got " + last.status);
  r = await req("/api/login", "POST", { username: "lockme", password: "Lockme-Pass-123!" }, "", ipHdr);
  check("SEC lockout: correct password while locked -> 429", r.status === 429 && (r.json?.retryAfterSec || 0) > 0, "got " + r.status + " " + JSON.stringify(r.json));
  r = await req("/api/login", "POST", { username: "lockme", password: "Lockme-Pass-123!" }, "", { "x-forwarded-for": "198.51.100.8" });
  check("SEC lockout: lock follows the account, not just the IP -> 429", r.status === 429, "got " + r.status);
  r = await req("/api/login", "POST", { username: "harness", password: "Harness-Test-123!" }, "", { "x-forwarded-for": "198.51.100.9" });
  check("SEC lockout: other accounts unaffected -> 200", r.status === 200, "got " + r.status);
}
// --- Security admin API: posture, audit, revoke ---
{
  r = await req("/api/security/status", "GET", undefined, wpOwner);
  check("SEC api: owner reads security status", r.status === 200 && typeof r.json?.posture?.passwordHashing === "string" && r.json.posture.passwordHashing.includes("PBKDF2"), "got " + r.status);
  check("SEC api: status lists active sessions", Array.isArray(r.json?.sessions?.admin) && r.json.sessions.admin.length >= 1 && r.json.sessions.admin.every((s) => !("token" in s)));
  r = await req("/api/security/status", "GET", undefined, editorCookie);
  check("SEC api: editor cannot read security status -> 403", r.status === 403, "got " + r.status);
  r = await req("/api/security/audit", "GET", undefined, wpOwner);
  const events = r.json?.events || [];
  check("SEC api: audit log records logins + lockout", r.status === 200 && events.some((e) => e.event === "login_success") && events.some((e) => e.event === "login_locked_out"), events.slice(0, 3).map((e) => e.event).join(","));
  check("SEC api: audit entries never carry a raw IP or token", events.every((e) => !("ip" in e) && !("token" in e)));
  // revoke: lockme signs in from a clean slate? (locked) -> use a fresh user
  r = await req("/api/users", "POST", { username: "revokeme", password: "Revoke-Pass-123!", role: "editor" }, wpOwner);
  r = await req("/api/login", "POST", { username: "revokeme", password: "Revoke-Pass-123!" });
  const revokeCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
  r = await req("/api/me", "GET", undefined, revokeCookie);
  check("SEC revoke setup: revokeme session works", r.status === 200);
  r = await req("/api/security/revoke", "POST", { scope: "user", username: "revokeme" }, wpOwner);
  check("SEC api: revoke one user's sessions -> 200", r.status === 200 && (r.json?.revoked || 0) >= 1, "got " + r.status + " " + JSON.stringify(r.json));
  r = await req("/api/me", "GET", undefined, revokeCookie);
  check("SEC api: revoked session is dead -> 401", r.status === 401, "got " + r.status);
  r = await req("/api/users/delete", "POST", { username: "revokeme" }, wpOwner);
  r = await req("/api/users/delete", "POST", { username: "lockme" }, wpOwner);
  check("SEC cleanup: delete revoke/lock users", r.status === 200);
}
// --- Contributor cannot publish typed content (calendar) ---
{
  r = await req("/api/users", "POST", { username: "contribsec", password: "Contrib-Pass-123!", role: "contributor" }, wpOwner);
  r = await req("/api/login", "POST", { username: "contribsec", password: "Contrib-Pass-123!" });
  const contribCookie = (r.setCookie.match(/session=[^;]+/) || [""])[0];
  r = await req("/api/wp/events", "POST", { post_title: "Sneaky publish", meta: { date: "2026-11-01" }, post_status: "publish" }, contribCookie);
  check("SEC caps: contributor publishing an event -> 403", r.status === 403, "got " + r.status);
  r = await req("/api/wp/events", "POST", { post_title: "Honest draft", meta: { date: "2026-11-02" }, post_status: "draft" }, contribCookie);
  check("SEC caps: contributor draft event still allowed", r.status === 200 && typeof r.json?.id === "string", "got " + r.status + " " + JSON.stringify(r.json).slice(0, 120));
  r = await req("/api/users/delete", "POST", { username: "contribsec" }, wpOwner);
  check("SEC cleanup: delete contribsec", r.status === 200);
}
// --- Media: script-capable uploads rejected ---
{
  r = await req("/api/wp/media", "POST", { url: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", title: "svg" }, wpOwner);
  check("SEC media: SVG data-URI -> 400", r.status === 400, "got " + r.status);
  r = await req("/api/wp/media", "POST", { url: "https://example.com/x.svg", title: "svg" }, wpOwner);
  check("SEC media: .svg URL -> 400", r.status === 400, "got " + r.status);
  r = await req("/api/wp/media", "POST", { url: "data:text/html;base64,PHNjcmlwdD4=", title: "html" }, wpOwner);
  check("SEC media: data:text/html -> 400", r.status === 400, "got " + r.status);
}
// --- Password length cap on user creation ---
{
  r = await req("/api/users", "POST", { username: "toolongpw", password: "Aa1!" + "x".repeat(200), role: "editor" }, wpOwner);
  check("SEC users: >128-char password -> 400", r.status === 400, "got " + r.status);
}
// --- Site logout requires the site session's CSRF token ---
{
  r = await req("/api/site/login", "POST", { username: "editor1", password: "Editor-Own-123!" });
  const sc2 = (r.setCookie.match(/site_session=[^;]+/) || [""])[0];
  check("SEC site csrf: editor1 site login -> 200", r.status === 200 && !!sc2, "got " + r.status);
  const noTok = await rawReq("/api/site/logout", { method: "POST", headers: { "content-type": "application/json", cookie: sc2 }, body: "{}" });
  check("SEC site csrf: site logout without token -> 403", noTok.status === 403, "got " + noTok.status);
  r = await req("/api/site/logout", "POST", {}, sc2);
  check("SEC site csrf: site logout with token -> 200", r.status === 200, "got " + r.status);
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
