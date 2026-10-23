# Harvest Church — WordPress CMS Worker

A CMS-enabled version of the live Harvest Church site. Same worker name
(`harvest-church`), same public URL (`https://harvest-church.dinklytics.workers.dev/`),
plus a real WordPress-style admin at `/admin/` backed by Cloudflare KV.

**Status: true WordPress re-architecture deployed 2026-10-16, plus members-only / visibility (deployed 2026-10-16), plus Members-group invite-link self-registration with QR code (deployed 2026-10-16).** Content lives
in WordPress tables (`wp_posts`, `wp_postmeta`, `wp_options`, `wp_users`,
`wp_terms`); the admin is WordPress's admin (Dashboard, Pages, Posts, Media,
Users, Settings); roles use WordPress's 5-role capability model. The public
site renders byte-identically to the pre-WordPress version (verified by
`render_compare.mjs` — all 14 view functions identical). The GitHub Pages
demo copy is a separate sandbox and is untouched by this project.

## Members-only / visibility (deployed 2026-10-16)

- **Visibility:** every page post carries postmeta `_visibility` ∈ `public` |
  `members` (default `public`); every block carries `visibility` ∈ `public` |
  `members` (default `public`). The page editor has a per-page control
  ("Who can see this page?") and a per-section control on every block
  ("Who can see this section?"); the Pages/Posts lists show a Visibility
  column. **Defaults:** House Churches page + all its sections, and the News
  page + all its sections, are `members` (applied once by a flag-guarded
  `wp_visibility_defaults` step; post-reset re-seed keeps them members).
- **Server-side stripping (the security rule):** `GET /api/content` and
  `GET /api/merged` return members-only content ONLY when the request has a
  valid admin session OR a valid site session. Otherwise members pages
  contribute no fields, members blocks are skipped, `news.items` is `[]`,
  and calendar/directory data never appears. Crucially, members pages' /
  blocks' field keys are **deleted** from the unprivileged merged result —
  merely skipping stored values would let the DEFAULTS fallback re-expose
  the same content (e.g. the 19 house-church groups). **Expected change:**
  logged-out `/api/content` + `/api/merged` now exclude News + House
  Churches content; privileged responses are unchanged.
- **Member role:** `member` has NO admin capabilities. Admin login as a
  member → 403 ("Members sign in on the church website, not here.").
  Members do not change their own password (`POST /api/users/me/password`
  → 400); admins manage member passwords via `POST /api/users/password`.
  Member accounts are created by Administrators in Users — and members
  can now also join by themselves with the secret invite link (next
  section).
- **Site login (public site, NOT the admin):** header shows "Members — Log
  in" when logged out, "Welcome, \<name\> — Log out" when logged in.
  `POST /api/site/login` (any CMS role may log in here) sets a
  `site_session` cookie (`HttpOnly; Secure; SameSite=Lax`, 24h, KV key
  `site-session:<token>`); `POST /api/site/logout` clears it;
  `GET /api/site/me` → `{loggedIn, username}` (never returns role/hashes).
  Logged-out visitors see a "Members only — please log in…" gate page on
  `#/login`, `#/calendar`, `#/directory`, `#/news`, `#/house-churches`,
  and members-only nav links are hidden.
- **Calendar** (`post_type=event`, meta `{date, time, location,
  description}`) and **Directory** (`post_type=directory_entry`, meta
  `{phone, email, house_church, photo}`): admin sidebar sections with
  list + editor + publish/draft/trash (no revisions in v1); site routes
  `#/calendar` + `#/directory`, members-only. The admin accepts the
  admin UI's field names (`title`/`name` + `status`) as aliases for
  `post_title`/`post_status`, and returns them on read. Directory entries
  are visible ONLY to logged-in members, never in `/api/content` /
  `/api/merged` (even privileged). **News = Announcements:** the existing
  News section IS the announcements — no separate section; its heading
  stays "News".
- **Known limitation (view-source):** the served site HTML embeds the
  static DEFAULTS object (including members-only *default* values, e.g.
  the 19 groups). Rendering is gated by login state and every API
  response is stripped, so nothing members-only is *displayed* to
  logged-out visitors — but a visitor inspecting the page source could
  read default values. Customized members-only values live only in KV
  and never appear in the page source.

## Members group + invite-link self-registration (deployed 2026-10-16)

**Model:** Members is a group like an Active Directory group. The site
does NOT connect to real Active Directory — this is the site's own
Members group behaving like one. Role `member` IS membership in the
Members group; one group controls members-only access. The admin manages
the group (invite link + roster) from Users → **Members group**, instead
of creating each member account one by one. Admin-created members keep
working exactly as before — they were already in the group.

