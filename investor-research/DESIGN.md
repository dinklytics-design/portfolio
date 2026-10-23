# DESIGN.md — Don't Waste Your Money design tokens

The site's own design language, formalized in Phase 4 (2026-10-21). All tokens
live in `:root` in `public/styles.css`. **New UI uses tokens, never raw
literals** — if a value you need is not here, add a token first; do not inline
a one-off hex or px.

## The language

Navy + optic yellow on a light grey page: deep navy header/hero/footer, white
cards with hairline borders and soft shadows, yellow reserved for the primary
action and small accents, plain-language labels, system fonts only, 44px+
touch targets, pill-shaped controls.

## Tokens

### Palette
| Token | Value | Used for |
|---|---|---|
| `--navy` | `#0a1b31` | header, hero base, headings, primary surfaces |
| `--navy-2` | `#14395a` | hero gradient end |
| `--navy-3` | `#101f2e` | ticker strip background |
| `--navy-line` | `#243447` | hairlines on navy |
| `--ink` | `#16222e` | body text |
| `--muted` | `#5b6b7a` | secondary text, stamps, notes |
| `--slate` `--slate-dark` `--slate-mid` | `#64748b` `#334155` `#475569` | neutral greys (cash chip, dots) |
| `--mist` `--cloud` | `#94a3b8` `#cbd5e1` | faint text on navy |
| `--line` `--line-2` `--line-3` `--line-soft` `--grey-line` | `#e2e8ee` `#e2e8f0` `#dde3e9` `#eef2f6` `#d1d5db` | borders, tracks, dividers |
| `--bg` `--card`/`--white` `--panel` | `#f7f8f9` `#fff` `#f8fafc` | page, cards, inset panels |
| `--hover` `--hover-2` | `#f4f8ff` `#eef4ff` | row/card hover |
| `--accent` | `#0b6e4f` | (legacy green accent) |
| `--accent2` | `#d8e31e` | optic yellow — primary buttons, accents, focus glow |
| `--link` | `#0b5cad` | links and focus outlines |
| `--eyebrow` `--lede` | `#7fb3d5` `#dbe7f3` | hero eyebrow / lede text on navy |
| `--warn` `--warn-line` `--warn-bg` `--warn-border` | `#fff3cd` `#e6c200` `#fff8e1` `#f0d98c` | warnings, disclaimer |
| `--ok-*` | greens | "Confirmed / on track" pills, enabler fills |
| `--est-*` `--blue-*` `--cyan-ink` | indigo/blue | "Estimated" pills, core fills |
| `--amber-*` | ambers | "Verify / to watch" pills, satellite fills |
| `--bad-*` | reds | "Changed our mind" pills, break states |
| `--good-chip` `--good-line` | `#e8f3e8` `#b7d7b7` | positive chip |
| `--overlay` | `rgba(10,27,49,.45)` | dialog/palette backdrops |
| `--shadow-dialog` | `0 24px 64px rgba(10,27,49,.35)` | dialog/palette shadow |

### Radii
`--radius` 14px (base) · `--radius-2xs` 4 · `--radius-xs` 6 · `--radius-sm` 8 ·
`--radius-md` 10 · `--radius-lg` 12 · `--radius-xl` 16 · `--radius-2xl` 20 ·
`--radius-pill` 999px · `--radius-round` 50%.

### Spacing
`--space-N` where N is the px value: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48, 56, 58, 64, 72, 76.
Use for padding, margin, gap, and inset offsets.

### Type
`--text-N` where N is the px value: 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22,
26, 28. Fluid display sizes (hero/H2 `clamp()` expressions) stay literal by
design — they are the type scale's fluid steps.

## What intentionally stays literal (audited 2026-10-21)

- `rgba()` shadow/overlay alphas and box-shadow geometry — one-off
  transparency steps of the palette colors.
- Border widths (1px/2px/3px/5px hairlines) and outline widths/offsets.
- Fixed component sizes: logo 40px/28px, 44px touch targets, 1160px layout
  cap, table min-widths, carousel geometry.
- `clamp()` fluid type, gradient stop geometry, grid track sizes, backdrop
  blur radii, `translateY(-1px)` hover micro-offsets, the skip-link's
  off-canvas `-9999px`, and the mobile table bleed `margin:0 -16px`.
- The `<meta name="theme-color">` in index.html (HTML cannot read CSS vars).

## Rules for new UI

1. Colors, radii, spacing, and font sizes come from tokens — no exceptions
   for new components.
2. Yellow is for the primary action and small accents only; navy carries the
   structure; status colors come only from the `--ok/--est/--amber/--bad`
   families (they are the pill system).
3. Plain-language labels; the site's banned-word list applies to rendered
   copy (see the goal GOAL.md).