**How a new member joins:** an Administrator copies the secret invite
link from Users → Members group and shares it with prospective members
(bulletin, email, text). The new person opens the link —
`https://harvest-church.dinklytics.workers.dev/#/register?code=<code>` —
fills in **Full name, Email (required), Username, Password, Confirm
password**, and is automatically added to the Members group, auto-logged
in to the site, and taken home. There is NO public Sign Up link anywhere
(header, login page, or admin login); without a valid invite link the
`#/register` page shows only a generic "This invite link isn't valid."
message. New members are never sent to `/admin`.

**Registration rules:** username follows the same rule as admin-created
users (3–64 chars, letters/numbers + `. _ @ -`); password must be 12+
chars with uppercase, lowercase, digit, and symbol; username AND email
must both be unique (case-insensitive). Any `role` field the client
sends is ignored — new accounts are always `member`.

**Invite-link management (Administrator only):** Users → Members group
shows registration status (enabled/disabled), a **Generate invite link**
/ **Regenerate invite link** button, and an **Enable/Disable
registration** toggle. Regenerating creates a new code immediately —
the old link (and its QR code) stops working. Disabling makes the link
and the QR code stop working (the QR is hidden with a note) until
re-enabled. **Security:** anyone with the invite link can register, so
share it only with prospective members; if it leaks, regenerate it.
Only a SHA-256 hash of the code is stored in KV (`member-invite`: hash
+ enabled + createdAt) — the raw code is never stored or logged. The
full link is shown exactly once, right after generating, for the admin
to copy; if it is lost, regenerate. No API response ever returns the
code or URL except that one regenerate response.

**Members roster (Administrator only):** Users → Members group lists
every member (username, name, email, joined date, joined-via). Admin
actions per member: **Change password** (admin sets it, 12+ chars) and
**Remove** (takes them out of the group immediately — members-only
access gone, all their sessions invalidated). Members cannot change
their own password, and there is **no email password-reset** in v1 (no
mailer) — a locked-out member asks an administrator to reset it.

**Rate limits (per IP, KV counters, 1-hour window):** max 10
registration attempts/hour (bad codes count too, so codes cannot be
brute-forced), max 5 successful registrations/hour, max 30 invite-code
checks/hour. Over the limit → 429 "Too many attempts."

**Future Google/Facebook login (NOT built):** needs church
Google/Facebook developer setup + consent screens. Every member account
already stores `email` + `provider: "password"`, so a future OAuth login
can match by email to the same member account.

**Invite QR code:** Users → Members group shows a QR code encoding the
FULL invite URL, with **Download PNG** and **Print** buttons (bulletin /
handout / slides). The QR is generated locally in the admin's browser
from the invite URL using a vendored QR encoder (qrcode-generator 1.4.4,
MIT) — the link is never sent to a third-party QR service. The encoder
is vendored into the admin page (`BEGIN VENDORED QR ENCODER` …
`END VENDORED QR ENCODER`) and loads with the admin, so the invite QR
code renders whenever the Users → Members group screen shows it. Format:
error correction level H, Harvest icon centered at ~20% of the QR width
with a white padding box behind it, quiet zone preserved; the center
logo is the Harvest icon — the orange rounded-square icon cropped from
the owner's uploaded photo (white corners, no blue-gray background),
served at `/harvest-icon.png` (small palette PNG, ~3 KB).
The full Harvest logo still lives at `/harvest-logo.png` and is
unchanged; only the QR center logo uses the icon.
The QR re-renders whenever the invite code is regenerated (new code =
new URL = new QR); when registration is disabled the QR hides with a
note. Because only the code hash is stored, the QR renders only while
the page session knows the full link (right after generating) —
regenerate to get the link + QR again. **Before printing:** test-scan
the QR, don't crop the logo or the white border around the code. Every
shipped QR is decode-verified in the harness (jsQR) and was
cross-checked with cv2 + the real logo before deploy. The onboarding
guide covers the QR (where to find it, print/share, don't crop the logo,
keep the quiet zone, test-scan, regenerate if the link leaks).

## Files

| File | Purpose |
|---|---|
| `fields.json` | Field definitions for block editors: 162 fields (145 admin-visible + 17 legacy aliases). Injected into the worker, the site bootstrap, and the admin page by `build_worker.py`. |
| `site-template.html` | Site HTML. All copy lives in the `CMS` object; every view renders from it. Hand-maintained — see "Rebuilding" below. |
| `admin-template.html` | WordPress admin: sidebar + Dashboard/Pages/Posts/Media/Users/Settings. Single file, no external assets. |
| `worker-template.js` | Worker source. Placeholders are filled by `build_worker.py`. |
| `build_worker.py` | Builds `dist/harvest-church-worker.js` (the deploy artifact) + `.txt` copy. Extracts DEFAULTS from the template's CMS object and validates every schema path. Embeds the ASSETS map (icons + manifest) from `assets/`; font/logo data-URIs stay inlined in the site template and the QR encoder stays vendored in the admin template. |
| `deploy.py` | Deploys `dist/` to the live worker **with the CMS_KV binding**. Use this — the generic `deploy_worker.py` would strip the binding. |
| `harness.mjs` | Harness against the built worker with a mocked KV (throwaway credentials, never production). Verifies the embedded asset routes (status + Content-Type + byte-identical body), inlined font/logo data-URIs, the vendored QR encoder, and that slim-only routes fall back to the site HTML. |
| `render_compare.mjs` | Runs old vs new site templates' view functions in a stubbed DOM and diffs the HTML. |
| `assets/` | Source of truth for the worker's embedded assets: `harvest-logo.png`, `harvest-icon.png` (QR center logo), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — embedded as base64 in the worker's ASSETS map and served at matching routes — plus `/manifest.webmanifest` (generated by `build_worker.py`). The font, the dark-header logo variant, and the QR encoder are inlined/vendored in the templates, not in `assets/`. |
| `dist/harvest-church-worker.js` | Built worker — this is what gets uploaded. |
| `dist/backup-pre-wp.js` | Pre-WordPress build backup (taken before the WP rebuild). |
| `backups/site-content-backup-2026-10-16.json` | Pre-revert snapshot of the two test overrides (hero "Free Cookies", footer "Coolies"). |
| `backups/wp-migration-2026-10-16.json` | Full KV backup (all 15 keys) taken immediately before the WordPress deploy. Rollback source. |

## Architecture: WordPress tables in KV

Each table is ONE KV key holding a JSON map. All keys are prefixed `wp_`.

| Key | Contents |
|---|---|
| `wp_posts` | id → post record |
| `wp_postmeta` | postId → `{ key: value }` |
| `wp_options` | option → value (site settings) |
| `wp_users` | username → `{ salt, hash, createdAt, role, email, displayName }` |
| `wp_usermeta` | username → `{ key: value }` (nickname, bio, …) |
| `wp_terms` | `{ categories: [...], tags: [...] }` |
| `wp_migrated` | `"1"` = migrated from old keys; `"reset"` = reset to defaults, do NOT re-migrate |

### Post record

```json
{
  "id": "page-visit",
  "post_type": "page",
  "post_status": "publish",
  "post_title": "Visit",
  "post_name": "visit",
  "post_content": [{ "block": "Headline", "fields": { "visit.headline": "…" } }],
  "post_author": "siteowner",
  "post_date": "2026-10-16T…",
  "post_modified": "2026-10-16T…",
  "post_parent": 0,
  "menu_order": 1,
  "terms": { "categories": [], "tags": [] },
  "changedKeys": ["visit.headline"]
}
```

- `post_type` ∈ `page`, `post`, `revision`, `attachment`.
- `post_status` ∈ `publish`, `draft`, `trash` (attachments use `inherit`).
- Pages/posts: `post_content` = **blocks**, one block per section:
  `{ block: "<section>", fields: { <flat field key>: value } }` using the
  existing `fields.json` keys. Posts carry a single `{ block: "body",
  fields: { body: "…" } }` block plus `terms`.
- Revisions: `post_type=revision`, `post_parent` = edited post id,
  `post_content` = full snapshot of the parent (blocks + meta) at that time,
  `changedKeys` = flat keys that changed. Autosaves are revisions with id
  `autosave-<postId>` and `post_name=<id>-autosave`.
- Attachments: `post_content = ""`; file data in postmeta
  `{ url, alt, caption, mime }`.

### Canonical pages vs admin-created pages

The 12 CMS pages (Home, Visit, About, House Churches, Ministries, Sermons,
Give, News, Contact, Welcome, Serve, Join) have canonical post IDs
`page-<slug>` (e.g. `page-visit`). **Only canonical published pages feed
the live site.** Admin-created pages (id `page-<timestamp>-<random>`) are
stored and listed in the admin but never affect the public site — otherwise
a new page using the Visit template would hijack the real Visit page's
fields, since assembly merges by field key. The site has 12 fixed templates;
new pages do not add public routes (documented limitation).

Site Settings is not a page — its fields live in `wp_options`.

### Assembly (public site contract)

- `GET /api/merged`: DEFAULTS → apply `wp_options` by field path → apply
  each canonical published page's blocks by field path (missing page =
  DEFAULTS for that page) → derive `news.items` from published
  News-category posts (post_date desc; icon from postmeta, fallback
  `"news"`). Produces the exact shape the site bootstrap has always used.
- `GET /api/content`: same assembly, but returns only keys differing from
  DEFAULTS (flat `{ fieldKey: value }`).

## Migration + rollback

**Lazy, in-worker, COPY-only.** On any request: if `wp_migrated` is absent
AND old keys exist → migrate, then set `wp_migrated="1"`. If no old keys
exist → seed from DEFAULTS. If `wp_migrated` is present but content posts
are gone (post-reset) → seed from DEFAULTS, never re-migrate.

- `site-content` → Site Settings fields to `wp_options`; other pages'
  fields to canonical page posts (full field sets, one block per section).
- News `news.items` → 6 post records (category News, author = owner,
  post_date staggered so the first original item stays newest; `menu_order`
  = original index). `news.items` is stripped from the News page blocks —
  items now come from Posts.
- `history:*` → revision posts (id = original history key).
- `admin-pass` + `admin-users` → `wp_users`/`wp_usermeta`, copying salt+hash
  as-is (same passwords keep working). Roles: `viewer→subscriber`,
  others unchanged; legacy entries with no role → administrator.
- Deterministic IDs make migration idempotent (safe to re-run).
- **Old keys are never deleted or modified** (`site-content`, `history:*`,
  `admin-pass`, `admin-users`, `setup-done`, `session:*`). They stay as the
  rollback path, alongside `backups/wp-migration-2026-10-16.json`.

**Rollback:** redeploy `dist/backup-pre-wp.js` (pre-WordPress worker). The
old worker reads the untouched old keys. To force a fresh migration after
rollback, delete the `wp_*` keys (or restore the backup) and redeploy the
WordPress worker.

## Admin map

Left sidebar: **Dashboard, Pages, Posts, Media, Calendar, Directory, Users, Settings** (no
Appearance/Plugins — no themes/plugins in this CMS).

- **Dashboard:** At a Glance (counts: Pages/Posts publish/draft/trash,
  Media, Users), Activity (latest 5 revisions), Quick Draft (title +
  content → draft post).
- **Pages:** All Pages list (title, author, date, status, **visibility**; Edit/Trash/View;
  status filters; search; bulk Trash/Restore/Delete). Editor: title + one
  block per section (fields from `fields.json`, pre-filled) + Publish box
  (Save Draft / Publish / Update, status, slug, parent, featured image) +
  **per-page visibility ("Who can see this page?") + per-section visibility
  on every block ("Who can see this section?")** + Revisions list + Restore. The News editor omits `news.items` (items come
  from Posts). Featured image sets `meta._thumbnail_id`; the theme's hero
  image still comes from the Hero block.
- **Posts:** All Posts list (same patterns + category filter + **visibility**). Editor:
  title + Body block + Categories + Tags + **visibility**.
- **Media:** Library grid (thumbnail, title, alt, caption), upload (file
  ≤1.2 MB as data-URI, or URL), edit metadata, Trash/Restore/Permanent
  delete. Image fields in the page editor get a "Choose from Media Library"
  picker.
- **Calendar:** list (title, date, time, location, status; filters, search,
  bulk actions) + editor (title, date, time, location, description,
  Publish box). No revisions.
- **Directory:** list (name, phone, email, house church, status; filters,
  search, bulk actions) + editor (name, phone, email, house church select
  from the existing groups, photo via Media Library picker + URL, Publish
  box). Entries are admin-managed only; members cannot edit their own
  entry. Editor notes entries are visible ONLY to logged-in members.
- **Users:** list + add/edit (5 roles **+ Member**), change passwords, delete (owner/self
  protections). Member accounts log in on the church website (Members —
  Log in), not in this admin. Non-admins see only a "My account" card.
- **Settings:** General (site title, tagline, admin email, timezone),
  Reading (display-only: front page = Home), Permalinks (display-only:
  hash-route slugs), Church Settings (Site Settings fields).

**Drafts & autosave:** saving a DRAFT never touches the live site. Save
Draft on a new page creates a draft post; on a draft post updates it; on a
PUBLISHED post it writes an autosave revision (live page untouched) and the
editor shows "You have unsaved draft changes". Publish applies the blocks,
creates a revision of the pre-publish state, and deletes the autosave.

**Notices:** fixed banner — errors pin to the top until dismissed; saves
confirm with field count + time ("Changes saved — 3 fields updated at 5:12
PM.").

## Roles + capabilities

WordPress's 5 roles, plus `member` (site login only, no admin access).
Capabilities enforced server-side on every endpoint.

| Capability | Administrator | Editor | Author | Contributor | Subscriber | Member |
|---|---|---|---|---|---|---|
| `read` | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| `edit_pages` / `edit_posts` | ✓ | ✓ | ✓ | draft only | – | – |
| `publish_pages` / `publish_posts` | ✓ | ✓ | ✓ | – | – | – |
| `delete_pages` / `delete_posts` | ✓ | ✓ | – | – | – | – |
| `upload_files` | ✓ | ✓ | ✓ | – | – | – |
| `restore_revisions` | ✓ | ✓ | – | – | – | – |
| `edit_users` / `manage_options` | ✓ | – | – | – | – | – |
| Site login (public site) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (only) |

- Owner is always Administrator. Nobody can change the owner's
  role/password except the owner (own-password change); nobody can delete
  the owner or change their own role. `viewer` is accepted as a legacy
  alias for `subscriber` on create/role-change (stored as `subscriber`).
  **`member` has no admin capabilities at all** — admin login as a member
  is rejected (403); members log in on the public site only, and cannot
  change their own password (admins manage member passwords).
- `GET /api/me` → `{ username, role }`; `GET /api/users` →
  `{ username, role, isOwner, createdAt }`, no salts/hashes.

## API routes

### WordPress endpoints (all session-required unless noted)

| Route | Auth / caps | Behavior |
|---|---|---|
| `GET /api/wp/me` | session | `{ username, role }` |
| `GET /api/wp/dashboard` | `read` | Counts + latest 5 revisions |
| `GET /api/wp/pages` | `read` | List (filters: `status`, `q`) |
| `GET /api/wp/pages/:id` | `read` | Post + `autosave` revision or null |
| `POST /api/wp/pages` | `edit_pages` / `publish_pages` | Create page/post |
| `POST /api/wp/pages/:id` | `edit_pages` / `publish_pages` | Update; `autosave: true` on published = autosave only |
| `POST /api/wp/pages/:id/trash|restore|delete` | `delete_pages` | Trash / restore (to `_pre_trash_status`) / permanent delete |
| `GET /api/wp/posts…` | same, post caps | Same shapes + `terms` |
| `GET /api/wp/revisions?post_id=` | `read` | Revision list for a post |
| `POST /api/wp/revisions/:id/restore` | `restore_revisions` | Restore (snapshots pre-restore state first = undoable) |
| `GET /api/wp/media` | `read` | Attachment list |
| `POST /api/wp/media` | `upload_files` | Upload (data-URI ≤1.2 MB or URL) |
| `POST /api/wp/media/:id` | `upload_files` | Update title/alt/caption |
| `POST /api/wp/media/:id/trash|restore|delete` | `delete_posts` | Trash / restore / permanent delete |
| `GET /api/wp/terms` | `read` | Categories/tags + counts |
| `POST /api/wp/terms` | `publish_posts` | Add category/tag |
| `GET /api/wp/options` | `manage_options` | All options |
| `POST /api/wp/options` | `manage_options` | Update options |
| `POST /api/wp/quick-draft` | `edit_posts` | Draft post from title + content |
| `GET /api/wp/events…` | `read` / `edit_posts` / `delete_posts` | Calendar list/get/create/update/trash/restore/delete (same shapes as posts; accepts `title` + `status` aliases) |
| `GET /api/wp/directory…` | `read` / `edit_posts` / `delete_posts` | Directory list/get/create/update/trash/restore/delete (same shapes; accepts `name` + `status` aliases) |

### Site auth + members-only site endpoints

| Route | Auth | Behavior |
|---|---|---|
| `POST /api/site/login` | none | `{username, password}` → `site_session` cookie + `{ok, username}`; any CMS role; 401 on failure |
| `POST /api/site/logout` | site session | Clears cookie + KV key |
| `GET /api/site/me` | none | `{loggedIn, username}` or `{loggedIn:false}` (never returns role/hashes) |
| `POST /api/site/register` | none (invite code required) | `{code, name, email, username, password, confirmPassword}` → creates a `member` account, auto-logs in (sets `site_session` cookie). Generic "This invite link isn't valid." error when disabled/bad code; field-specific `errors` only after code checks pass; 429 past rate limits |
| `POST /api/site/invite/check` | none | `{code}` → `{valid: true/false}` (rate-limited) |
| `GET /api/site/invite` | Administrator (`edit_users`) | `{hasCode, enabled, createdAt}` — never returns the code/URL |
| `POST /api/site/invite/regenerate` | Administrator (`edit_users`) | New code (old dies immediately); returns full `inviteUrl` ONCE for the admin to copy |
| `POST /api/site/invite/toggle` | Administrator (`edit_users`) | `{enabled}` → enable/disable registration |
| `GET /api/site/members` | Administrator (`edit_users`) | Members-group roster (username, name, email, joined date, joined-via) — never salts/hashes |
| `GET /api/site/calendar` | site OR admin session | Published events, date ascending; else 401 `{error: 'Members only.'}` |
| `GET /api/site/directory` | site OR admin session | Published directory entries, name ascending; else 401 `{error: 'Members only.'}` |

Site URL: `https://harvest-church.dinklytics.workers.dev/` — members log in
via the "Members — Log in" header link (route `#/login`). Admin URL:
`https://harvest-church.dinklytics.workers.dev/admin/` — append `/admin`
to the domain; members cannot log in there.

### Legacy shims (SAME request/response shapes as before)

| Route | Behavior |
|---|---|
| `GET /api/content` | Effective overrides vs DEFAULTS (from WP state). **Logged-out:**
  members-only pages/blocks are deleted from the result (not just
  skipped), so no members values leak via DEFAULTS. |
| `GET /api/merged` | Full effective content (from WP state). **Logged-out:**
  members-only pages/blocks deleted, `news.items` = `[]`, no
  calendar/directory data. Privileged responses unchanged. |
| `POST /api/content` | Write-through: flat keys → canonical page blocks + revision; Site Settings → options; `news.items` → replace published News posts; `null` deletes a key; no-op → `{ ok, saved: 0, unchanged: true }`. Requires `publish_pages`. |
| `POST /api/reset` | Site-wide revision, then content tables cleared (users + revisions kept), `wp_migrated="reset"`. Requires `manage_options`. |
| `GET /api/history` | Revision posts → old `{ id, savedAt, changedKeys }` list |
| `POST /api/restore` | Restore a revision (undoable; no-op → `unchanged`) |
| `GET /api/me`, `GET /api/users`, `POST /api/users`, `POST /api/users/password`, `POST /api/users/delete`, `POST /api/users/role`, `POST /api/users/me/password` | Users, exact old shapes; management requires `edit_users` |
| `GET /api/session`, `POST /api/login`, `POST /api/logout`, `GET /api/setup-status` | Unchanged. Login checks `wp_users` with old-key fallback. |
| `GET /`, `GET /admin/` | Site (defaults + client-side overrides) / admin. Admin served with `cache-control: no-store`. |

## Revision history

Revisions are posts (`post_type=revision`), not separate history keys.
Every publish/update of a published post snapshots the pre-write state
(changedKeys = diffed flat keys); no-op writes create no revision. Reset
creates a site-wide revision (parent 0) so reset is undoable. Restores
snapshot the pre-restore state first. At most 30 non-autosave revisions
are kept (oldest pruned); autosaves excluded from history/count. The
admin's History tab is per-page (Revisions list in the editor); the legacy
`GET /api/history` shim lists all revisions newest-first.

## Users

The owner account lives in `admin-pass` (set once at setup) AND in
`wp_users` (migrated copy). Additional users live in `wp_users`.
`admin-users` (legacy) is kept untouched for rollback; new users are
WP-only. Login checks `wp_users` with old-key fallback. Sessions keep the
existing format (`session:<token>` = username, 24-hour TTL) — a session
created before the WordPress deploy stays valid after it.

- Removing a user deletes all their live sessions. Since the
  2026-10-20 hardening, changing a user's password (admin reset) or
  their role also deletes all their live sessions immediately. A user
  changing their OWN password keeps only the session doing it — every
  other session of that account is signed out (WordPress model).
- Owner's own-password change updates BOTH `wp_users` and `admin-pass`
  (the only write to `admin-pass` ever allowed). Usernames are unique
  case-insensitively (including the owner name); additional-user login
  accepts any case. Email-style usernames allowed (3–64 chars, letters,
  numbers, `. _ @ -`).

## Validation

- WP page/post endpoints: blocks validated against `fields.json`
  (per-field types/lengths); blank `""` for top-level image/url accepted
  (the new admin sends full field sets). Legacy `POST /api/content` stays
  strict (unknown keys → 400, `null` deletes a key, body ≤ 200,000 chars).
- Media upload: data-URI ≤ 1.2 MB or `https://` URL. **Quirk:** the
  global 200 KB JSON body cap fires before the media handler's 1.2 MB
  data-URI cap, so the effective data-URI ceiling via JSON is ~200 KB.
  URL uploads are unaffected.
- Terms: categories/tags are string arrays.
- Admins are NOT trusted with markup anymore (2026-10-20 hardening):
  every CMS text value is rejected on save if it contains tag-like
  markup, event handlers, or script URLs (a tiny attribute-free subset —
  `<br> <b> <i> <em> <strong>` — stays allowed because shipped copy uses
  it), and the public site escapes every CMS value at render time with
  a URL scheme allowlist on links/images. Still never share admin
  credentials: editors can change what the site says, just not inject
  code into visitors' browsers.

## Auth: one-time setup flow

There are **no baked-in credentials**. The admin password is set once, after
deploy, by the site owner — the builder never sees it.

1. Owner opens `/admin/` → sees the **Set up the admin password** form →
   enters a username and a strong password. There is no setup token:
   setup is an open first-run step, so the owner must complete it
   **immediately** after deploy.
2. The worker validates the password rules (≥ 12 chars, uppercase,
   lowercase, digit, symbol) and username rules (3–64 chars, letters,
   numbers, `. _ @ -`). It stores a PBKDF2 password record (format v2,
   see "Security hardening" below) in KV under `admin-pass` (and
   `wp_users`), sets `setup-done`, and logs the owner in (session
   cookie).
3. From then on `POST /api/setup` is dead (403). `GET /admin/` shows the
   login form.

Sessions: random token in an `HttpOnly; Secure; SameSite=Lax` cookie,
stored in KV as `session:<token>` with a 24-hour TTL. Hardened sessions
also carry two KV sidecars: `session-csrf:<token>` (the per-session CSRF
token every authenticated POST must present) and `session-meta:<token>`
(created-at, hashed IP, user agent — shown in Admin → Security).

## Security hardening (2026-10-20)

Full audit + fixes, verified by ~50 dedicated harness tests (740 total,
all passing) and live probes. Summary:

- **Passwords:** PBKDF2-HMAC-SHA-512, 150,000 iterations, 32-byte salt
  (record format v2: `{salt, hash, v:2, algo:"pbkdf2-sha512", iter}`).
  150k is empirical: 210,000 exceeds this account's per-request CPU
  budget on the live Worker (login returned 500); 150k verified live
  twice. If the account moves to Workers Paid, raise
  `PBKDF2_ITERATIONS` — records store their own `iter`, old ones keep
  verifying. Legacy salted-SHA-256 records still verify and upgrade
  transparently at the owner's next successful login. The upgrade
  touches ONLY `wp_users`: `admin-pass`/`admin-users` stay
  byte-untouched and legacy-verifiable for rollback. Rolling back to a
  pre-hardening WP build after users have upgraded requires resetting
  upgraded users' passwords. Unknown-user logins run a dummy PBKDF2
  verify so timing doesn't reveal whether an account exists; a KDF
  error fails closed (401), never a 500.
- **Brute force:** failed logins counted per account (10) and per IP
  (30) per hour in KV (`rl:auth-fail-*`); locked accounts get 429 +
  `Retry-After: 900` even with the right password. Counters are
  KV-backed and eventually consistent — under a sustained burst the
  lock engages within a few attempts (live-verified). Setup attempts
  are capped per IP too.
- **CSRF:** every authenticated POST (admin and member site, logouts
  included) requires the session's `x-csrf-token`; cross-site Origin or
  `Sec-Fetch-Site: cross-site` is rejected, non-JSON POST bodies get
  415. Login/setup/register stay open by necessity (no session yet) and
  are rate-limited instead.
- **Headers/CSP:** HSTS, `X-Content-Type-Options: nosniff`,
  Referrer-Policy, Permissions-Policy, COOP, and a hash-based CSP
  (computed per build in `build_worker.py`; no `'unsafe-inline'` for
  scripts) on the site, admin, API, and error responses.
  `X-Frame-Options: DENY` on admin/API, `SAMEORIGIN` + CSP
  `frame-ancestors 'self'` on the public site.
- **Injection:** there is no SQL anywhere — content is allowlist-
  validated JSON in KV; parameterized route IDs reject
  `__proto__`/`constructor`/`prototype`.
- **Session lifecycle:** login always mints a fresh token (fixation
  guard). Admin password resets and role changes sign the target out
  everywhere; own-password change keeps only the current session.
- **Audit log:** security events (logins, failures, lockouts, password
  and role changes, user create/delete, invite changes, session
  revocations, content reset) append to KV `sec-audit` (last 200; IPs
  stored only as truncated hashes). Admin → **Security** shows posture,
  the log, live sessions, and revoke buttons (per user / everyone else
  / everyone). Endpoints: `GET /api/security/status`,
  `GET /api/security/audit`, `POST /api/security/revoke`
  (administrator only).
- **DDoS layers in the Worker:** anonymous `GET /api/content` and
  `/api/merged` are edge-cached 30s (sessions bypass), the WP bootstrap
  is memoized per isolate, a per-IP soft cap (1200 req/min) backstops
  the API, and only GET/POST/HEAD are accepted. Real flood protection
  still lives in the Cloudflare dashboard (Rate Limiting Rules, Bot
  Fight Mode, WAF managed rules, Under Attack Mode) — account-owner
  toggles, listed in the 2026-10-20 security report.
- **Known residual:** the served site HTML still embeds the static
  DEFAULT content (including members-only defaults such as the house
  church list); the APIs strip members-only data and rendering is
  gated, but view-source can read the defaults. Customized members-only
  values live only in KV and are never embedded.

### Changing / resetting the admin password

Use the admin's Users → My account → change-your-own-password (current
password required). To reset from outside: delete the `admin-pass` (and
`setup-done`) keys from the KV namespace, then revisit `/admin/` to run
setup again. To also kill live sessions, delete the `session:*` keys.

## Deploy

```bash
cd ~/workspace/harvest-church-cms-worker
python3 build_worker.py
node --check dist/harvest-church-worker.js
node harness.mjs          # harness against a mocked KV, must all pass
python3 deploy.py         # uploads with the CMS_KV binding preserved
```

Static assets: icons + manifest are embedded in the worker script
(ASSETS map, base64); the font and logos are inlined as data-URIs in the
site template; the QR encoder is vendored into the admin template. The
built worker is ~1,044,925 bytes. Unknown paths fall back to the site
HTML (SPA fallback), never 404. Rollback: `dist/backup-2026-10-17-slimmed.js`
preserves the interim KV-backed slim build; `dist/backup-2026-10-16-pre-slim.js`
is the pre-slim build (byte-identical to the current build) — redeploy
either with `deploy.py` if anything fails live.

Deploy notes:
- Uploading **replaces** the live worker. The public site is unchanged by
  the deploy itself: the worker serves the same site HTML, and content
  comes from the WP tables (migrated from the old keys on first request).
- **Always use `deploy.py`.** The generic `deploy_worker.py` omits KV
  bindings from the upload metadata, which would strip `CMS_KV` from the
  live worker. `deploy.py` includes
  `{"type": "kv_namespace", "name": "CMS_KV", "namespace_id": "fcf39ee1db9243349b76583fe6b149b6"}`.
- Module-worker upload rule: the file part must carry
  `Content-Type: application/javascript+module`, and
  `metadata.main_module` must match the form field name AND `filename=`,
  or the API returns 10021.
- If the Cloudflare "verify you're human" checkbox appears, a human must
  clear it — automation cannot.
- The `workers.dev` subdomain toggle is dashboard-only (Workers & Pages →
  script → Settings → workers.dev). The existing `harvest-church` worker
  already has it enabled; uploading to the same script name preserves it.
- Without the `CMS_KV` binding the public site still renders defaults
  (the bootstrap fetch fails and falls back), but `/admin/` will fail —
  the binding is required for the CMS to function.

### Verify after deploy (use curl — Cloudflare blocks Python urllib to *.workers.dev with 403)

```bash
curl -s https://harvest-church.dinklytics.workers.dev/ | grep -o "You belong here" | head -1
curl -s https://harvest-church.dinklytics.workers.dev/admin/ -o /dev/null -w "%{http_code}\n"
curl -s https://harvest-church.dinklytics.workers.dev/api/content        # → owner overrides, unchanged by deploy
curl -s https://harvest-church.dinklytics.workers.dev/api/setup-status   # → {"setupRequired":false}
curl -s https://harvest-church.dinklytics.workers.dev/api/merged | head -c 400
```

## Local verification (done 2026-10-16)

- `node --check` on the built worker + the admin's extracted script block.
- `node harness.mjs` — **420/420 pass** against the built worker with a
  mocked KV: public routes, merged defaults (all pages/sections, no base64
  blob), 401 without session, throwaway setup + login (mock KV only, never
  the real admin password), scalar/repeater/stringlist saves, null-delete
  reverts, alias vs canonical precedence, teams-transform alias, validation
  rejections, reset, logout, users (create/login/duplicate/weak-password/
  password-change/delete/owner-self guards, all endpoints 401 without
  session), roles (5-role × endpoint matrix, contributor draft-only,
  legacy no-role → administrator, viewer → subscriber), plus WordPress:
  lazy migration (overrides → pages/options, news → posts, history →
  revisions, users, old keys byte-untouched, idempotent), drafts never in
  merged, autosave flow, trash/restore/delete + `_pre_trash_status`,
  media CRUD, posts CRUD + News assembly, per-page revisions + undoable
  restore, reset → defaults + site-wide revision + no re-migration, all
  legacy routes with old shapes, non-canonical pages never feeding the
  live site.
- `node render_compare.mjs` — all 14 view functions produce byte-identical
  HTML between the pre-rebuild live template and the rebuilt template,
  and between pre-deploy and post-deploy live HTML.
- Live post-deploy curl checks: site 200, admin 200 (Dashboard/Pages/
  Posts/Media/Users/Settings markers), `/api/content` byte-identical to
  pre-deploy (owner overrides: 12:30 PM service time, "Connects" footer),
  `/api/merged` correct (hero "You belong here.", 6 news items with
  original order + icons, 19 house-church groups), `/api/setup-status`
  `{"setupRequired":false}`, WP endpoints 401 without session, all 7
  `wp_*` keys present, all old keys intact.
- Key prototype facts present: 8:30 AM / 10:30 AM services,
  16796 E. Davenport Road, Winter Garden, FL, house churches, gym setting.

## Rebuilding

```bash
python3 build_worker.py     # rebuilds dist/harvest-church-worker.js
node --check dist/harvest-church-worker.js
node harness.mjs
python3 deploy.py
```

Do NOT re-run `patch_template.py` — it regenerates `site-template.html`
from the upstream prototype and would wipe the CMS edits (it refuses to
run without `--i-know-this-wipes-full-cms-edits`). `site-template.html`
is now the hand-maintained source of truth; if the upstream prototype
changes, port the change into `site-template.html` by hand and re-run the
checks above.

## Showcase note

The Worker implementation and the site/admin templates are proprietary and withheld from this showcase. What is shown: the content model (`fields.json` — every editable field, section, and repeater across the site) and the complete automated test harness (`harness.mjs` — 740+ checks covering authentication, roles and permissions, members-only enforcement, invite registration, version history, and the security suite), which together evidence the system's scope and rigor. The system itself is live at the URL in the portfolio index.
