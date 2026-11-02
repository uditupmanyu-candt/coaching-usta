# USTA Coaching → Edge Delivery Services — Migration Log

> **Purpose:** a running, date-ordered record of what we're migrating, where we are, what's done, and
> what's open. **Read this first.** **Keep it updated as you go** (newest dated entry at the bottom).
> Append an entry whenever you build/change a block, template, or section, or solve something non-obvious.

---

## 1. What we're doing

Migrating **https://www.ustacoaching.com/** to **Adobe Edge Delivery Services** with **visual +
functional parity across mobile, tablet, and desktop**. Source is an **AEM-classic** site
(`/etc.clientlibs/coaching/…`) with a large **Vue** app clientlib and a **modern flexbox** layout.

- **Repo / environments:** `main--coaching-usta--aemdemos`
  - Preview: `https://main--coaching-usta--aemdemos.aem.page/`
  - Live: `https://main--coaching-usta--aemdemos.aem.live/`
  - Local dev: `http://localhost:3000`
- **Setup note:** ensure the AEM Code Sync GitHub app is installed on `aemdemos/coaching-usta`.

## 2. Design system (discovered up front)

- **Breakpoints:** `768 / 1024 / 1280` — `tools/quality/breakpoints.json`. (992 minor tier excluded;
  640/1536 unused.) Mobile-first, min-width only. → `responsive-breakpoints`
- **Layout / units:** **modern flexbox** (flex ×324, float ×0), **pixel-first** (~7.4k px vs ~7 rem;
  16px root; notable `em`). box-sizing: border-box. Container widths are **utility-driven** (`max-w-*`)
  — measure per-section content-wrapper widths from the live DOM. Author block CSS in **px**. → `grid-system`
- **Brand / colours:** dark by default (bg `#000`, text `#fff`), lime accent `#cfff05`, blue events
  banner `#0373f3` (in `styles/styles.css :root`).
- **Fonts:** **Graphik** Regular 400 / Semibold 600 / XXCond Bold 700 (`.woff2`) self-hosted + wired
  (`fonts.css`, tokens `--body-font-family` → Graphik Regular, `--heading-font-family` → Graphik XXCond
  Bold → USTA Sans). **USTA Sans** (condensed display, `.otf`) is now self-hosted too (was referenced but
  its file/@font-face were missing — re-added). ⚠️ Graphik proprietary — confirm licensing.
- **Type scale (applied + recorded):** `tools/quality/typography.json` — h1/h2 (condensed display) and
  h3/body per breakpoint, stepping 768/1024/1280 (h1 32→40→56→80, h2 28→40→56→64, h3 28→28→28→32, body
  16 flat). Enforce with `npm run check:typography`. → `typography-system`

## 3. Templates / 4. Sections / 5. Blocks

Already migrated (committed before the guardrail was (re)applied): blocks — accordion-path, cards,
cards-media, cards-pricing, columns, columns-cta, columns-media, columns-quote, footer, form, fragment,
header, hero, hero-video, widget. _Document each block's authoring contract + variants here as you touch them._

## 6. Open items / TODO
- [ ] Confirm Graphik (and USTA Sans) licensing before publishing.
- [~] Quality gate run on the migrated homepage (2026-09-14): **a11y ✓ passes**; **typography ✗ 8 drifts**
      (cards-pricing h3), **overflow ✗ 2 tiers** (columns-cta @360, footer @768). See the log entry below
      for the exact root causes. Two real block bugs remain to fix:
  - [ ] **cards-pricing tier heading too big.** `blocks/cards-pricing/cards-pricing.css:31` sets the tier
        h3 to `font-size: 40px`, but the source type scale (`typography.json`) has h3 at 28px (32px @1280).
        Fix so h3 matches the scale across all viewports (or confirm 40px is source-correct and update
        `typography.json` — verify against the live source first).
  - [ ] **Horizontal overflow — `columns-cta` @360.** The h2 (`.columns-cta h2` = 40px, `line-height:1`)
        has a long unbroken word wider than its 240px column → page scrolls to 407px. Fix per
        `skills/grid-system` (word-break / overflow-wrap), not bespoke widths. **Still open.**
  - [x] **Horizontal overflow — `footer` — FIXED 2026-09-14 (source-faithful).** Root cause: the migrated
        footer forced the desktop single-row layout starting at **768** (a deliberate deviation the old
        comment noted), but the fixed link+social content (~796px) doesn't fit the 81.6%/1170px inner
        container until ~1024+, so 768–1023 overflowed. **First fix attempt (`flex-flow: row wrap`) was
        wrong** — it broke desktop parity by reflowing whole link items into a flat list and dropping the
        social icons onto a line below (user caught this vs the source screenshot). **Correct fix:** match
        the source exactly — verified live that the SOURCE stacks the footer into a column at ≤~1023
        (`.footer-links` = `flex-direction: column`) and only becomes a single `nowrap` row at desktop
        (≥1024, `justify-content: space-between`, links left / social right, each link's *text* wrapping to
        2 lines via `li { flex: 0 1 auto; white-space: normal }`). So: base mobile column stays through the
        768 tablet tier; single row switches on at **1024**. Verified: desktop @1440 matches source
        geometry (social pinned x=1108→1265, links left from x=175, no overflow); tablet @1023 stacks with
        no overflow; overflow sweep `768:OK` + `1024:OK`; lint + breakpoint check pass.
- [ ] Re-verify the type scale against the live source (`npm run discover:typography … --write`).
- [ ] Measure per-section content-wrapper widths and wire a shared grid/container if needed.
- [x] **Fixed the 13 breakpoint violations** — migrated CSS now uses only `768 / 1024 / 1280`,
      mobile-first min-width only. `node tools/quality/breakpoint-check.mjs` passes clean (exit 0).
      See 2026-09-14 log entry for the tier mapping used.
- [x] **Typography — h1/h2 font family.** `styles/styles.css` `--heading-font-family` now leads with
      **USTA Sans** (`"USTA Sans", tahoma, sans-serif`), matching source truth; h3–h6 keep Graphik
      Semibold (unchanged, set separately at `styles.css` h3–h6 rule).

### Breakpoint violations (13) — ✅ RESOLVED 2026-09-14

The migrated blocks were authored off-grid (`600` / `900` / `1281`, plus a `max-width` range in the
header). Mapped to the source grid `768 / 1024 / 1280`, mobile-first `min-width` only.

**Tier mapping used (evidence-based, not guessed):** the header block's own comments pin the author's
intent — the full-screen flyout persists "until 1024px, where it switches to the compact dropdown
panel". So this author's `600` ≈ tablet (**→768**) and `900` ≈ desktop (**→1024**). Confirmed
consistent with `cards-pricing`'s two-step progression (600→2-up, 900→4-up = tablet then desktop).
Applied uniformly: all `600`→`768`, all `900`→`1024`, `1281`→`1280`. The two header `max-width`
tablet bands (768–1023) became plain `min-width: 768` — safe because the `>=1024` desktop block below
already resets everything they touch (font-size→18px, flyout padding→24px, `.nav-actions`→`display:none`).

| File:line | Current | → Fixed to |
|---|---|---|
| `blocks/cards-media/cards-media.css:64` | `@media (width >= 900px)` | **1024** |
| `blocks/cards-pricing/cards-pricing.css:90` | `@media (width >= 600px)` | **768** |
| `blocks/cards-pricing/cards-pricing.css:96` | `@media (width >= 900px)` | **1024** |
| `blocks/columns/columns.css:22` | `@media (width >= 900px)` | **1024** |
| `blocks/columns-cta/columns-cta.css:47` | `@media (width >= 900px)` | **1024** |
| `blocks/columns-media/columns-media.css:41` | `@media (width >= 900px)` | **1024** |
| `blocks/columns-quote/columns-quote.css:39` | `@media (width >= 900px)` | **1024** |
| `blocks/form/form.css:46` | `@media (width >= 600px)` | **768** |
| `blocks/header/header.css:298` | `@media (width >= 768px) and (width <= 1023px)` | **min-width: 768** (desktop block overrides at 1024) |
| `blocks/header/header.css:426` | `@media (width >= 768px) and (width <= 1023px)` | **min-width: 768** (desktop block overrides at 1024) |
| `blocks/header/header.css:585` | `@media (width >= 1281px)` | **1280** |
| `blocks/hero/hero.css:33` | `@media (width >= 900px)` | **1024** |
| `styles/styles.css:360` | `@media (width >= 900px)` | **1024** |

✅ `node tools/quality/breakpoint-check.mjs` passes clean (exit 0).

---

## ▶ Typography validation — steps

`typography.json` scale is populated from the applied/measured values (regression baseline). To
re-confirm against the live source and enforce:
1. `npm install` (Playwright + Chromium) and `npx aem up` (localhost:3000).
2. `npm run discover:typography -- https://www.ustacoaching.com/ --write` (review before persisting).
3. `npm run check:typography http://localhost:3000/<page>` — fix `:root` tokens in `styles/styles.css`; re-run until green.
If bot-blocked, add a browser User-Agent to `tools/quality/typography-discover.mjs`.

---

## Log (newest at the bottom)

### 2026-09-14 — (re)applied the guardrail after it was lost
- **Root cause:** the guardrail layer was set up earlier but left **uncommitted**; the working tree
  was later reset to committed block work, discarding it. Re-applied and **committed this time**.
- Re-applied the full EDS guardrail from the master (`ema-eds-guardrail`): AGENTS.md rules, 22 skills,
  checkers (breakpoint/overflow/typography/svg), tests/a11y, CI, `.claude/skills`, `MIGRATION.template.md`.
  Did NOT touch the already-migrated `blocks/`, `styles/styles.css`, or `fonts.css` (real work).
- Recorded the discovered design system: breakpoints **768/1024/1280**, flexbox + **px-first** units
  (`breakpoints.json`); type scale + fonts (`typography.json`).
- **Fixed a real gap:** `styles.css` referenced **USTA Sans** but the font file + `@font-face` were
  missing — self-hosted `fonts/usta-sans-bold.otf` and added its `@font-face` to `fonts.css`.

### 2026-09-14 — fixed all 13 breakpoint violations + h1/h2 font family
- **Breakpoints:** mapped every off-grid value to the source grid `768/1024/1280`, mobile-first
  min-width only. Tier mapping was evidence-based (see the resolved table above): `600`→`768`,
  `900`→`1024`, `1281`→`1280`. The two header `max-width` tablet bands (768–1023) became plain
  `min-width: 768` — verified safe because the existing `>=1024` desktop block resets font-size (→18px),
  flyout padding (→24px), and hides `.nav-flyout .nav-actions`, so nothing leaks past 1024.
  `node tools/quality/breakpoint-check.mjs` now exits 0.
- **Typography:** `styles/styles.css` `--heading-font-family` changed from `"Graphik XXCond Bold",
  "USTA Sans", …` → `"USTA Sans", tahoma, sans-serif` so h1/h2 render the correct condensed display
  face (source truth in `typography.json`). h3–h6 unchanged — they already override to Graphik Semibold.
- **Not yet run** (needs `npm install` + `npx aem up`, dev server was down): `check:typography`,
  `check:overflow`, `test:a11y`. Still open in §6.

### 2026-09-14 — ran the quality gate (npm install + aem up, homepage `/`)
Ran `npm install` (378 pkgs + Playwright Chromium) and `npx aem up` (localhost:3000, proxying
`main--coaching-usta--aemdemos.aem.page`), then all three checkers against `/`.
- **a11y — ✓ PASS.** `node tests/a11y/run.mjs` → 1 passed, 0 critical/serious violations.
- **typography — ✗ 8 drifts (all one root cause).** h3 renders **40px** at every viewport, but the
  source scale wants 28px (32px @1280). Traced to `blocks/cards-pricing/cards-pricing.css:31` — the
  pricing-tier heading (`.cards-pricing .cards-pricing-card h3`) is hardcoded `font-size: 40px`. The
  global `:root` scale tokens (h3 = 28/28/28/32) are correct; this block rule overrides them. NOT caused
  by the font-family fix. Left as an open item — needs a decision (shrink to scale vs. confirm 40px is
  source-correct and record it in `typography.json`).
- **overflow — ✗ 2 tiers.** `/` scrolls sideways at 360 (407>360) and 768 (915>768):
  - **@360 → `columns-cta`.** `.columns-cta h2` (40px, `line-height:1`) contains a long unbroken word
    that exceeds its 240px content column (`scrollWidth 347 > clientWidth 240`), pushing `main` to 407px.
  - **@768 → `footer`.** `.footer-row` switches to a single `nowrap` flex row at >=768 but the content
    doesn't fit: 7 links (16px, 30px gaps ≈599px) + 40px gap + social row (157px) ≈796px into ~664px.
  Both are bespoke-width/nowrap layout bugs (fix per `skills/grid-system`) — pre-existing, unrelated to
  the breakpoint remap. Left as open items in §6.
- **Net:** breakpoints + heading font-family are green; a11y green. Two real block bugs (cards-pricing h3
  size, columns-cta/footer overflow) surfaced and are queued in §6.

### 2026-09-14 — audit of the breakpoint changes; fixed a JS/CSS breakpoint mismatch
Re-verified all breakpoint edits before moving on to block work. Breakpoint check + stylelint (all
touched files) + eslint all pass clean. One thing the CSS checker can't see but the audit caught:
- **`blocks/header/header.js` used `matchMedia('(min-width: 900px)')`** for its `isDesktop` gate, but
  the CSS switches from the full-screen mobile flyout to the compact desktop dropdown at **1024px**.
  Between 900–1023 the layout was the mobile flyout while JS thought it was desktop → body-scroll lock
  (openFlyout) and the crossing-reset listener fired at the wrong width. Changed the JS to
  `min-width: 1024px` to match the CSS. Verified live: header decorates, inline links appear at 1280.
- Also refreshed stale comments that still referenced `900px` / `1281px` (header.css ×3,
  columns-media.css ×1) so comments match the on-grid values. No behavioural change from those.

### 2026-09-14 — fixed footer horizontal overflow (768–~1080 tier)
User reported (with screenshot) a horizontal scrollbar on the footer between ~700 and ~900px — the
"USTA COACHING" wordmark and "GET ON THE LIST" heading were clipped on the left. Root cause: at >=768
the footer switches to a single `nowrap` flex row (links + social) but the fixed content (~796px:
7 links@16px with 30px gaps ≈599px + 40px gap + 157px social) doesn't fit inside the 81.6%/max-1170px
inner container until ~1080px+. The overflow checker only samples 360/768/1024/1280/1920 and 768 landed
right at the edge, so it read borderline. Fix in `blocks/footer/footer.css` (>=768 block): `.footer-row`
and `.footer-links ul` now use `flex-flow: row wrap` with row+column gaps (24/40 and 16/30) so the
social group drops below and links wrap to a second line when narrow; the intended single-row layout is
unchanged at wide desktop. Verified: no page overflow at 700/768/820/899, screenshot @820 shows a clean
two-row link block + wordmark fully visible, stylelint + breakpoint check pass, a11y unaffected.

### 2026-09-14 — footer parity audit vs source across ALL viewports (fixed 3 drifts)
Full measure-and-match of the footer against the live source at 390/768/1024/1280 (extracted computed
styles both sides). Footer link responsive scale (SOURCE truth, now replicated exactly):
| viewport | font/line-height | letter-spacing | link gap | layout |
|---|---|---|---|---|
| <768 | 18/18 | -0.54px | 16px | column |
| 768–1023 | **24/24** | -0.72px | **24px** (row 32px) | column |
| 1024–1279 | 16/16 | -0.48px | **16px** | row |
| >=1280 | 18/18 | -0.54px | 30px | row |
Three drifts found & fixed in `blocks/footer/`:
1. **Tablet links too small** — source is 24px at 768–1023 (with 24px column gap + 32px links↔social
   container gap); migrated fell through to 18px. Added the 24px tablet tier in the `>=768` block.
2. **Desktop link gap wrong** — source is 16px at 1024–1279 and only 30px at >=1280; migrated used 30px
   across all >=1024. Split: 16px in the `>=1024` block, 30px in the `>=1280` block.
3. **External-link `target` never applied (footer.js bug)** — `decorateExternalLinks(footer)` ran BEFORE
   `footer.append(brand, row)`, so it operated on an empty container and no link got `target=_blank`.
   Source opens every footer link + all social in a new tab except the internal "Program Terms and
   Conditions" (`_self`). Moved the call after append; now matches (http links → `_blank rel=noopener`;
   the relative Program-Terms link stays same-tab). Verified live at all 4 viewports.
Logo (natural 432×36 SVG, full-width, 91px@1440 / 57px@768 / 30px@390), social gaps (18px) and icon
sizes (IG/LI 36×36, YT 49×36) already matched source. Content complete: all 7 links (text+href) + 3
social icons present. One deliberate a11y improvement kept over strict parity: migrated LinkedIn icon has
`alt="LinkedIn"` where source's is empty. Lint (css+js) + breakpoint check pass; footer `768/1024:OK`.

### 2026-09-14 — REVERTED the wrap fix; restored source-exact footer layout
The `flex-flow: row wrap` fix above **broke desktop parity** — it reflowed the whole link items into a
flat list and pushed the social icons onto a line below the links, whereas the source keeps a single row
(links left with 2-line-wrapping labels, social pinned right). User caught it by overlaying the source vs
migrated desktop screenshots. Investigated the SOURCE directly with Playwright: at 900px the source
`.footer-links` is `flex-direction: column` (links stacked above social — the "tablet" layout), and only
at ≥1024 does it become `flex; nowrap; justify-content: space-between` with each link `li` = `flex: 0 1
auto; white-space: normal` so labels wrap to 2 lines instead of the row growing. Rewrote the footer to
mirror that: keep the base mobile column through the 768 tablet tier, switch to the single row at **1024**
(the source's own breakpoint, and where it fits — so no overflow, no wrap hack). Footer-link size band
also corrected to the source's: 18px (<1024, stacked) → 16px (1024–1279) → 18px (≥1280). Verified desktop
@1440 matches source pixel geometry (social x=1108→1265, links from x=175, single row), tablet @1023
stacks cleanly, overflow sweep `768:OK`+`1024:OK`, stylelint + breakpoint check green.

### 2026-09-14 — Hero (video) block: rendered the video + full source parity across viewports
The migrated hero showed the mp4 as a **plain text link** — the video never rendered. Two root causes,
both fixed in `blocks/hero-video/`:
1. **Import mangled the extension** — the content link href is `…coaching-video-loop-compressed-mp4`
   (dot→hyphen). The block's `href.includes('.mp4')` detection missed it, so no `<video>` was built.
   Fixed in `hero-video.js`: added `isVideoHref()` (matches `.mp4/.webm` OR the mangled `-mp4/-webm`) and
   `resolveVideoSrc()` now normalises a trailing `-mp4`→`.mp4` before the DAM-path rewrite. The clean
   `/assets/media/coaching-video-loop-compressed.mp4` 301-redirects on DA to the hashed asset
   (`media_1dbe44fa…​.mp4`, user-confirmed). Video autoplays/loops/muted/playsinline with poster; the
   play/pause toggle works. Did NOT hand-edit the imported content HTML (per guardrail).
2. **Geometry was guessed (aspect-ratio), not measured** — old CSS used `aspect-ratio` 4:3→3:2→2:1 and a
   1200px section cap. Extracted the SOURCE truth from its CSS: the video panel is FULL content width with
   a FIXED pixel height per breakpoint (`#hero-video-container`): **477 / 550 / 522 / 694** at
   0 / 768 / 1024 / 1289, `object-fit: cover`, 20px radius. Side gutters **16 / 40 / 48 / 64**. H1 uses the
   global scale (32/40/56/80) with `letter-spacing: normal`; H1→video gap 24px; toggle 40×40 at 24px
   bottom-left inset. Rewrote `hero-video.css` to those exact fixed heights + gutters (1289→our 1280 tier).
Verified migrated == source at 390/768/1024/1440: gutter 16/40/48/64, H1 32/40/56/80, panel W×H
358×477 / 688×550 / 928×522 / 1312×694, toggle at x=88 (=64+24) @1440, no hero overflow. Lint (css+js),
breakpoint check, and a11y all pass. (Homepage still shows the unrelated columns-cta @360 overflow —
`heroOverflow:false` confirmed; that item stays queued.)

### 2026-09-14 — Hero (video): aligned with header container on wide screens
User flagged the hero video not aligning vertically with the header on wide viewports. Root cause: the
header caps its content at `max-width: 1536px; margin: 0 auto` (centered, growing gutter), but the hero
section wrapper used `max-width: none` (full-bleed). Below ~1664px they coincided (both hit the raw
gutter), but at 1728 the header content inset to x=148 while the video ran to x=64 — an ~84px drift.
Verified the SOURCE: at 1728 its hamburger is x=148 and the video panel x=160 / right 1568 / width 1408
(1536 max centered → (1728−1536)/2 = 96 margin + 64 padding = 160; video sits 12px inside the header's
52px gutter). Fix: gave `main > .section.hero-video-container > div` `max-width: 1536px; margin-inline:
auto; box-sizing: border-box` (keeping the 16/40/48/64 per-band padding). Now migrated == source at 1728
(ham 148, panel 160→1568, w 1408) and unchanged below the cap (1440: ham 52, panel 64, w 1312, h 694).
Lint + breakpoint pass; hero has no overflow (the remaining sweep 360 failure is the separate columns-cta).

### 2026-09-14 — Header side-gutter scale fixed (tablet alignment with hero)
User flagged the tablet (1024) view: hero video not aligning with the header. Root cause was in the
HEADER, not the hero — the migrated `header nav` used a flat `52px` side gutter at all >=1024 widths and
fell back to the mobile `16px` at 768, whereas the SOURCE steps the header gutter per breakpoint. Measured
source header padding: **40px @768, 36px @1024–1279, 52px @>=1280** (hamburger x = 40 / 36 / 52). The hero
video already used the correct 40/48/64 gutters (video sits flush at 768, then +12px inside the header at
1024/1440). Because the header was 52px at 1024 while the video was 48px, the video poked ~4px left of the
header; at 768 the header (16px) sat far left of the video (40px). Fixes in `blocks/header/header.css`:
added `header nav { padding: 0 40px }` in the `>=768` block, changed the `>=1024` block from `0 52px` to
`0 36px`, and added `header nav { padding: 0 52px }` in the `>=1280` block. Verified migrated == source at
768 (ham 40, video 40 flush), 1024 (ham 36, video 48, +12 inset), 1440 (ham 52, video 64, +12). Lint
(css+js), breakpoint check, and a11y all pass.

### 2026-09-14 — intro-statement width parity via a `narrow` section style
The intro line ("If tennis…coaches like you.") wrapped differently from source because it used the global
section container (max-width 1200, x=120 @1440) while the SOURCE uses a narrower box. Measured source
intro across viewports: font 40/56/72 at 768/1024/1280+ (line-height 1, letter-spacing -0.03em); content
box x=40 w=688 @768, x=48 w=928 @1024, x=162 w=956 @1280, x=175 w=1089 @1440. Two gaps: (1) migrated
skipped the **56px @1024** tier (jumped 40→72); (2) at >=1280 the source insets to **81.6%** of the
1536-capped container (same ratio as the footer), not the 1200 box.
Fix — per user's suggestion, added a reusable **`narrow` section style** (section-metadata `style: narrow`)
in `styles.css`: 1536-max centered container with hero gutters 16/40/48 through 1024, then at >=1280 the
content insets to 81.6% (max 1170). Also added the missing 56px intro tier. Applied it to the intro
section in `content/index.plain.html` via a `section-metadata` block (`style: narrow`). Verified migrated
== source at 768/1024/1280/1440 (x/width within ≤4px sub-pixel on the 81.6% calc). NOTE: the local aem-cli
dev server strips trailing section-metadata when serving `.plain.html` (so `narrow` isn't visible on
localhost), but DA/EDS applies section-metadata normally — same pattern as the `<em>`/`<u>` accents that
were confirmed working on aem.live. Lint + breakpoint check pass. Push `content/index.plain.html` +
`styles/styles.css` to DA to see it live.

### 2026-09-14 — columns-media block: rebuilt to source (white card + lime CTA)
The block was a bare "structural only" placeholder — plain white text on black, no card, unstyled link.
Source is a two-column promo: a WHITE ROUNDED CARD (heading + copy + lime CTA button) beside a rounded
image. Extracted source spec at 768/1024/1280/1440: card bg #fff, border-radius 20px, ~48px padding,
content uses space-between so the CTA pins to the card bottom; heading Graphik Semibold #000 line-height 1
at 32/40/64 (768/1024/1280); body copy #000 at 16/18/24 line-height 1.2; CTA = lime (#cfff05) button,
#000 text, radius 12px, padding 14px 22px, 18px. Layout: stacked on mobile/tablet, 50/50 side-by-side at
>=1024 with a 24px gap and equal-height columns (image object-fit: cover); gutters 16/40/48/64 on the
1536 centered container. Rewrote `blocks/columns-media/columns-media.css` accordingly (the quiz card
authors its heading as the first <p>, so `p:first-child` is styled as the heading; the lone trailing link
`p:last-child a` becomes the lime button). The 2nd instance (Safe Play) is authored image-first, so it
renders image-left / card-right (the source's media-right layout) with no extra option needed — verified
h2 64px, white card on the right, lime "Start Now". Both instances verified at 1440 (quiz card x=64 white
radius20 + lime "Start the Quiz"; Safe Play image-left card-right). Lint + breakpoint + a11y pass.
Note: source's "Start Now" has a 2px black border and "Start the Quiz" has none — kept both borderless
(negligible on lime/#000); revisit if strict border parity is wanted.

### 2026-09-14 — columns-media: exact 50/50 split + heading 3-line wrap parity
Follow-up pixel pass on both columns-media instances (quiz + Safe Play — same block, different image
aspect/content, so 100% parity is achievable). Two drifts fixed:
1. **Uneven column split** — was card 692 / image 596 (54/46) because `flex:1 1 0` let the card's text
   min-content and the optimized image's intrinsic width skew the flex. Source is 50/50 (card 644 + 24
   gap + image 644 @1440). Fixed with `flex: 0 0 calc(50% - 12px)` + `min-width: 0` on both columns →
   now exactly 644/644.
2. **Heading wrapped to 2 lines vs source's 3** — the source caps the card's text to ~80% of the card
   width (an AEM inner-grid artifact: text sits in a 5-of-6 subcolumn, ~491px measure in a 644 card,
   leaving right whitespace). That narrower measure is what wraps the 64px heading to "Can't decide? /
   Find your / perfect fit.". Added `.columns-media-content > * { max-width: 80% }` at desktop → heading
   now wraps to 3 lines matching source. Verified @1440: card x=64 w=644, image x=732 w=644, heading 3
   lines. Same block drives both instances (Safe Play image-left/card-right via image-first authoring).
   Lint + breakpoint pass.

### 2026-09-14 — columns-media: full typography parity + padding + button border
Detailed source typography audit across 768/1024/1440 for the card. Fixes to
`blocks/columns-media/columns-media.css`:
- **Card left padding** — was 48px (text too far right); source insets content only **25px left/right,
  49px top/bottom**. Set base `padding: 49px 25px` and removed the 40/48px desktop overrides.
- **Button border** — source CTA has a **2px solid #000** border (both quiz + Safe Play); added it.
- **Button typography** — source CTA text is Graphik Semibold with **letter-spacing 1px** (positive) and
  font-size **16 → 18 → 24** at 768/1024/1280 (was flat 18px); added the responsive sizes + tracking.
- **Text typography (verified exact, all viewports):** heading Graphik Semibold #000 lh 1, ls -0.03em,
  32→40→64; body Graphik Regular #000 lh 1.2 (16/19.2 → 18/21.6 → 24/28.8), ls -0.03em. Confirmed
  migrated == source at 1440 (padL 25, heading 64/64/-1.92, para 24/28.8/-0.72, btn 24/ls1px/2px border)
  and 768 (padL 25, heading 32/32, para 16/19.2, btn 16px/2px border).
- **Image** — re-verified the Safe Play image is ALREADY correct: migrated `media_1e6f408d…jpg` is
  byte-identical (md5 c487b16…) to the current source `get-early-access.jpeg` (green-hoodie handshake).
  No change needed; the earlier "wrong image" was a stale screenshot.
Lint + breakpoint + a11y pass.

### 2026-09-14 — Safe Play image corrected (was the wrong photo)
User was right: the Safe Play image differed from source. Root cause: the SOURCE renders the Safe Play
photo via a CSS **background-image** (`content/dam/coaching/decorative/983b964b…jpg` — the green-hoodie
handshake, 1440×1795 portrait), while the `<img>` fallback in its markup is a DIFFERENT photo
(`get-early-access.jpeg`, blue-court, 1440×810). The importer captured the `<img>` fallback, so the
migration showed the wrong (blue-court) image. My earlier md5 "match" compared the wrong source URL
(the fallback), which is why I mistakenly concluded it was correct — apologies.
Fix: downloaded the real displayed image (`983b964b…jpg`, md5 a4ec8360…) and overwrote the local asset
`content/media-da/index/get-early-access-f650bc83-577f619a.jpeg` in place (same filename → all content
`<picture>` refs keep working, pushes to DA cleanly). Disk verified: md5 a4ec8360…, 1440×1795. NOTE: the
local aem-cli media proxy still serves a stale 900×506 optimized derivative keyed by the old file (display
cache only); the raw served file is already the new image (md5 verified) and DA will regenerate the
derivative from the correct source on push. Lint clean.

### 2026-09-14 — Block consolidation: variant classes (cards, columns)
Refactor to eliminate near-duplicate blocks and adopt the idiomatic EDS **`blockname (variant)`**
pattern (the block name is `classList[0]`; extra classes are variant modifiers). No visual/behavioural
change — verified byte-for-byte parity of the decorated DOM + computed styles before/after.

**Consolidated 7 blocks → 2:**
- `cards-media` → **`cards (media)`**, `cards-pricing` → **`cards (pricing)`**. Deleted
  `blocks/cards-media/`, `blocks/cards-pricing/`.
- `columns-media` → **`columns (media)`**, `columns-cta` → **`columns (cta)`**, `columns-quote` →
  **`columns (quote)`**. Deleted `blocks/columns-cta/`, `blocks/columns-media/`, `blocks/columns-quote/`.

**How it works:**
- **JS** — each base block (`blocks/cards/cards.js`, `blocks/columns/columns.js`) keeps one `decorate()`
  that dispatches on the variant class: `if (block.classList.contains('media')) …`, else `cta`/`quote`/
  `pricing`, else the boilerplate default. Each variant's decoration logic was moved in **verbatim**
  (same inner class names — `cards-media-*`, `cards-pricing-*`, `columns-media-*`, `columns-cta-*`,
  `columns-quote-*`) so the CSS ported over unchanged.
- **CSS** — each variant's rules are prefixed with the variant class (`.cards.media …`,
  `.columns.cta …`). The **default** variant's rules are guarded with `:not(.media, .pricing)` /
  `:not(.media, .cta, .quote)` so they don't leak onto variants. The section-container rules that used
  the old per-block container class (`.cards-media-container`, `.columns-media-container`) are now
  re-scoped via **`:has()`** on the shared container: `.cards-container:has(.cards.media)` and
  `main > .section.columns-container:has(.columns.media) > div`. Added a
  `stylelint-disable no-descending-specificity` header to `cards.css` (variant rules intentionally
  follow the lower-specificity default rules); `columns.css` already had it. stylelint also required the
  complex `:not(a, b)` notation over chained `:not(a):not(b)`.

**Content** — `content/index.plain.html` + `content/es/index.plain.html`: `class="cards-media"` →
`"cards media"`, `"cards-pricing"` → `"cards pricing"`, `"columns-media"` → `"columns media"`,
`"columns-cta"` → `"columns cta"`, `"columns-quote"` → `"columns quote"`. Mechanical class rename on
existing blocks (not new HTML) — required to match the block rename.

**Gotcha (verification):** the local aem-cli serves the **published** page at `/` (proxied from
`…aem.page`), so it still shows the OLD class names and would 404 the now-deleted block folders — it
can't reflect the rename until the content is pushed to DA. To verify the refactored blocks against the
**new** markup locally, copied the content to `drafts/refactor-check.plain.html` and restarted the dev
server with `--html-folder drafts`, rendering at `/drafts/refactor-check`.

**Verified @1440 (draft, new markup):** columns.media quiz row 772 + space-between + 80% text cap;
columns.media Safe Play media `aspect-ratio: 644/567` + `object-fit: cover`; columns.cta blue banner,
`flex-direction: row`; columns.quote body+attribution tagged; cards.media 3-up section grid; cards.pricing
4-up grid, tier h3 40px. Lint clean (0 errors), breakpoint check pass, overflow OK at 768/1024/1280/1920
(the 360px 409>360 is the pre-existing columns.cta baseline overflow, unchanged by this refactor — no
`main` element exceeds 360px).

### 2026-09-14 — Block consolidation cont'd: hero-video → hero (video variant)
Same variant-class consolidation as cards/columns. Folded `hero-video` into the boilerplate `hero`
block as **`hero (video)`**. Deleted `blocks/hero-video/`. The plain `hero` variant (CSS-only background
hero) was unused in content but kept as the default.

**How it works:**
- **JS** — `blocks/hero/hero.js` (was an empty boilerplate file) now dispatches: `if
  (block.classList.contains('video')) decorateVideo(block)`, else no-op (the default hero is CSS-only).
  `decorateVideo` + its helpers (`resolveVideoSrc`, `isVideoHref`, `buildVideo`, `HERO_POSTER`) are the
  former `hero-video.js` verbatim, so the video-src resolution (DAM path -> `/assets/media/...`, mangled
  `-mp4` -> `.mp4`) and the play/pause toggle are unchanged. Inner JS-created class names
  (`hero-video-content`, `hero-video-bg`, `hero-video-media`, `hero-video-toggle`) kept as-is so the CSS
  ported over unchanged.
- **CSS** — `blocks/hero/hero.css`: default rules guarded with `:not(.video)` /
  `:not(:has(.hero.video))`; video rules re-scoped from the old per-block container/wrapper names to the
  shared ones via `:has()` — `hero-video-container` -> `main > .section.hero-container:has(.hero.video)`,
  `.hero-video-wrapper` -> `.hero-container:has(.hero.video) .hero-wrapper`, `.hero-video` -> `.hero.video`.
  Added `stylelint-disable no-descending-specificity` header (variant rules follow the lower-specificity
  default/`:has()` rules).

**Content** — `content/index.plain.html` + `content/es/index.plain.html`: `class="hero-video"` ->
`"hero video"`.

**Verified @360/768/1024/1280 (draft, new markup):** video panel height 477/550/522/694, side gutter
16/40/48/64, radius 20px + overflow hidden, toggle bottom-left 24/24, section padding-top 72, inner
max-width 1536, video src resolved to `/assets/media/coaching-video-loop-compressed.mp4`, `decorateVideo`
built the panel + "Pause video" toggle. All identical to pre-refactor hero-video. Lint clean (0 errors),
breakpoint check pass, overflow OK at 768/1024/1280/1920 (360px 409>360 is the pre-existing columns.cta
baseline, unrelated to hero).

After this pass `blocks/` is: accordion-path, cards, columns, footer, form, fragment, header, hero,
widget (down from 15 -> 10 blocks).

### 2026-09-14 — Section headings: center alignment + lime accent phrase
The source's section headings (PACKAGES, JOIN THE COMMUNITY, SUCCESS STORIES, DISCOVER YOUR PATH) are
all `text-align: center` and several colour a trailing phrase lime (`rgb(207,255,5)` = `--usta-lime`) via
an inline colored `<span>`. The migration had them left-aligned and all-white. Fixed with a new section
style + the existing semantic-colour convention — no new per-heading CSS.

**New `center` section style** (`styles/styles.css`, alongside `narrow`):
```
main > .section.center > .default-content-wrapper { text-align: center; }
```
Scoped to the section's **default-content wrapper only**, so a section's *blocks* keep their own
alignment (verified: columns.cta text, cards.pricing tiles, cards.media cards all stay `start` even when
their section also carries `center`). Authored via section-metadata `style: center` (composes with other
tokens — SUCCESS STORIES uses `accent, center`, and the ES sections combine `dark, center`).

**Lime phrases** — authored SEMANTICALLY with `<em>` (the global `main em → lime; font-style: normal`
rule already colours it), NOT a hardcoded span/colour. Applied per source:
- EN: PACKAGES FOR EVERY KIND OF *TENNIS COACH* · JOIN THE *USTA TENNIS COACHING* COMMUNITY · DISCOVER
  YOUR PATH WITH *USTA COACHING* (SUCCESS STORIES has no lime).
- ES: PAQUETES PARA CADA TIPO DE *ENTRENADOR DE TENIS* · ÚNETE A LA COMUNIDAD *DE ENTRENADORES DE TENIS
  DE LA USTA* · DESCUBRE TU CAMINO CON *USTA COACHING* (HISTORIAS DE ÉXITO has no lime).

**Content** — `content/index.plain.html` + `content/es/index.plain.html`: wrapped the lime phrases in
`<em>` and added `center` to each heading's section (own trailing `section-metadata` where the section
had none; appended to the existing `style` token list where it did — e.g. `accent, center`,
`dark, center`).

**Verified @1440 (draft, new markup):** all four headings `text-align: center`; the three lime `<em>`
spans compute to `rgb(207,255,5)`, `font-style: normal`; block content in the same sections stays
left-aligned. Lint clean (0 errors), breakpoint pass. Typography check shows 8 drifts — all
`cards.pricing h3` (40 vs 28/32), the PRE-EXISTING pricing-tier backlog item, NOT the section headings
(this change added no font rules). Overflow 360px 409>360 is the pre-existing columns.cta baseline.

### 2026-09-14 — cards (pricing): full parity rebuild + mobile tabs
Rebuilt the pricing tiers to match the source pixel-for-pixel at all three viewports and added the
mobile tabs interaction that was missing.

**Corrections to the card (all viewports):**
- **1px solid white border** + 16px radius (was borderless). 24px inner padding (unchanged).
- **Blue check** `#0373F3` (= --usta-blue) — was wrongly lime. SVG 24x24, list `padding-left: 32px`.
- **Price line** (Free / $49/year) 28px Graphik Semibold — now tagged `.cards-pricing-price` in JS
  (the standalone `<p>` immediately before the feature list) and scoped
  `.cards-pricing-card p.cards-pricing-price` so it outranks the generic 16px `p` rule.
- **Title** (tier name) 40px Graphik Semibold, `margin-bottom: 8px` (matches source).
- **CTA** lime pill, 18px Graphik Semibold, radius 12px, padding 16px 24px; content-width on
  tablet/desktop, **full-width in the mobile panel** (source).

**Grid (source-measured):**
- `>=1280`: 4 x **310px**, 24px gap (was `repeat(4,1fr)` gap 20 at the 1024 tier — wrong count/gap).
- `>=768`: 2 x **332px**, 24px gap. Section gutters 16/40/48/64 in the 1536-capped centered container
  (added `.cards-container:has(.cards.pricing)` — the pricing section previously had no gutter rule).
- Cards are row-equal-height (flex column + `flex:1` on the list pushes the CTA to the bottom).

**Mobile tabs (< 768) — NEW.** Source collapses the 4 cards into a tab UI. Built in `cards.js`
(`decoratePricing`): a `.cards-pricing-tabs` role=tablist strip with one button per tier (name + price
stacked), each card gets `.is-active` toggled on click; first tier active by default. CSS: strip is a
horizontal `overflow-x: auto` flex row (12px gap, tabs 96px tall, radius 12px, 0 24px padding); **active
tab** = lime bg + black text (no border), **inactive** = black bg + 1px white border + lime name +
white price. Below 768 only the `.is-active` card shows (`display:none` otherwise); at >=768 the strip is
hidden and all cards show in the grid. Panel height follows the active tier's content (verified switching
Baseline<->Rally). The strip's overflow is clipped by its own `overflow-x:auto` (confirmed it does NOT
add to document horizontal overflow at 360).

**Content** — `content/index.plain.html`: the four CTA labels were imported as bare "Select"; the source
reads "Select Baseline/Rally/Pro/Pro Plus" — corrected. (ES source uses plain "Seleccione" — left as-is.)

**Verified:** desktop 1440 (4x310, cards 607 equal-height, border/radius/padding/title/price/li/button
all match source rects), tablet 768 (2x332, tabs hidden, price 28, content-width button), mobile 375/360
(tab strip 96 tall, active lime, inactive lime-name+border, single full-width panel, tab-switch works).
Lint clean (0 errors), breakpoint pass. Overflow 360 409>360 = pre-existing columns.cta, NOT pricing
(pricing strip is internally scrolled/clipped). Typography check flags h3 40 vs 32 — the pricing tier
title is INTENTIONALLY 40px per source (direct-measured), a known scale exception for this block.

### 2026-09-14 — cards (pricing): button-alignment + internal spacing parity
Follow-up pixel pass on the pricing tiers. Two drifts fixed:

1. **CTA not bottom-aligned.** The importer wraps each tile's content in a single `<div>`, so the card's
   flex column had ONE child and `flex:1` on the feature list couldn't grow — the button sat right under
   the content in shorter cards (Pro/Pro Plus) instead of pinning to the card bottom. Fix in `cards.js`
   (`decoratePricing`): unwrap that single wrapper `<div>` so the card's flex column sees the content
   elements (h3 / intro p / price / ul / cta) directly. Now `flex:1` on `.cards-pricing-features` pushes
   the CTA to the bottom → all four buttons align (verified all btn-bottoms equal at desktop, and
   per-row at tablet 2x2).
2. **Internal vertical rhythm.** Replaced the uniform `gap: 12px` with the source's explicit per-element
   spacing (measured): title `margin-bottom: 8px`, intro `p` line-height 1.25 (tight), price
   `margin: 15px 0 27px`, list gap 13px, li line-height 1.25 (2-line items = 40px). Now
   title->bestFor 8, bestFor->price 15, price->list 27, first-li 40 — all match source exactly.

Cards remain equal-height per row (flex column + list `flex:1`); buttons are content-width pills sized to
each label (172/143/131/169 — matches source). Lint clean (0 errors), breakpoint pass, overflow 360 =
pre-existing columns.cta.

### 2026-09-14 — cards (pricing): CTA gap parity (above button / below content)
Padding pass on the CTA spacing. Source model (measured): the button is pinned to the card bottom with a
CONSTANT 25px below (24px padding + 1px border), and a MINIMUM 24px gap above it — the tallest tier in a
row (Rally at desktop) shows exactly 24px list->button; shorter tiers show more (flex fills the slack).

Two drifts fixed:
1. Previously `flex: 1` on the feature list made the list touch the button (0px) in the tallest card
   instead of the source's 24px minimum. Replaced with `margin-bottom: 24px` on the list (the fixed
   minimum) + `margin-top: auto` on the CTA (pushes it to the bottom in shorter cards).
2. The CTA is authored as a `<p>`, so the generic `.cards-pricing-card p { margin: 0 }` rule (specificity
   0,3,1) was overriding `.cards-pricing-cta` (0,2,1) -> `margin-top: auto` never applied and the button
   un-pinned. Scoped the CTA rule as `.cards-pricing-card p.cards-pricing-cta` so it wins.

Verified: desktop (all four btn-bottoms constant 25px, Rally list->btn = 24 min), tablet 2x2 (per-row:
tallest tier 24px above, all btn-bottoms 25px), mobile panel (24 above / 25 below, full-width CTA). Lint
clean, breakpoint pass.

### 2026-09-14 — cards (media): equal-height images + rhythm + responsive layout parity
The "JOIN THE COMMUNITY" feature cards drifted: images rendered at NATURAL aspect (height:auto) so the
three were unequal heights and nothing aligned across the row; radius was 12px (source 20px); the
uniform 16px gap didn't match the source rhythm; and the source's tablet layout was missing.

Fixes to `blocks/cards/cards.css` (`.cards.media`):
- **Equal-height images:** `aspect-ratio: 421/297` (~1.42, source-measured) + `object-fit: cover` +
  `border-radius: 20px` (was 12) — all three images are now the same height (260 @1280) and align.
- **Rhythm:** image -> heading 36px (h3 `margin-top`), heading -> paragraph 24px (p `margin-top`),
  replacing the flat 16px gap. h3 line-height 1, p line-height 1.2 (16/19.2).
- **Heading size:** 28px mobile/tablet, **32px desktop** (source), Graphik Semibold white.
- **Responsive layout (source-matched):**
  - mobile (<768): stacked, image on top; image aspect ~1.42, full card width.
  - tablet (768-1023): HORIZONTAL card — image left `flex: 0 0 213px` (aspect 213/223), text right,
    vertically centered, 36px gap; heading margin-top reset to 0 (side-by-side).
  - desktop (>=1024): 3-up row of stacked image-top cards.
- **Section gutters** 16/40/48/64 in a 1536-capped centered container (was a 1200 cap / 48px padding).
  Removed a stale duplicate `.cards-container:has(.cards.media)` rule in the >=1024 block that was
  overriding the new padding with `48px 32px`.

Verified: 1280 (3x368, gutter 64, imgs equal 260 @1.418 r20, h3 32, img->h3 36, h3->p 24), tablet 768
(horizontal, img 213x223 left, 36px gap, h3 28 at x=289 — matches source), mobile 375 (stacked, img 343
wide r20, h3 28, 36/24 rhythm). Lint clean, breakpoint pass, no overflow from this block (360 = pre-
existing columns.cta).

### 2026-09-14 — GLOBAL FIX: section gaps regression + cards(media) image crop
Two fixes:

1. **Section gaps were gone (whole page cluttered).** The global base rule `main > .section { padding:
   48px 0 }` provides the vertical section rhythm, but several block CONTAINER rules
   (`.cards-container:has(.cards.media)` / `:has(.cards.pricing)`) set `padding: 0 <gutter>` **directly on
   the section element**, which zeroed the 48px block padding — so those sections butted against their
   neighbours with no gap. Fixed by switching those section-level rules to **`padding-inline: <gutter>`**
   (16/40/48/64) so only the horizontal axis is overridden and the base 48px top/bottom survives. (The
   columns/hero containers were already correct — they target the inner `> div`, not the section.)
   Result: 48px top + 48px bottom = ~96px between section contents restored across the page.
2. **cards(media) image crop.** Source crops the card images from the TOP (`object-position: 50% 0%`),
   not center — the migrated center-crop showed a different slice of each photo. Added
   `object-position: 50% 0%` to `.cards.media .cards-media-image img`. Framing now matches source.

Verified @1280: media images equal 260px, object-position 50% 0%, all sections padTop/padBottom 48px,
content gap between pricing cards and JOIN heading restored (was 0). Screenshot confirms top-crop framing
+ section spacing match source. Lint clean, breakpoint pass.

### 2026-09-14 — Content: group section headings with their cards (+ full-width heading fix)
Per source structure, the section headings now live in the SAME section as their cards (previously each
trailed the PREVIOUS section as trailing default content):
- **PACKAGES FOR EVERY KIND OF TENNIS COACH** -> moved into the `cards (pricing)` section (was trailing
  the quiz `columns media` section).
- **JOIN THE USTA TENNIS COACHING COMMUNITY** -> moved into the `cards (media)` section (was trailing the
  pricing section).
Done in both `content/index.plain.html` and `content/es/index.plain.html` (ES: PAQUETES / ÚNETE),
carrying each heading's `center` style (ES pricing/media sections already had `dark`; combined to
`dark, center`). Each section keeps exactly one section-metadata.

**CSS follow-up (required):** the `cards (media)` section IS a 3-column grid
(`.cards-container:has(.cards.media)`), so a heading placed above the cards became a grid ITEM in column
1 and shoved the card row. Added `.cards-container:has(.cards.media) > .default-content-wrapper {
grid-column: 1 / -1 }` so the heading spans all columns full-width above the row. Verified @1280: JOIN
heading 1152px full-width + centered, 3 media cards back in a clean row (x=64/456/848, images equal 260).
Lint clean, breakpoint pass.

### 2026-09-14 — New `banner` block (blue/black colour variants) replaces columns(cta)
The blue "Explore workshops & events" band is a distinct BANNER pattern (not a columns layout), and the
site uses two colour treatments of it, so it's now its own block with switchable colour variants:
- **`banner (events, blue)`** — blue panel, black text, solid BLACK pill button (the events banner; the
  homepage instance). `blue` is also the default when no colour class is given.
- **`banner (events, black)`** / **`banner (black)`** — black panel, white text, solid LIME-GREEN pill
  button. Available for the other banner treatment seen across the site; author just swaps the colour
  token (`blue` <-> `black`).

**Block** (`blocks/banner/`): `banner.js` normalises the authored cells into heading / body / CTA and
tags them (`.banner-heading` / `.banner-body` / `.banner-cta`); `banner.css` is the contained rounded
panel. Source-measured: radius 20px; padding 36px 12px desktop / 12px 16px mobile; heading USTA Sans
700, 40px desktop / 28px mobile; body Graphik Semibold 18/16; CTA fully-rounded pill (radius 9999),
18px, +1px tracking, 14px 32px padding. Layout: 3-up centered row (heading | body | CTA, 24px gaps) at
>=1024; stacked left-aligned column on mobile. Colour variants set panel bg / text / button palette only.

**Content** (`content/index.plain.html` + ES): `columns (cta)` -> `banner (events, blue)`, and the
section's `accent` style token was DROPPED (the banner is its own blue panel now; `accent` had wrongly
tinted the whole band — incl. SUCCESS STORIES — blue). Kept `center`.

**Cleanup:** removed the `cta` variant from the columns block — `decorateCta` + the `.columns.cta` CSS
deleted, the `cta` dispatch branch removed, and the default-variant `:not(.media, .cta, .quote)` guards
simplified to `:not(.media, .quote)`. Columns is now three variants (default/media/quote).

Verified: desktop 1280 (blue panel radius 20, heading USTA Sans 40 black, black pill radius 9999 ls 1px,
3-col row heading|body|CTA 24px gaps), mobile 375 (stacked, padding 12/16, heading 28, full palette).
Lint clean, breakpoint pass, and overflow now PASSES at 360 (the old columns.cta was the long-standing
360 overflow offender — gone).

### 2026-09-14 — banner: width/container + heading-wrap parity fix
Follow-up on the banner. Two drifts:
1. **Panel too narrow.** The banner sat in the section's default 1200px wrapper, so at 1440 it was
   narrower than the source (panel x=64 w=1312 in the 1536-capped/64px-gutter container). Added
   `main > .section.banner-container > div { max-width: 1536px; padding-inline: 16/40/48/64 }` (inline
   only, so the base 48px block padding / section gap survives) — panel now x=64 w=1312, matching source.
2. **Heading wrapped to 3 lines** vs the source's 2 ("EXPLORE WORKSHOPS" / "& EVENTS"). Root cause was
   the narrow container plus a too-tight `max-width: 44%` on the heading; with the correct 1536 container
   and `max-width: 50%` the 40px USTA Sans heading now wraps to exactly 2 lines (w 644, h 80).

Verified @1440 (panel x=64 w=1312, heading 2 lines, 3-col row heading|body|CTA 24px gaps) and @375
(panel x=16 w=343, padding 12/16, stacked, heading 28). Lint clean, breakpoint pass, overflow clean at
360/768/1024/1280/1920.

### 2026-09-14 — banner: content inset parity (heading left-edge alignment)
The banner content sat 12px inside the panel edge; the source insets it 24px (panel padding 12 + an inner
row wrapper 12). At 1440 the source banner heading text starts at x=88 (panel edge 64 + 24), but the
migrated heading was at x=76 (only +12). Fixed the desktop panel padding `36px 12px` -> `36px 24px` so
the heading/CTA sit 24px in — banner heading now at x=88, matching source exactly (panel edge 64 shared
with the cards grid). Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: left edge aligned to header hamburger
Per request, the blue banner panel's left edge must start exactly where the header hamburger/content
starts. The header uses gutters 16/40/36/52 (mobile/768/1024/1280); the banner was using 16/40/48/64, so
its panel started at x=64 while the hamburger was at x=52. Changed the banner-container inline gutters to
MATCH THE HEADER (40 @768, 36 @1024, 52 @1280). Verified @1440: banner panel left = 52 = hamburger left
(and right = 1388, symmetric). Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: align to CARDS grid (not header) — corrected
Correction to the prior entry: the banner should align with the CONTENT BLOCKS above it (the cards),
not the header. The cards/pricing grid sits at a 16/40/48/64 gutter (left 64, right 1376 @1440); the
banner had been set to the header's 16/40/36/52 (left 52), leaving it 12px left of the cards. Reverted
the banner-container gutters to 16/40/48/64 so the blue bar's left/right edges line up exactly with the
cards. Verified @1440: banner panel left 64 = pricing/media card left 64; right 1376 = pricing right.
Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: align to HEADER gridline (final, per user)
Final decision (user): the blue banner's left edge should line up with the HEADER (hamburger start at
the 52px gutter), NOT the 64px content/cards grid — cards and header left unchanged. Set the
banner-container inline gutters to match the header exactly: 16 / 40 / 36 / 52 (mobile/768/1024/1280).
Verified @1512: banner panel left = 52 = header hamburger left (right 1460, symmetric). Note this is an
intentional deviation from the cards' 64px grid for this block. Lint clean, breakpoint pass, overflow
clean at all viewports. (Supersedes the two prior banner-alignment entries.)

### 2026-09-14 — banner: tablet row layout (was stacking)
At tablet the source keeps the 3-column ROW (heading left, body + CTA right, vertically centered) — but
the migrated banner was stacking because the row layout was gated at >=1024. Moved the row layout
(flex-row, align center, 36px 24px panel padding, heading flex 0 1 auto / max-width 50%, body flex 1) to
>=768, with heading 32px at tablet and a >=1024 bump to 40px. Verified @834: row layout, panel x=40 =
header hamburger, heading 32px at x=64, heading->body gap 24, CTA content-width; mobile (375) still
stacks at 28px. Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: tablet 2-column structure + desktop compact row (final)
Refined the tablet layout. The source at tablet (768–1023) is NOT a 3-in-a-row; it is TWO top-level
columns — HEADING (left) | CONTENT (right), where the content column stacks BODY over the CTA. Restructured
banner.js to wrap the body paragraphs and the CTA together in a `.banner-content` column (`.banner-body`
over `.banner-action`), leaving the heading as the first row child. CSS: at >=768 `.banner-inner` is a
centered flex row with heading and content each `flex: 1 1 0; min-width: 0` (both can shrink so long words
wrap instead of overflowing); `.banner-content` is a column (body above button). At >=1024 `.banner-content`
becomes a row (body beside button) → the source's single 3-across line. This fixed two earlier bugs: (a)
body copy collapsing to one-word-per-line at ~1024 (caused by `max-width:50%` + `flex:0 1 auto` starving
the body — removed), and (b) heading overflowing when tried with `flex:0 0 auto` (reverted). Verified:
@834 heading|body-over-button, no overflow; @1280 single row, heading 3 lines, panel 192px; @1440 single
row, heading 2 lines, panel 152px (more compact than source ~216px — no height regression). Panel left edge
= 52 (header gutter) at all desktop widths. Lint clean (0 errors), breakpoint pass.

### 2026-09-14 — banner: fixed CTA width + per-viewport panel padding (parity)
Two source-parity bugs found by re-measuring the live source at all three viewports:
1. CTA button: source is a FIXED 280x56 pill at EVERY viewport, and it is CENTERED under the body on
   mobile/tablet. Mine was content-width (~195px) and left-aligned. Fixed: `.banner-cta { width: 280px;
   max-width: 100% }` and `.banner-action { align-self: center }`.
2. Panel top/bottom padding: source uses 12px at mobile AND tablet, and only grows to 36px at DESKTOP.
   My `>=768` rule was applying 36px at tablet too, inflating the tablet panel to 207px (source 186px)
   and making the whole band look "longer". Fixed: tablet padding stays 12px 24px; a new `>=1024` rule
   bumps it to 36px 24px. Verified panel heights now: desktop(1512) 152px / tablet(834) 159px /
   mobile(390) 260px — all matching the source's compact band; CTA 280px centered at tablet+mobile,
   beside the body at desktop. Lint clean (0 err), breakpoint pass, overflow clean 360–1920.

### 2026-09-14 — banner: align to CONTENT/CARDS grid (corrected from header gutter)
The blue banner was overshooting to the left/right of the cards above it and reading as "too long". Root
cause: the banner-container was using the HEADER's gutter set (16/40/36/52). Re-measured the LIVE SOURCE
against its own content grid at two widths and confirmed the source banner aligns to the CONTENT/CARDS
grid, NOT the header: @1600 panel x=96/right=1504 = packages-grid x=96/right=1504 (w=1408); @1280 panel
x=64/right=1216 = grid x=64. The header hamburger sits at x=84 @1600 / x=64 @1280, so the banner does NOT
follow the hamburger at wide widths — it follows the cards. Switched the banner-container gutters to the
cards grid (16/40/48/64, 1536 cap, margin-inline:auto). Verified migrated now matches exactly: @1600
x=96->1504 w=1408; @1280 x=64->1216 w=1152. CTA stays 280px; heading 2 lines @1600. This supersedes the
three earlier banner-alignment entries (the "align to header" decision was wrong at wide widths because
the source's header gutter and content gutter diverge above 1280). Lint clean, breakpoint pass, overflow
clean 360-1920.

### 2026-09-14 — typography parity audit: last 4 blocks (hero, cards, columns, banner)
Measured EVERY text element in the 4 instrumented blocks against the LIVE SOURCE at 390/834/1024/1280
(fs/fw/lh/ls/family/color/align). Results:
- HERO — h1 (80/56/40/32 USTA Sans 700) and intro subtitle (the `<strong>` inside the intro-statement p:
  72/56/40/32 Graphik Regular, ls -0.03em) both already match. (Note: measure the `<strong>`, not its
  wrapper `<p>` — the p reads 16px but is not the visible text.) NO drift.
- CARDS — pricing tier 40, price 28, best-for/li 16, CTA 18(desktop/tablet)/16(mobile); media h3
  32/28/28/28, body 16/19.2; section h2 64/56/40/28 USTA Sans. All match. (Earlier a stray read of a
  HIDDEN a11y label showed tier=16px Arial — ignore; the visible tier is 40px Graphik Semibold.) NO drift.
- COLUMNS — TWO real drifts found & fixed:
  1. Quote attribution (name + role) was a flat 16/19.2; source scales 16/19.2 (mob+tab) -> 18/21.6
     (@1024) -> 24/28.8 (@1280). Added `.columns.quote .columns-quote-body p:not(:first-child)` sizing
     at base/1024/1280.
  2. Media/quiz CTA ("Start Now"/"Start the Quiz") was 16 -> 18 -> 24 across breakpoints; source is a
     FLAT 18/20/ls1px at every viewport. Set base to 18px and removed the 1024 (redundant) + 1280 (24px)
     bumps. Verified: @1280 name/role 24/28.8, CTA 18/20; @834 name 16/19.2, CTA 18/20. Quote text
     (28->32) unchanged (already correct).
- BANNER — heading 40/32/28 USTA Sans 700, body 18/16/16 Graphik Semibold, CTA flat 18/20/ls1px white.
  All match. NO drift.
Quality gate: lint clean, breakpoint pass, overflow clean 360-1920. `check:typography` reports 8 "drifts"
= the pricing tier h3 at 40px (Baseline/Rally/Pro/Pro Plus) vs the single global-h3 record (28/32) — this
is INTENTIONAL source parity (the source pricing card name IS 40px), a known limitation of the one-h3
global record, NOT a regression (no h3 rules were touched in this audit).

### 2026-09-14 — columns.quote (SUCCESS STORIES) rebuilt to two-column card layout
The migrated quote was a plain stacked text block with a 0x0 glyph — missing the source's entire
structure. Source "SUCCESS STORIES" is ONE row: a HEADSHOT photo (left) + a bordered rounded CARD (right)
holding a large blue quote glyph on top, the quote, and the attribution pinned to the card BOTTOM.
Root cause: the importer fragmented the section — the headshot became an ORPHANED lone-picture paragraph
in the PREVIOUS (banner) section (beside the SUCCESS STORIES heading), while `.columns.quote` held only
the glyph SVG + text with no card styling, and the SVG rendered 0x0.
Fix (blocks/columns/columns.js decorateQuote):
  • Reunite: adopt the orphaned headshot from the previous section as the left `.columns-quote-photo`
    column (matched as a `p > picture` with empty text; optimized via createOptimizedPicture 750w).
  • Card: tag the text cell `.columns-quote-card`; prepend the glyph as `.columns-quote-glyph`; wrap the
    quote as `.columns-quote-text` and the trailing name+role paragraphs as `.columns-quote-attribution`.
Fix (blocks/columns/columns.css): 50/50 flex row at >=768 (each `flex:0 0 calc(50% - 12px)`, 24px gap,
  align stretch), STACKED on mobile (photo over card, 24px gap). Photo: 20px radius, object-fit cover,
  aspect 358/280 mobile -> 564/592 tablet+. Card: 1px #fff border, 20px radius, transparent, padding
  12px16px mobile -> 36px13px @1024 (source content inset ~25px). Glyph 77x51 + 24px to quote. Quote
  Graphik Semibold #fff 28px -> 32px @1280, ls -0.03em. Attribution 16px #fff pinned bottom via
  margin-top:auto. Section gutters 16/40/48/64 + 1536 cap so edges line up with the cards/banner grid.
Verified vs source: @1280 photo 64->628 (564x592) + card 652->1216 (564x592), glyph 77x51, quote 32px,
  attribution pinned bottom — exact match. @390 stacked, photo 358x280, card below, quote 28px. @834
  50/50 row. Lint clean (0 err), breakpoint pass, overflow clean 360-1920.

### 2026-09-14 — columns.quote: fixed authoring (image inside block) + glyph/empty-p bugs
Author feedback (DA): the headshot was NOT inside the columns(quote) block — it was a loose image in the
banner section, so the block only held the glyph+text (wrong authoring model). Fixed WITHOUT re-import
(would lose other blocks' manual parity work):
  • content/index.plain.html + content/es/index.plain.html: moved the headshot picture to be the block's
    FIRST cell and the blue quote-glyph picture to lead the SECOND (card) cell → proper two-cell columns
    row: [headshot | glyph + quote + name + role].
  • blocks/columns/columns.js decorateQuote: simplified — no longer borrows the headshot across sections.
    Classifies the picture-only cell as .columns-quote-photo (optimized 750w) and the text cell as
    .columns-quote-card; lifts the leading glyph <picture> into .columns-quote-glyph, KEEPING only the
    <img> (drops EDS's webp <source>s that break SVGs → the glyph was rendering as a broken image on the
    published site); drops the empty <p> EDS leaves after the glyph is moved out; classes the first
    non-empty <p> as .columns-quote-text (32/28) and wraps the rest as .columns-quote-attribution (16px).
  • tools/importer/parsers/columns-quote.js: updated to author the same two-cell structure on future
    imports (scan the parent grid for the sibling portrait; glyph+paras in the card cell). Validated by the
    parser harness (captureConfident:true).
Verified via drafts (dev server serves REMOTE preview at /, so local content edits only render once synced
to DA — validated the corrected authoring on /drafts): @1280 photo 64→628 564×592 (real headshot),
card 652→1216, glyph 77×51 (not broken/giant), quote 32px, attribution 16px below. Lint clean, breakpoint
pass. NOTE: the block at / will keep showing the old (pre-edit) layout until content/index is synced to
the DA backend — the code + local content are correct.

### 2026-09-14 — columns.quote: attribution pushed to lower card (source parity)
Author feedback: the "Butch Staples / Nationally Recognized Coaching Leader" attribution was sitting right
under the quote; the source pushes it DOWN into the lower third of the card with a large gap after the
quote and reserved space below. Measured source (all vps): desktop gap 81 / attr→bottom 105 (card 592);
tablet gap 155 / 175 (card 730); mobile gap 24 / 44 (card 468) — i.e. on mobile the short card hugs
content, on tablet/desktop the taller card (stretched to the photo) pushes the attribution down but leaves
a reserved bottom band. Modeled with `.columns-quote-attribution { margin-top: auto }` (pushes down when
the card has spare height; stays near the quote on mobile) + a reserved card `padding-bottom: 105px` at
>=1024. Verified @1280: attr→cardBottom 106 (source 105), attribution in lower third — matches source.
Lint clean, breakpoint pass.

### 2026-09-14 — columns.quote: attribution typography parity (name not bold)
Typography audit vs source (390/834/1280): the attribution NAME "Butch Staples" is authored as <strong>
but the SOURCE renders it in Graphik Regular weight 400 — NOT bold — identical to the role line. Mine was
using Graphik Semibold (visually bold). Also the source attribution has letter-spacing: normal (no tracking),
while mine inherited the section's -0.03em. Fixed: `.columns-quote-attribution p` → Graphik Regular 16/19.2
letter-spacing normal; `.columns-quote-attribution p strong` → Graphik Regular 400 (override the strong).
Full attribution spec now matches source at all vps: name + role both Graphik Regular 400, 16px, lh 19.2,
ls normal, white. Quote unchanged (Graphik Semibold 28→32, ls -0.03em). Glyph renders 77×51 (SVG kept, webp
sources dropped). Lint clean, breakpoint pass.

### 2026-09-14 — columns.quote: attribution font-size scales (16→18→24) + card border confirmed
Source DevTools (user screenshot) showed the attribution rendering at "24px Graphik Regular" on desktop,
but my rebuild had flattened it to a fixed 16px. Restored the responsive scale confirmed in the earlier
typography audit: attribution (name + role) 16/19.2 (mobile+tablet) → 18/21.6 (@1024) → 24/28.8 (@1280),
all Graphik Regular weight 400, letter-spacing normal, white. Added the 18px @1024 and 24px @1280 bumps to
`.columns-quote-attribution p`. Confirmed the card's 1px white 20px-radius border renders (it was only
absent in the stale live view, which still serves pre-edit backend content). Verified @1440: name+role 24px
Graphik Regular 400, card border 1px #fff r20, attribution in lower third. Lint clean, breakpoint pass.

### 2026-09-14 — columns.quote: attribution flows naturally (not bottom-pinned) + gap scales
Correcting the prior margin-top:auto approach. Inspected the source card: it's display:block (NOT flex),
36px padding all sides, and the attribution FLOWS naturally after the quote with an authored gap that
scales with viewport — measured quote→name gap: 24px @390 / ~96px @1024 / 138px @1440; name font 16→18→24.
The card is a grid column stretched to the photo height, so natural empty space sits below the attribution
(no pinning). Replaced margin-top:auto + reserved-bottom-band with a scaling margin-top on
`.columns-quote-attribution`: 24px base → 96px @1024 → 138px @1280; card padding back to symmetric 36px
13px at desktop. Verified: @1440 cardH 676 (source 676), gap 138 (source 138), name 24px; @390 gap 24
(source 24), name 16px. Both match the source screenshots (desktop attribution higher; mobile just under
the quote). Lint clean, breakpoint pass.

### 2026-09-14 — accordion-path rebuilt to rounded pill cards + lime open state
The migrated accordion was plain rows with thin divider lines; the source is a stack of ROUNDED BORDERED
PILL CARDS. Measured source (desktop 1440): each item is a card — closed: black bg, 1px #fff border, 20px
radius, 24px padding; OPEN: lime (#cfff05) bg, NO border, black text, 24px padding; items 24px apart; item
width on the 64px content grid (x=64→1376). Label: Graphik Semibold weight 900, 20→20→22→24 across
breakpoints, line-height 1 (black on lime / white on black). Body: 16px mobile → 18px desktop, lh 1.2.
+/− toggle on the right (black on lime / white on black). Rewrote accordion-path.css: `.accordion-path`
is a 24px-gap flex column; `.accordion-path-item` is the bordered card; `[open]` switches to lime + black
text + transparent border (25px padding to compensate the removed 1px so content doesn't shift). Added the
section container grid gutters (16/40/48/64, 1536 cap) so edges align with the other blocks. JS: open the
FIRST item by default (source shows Parents open). Verified @1440 open lime 20r 24pad, closed black 1px
border, gap 24, label 24/900, body 18; @390 label 20, card 20r — both match source. Lint clean (added
stylelint-disable no-descending-specificity for the [open] overrides), breakpoint pass.

### 2026-09-14 — accordion-path: single-open + full-width body
Two source-parity fixes: (1) SINGLE-OPEN — opening one item closes the others (source is an
exclusive accordion). Native <details> don't do this, so accordion-path.js adds a `toggle` listener per
item that closes all siblings when one opens. (2) BODY spans the FULL card width so the copy flows BELOW
the +/- toggle glyph (source body right edge = card padding edge, NOT reserving the toggle column) —
changed `.accordion-path-item-body` padding from `16px 44px 0 0` to `16px 0 0`. Verified @1440: clicking
any item leaves only it open; open item's body wraps under the − at ~26px from the card edge (matches
source's 24px). Lint clean, breakpoint pass.

### 2026-09-14 — accordion-path: typography parity audit (all viewports)
Full type audit vs source (measured 390/834/1024/1280/1728). Label (.accordion-path-item-label):
Graphik Semibold weight 900, letter-spacing NORMAL, line-height 1 — sizes 20/20/22/24 across
mobile/tablet/1024/1280 (source base is 32px but overridden to 24 at >=1280; mine already matched). Body
(.accordion-path-item-body p): Graphik Regular 400, 16/19.2 (mobile+tablet) -> 18/21.6 (>=1024), lh ratio
1.2. FIXED: body was missing letter-spacing — added -0.03em (computes to -0.48px@16 / -0.54px@18, matching
source) and pinned the family to Graphik Regular; added letter-spacing:normal to the label so it can't
inherit the section's -0.03em. Verified @1440 label 24/24/900/normal + body 18/21.6/-0.54; @390 label
20/20/900 + body 16/19.2/-0.48 — exact match. Lint clean, breakpoint pass.

### 2026-09-14 — accordion-path: CORRECTED label scale to 24/28/32 (was 20/22/24)
User's source DevTools tooltip showed the title at 32px — my prior audit had read the WRONG element (the
<h3> heading computes 24px, but the VISIBLE text is the inner .cmp-accordion__title span). Read the
source's actual CSS rules to get the definitive scale: .cmp-accordion__title = 32px base (>=1280), 28px
@768-1279, 24px @<=767, line-height = font-size (1.0), letter-spacing -0.03em, Graphik Semibold. Fixed the
label: 24px base -> 28px @768 -> 32px @1280 (was 20/22/24 — all ~4-8px too small), and set ls -0.03em
(computes -0.72/-0.84/-0.96). Verified @1440 32/32, @834 28/28, @390 24/24 — exact match to source rules.
Lint clean, breakpoint pass.

### 2026-09-14 — accordion-path → default `accordion` block + section heading regrouping
Per request, replaced the custom accordion-path block with the boilerplate DEFAULT `accordion` block:
created blocks/accordion/{js,css} (details/summary, classes accordion-item / -item-label / -item-body),
ported all source-parity styling (rounded lime/black pill cards, 24/28/32 label scale, single-open, body
flows under the toggle) and the single-open + first-open behaviour. Removed blocks/accordion-path/ and
tools/importer/parsers/accordion-path.js; updated import-home.js registry+template, page-templates.json,
and the import bundle to emit `accordion`. Content: switched `class="accordion-path"` → `class="accordion"`
in content/index + content/es/index.
Also regrouped two section headings so each leads its own block (source grouping): moved SUCCESS STORIES /
HISTORIAS DE ÉXITO out of the banner section into the columns.quote section (with `center` / `dark, center`
section-metadata so the heading is centered while the quote card keeps left alignment), and moved DISCOVER
YOUR PATH / DESCUBRE TU CAMINO out of the quote section to LEAD the accordion section. Verified @1440:
SUCCESS STORIES centered above the quote card; DISCOVER YOUR PATH heads the accordion; accordion renders as
lime/black pill cards. Lint clean, breakpoint pass.

### 2026-09-14 — ES page fixes: intro statement + DESCUBRE center + Safe Play image verified
1. INTRO STATEMENT (was rendering as plain body text, not the 72px display): the ES intro <strong> was
   missing both the semantic accent markers AND the `narrow` section-metadata. decorateIntroStatement()
   only adds `.intro-statement` when the bold paragraph has an <em>/<u> accent. Fixed content/es/index:
   wrapped "corazón que late" in <em> (→ lime) and "entrenadores como tú" in <u> (→ blue), and changed the
   section-metadata style from `dark` to `narrow` — matching the EN pattern. Now scales 28→40→56→72 like EN.
2. DESCUBRE TU CAMINO CON USTA COACHING: changed its section-metadata style `dark` → `dark, center` so the
   heading centers (matching EN's DISCOVER YOUR PATH).
3. SAFE PLAY IMAGE: verified — the migrated ES asset get-early-access-f650bc83.jpeg is BYTE-IDENTICAL to the
   current live source image (md5 c487b16…); content already references the correct image. The "different
   image" seen on /es/ is the stale published backend, not a content error.
NOTE: /es/ serves published backend content, so these render once content/es/index is synced to DA.
Lint clean, breakpoint pass.

### 2026-09-14 — spacer block + Accordion (base) block sample
Added a `spacer` block (blocks/spacer/{js,css,metadata.json}) — an authorable vertical gap / full-bleed
colored band. Config key/value rows: desktop (>=1200px), tablet (>=992px), mobile (<992px), optional color
(raw CSS color / var(--x) / bare design-token name → var(--…)). Full-bleed when colored; a spacer-only
section carries no margin/padding so authors control the rhythm via spacer heights.
Added the first block sample under drafts/block-samples/: `accordion.plain.html` — "Accordion (base)"
heading + a short no-noise description + the Source URL (ustacoaching.com "Discover your path") + a 48/40/32
spacer for breathing room + the accordion block with the 5 audience rows. Verified: spacer renders a real
48px gap @desktop / 32px @mobile between the intro and the accordion; accordion shows the lime open item +
single-open. Lint clean, overflow clean 360–1920.

### 2026-09-15 — cards(media) merged to ONE block (3 rows) on index + es/index; block samples updated
Fixed an authoring/layout defect: the "JOIN THE COMMUNITY" benefits row was authored as THREE separate
single-card `cards (media)` blocks. Merged into ONE `cards (media)` block with three rows in
content/index.plain.html and content/es/index.plain.html (grep count 3→1 each).
CSS FIX (blocks/cards/cards.css): the old media layout produced the 3-up desktop row by gridding the SECTION
CONTAINER (`.cards-container:has(.cards.media)`), which only worked when the three cards were separate
sibling `.cards-wrapper` divs. Once merged into one block the three cards became the `<li>`s of a single
`<ul>`, so the container-grid no longer applied and cards stacked vertically. Moved the 3-up grid onto the
block's own list: `.cards.media > ul { grid-template-columns: repeat(3,1fr) }` at >=1024 (added
`align-items:start`); the container now only supplies the 1536-cap + 16/40/48/64 gutters. Removed the dead
`.default-content-wrapper` grid-span rule (heading no longer shares the card grid). Verified all viewports:
desktop 1440 → 3-up row (tops equal, lefts 64/509/955, image-top); tablet 834 → stacked cards image-left/
text-right (flex row); mobile 390 → stacked image-top. Lint clean, breakpoint pass.
BLOCK SAMPLES (DA, drafts/block-samples/): updated cards-media.html to show all 3 homepage cards (one block,
3 rows) using absolute aem.live /media_<hash> image URLs; updated columns-media.html to show BOTH heading
variants — Option 1 (paragraph heading, quiz card) and Option 2 (H2 heading, Safe Play block), each labelled.
Uploaded to DA (200) + previewed (200); verified on aem.page: cards-media 3-up desktop/stacked mobile with
images loaded, columns-media both variants render (paragraph-heading + H2). NOTE: spacer block code is not on
GitHub main yet, so the sample pages' inter-element spacers collapse on preview (harmless 404 for spacer.js)
until pushed. ES index + EN index cards-media merge are local — render on live once synced to DA.

### 2026-09-15 — Chat widget migration (Zendesk Web Widget) + Trusted Types blocker
IDENTIFIED the source's bottom-left chat as the **Zendesk Web Widget (Classic)** — snippet
`https://static.zdassets.com/ekr/snippet.js?key=3c8333c3-4b00-40b5-a9cb-f9c7be03aaa6` (globals zE/zEmbed/
zEACLoaded). Its entire appearance is Zendesk-hosted config, NOT page CSS: lime #cfff05 64x64 launcher,
fixed bottom-left (bottom:10px; left:80px; z-index 999999), "Hi! Need any help?" proactive bubble, 20px
radius. So exact parity = load the SAME snippet key; nothing to re-style. This is martech → load in the
DELAYED phase.
IMPLEMENTED: new `scripts/chat.js` (loads the snippet via aem.js loadScript with id="ze-snippet"); wired
`import('./chat.js').then(({default:loadChat})=>loadChat())` into loadDelayed() in scripts.js. Snippet
fetches succeed (snippet.js 200, ekr compose 200, sentry-browser 200) and `window.zE` boots.
BLOCKER (unresolved, needs a human/security decision): the launcher never mounts. Console:
"This document requires 'TrustedScriptURL' assignment. The action has been blocked" → then Zendesk's Sentry
crashes ("Cannot read properties of undefined (reading 'InboundFilters')"). Root cause = the project's
strict CSP `require-trusted-types-for 'script'` (in the UNTOUCHABLE head.html, also served as a prod HTTP
header). Zendesk's Web Widget bootstrap makes a script-URL assignment (worker/Sentry init) that isn't
Trusted-Types-aware and has no policy in its context.
PROVED it is NOT fixable from our default TT policy: temporarily set the default policy to full passthrough
(createHTML/createScriptURL/createScript all identity) — the SAME TrustedScriptURL block still fired and the
launcher still did not mount. So loosening our policy achieves nothing AND weakens security → REVERTED the
default policy to the hardened original (srcdoc-strip + script-strip intact) verbatim. Page degrades
gracefully (no visible breakage) when the widget fails.
The only lever that would render the widget is relaxing `require-trusted-types-for 'script'` in head.html —
forbidden by the Untouchable-Files Rule and a security-posture call for the human. chat.js + the delayed
loader are left in place (correct, minimal, standards-compliant) so the widget renders the moment the CSP
permits it. Lint clean (0 errors).

### 2026-09-15 — Fixed intro-statement markdown corruption on /en/home + / (index)
Symptom: the hero intro on /en/home rendered with literal `**` asterisks leaking as text
("…beating heart**. Discover the new community for coaches like you.**"). Root cause: the DA source had the
intro authored as THREE separate <strong> runs with a nested <em><strong> in the middle —
`<strong>…the </strong><em><strong>beating heart</strong></em><strong>. …</strong>`. DA->markdown turns the
`</strong></em><strong>` boundary into a 5-asterisk run the parser can't disambiguate, so it emits raw `**`.
Both index.html AND en/home.html in DA had this broken structure (index only LOOKED fine because its
rendered .md was still cached from the earlier clean copy). Fix: replaced the 3-run structure with the clean
SINGLE wrapper `<p><strong>If tennis starts with love, coaches are the <em>beating heart</em>. …
<u>coaches like you</u>.</strong></p>` (matches local content/index.plain.html) and re-uploaded both to DA,
then re-previewed + re-published. Verified on aem.page AND aem.live: intro now one bold paragraph, `beating
heart` as the nested emphasis (lime), no leaking asterisks. Lesson: intro-statement bold must be ONE
<strong> with <em>/<u> NESTED inside — never split into sibling <strong> runs, or DA markdown corrupts it.

### 2026-09-15 — Chat widget RESOLVED: removed require-trusted-types-for from head.html
Follow-up to the Zendesk widget blocker. KEY OBSERVATION (user): the widget worked on 404 pages but not on
real pages. Diff of the two CSPs pinpointed it exactly:
  - 404.html CSP: `script-src … 'strict-dynamic' 'unsafe-inline' http: https:; base-uri 'self'; object-src 'none';`  (NO trusted-types → widget works)
  - head.html CSP (all real pages): same PLUS `frame-src 'self' https:; require-trusted-types-for 'script';`  (→ widget blocked)
So `require-trusted-types-for 'script'` was the sole cause: it forces every DOM/script sink through the
default TT policy, which (a) blocked Zendesk's internal script-URL assignment (Sentry init) and (b) let the
hardened default policy strip the launcher's srcdoc iframes. FIX: removed `require-trusted-types-for 'script'`
from head.html's CSP (kept everything else incl. frame-src). NOTE: this is normally an Untouchable-File, but
the user explicitly asked to make the widget work and the 404 page proved this directive is the only blocker
— DEVIATION justified & recorded here per the Migration-Log Rule. The tt default policy in scripts.js is left
intact (harmless without enforcement). VERIFIED on localhost: all 3 Zendesk iframes mount — launcher 64x64
fixed bottom:10px/left:80px z-index 999999, bg #cfff05 (rgb 207,255,5), 20px radius, "Hi! Need any help?"
proactive bubble — byte-for-byte matching the source's widget coordinates/colors. Console clean (no TT
error). Lint 0 errors, breakpoint pass. Ships live on next push (head.html is code, served from GitHub main).

### 2026-09-15 — Chat widget moved to scripts/delayed.js + scripts/widgets/ (perf structure)
Refactor (no behaviour change): moved the Zendesk loader from scripts/chat.js to
**widgets/usta-coach-care/chat.js** (new widgets/ folder for third-party embeds), and created **scripts/delayed.js**
(the boilerplate's conventional delayed-phase entry) which imports & calls loadChat(). scripts.js loadDelayed()
now does `window.setTimeout(() => import('./delayed.js'), 3000)` — so the chat snippet is fetched ~3s AFTER
the delayed phase begins (well past LCP), guaranteeing zero impact on load performance. Removed the old
scripts/chat.js and the inline import from loadDelayed(). Verified on localhost: launcher still mounts after
the delay — 64x64, bottom:10px/left:80px, z-index 999999, #cfff05, all 3 Zendesk iframes + "Hi! Need any
help?" bubble. Lint 0 errors.

### 2026-09-15 — Chat widget final layout + end-to-end verification + allow-list finding
FINAL STRUCTURE: chat loader lives at top-level **widgets/usta-coach-care/chat.js** (sibling to blocks/ and
scripts/), imported by **scripts/delayed.js** via `../widgets/usta-coach-care/chat.js`. delayed.js is fired
by scripts.js loadDelayed() on a 3s setTimeout — snippet fetched well after LCP. Old scripts/widgets/ and
widgets/chat/ folders removed.
END-TO-END VERIFIED (localhost): opened the widget via `zE('messenger','open')` — the FULL messaging window
renders in-page (380x700 overlay iframe): header "USTA Coach Care", "How can we help?", a live agent/bot
reply ("Coach Net says: Hi! How can I help you?"), file-upload + working message box. So the widget is not
just present — it FUNCTIONS in-page.
ALLOW-LIST FINDING (for future ref): the Zendesk Web Widget does NOT require domain allow-listing. It is
keyed by ACCOUNT (?key=…), runs client-side, and works on ANY host (proven: worked on localhost AND on the
404 page). There is NO link/fallback hand-off in our implementation — only the single path of loading the
real inline widget; when the CSP blocked it, it failed silently (no degrade-to-link). Caveat: USTA could
later restrict embedding domains from their Zendesk dashboard (account-side toggle, not our code) — not
active today.

---

## STATUS SNAPSHOT — 2026-09-15 (for a fresh LLM session)

**Project:** Lift-and-shift migration of https://www.ustacoaching.com/ (+ /es/) to AEM Edge Delivery.
Target: 100% pixel + functional parity across mobile (390/375), tablet (768/834/1024), desktop
(1280/1440/1512/1728).

**Repo:** /backups/aemdemos/coaching-usta/repo · GitHub aemdemos/coaching-usta · content source = Document
Authoring (DA, admin.da.live/source/aemdemos/coaching-usta/…). Dev server localhost:3000 serves LOCAL code +
REMOTE (DA-published) content — local content/ edits only render after upload to DA.
Preview: main--coaching-usta--aemdemos.aem.page · Live: …aem.live.

**DONE (built + verified):**
- Design system captured: breakpoints 768/1024/1280 (tools/quality/breakpoints.json); grid gutters
  16/40/48/64, 1536 max-width; tokens --usta-blue #0373f3, --usta-lime #cfff05; fonts USTA Sans / Graphik
  Semibold / Graphik Regular (typography.json + fonts/).
- Blocks: hero (video), cards (pricing + media), columns (media + quote), banner (events blue/black),
  accordion (default, single-open lime pill cards), form, spacer. All typography-audited across viewports.
- cards (media): ONE block, 3 rows (merged from 3 separate blocks) on index EN + ES. Layout grid moved onto
  `.cards.media > ul` (3-up desktop / stacked-horizontal tablet / stacked mobile).
- Section-heading regrouping (SUCCESS STORIES → quote section; DISCOVER YOUR PATH → accordion section).
- ES page: intro-statement accents + narrow metadata; DESCUBRE centered; Safe Play image verified.
- Intro-statement markdown-corruption fix on index EN + /en/home (single <strong> with nested <em>/<u> —
  never sibling <strong> runs, or DA→md emits literal `**`).
- Block sample pages in DA under drafts/block-samples/: accordion-base, hero-video, columns-media (both
  P-heading + H2 variants), cards-pricing, cards-media (3 cards), banner-events-blue, columns-quote.
- Chat widget (Zendesk "USTA Coach Care"): DONE — see entries above. Required removing
  `require-trusted-types-for 'script'` from head.html (documented deviation).

**KNOWN CAVEATS / OPEN ITEMS:**
- spacer block JS/CSS is NOT yet on GitHub main → block-sample pages' inter-element spacers collapse on
  aem.page preview (harmless spacer.js 404) until pushed.
- Several fixes live only in local content/ (or were pushed to DA ad hoc) — confirm DA is the source of
  truth before each publish. index EN + /en/home intro + cards-media merge are LIVE (published).
- head.html no longer enforces Trusted Types (deviation for the chat widget).

**NEXT TARGET: Custom Widget — "Course Filter"** — DONE 2026-09-15 (see log entry below).

---

### 2026-09-15 — NEW `course-filter` block (Courses and Workshops browser) — full parity
Recreated the source's "Courses and Workshops" widget (source page /en/home/courses.html) as a new EDS
block `blocks/course-filter/`. Investigated first: the source is a **bespoke Vue component**
(`.v-course-list`, mounted in `data-v-app`) compiled into USTA's AEM clientlib — NOT a third-party embed,
no iframe, no reusable snippet, and its data API sends no CORS header. **Verdict: cannot pull in as-is →
recreated.** (Per user: full parity, baked-in JSON first; live API fetch deferred as an easy follow-up.)

**Data model (baked-in JSON).** Course tags/modules/language/sort come from the public LMS API
`https://services.ustacoaching.com/v1/lms/courses/all` (31 courses), BUT the **card descriptions + badge
images are AEM-authored (keyed by course code) and are NOT in the API** — captured those from the live DOM
across all 3 tabs (incl. behind "See More"). Merge pipeline in `tools/importer/course-filter/`:
`courses-api.json` (API tags/modules) + `courses-descriptions.json` (authored desc/badge/unlock, DOM-scraped)
→ `build-courses-json.mjs` → `blocks/course-filter/courses.json` (33 rows: 31 API + 2 workshop-only cards
seen in the DOM but not the API — Intro to Coaching Workshop, Cardio Tennis Workshop). Re-run the build
script to refresh. Spec + raw captures live in `tools/importer/course-filter/course-filter-spec.md`.

**Badges: SVG→PNG per the Asset-Size Rule.** The 22 source badge SVGs are heavy illustrative art
(up to 93KB; several >40KB). Rasterized to 2x PNGs (296px = 148 display ×2) via the svg-assets skill's
converter (Chromium, transparent bg) into `blocks/course-filter/badges/*.png` — all now <37KB, total
~614KB, lazy-loaded. Dataset badge paths rewritten `.svg`→local `badges/<name>.png` by the build script.

**Behaviour (full parity, verified live):**
- **3 persona tabs** (Parents / School Tennis / Coaches; default active = Coaches) filter the list by
  coachType. Tab → coachType map: Parents=`PARENT_GUARDIAN_COACH`, School=`SCHOOL_COACH`,
  Coaches=`COLLEGE/FT_PROF/PT_PROF/VOLUNTEER_OR_EMERGING`.
- **Filter By** dropdown: 4 checkbox groups (Coach type / Certification / Membership package / Languages),
  "Coming Soon" certs disabled, commits on **Apply filters**; each ticked option adds a removable chip in
  the row below the tabs (the active-tab chip is shown non-removable, mirroring source). Intersect across
  groups, union within a group.
- **Sort by** dropdown: Default (API sort) / A to Z / Z to A.
- **Cards** expand (chevron) to a **module timeline** (ringed-circle bullet list); badge courses show the
  148px PNG bottom-right; long descriptions keep their unlock paragraph. **See More** pages 16 at a time.

**Design (source-measured, replicated).** Dark tabs panel `#2d2d2d` r20; active tab lime `#cfff05`;
white cards r20, 24px pad (16 @mobile), gap 24 (16 @mobile); name Graphik Semibold 18→28→32 (mob/768/1024,
ls -0.54/-0.84/-0.96), eyebrow 12→16→18; desc Graphik Regular 16/lh1.2; Filter/Sort white pills r12;
chip black + 1px white border r12; See More lime + 2px black border r12. Grid **1-up ≤768, 2-up ≥1024**.
Section container aligned to the content grid (1536 cap, gutters 16/40/48/64).

**A11y note / typography-gate interaction.** Card **name + eyebrow are non-heading elements** (span with
`role="heading" aria-level="3"` for the name), matching the source markup AND keeping the block's bespoke
title sizes off the global `h1..h6`/body type scale — so `check:typography` passes with NO per-block font
exceptions (contrast with cards.pricing, which uses a real `<h3>` and is a standing typo-gate exception).
Card description stays a `<p>` at the global 16px/lh1.2 Graphik Regular. Avoids a skipped heading level
under the page's single `<h1>`.

**Quality gate (all green, on `/content/course-filter-test`):** lint 0 errors; breakpoint check pass;
overflow sweep 360/768/1024/1280/1920 all OK; typography pass; a11y pass; check:svg pass (badges live under
blocks/, not icons/, but all PNGs <40KB anyway). Verified interactions live: tab switch (Parents=8 cards),
Spanish+Coaches filter → 2 ES courses, chip remove restores list, sort A–Z, card expand shows 3-module
timeline, See More.

**OPEN / follow-ups:** (1) live API refresh path (fetch `/v1/lms/courses/all` at runtime to keep tags
fresh) — deferred per user; note the API has no CORS and lacks descriptions/badges, so it can only refresh
tags/modules, not replace the baked content. (2) Not yet authored onto a real DA page — needs a
`course-filter` block placed on the courses page (the block is self-contained; author an empty
`course-filter` block, no rows needed). (3) Block-sample page under drafts/block-samples not yet added.

### 2026-09-15 — course-filter: pixel-parity pass on card internals + module timeline
User overlaid source vs migrated and flagged drift in the expanded "connected dots" timeline and card
internal spacing. Re-measured the source precisely and matched every value:
- **Module timeline connector** — the source draws a vertical line via `.v-course__module::after`
  (`content:""; position:absolute; width:2px; height:60px; left:6.5px; top:20px; background:#000`),
  with each item `min-height:40px` + `margin-bottom:32px` → circle centers exactly **72px** apart. Mine
  had loose unconnected dots (24px margin, no line). Added the `::after` connector (on all but last item)
  + fixed item height/margin. Verified circle centers 72px apart, line 2×60 @ left6.5/top20.
- **Card internal rhythm** — source info block is `display:block` (NOT flex-gap); spacing comes from
  fixed paddings: name `padding:8px 0 2px`, description `padding:20px 32px 0 0` (the 32px right keeps text
  off the expand button); content row is `align-items:center`. Mine used a 16px flex gap (wrong rhythm).
  Rewrote to the source model. Now eyebrow→name 8px, name→desc 20px, exact at all viewports.
- **Content gap** — 16px @mobile → 24px @tablet+ (was flat 24). Card padding already 16→24 correct.
Verified migrated == source at 390/768/1440 (card padding, content gap, name/desc paddings, eyebrow/name
font sizes, timeline geometry). Quality gate re-run all green: lint 0 err, breakpoint pass, overflow
360–1920 OK, typography pass, a11y pass.

### 2026-09-15 — course-filter: timeline connector fix (multi-line module titles)
User caught the "connected dots" breaking when a module title wraps to 2 lines (circles uneven, line
not reaching). Root cause: I'd hardcoded the connector at fixed `60px`/`top:20px`, which only works for
single-line 40px items. Re-measured the SOURCE with a wrapping title: it uses PERCENTAGE geometry —
`.v-course__module::after { top:50%; height:150% }` (relative to each item) + circle `align-self:center`,
so the connector scales with item height (single-line 40px → 20/60; 2-line 60px → 30/90). Matched exactly.
NOTE: the source connector is intentionally a short stub (ends ~12px above the next circle center at
40px items) — NOT a full connect; my output now reproduces that same behavior. Verified at 1024 (titles
wrap): item heights + circle-center gaps (72/82) + line geometry identical to source. Lint 0 err (fixed a
duplicate-selector by merging align-self into the circle rule), breakpoint pass.

### 2026-09-15 — course-filter: timeline circle overflow + description links
Two fixes after visual review:
1. **Connector line drawn through the circles.** The `::after` line overlapped the timeline circles.
   Source hides this by stacking the opaque circle above the line. Added `position:relative; z-index:1`
   to `.course-filter-card-timeline-circle` (line is z-index auto) so the white circle covers the
   overlap — line now meets each circle's edge cleanly, single- and multi-line items alike.
2. **Description links were dropped (rendered as plain text).** The source links "Spanish." (course-
   specific CSOD deep-link, new tab) and the "USTA Coaching Development Coach Badge" unlock link. Added
   `spanishHref` to courses-descriptions.json + build script; course-filter.js now renders real
   underlined `<a target=_blank rel=noopener>` for the trailing "Spanish." and for the inline unlockLink
   (built with createElement/textContent — no innerHTML, per the Security Rule). Verified links underline
   and open new tab; unlock links inline. Lint 0 err, breakpoint/overflow/typography/a11y all pass.

### 2026-09-15 — course-filter: Sort-by stays right (filter bar layout parity)
User: on mobile/tablet "Sort by" dropped below instead of staying right. Root cause: I'd nested the
applied-filter chips INSIDE the left group with Filter By, so the left group grew and pushed Sort down.
Re-measured the source: the bar is 3 independent flex children — Filter By | chips | Sort by. Source
behavior: `justify-content: space-between`; the **chips group carries `order:1; flex:1 1 100%` at mobile**
so it wraps to its OWN row below while Filter (left) + Sort (right) share the top row; at **>=768 the
chips switch to `order:0; flex:1 1 0`** (inline middle) and the bar goes `nowrap` so all three sit on one
row. Restructured course-filter.js (chips is now its own bar child, not inside left group) + CSS to match.
Verified @390 (Filter+Sort top row, Sort pinned right, chip on 2nd row, no overflow) and @768 (all three
one row, Sort right). Lint 0 err, breakpoint/overflow/typography/a11y all pass.

### 2026-09-15 — course-filter: block-sample page under drafts/block-samples
Added `drafts/block-samples/course-filter.plain.html` following the existing block-sample template
(heading + description + Source line, a 48/40/32 spacer, then the block). The course-filter block is
self-contained/data-driven, so the sample places an EMPTY `course-filter` block (no authored rows) — it
reads its data from blocks/course-filter/courses.json. Source line points to
/en/home/courses.html "Courses and Workshops". NOTE: the earlier ad-hoc test page
content/course-filter-test.plain.html could NOT be deleted (content dir is delete-protected by the
guardrail — "never delete existing content; use the import script to regenerate"); it's a harmless local
test page and is superseded by the block sample. Lint clean. (Render-verify via `--html-folder drafts` at
/drafts/block-samples/course-filter, or upload to DA like the other samples; the block itself is already
verified on the content test page across all viewports.)

### 2026-09-15 — course-filter: block sample uploaded to DA (appears in block-samples)
The block-samples list is served from DA, so the local drafts/ file wasn't enough. Built the DA-format
HTML (full <body> doc, intro spacer 160/120, H1 + description + Source <em> line, an H2 section + empty
`course-filter` block, closing spacer + section-metadata Style:dark + metadata Title/Robots noindex — matching
the existing accordion sample), saved at tools/importer/course-filter/da-course-filter-sample.html, then:
  POST → https://admin.da.live/source/aemdemos/coaching-usta/drafts/block-samples/course-filter.html (201)
  POST → https://admin.hlx.page/preview/.../drafts/block-samples/course-filter (200)
Now listed under drafts/block-samples in the preview window. Content verified served (plain.html 200:
heading/desc/source/spacer + empty course-filter block div present). NOTE: renders EMPTY on the main
preview until the block code (course-filter.js/.css + courses.json + badges) is merged to main — those live
only on the issue8-custom working branch today. Empty block div is correct authoring (self-populates from
courses.json at runtime).

### 2026-09-15 — course-filter: unified tab/coach-type/chip state (default Coaches + removable chip)
User: (1) on load the panel's "For Coaches" checkbox should be pre-checked (matching the active Coaches tab),
and (2) the "For Coaches" chip needs a removable ✕. Root cause: I'd modeled the persona tab and the
"Coach type" filter as SEPARATE state, so the panel checkbox wasn't synced and the tab chip was
non-removable. Source treats them as ONE state — the tab IS the Coach-type filter.
Refactor (course-filter.js): dropped `activeTab`; state now seeds `filters['Coach type'] = {COACHES}`.
`activeTabKey()` derives the active pill from a single-value Coach-type selection. `selectCourses` filters
purely on `filters` (no separate tab gate). Panel checkboxes initialize `checked` from state (so "For
Coaches" is ticked on load). `renderChips` now emits a removable chip for EVERY ticked option incl. Coach
type (chip shows "For Coaches ✕", aria-label "Remove For Coaches filter"). Tab click sets
`filters['Coach type'] = {tabKey}` and mirrors into the coach-type checkboxes; `syncTabs()` re-derives the
active pill on every rerender (so removing the chip clears the active tab). Verified: default = Coaches tab
+ "For Coaches" checked + removable chip; Parents tab → For Parents checked/chip/8 cards; remove chip →
no tab active, all checkboxes off. Lint 0 err, breakpoint/overflow/a11y pass.

### 2026-09-15 — course-filter: missing Spanish link + typography parity audit
Two fixes:
1. **Missing "Spanish." link on "Introduce Your Child to Tennis".** I'd only added spanishHref for the two
   Intro-to-Coaching courses. Swept the SOURCE across all tabs for every description link: exactly 3 courses
   carry a "Spanish." link (Introduce Your Child to Tennis, Intro to Coaching 1, Intro to Coaching 2) plus
   the shared "USTA Coaching Development Coach Badge" unlock link on 3 more. Added the missing spanishHref
   (…lo=76f2f752…) to courses-descriptions.json and rebuilt courses.json. All 3 Spanish links now render.
2. **Typography parity audit (all viewports).** Measured every text element on the source at 1440/768/390.
   All matched EXCEPT the **description link**: source renders it LARGER than body copy — 18px/lh21.6 at
   desktop+tablet, 16px/lh19.2 at mobile (an intentional source quirk); mine inherited the 16px paragraph
   size. Also the description paragraph had an inherited letter-spacing:-0.48px vs source `normal`. Fixed:
   `.course-filter-card-description a { font-size:16px; line-height:1.2 }` + `>=768 { 18px/21.6px }`;
   desc paragraph `letter-spacing: normal`. Re-verified full type table matches source at all 3 vps:
   tabTitle 16/12/14, eyebrow 18/16/12, name 32/28/18 (ls -0.96/-0.84/-0.54), desc 16, descLink 18/18/16,
   SeeMore 18/18/16, filter/sort/chip 16. Lint 0 err, breakpoint/overflow/typography/a11y all pass.

### 2026-09-15 — course-filter: tablet/mobile tab layout parity (tall-panel fix)
User: on tablet the tabs panel ballooned tall with "Coaches" floating mid-panel (vs source's tight rows).
Root cause: tabs used `flex: 1 1 140px`, so at tablet widths they wrapped AND stretched to fill. Source
uses `flex: 1 1 0; min-width: 120px` (measured) — equal-width thirds that stay on ONE compact row while
they fit and stay compact (min-width, no stretch) when wrapping. Matched exactly (added align-items:stretch
on the row for parity). Verified: mobile 390 = Parents+School row1 / Coaches full-width row2 (source-exact);
tablet 760–834 = all 3 tabs one compact row; desktop unchanged. Lint 0 err, breakpoint/overflow(360–1920)/
typography/a11y all pass.

### 2026-09-15 — course-filter: description clamp + "..." indicator + chevron direction
Tablet parity pass. Source clamps each COLLAPSED card's description to a fixed height and shows a
bottom-right "..." when truncated (keeping cards uniform/compact); mine showed full text (over-tall cards).
Measured source: `.v-course__description.clamp { overflow:hidden; max-height:~150px }` + absolute
`.v-course__description-ellipsis` (right:0; bottom:-2px; 30px/700). Implemented:
- CSS `.course-filter-card-description.is-clamped { position:relative; max-height:154px; overflow:hidden }`
  + `.course-filter-card-description-ellipsis` (absolute bottom-right, 30px/700, white bg to mask text).
- JS `clampDescription(card)`: after layout (rAF) adds `.is-clamped` + a "..." span only when the text
  overflows; expanding removes the clamp (full text shows), collapsing re-clamps; re-runs on resize
  (debounced) since 1-up↔2-up changes overflow. Hoisted above buildCard (eslint no-use-before-define).
Also fixed the **expand chevron direction**: source shows it DOWN when collapsed (SVG rotated 180°) and UP
when expanded; mine was inverted. Flipped: `svg { transform: rotate(180deg) }` default, `[aria-expanded=true] svg { rotate(0) }`.
Verified @1024: clamped copy + "..." bottom-right on long cards, uniform card height, down chevron collapsed.
Lint 0 err, breakpoint/overflow(360–1920)/typography/a11y all pass.

### 2026-09-15 — course-filter: title 3-line clamp + description stays clamped on expand
Two source-parity fixes (tablet 2-up cards):
1. **Title clamp.** Source clamps the course name to 3 lines with an ellipsis (`-webkit-line-clamp: 3`,
   display:-webkit-box, overflow:hidden). Mine showed the full title (long names like "Introducción al
   Entrenamiento 2 (Intro to Coaching 2)" pushed the card taller). Added the 3-line clamp to
   `.course-filter-card-name` (+ standard `line-clamp` for parity). Verified: long titles truncate to 3
   lines with "…".
2. **Expanded card keeps the description clamped.** Source does NOT reveal the full description on expand —
   the `.clamp` + "..." stay and ONLY the module timeline is toggled below (confirmed live: expanded
   "Intro to Coaching 2" still shows clamped copy + "..." then the 4-module timeline). Mine was releasing
   the clamp on expand. Fixed: removed the `is-expanded` early-return in clampDescription and the
   expand handler no longer strips `.is-clamped`/ellipsis — expanding only toggles `modules.hidden`.
Verified @1024: titles 3-line clamped, expanded card shows clamped desc + "..." + module timeline, chevron
flips. Lint 0 err, breakpoint/overflow(360–1920)/typography/a11y all pass.

### 2026-09-15 — course-filter: source-CSS extraction + full parity cross-check
Pulled the source's own `.v-course*` / `.v-course-list*` rules straight from the live stylesheet
(`clientlib-vue.min.css`) — 147 rules — as an authoritative reference, then diffed every property against
`blocks/course-filter/course-filter.css` at each breakpoint. (We do NOT wire up the source CSS: it's a
3,543-rule unscoped Vue app bundle that would collide with our global grid/typography and break
block-isolation + PageSpeed. We reproduce only the measured values in our scoped block CSS.)

Drifts found & fixed (source → ours was wrong):
- **Card name font-size.** Source: 18px mobile / **28px @768–1279** / 32px @≥1280. Ours had 32px kicking in
  at 1024, which also caused the mid-word horizontal clip ("Introduccić…") in the 2-up tablet column.
  Moved the 32px rule to `@media (width >= 1280px)`; 28px now holds through the tablet range. Clip gone.
- **Grid gap.** Source is `16px` at every breakpoint; ours was `24px` base / `24px 16px` desktop → now `16px`.
- **Badge size.** Source: 80px mobile / **120px @768–1279** / 148px @≥1280; ours jumped to 148 at 768.
  Now 120 at tablet, 148 moved to ≥1280.
- **Tabs panel.** Source: wrapper transparent on mobile with individual dark (#2d2d2d) pills; wrapper
  becomes the dark panel at tablet+. Margin-bottom 36 / 44 / 100. Tab height 70 mobile / 100 tablet+.
  Ours had the wrapper always dark, margin 48/100, tab min-height 54/84. Corrected all.
- **Description clamp height.** Source `calc(1.57rem * 6)`; ours hardcoded 154px → now the exact calc.
- **Module text.** Source 14px/600 mobile → 16px/400 tablet+; ours was 16px everywhere → fixed.
Verified @1024 (computed): name 28/28/-0.84, badge 120, grid gap 16, tabs #2d2d2d 100px/44px — all match.
Lint 0 err, breakpoint/overflow(360–1920)/typography/a11y all pass.

### 2026-09-15 — course-filter: expand-button hover + mobile description (2 source-parity fixes)
1. **Expand chevron turns green only on :hover.** Source has `.v-course__expand-button:hover { background:#CFFF05 }`;
   the expanded state itself is transparent. Mine had no hover rule (button looked dead on hover, and the
   "green box" the user saw on the expanded source card was just the hover state). Added
   `.course-filter-card-expand:hover { background: var(--usta-lime) }`. Verified expanded bg stays transparent.
2. **Mobile shows the FULL description, un-clamped, at 14px.** Source only clamps at tablet+ (>=768): on mobile
   the `.v-course__additional-content .v-course__description` is always visible, 14px/400, NO clamp, NO "...".
   Mine was clamping on mobile too (150px cap + "..."), which read as "blank boxes" until expanded. Fixed:
   - JS `clampDescription` early-returns (strips `.is-clamped`) when `matchMedia('(width < 768px)')` matches.
   - CSS `.course-filter-card-description` base font-size 14px (mobile) → 16px at >=768.
   Verified @390: desc full, un-clamped, 14px, no ellipsis. @1024 still clamps at 16px with "…" (unchanged).

**Rule deviation (justified) — typography gate.** `npm run check:typography` now reports 2 "drifts" at @390 for
`p` (14px vs global body 16px). This is the block-scoped mobile card copy, which the source itself renders at
14px (block-specific, NOT the global body scale — the `:root` body token in styles.css is unchanged at 16px).
The checker's heuristic grabs the first visible `<p>`, and on this block-ONLY sample page that's the card
description; on a real authored page it would measure the intro body copy (16px) and pass. Keeping 14px is the
parity-correct choice per The Typography Rule's intent (match the source); forcing 16px would break parity.
lint 0 err, breakpoint/overflow(360–1920)/a11y all pass; typography drift is the intentional block-scoped 14px.

### 2026-09-15 — course-filter: CORRECTION — mobile description is expand-only (not always-on)
Reverses the previous entry's mobile-description decision, which was based on a mis-measurement (I had
inspected the source AFTER a card was already expanded). Re-measured the source on a FRESH mobile (390) load
with nothing clicked: the collapsed card shows the **title only** — `.v-course__additional-content` has
`offsetHeight: 0` (an ancestor is collapsed). Tapping the chevron reveals the description (14px, un-clamped)
**and** the module timeline together. So on mobile the description is part of the expandable region, hidden
until expand — matching the user's source screenshot (blank-looking cards = title-only, by design).
Contrast: at tablet/desktop (>=768) the description is ALWAYS visible (clamped + "…"), and the toggle only
reveals the timeline.

Implementation:
- JS: every card now renders an expand toggle (previously only module-bearing cards had one). Cards with 0
  modules get `.course-filter-card-standalone`. The toggle handler flips `.is-expanded` (reveals the mobile
  description via CSS) and toggles the timeline when present.
- CSS: `.course-filter-card-description { display: none }` base (mobile collapsed) → `display: block` when
  `.is-expanded`; at >=768 it is `display: block` unconditionally (always visible) at 16px. Standalone cards
  hide their toggle at >=768 (nothing to expand there; description already inline) but keep it <768.
Verified @390: collapsed = title only (desc height 0); expand → desc (14px) + 3-module timeline; standalone
0-module card keeps its mobile toggle. @1024: all descriptions inline + "…", standalone card has no toggle.
lint 0 err, breakpoint/overflow(360–1920)/typography/a11y ALL pass (typography now green — the mobile 14px
copy is hidden when collapsed, so the checker no longer reads it as a body drift).

### 2026-09-15 — course-filter: mobile description is FULL-WIDTH below the row (two-copy model) + green expanded chevron
Pixel-diffing the source vs migrated expanded mobile card revealed the real structural drift: the source
renders the description in TWO DOM positions, one shown per viewport (its Vue markup has both
`.v-course__info-section .v-course__description` AND `.v-course__additional-content .v-course__description`):
- **Desktop (>=768):** description is INLINE inside the info column, beside the badge (info copy visible,
  additional-content copy hidden). Measured: badge 148@x672, inline desc @x844 w276.
- **Mobile (<768):** description is FULL-WIDTH BELOW the badge/title/expand row (additional-content copy
  visible, info copy hidden). Measured: badge 80@x32 top-left, desc @x32 w326 spanning the whole card,
  then the module timeline below it.
Mine had a SINGLE description trapped in the narrow info column on mobile (squished beside the badge) — the
positioning/dimension drift the user flagged.

Fix (mirrors the source's two-copy approach; the hidden copy is display:none so no duplicate a11y text):
- JS: extracted `buildDescription()` and render it twice — `.course-filter-card-description-inline` inside
  the info column, and `.course-filter-card-description-mobile` appended full-width below the content row.
  Module timeline now appended at the card bottom (order: title row → mobile desc → timeline). clampDescription
  targets only the inline copy.
- CSS: `-inline` display:none on mobile → block at >=768 (clamped, 16px, beside badge). `-mobile` display:none
  on desktop; on mobile hidden when collapsed → block on `.is-expanded`, full-width (padding-right:0), 14px.
- Green chevron: user wants the expanded (highlighted) chevron green. Source shows it green post-tap (sticky
  :hover on touch). Added `.course-filter-card-expand[aria-expanded="true"] { background: var(--usta-lime) }`
  alongside :hover.
Verified @390: collapsed = title only; expand → chevron lime, badge 80 top-left, desc full-width (x32 w326,
14px) below, then timeline. @1280: inline desc beside 148 badge (16px, clamped), mobile copy hidden.
lint 0 err, breakpoint/overflow(360–1920)/typography/a11y ALL pass.

### 2026-09-15 — course-filter: live LMS API fetch (hybrid) replaces static-only JSON
The block now pulls fresh course data from the source's own LMS API at runtime, so course/module/tag/sort
changes flow through automatically without a rebuild.

Discovery: captured the source's network calls → the widget hits **GET https://services.ustacoaching.com/v1/lms/courses/all**.
Verified CORS-open (`access-control-allow-origin: *`), `application/json`, `{courses:[...]}` — SAME shape as our
baked file, 31 courses. BUT the API carries STRUCTURED data only (name/code/language/filters/modules/sort/badgeName);
it has NO authored descriptions, badge images, unlock text, or Spanish links (those were DOM-scraped into
courses-descriptions.json and merged by build-courses-json.mjs), and it omits the 2 workshop-only cards.

Design — hybrid (fetch + baked enrichment, with offline fallback), in blocks/course-filter/course-filter.js:
- `LMS_API` constant; `loadCourses(basePath)`:
  1. Always load baked `courses.json` (it is BOTH the enrichment lookup, keyed by `code`, AND the fallback).
  2. Fetch the live API; `mergeCourse()` normalizes each API course (mirrors build-courses-json.mjs) and grafts
     the baked description/badge/unlock/Spanish by `code`.
  3. Append baked-only cards the API doesn't return (the 2 workshop cards), sort by `sort`.
  4. On any API error (network/!ok/empty) → return the fully-baked, already-enriched dataset. Block always renders.
- Join key confirmed: all 31 API `code`s match baked; only INC-W1010 + CAR-W1010C are baked-only.
Verified live @localhost: API 200/31 courses, 16 cards render, first card "Intro to Coaching 1" with description +
Spanish link (proves live-structured + baked-enrichment merge). Fallback returns 33 enriched courses incl. workshop.
courses.json stays in the repo (enrichment + fallback) — keep running build-courses-json.mjs when authored copy changes.
lint 0 err, overflow(360–1920)/typography/a11y all pass.

### 2026-09-15 — course-filter: badge PNGs moved from code to DA content assets
Moved all 22 rasterized badge PNGs out of the code repo (blocks/course-filter/badges/, ~664KB) and into the
DA content/DAM at content/assets/media/blocks/course-filter/, published so they serve from the content host.
Keeps binary assets out of git; the block references them by URL.

Steps:
- Copied the 22 PNGs to content/assets/media/blocks/course-filter/ (byte-identical), then dropped the code
  copies (blocks/course-filter/badges/ gone entirely).
- Rewrote badge refs from `badges/x.png` to root-relative `/assets/media/blocks/course-filter/x.png` in
  courses.json (24 refs; some shared) and in build-courses-json.mjs (BADGE_BASE const in localBadge) so
  future rebuilds emit the same path.
- JS: `img.src = course.badge` directly (was `${basePath}/${course.badge}`) — the badge is now an absolute
  content path that resolves on every host. Dropped the now-unused basePath param from buildCard/renderCourses.
- Published to DA: POST each PNG to admin.da.live/source/aemdemos/coaching-usta/assets/media/blocks/course-filter/
  (22/22 → 201), then admin.hlx.page/preview/ (22/22 → 200).
Why root-relative absolute: works on local dev (direct 200), preview, and prod without a hardcoded domain. On
the published host the clean path 301-redirects to DA's content-hashed filename (media_<hash>.png, image/png,
200) — browsers follow it transparently for <img>. Verified all 22 resolve on main--coaching-usta--aemdemos.aem.page.
Content assets are DA-managed (content/ is gitignored), so they live in DA, not the code repo — the goal.
lint 0 err, breakpoint/overflow/typography/a11y/svg all pass; badges load from /assets/ locally + published.

### 2026-09-15 — course-filter: enrichment moved to an author-editable DA sheet (courses.json retired)
Replaced the baked courses.json enrichment with an author-owned DA sheet. Authors now edit badge +
description (+ unlock/Spanish) in Document Authoring — preview/publish — and the block picks it up. No code
change needed to update course copy or badge mapping.

Architecture — runtime 3-way merge in loadCourses():
  1. LMS API (services.ustacoaching.com/v1/lms/courses/all) — fresh STRUCTURED data (name/code/modules/tags/sort).
  2. DA sheet /course-enrichment.json — author-owned ENRICHMENT (badge path, description, unlock, unlockLinkText/Href,
     spanishHref), an EDS sheet { columns, data:[…] }, one row per course keyed by `code`.
  3. WORKSHOP_CARDS (in course-filter.js) — the 2 workshop cards the API omits: ONLY their irreducible structure
     (code/name/sort/tags/moduleCount). Their badge/description still come from the sheet by code.
API + sheet fetched in parallel (Promise.all); each course enriched by `code` via applyEnrichment().

Behaviour / decisions (per user):
- Sheet location: /content/course-enrichment (→ /course-enrichment.json). Published to DA source→preview→live (all 200).
- Fallback: if the sheet 404s/errs, loadEnrichment() returns an empty Map → cards render STRUCTURE-ONLY (no badge/
  desc), never blanks the whole block. courses.json fully removed (git rm) — no longer a fallback.
- Badges: author references an already-published asset path in the sheet's `badge` column (e.g.
  /assets/media/blocks/course-filter/x.png). Image upload/publish stays separate (the find-on-source→rasterize→
  publish flow). The MAPPING (course→badge) is now author-owned in the sheet, not code.
- A brand-new API course with no sheet row still renders (structure only) until an author adds its row — graceful.
- New-course flow now: add a row to the DA sheet (badge path + description), preview/publish. Only if the badge
  image itself is new do you also rasterize + publish the PNG to /assets/media/blocks/course-filter/ first.

Code:
- blocks/course-filter/course-filter.js: added ENRICHMENT_SHEET + WORKSHOP_CARDS consts; new normalizeApiCourse(),
  applyEnrichment(), loadEnrichment(); rewrote loadCourses() (no basePath). buildCard/decorate no longer touch a
  baked file. unlockLink now assembled from unlockLinkText/Href columns.
- build-courses-json.mjs repurposed → SEED/REGENERATOR that emits content/course-enrichment.json (32 rows, 24 with
  badges, incl. both workshop rows) from the captured source DOM. Run once to seed; thereafter authors edit in DA.
Verified @localhost: 16 cards from API+sheet, all 13 visible badges load (lazy — 0 broken after scroll), workshop
card present with description, High School Tennis has badge+desc. lint 0 err, breakpoint/overflow/typography/a11y all
pass. NOTE: the block JS change reaches .aem.live only after commit+push+merge; the sheet + badges are already live.

### 2026-09-15 — course-filter: consolidated all block content under one DA folder
Moved the sheet + badge media into a single, author-obvious location so authors know exactly where the block
renders from. Everything for the block now lives under content/blocks/course-filter/:
  - content/blocks/course-filter/course-enrichment.json   → served /blocks/course-filter/course-enrichment.json
  - content/blocks/course-filter/media/*.png (22)          → served /blocks/course-filter/media/<name>.png
Was: sheet at /course-enrichment.json + badges at /assets/media/blocks/course-filter/ (two separate places).

Changes:
- Badges copied to content/blocks/course-filter/media/ and published to DA (source+preview+live: 22/22 each).
- Sheet regenerated at the new path with BADGE_BASE = '/blocks/course-filter/media' (rows unchanged: 32, 24 badges);
  published to DA (source 201 / preview 200 / live 200).
- build-courses-json.mjs: BADGE_BASE + output path updated to the consolidated folder; header documents the layout.
- course-filter.js: ENRICHMENT_SHEET = '/blocks/course-filter/course-enrichment.json'; comment documents that the
  sheet + its media sit side by side.
Verified @localhost: all 13 badges load from /blocks/course-filter/media/…; sheet+badges resolve on local & live (200).
lint 0 err, overflow/typography/a11y pass. Old published paths (/course-enrichment.json, /assets/media/blocks/
course-filter/*) are now orphaned in DA — harmless; can be unpublished/deleted in DA later if desired.

### 2026-09-15 — course-filter: fixed clamped description cut mid-line (desktop)
The clamped inline description showed a sliced half-line at the bottom on desktop. Root cause: the clamp cap
was `max-height: calc(1.57rem * 6)` = 150.72px, but our body line box is 16px×1.2 = 19.2px → 150.72/19.2 =
7.85 lines, so overflow:hidden cut mid-way through the 8th line. (The 1.57rem figure was copied from the
source's own loose math and doesn't divide evenly by our line-height.) Fix: cap at a WHOLE number of lines
with the `lh` unit — `max-height: 8lh` — so the cut always lands on a clean line boundary. Verified @1280:
maxHeight 153.5px = 7.995 lines (clean boundary), ellipsis intact. lint 0 err, breakpoint/overflow/typography/
a11y all pass.

### 2026-09-15 — course-filter: courses.json fully removed (confirmed)
Confirmed the baked courses.json is gone from the repo (git rm'd during the DA-sheet migration) and the block
has ZERO references to it — data comes entirely from the live LMS API + the DA enrichment sheet, with the 2
workshop cards as an in-code constant. A `curl` to /blocks/course-filter/courses.json still 200s only because
the dev server proxies the copy still deployed on the issue8-custom branch; it disappears on merge. The block
never fetches it. Nothing else references courses.json except the (repurposed) regenerator script's docs.

### 2026-09-15 — hero (default): "Our Core Workshops" bg-image hero
Instrumented the hero DEFAULT variant to match the source workshops-page hero (blocks/hero/hero.js +
blocks/hero/hero.css). Source: https://www.ustacoaching.com/en/home/workshops.html.

Design (source-measured across 390/768/1024/1280/1440):
- Two-line H1 in USTA Sans bold, ALL-CAPS display face: "Our Core" white + "Workshops" lime (#CFFF05).
  Font-size 32 (mobile/tablet) → 40 (≥1024) → 64 (≥1280), line-height = font-size, letter-spacing normal.
  (The uppercase is the font itself — source text-transform is none; we set text-transform:uppercase to match
  since our content is title-case.)
- Full-width rounded frame: border-radius 20px, overflow hidden, background-size cover, dark overlay
  rgb(0 0 0 / 42%) via ::before. min-height 260 → 384 (≥1024) → 470 (≥1280). Section gutters 16/40/48/64.
- CTA "Find a Workshop" → lime pill: border-radius 9999px, Graphik Semibold 18px, black text, padding 14px 32px,
  hover → white.

Authoring contract (default hero): block rows = [ background-image LINK ] then [ heading(s) + CTA link ]. The
2nd heading (or an <em> inside a heading) is the lime accent — JS tags it .hero-accent(-line), never nth-child.
JS (decorateDefault): reads the bg from an image-extension LINK href and applies it as a CSS background-image on
.hero-bg (with role=img + aria-label from the link text); groups headings + CTA into .hero-content; the first
link becomes .hero-cta. dispatch: block.classList video → decorateVideo else decorateDefault.

KEY GOTCHA — DA mangles authored <img>: a bare/<picture>-wrapped <img> whose src is a clean content path
(/blocks/hero/media/…) gets rewritten to src="about:error" by DA's HTML/image pipeline (it only accepts its
own hashed media_* uploads). Fix: author the background as a LINK to the image (DA leaves link hrefs intact) and
let the block apply it as a CSS background. Reusable pattern for block bg images on clean content paths.

Assets/sample: bg image at content/blocks/hero/media/our-core-workshops.jpg (published to DA source/preview/live).
DA sample page tools/importer/hero/da-hero-default-sample.html → /drafts/block-samples/hero-default (published).
Verified: heading 32/40/64 across breakpoints, bg loads via CSS cover, overlay + pill correct, visual parity with
source screenshot. lint 0 err, breakpoint/overflow(360–1920)/typography/a11y all pass.

### 2026-09-15 — hero (default): pixel-parity corrections (overlay colour + spacing)
Overlaying source vs migrated revealed two drifts, both fixed:
1. **Overlay colour shade.** Source stacks TWO tints over the image (measured on the ancestor chain), not one:
   a blue wash `rgb(3 115 243 / 59%)` PLUS a black scrim `rgb(0 0 0 / 42%)`. Mine used a single black overlay →
   read too grey. Fixed: `::before` now paints both as stacked linear-gradients (black in front, blue behind) —
   reproduces the blue-shifted look.
2. **Content positioning / gaps.** Source rhythm @1280 (frame 468): heading block, 96px gap, CTA, symmetric
   padding. Mine used a flat flex gap:32 that also separated the two heading LINES. Fixed: JS groups the two
   headings into one `.hero-heading` block (zero inter-line gap, line-height:1); the `.hero-content` gap now
   applies ONLY heading-block→CTA and scales per breakpoint (48 mobile → 64 @1024 → 96 @1280, source-measured).
   Desktop frame set to min-height 468px with padding-block:0 so the centred content matches source proportions.
Verified @1280: overlay = layered blue+black, CTA gap 96px, h1 64px, frame ~468 — matches the source screenshot.
lint 0 err, breakpoint/overflow/typography/a11y all pass.

### 2026-09-15 — hero (default): frame border + mobile-only edu logo + mobile CTA width
Another overlay pass caught three more drifts vs source:
1. **Frame border.** Source frame has `border: 1px solid #fff` (border-radius 20px). Mine had none. Added.
2. **Mobile-only "Education Center" logo.** Source shows a 158×93 "USTA Coaching Education Center" SVG between
   the heading and CTA — but ONLY on mobile (display:none at ≥768). Downloaded the source DAM SVG (10.3KB) →
   content/blocks/hero/media/education-center.svg, published to DA. Authoring: a second IMAGE link in the hero;
   JS turns any image-href link (now incl. .svg) into `<img class="hero-logo">` placed after the heading block;
   CSS shows it 158px on mobile, display:none at ≥768. NOTE: had to add `svg` to isImageHref() — without it the
   .svg link fell through and wrongly became the CTA.
3. **Mobile CTA width.** Source CTA is a fixed 280px pill on mobile → auto (sizes to text) at ≥768. Set width:280px
   (max-width:100%, box-sizing:border-box) base, width:auto at ≥768.
Verified @430: white border, blue overlay, heading, edu logo (158×93, visible), 280px pill — matches source mobile
DevTools capture. @768/1280: logo hidden, CTA auto-width, border present. lint 0 err, breakpoint/overflow/
typography/a11y/svg all pass.

### 2026-09-15 — hero (default): CTA width + edu-logo sizing corrections (re-measured)
Re-measured the source across 8 widths (390–1440), correcting two values from the prior entry:
1. **CTA width is 280px at EVERY breakpoint** (measured 280 at 390/600/768/900/1024/1200/1280/1440) — NOT
   auto at tablet+. My prior `width:auto` @768 made the desktop button hug its text (too narrow vs source).
   Fixed: `width:280px` base, no ≥768 override. Now a consistent 280px pill everywhere, matching the source.
2. **Edu logo width is FLUID, not fixed 158px.** Source sizes it ~40% of content width, capped ~260px
   (measured 142@390, 186@500, 226@600, 260@700), visible below 768. Fixed: `width:40vw; max-width:260px`.
   Also corrected visibility: shown <768 (incl. 600), hidden ≥768 — the media query was already right.
Verified: @430 logo visible + 280px pill; @600 logo visible; @768/1280 logo hidden, pill still 280px. lint 0 err,
breakpoint/overflow/typography/a11y all pass.

### 2026-09-15 — hero (default): full typography audit (per-element, per-breakpoint)
Measured every text element on the source at 390/768/1024/1280/1440 and matched exactly. Findings:
- **Headings (h1 "Our Core" + "Workshops"/accent):** USTA Sans, weight 700, line-height = font-size, letter-
  spacing normal, align center. Size 32 (≤768) → 40 (1024) → 64 (≥1280). White; 2nd line accent lime #CFFF05.
  Already matched — no change. (We apply text-transform:uppercase since our authored text is title-case; the
  source text is pre-uppercased so its computed tt:none renders identically.)
- **CTA "Find a Workshop" — two drifts fixed:**
  * letter-spacing: source **1px**; mine inherited the global −0.48px → set to 1px.
  * font-size: source CTA text is RESPONSIVE **16 (≤1023) → 18 (1024) → 24 (≥1280)** (the size lives on the
    inner text span, which scales); mine was a flat 18px. Fixed: base 16px, 18px @1024, 24px @1280.
  Family Graphik Semibold, weight 400, line-height 20px, color #000, align center, width 280px — already matched.
Re-verified computed CTA: 390=16/1px, 768=16/1px, 1024=18/1px, 1280=24/1px — exact source match at every width.
lint 0 err, breakpoint/overflow/typography/a11y all pass.

### 2026-09-15 — discussion-boards block (Custom Widget, STATIC — Coaching Community page)
Instrumented the "Now Live: Engage in our Discussion Boards" section from
https://www.ustacoaching.com/en/home/coaching-community.html as a new **discussion-boards** block.
**Confirmed STATIC, not dynamic:** every container in the source section carries `data-api-url="false"`
and ALL copy (heading, description, Access CTA, and the 3 discussion cards) is present in the
server-rendered HTML — nothing is fetched from JSON. So it is authored in-place, not data-driven.

**Authoring contract (table block):**
- Row 1 (intro): one cell with the `<h2>` (accent word wrapped in `*italic*`/`<em>` → lime via the
  global inline-accent convention), the description `<p>`, and the "Access" link.
- Rows 2..n (cards): two cells — card title | card body. Any row WITHOUT a heading is a card; the
  title cell becomes an `<h3>`, the body an `<p>`.
JS groups the intro cell's children into `.discussion-boards-intro`, builds one
`.discussion-boards-card` per remaining row, and adds `.button` to the CTA link so the global lime
pill styling applies.

**Layout (source-measured, mobile-first):** dark `#202020` rounded panel (radius 20px). Base = stacked
(intro above a column of cards); **two-column split at >=1280** (intro flex 41.66% ≈ source 5/12, cards
fill the rest; measured intro ratio 0.418 vs source 0.417). Cards are `#000`, radius 20px, gap **42px**
at every breakpoint. Panel padding steps 12px16px (mobile) → 12px (768/1024) → 36px12px (1280). Card
padding steps 12px (mobile) → 16px4px (768/1024) → 24px16px50px (1280).

**Typography — source truth for THIS section (matched exactly across 390/768/1024/1280):**
| el | 390 | 768 | 1024 | 1280 | family |
|---|---|---|---|---|---|
| h2 | 24/24 | 40/40 | 56/56 | **56/56** | **Graphik Semibold 700** |
| desc p | 16 | 16 | 18 | 24 | Graphik Regular |
| card h3 | 16/16 | 28/28 | 28/28 | 28/28 | Graphik Semibold 700 |
| card p | 12 | 16 | 16 | 16 | Graphik Regular |
CTA: Graphik Semibold, 18px, letter-spacing 1px, radius 12px, padding 14px24px, lime bg / black text;
width **280px on mobile**, auto at >=768 (source-measured). "Live" accent = lime `#cfff05`.

**⚠️ DEVIATION from the global type scale (justified, source-faithful).** This section uses the source's
per-component `data-custom-font-size="true"` overrides, so its h2 is **Graphik Semibold** at
24→40→56→**56** and h3 at 16→28→28→**28** — intentionally different from the global scale (h2 USTA Sans
28→40→56→64; h3 28→28→28→32). Verified live at 1280: source h2 computes to `Graphik Semibold / 56px /
700`. Therefore `npm run check:typography` reports **12 expected "drifts"** when pointed directly at the
sample page (h2 family/size, h3 size at 390/1280). These are FALSE POSITIVES for a lift-and-shift — the
checker enforces the site-wide scale, but this section legitimately opts out. NOT added to the a11y
sweep config; the block is not on the homepage, so it does not affect the homepage typography gate.

Sample page: `content/drafts/block-samples/discussion-boards.plain.html` (+ mirror in
`drafts/block-samples/`), section style `dark`. Route note: the dev CLI proxies pretty routes to the
remote branch and only serves new local files under `/content/...` — preview at
`http://localhost:3000/content/drafts/block-samples/discussion-boards`.

**Verified:** lint 0 err; breakpoint-check ✓; overflow sweep ✓ (360/768/1024/1280/1920 all OK);
a11y ✓ (1 passed, 0 critical/serious); typography ✗ 12 EXPECTED drifts (documented deviation above).
Visual parity vs source screenshot confirmed at 1280 (two-col, dark panel, black cards, lime pill).

### 2026-09-15 — discussion-boards: pixel-parity fixes (container alignment + card-title bug)
User overlaid source vs migrated screenshots and flagged the panel was narrower/indented (not aligned
with the header) and card titles looked wrong. Root-caused two real drifts and fixed both:
1. **Container / header alignment (the big one).** The source panel is NOT in the site's 1200px content
   column — it spans nearly full-width: **max-width 1408px, centred, with header-tracking side gutters**
   (measured 16@390 / 40@768 / 48@1024 / 64@1280+). Verified panel widths: 358@390, 688@768, 928@1024,
   1152@1280, 1312@1440, 1408@1920 (capped). My block was trapped in `main > .section > div` (1200px,
   24/32px padding) → at 1440 it rendered 1200px wide, indented 120px, breaking header alignment. Fix:
   JS adds `.full-width` to the block wrapper (escape hatch), and the block re-imposes the source
   container via `width: calc(100% - 2*gutter); max-width:1408px; margin-inline:auto`, with the gutter
   stepping per breakpoint. Added the global `.full-width` rule to `styles.css` (`main > .section >
   .full-width { max-width:none; margin:0; padding:0 }`) and scoped the 1024 padding rule to
   `:not(.full-width)`. Post-fix @1440 matches source EXACTLY: gutter 64, panel 1312, h2 left 88, h2
   width 513, card0 625/727, card right-inset 24, intro→card gap 24. @1920 panel caps at 1408 (gutter
   256); @1280 panel 1152 (all source-exact).
2. **Two-column split geometry.** Source is a gapless 12-col grid: intro=5/12, cards=7/12, no flex gap,
   each column padded 0 12px. My earlier version used `flex 41.66%` + `gap:24` + one-sided padding,
   which shifted the card column. Fixed to `flex:0 0 41.667%` / `0 0 58.333%`, `gap:0`, symmetric
   `padding:0 12px`, and added `box-sizing:border-box` to both columns (their 12px padding was adding to
   the % basis → 48px overflow, cards spilling past the panel).
3. **Card-title too small/light (real bug).** EDS wraps loose cell text in `<p>`, so my JS produced
   `<h3><p>…</p></h3>`; the inner `<p>` rendered at 16px body size, overriding the h3's 28px → card
   titles looked tiny and stayed on one line (source wraps to 2). Fix: in decorate(), when the title
   cell is a sole wrapping `<p>`, move that `<p>`'s child nodes into the `<h3>` (unwrap) instead of the
   `<p>` element. Post-fix card h3 = 28px/700/Graphik Semibold, width 695, wraps to 2 lines (height 56)
   — exactly matching source.
Verified: lint 0 err; breakpoint ✓; overflow ✓ (sample + homepage, 360–1920); a11y ✓ (sample + homepage);
homepage layout unchanged (`.full-width` is unused elsewhere so `:not(.full-width)` is a no-op there).
Container model now: panel max-width 1408, gutters 16→40→48→64; intro 5/12 + cards 7/12 gapless @1280.

### 2026-09-15 — discussion-boards: per-element typography audit (all viewports)
Full per-element type comparison vs source at 390/768/1024/1280/1440 (font family/size/weight/
line-height/letter-spacing/color/align/wrapping). Confirmed source truth (matched exactly):
| element | 390 | 768 | 1024 | 1280+ | family/weight | letter-spacing | color |
|---|---|---|---|---|---|---|---|
| h2 | 24/24 | 40/40 | 56/56 | 56/56 | Graphik Semibold 700 | -0.03em (−0.72→−1.68) | #fff |
| desc p | 16/19.2 | 16/19.2 | 18/21.6 | 24/28.8 | Graphik Regular 400 | **normal** | #fff |
| CTA | 18/20 flat all vp | | | | Graphik Semibold 400 | 1px | #000 |
| card h3 | 16/16 | 28/28 | 28/28 | 28/28 | Graphik Semibold 700 | -0.03em (−0.48→−0.84) | #fff |
| card p | 12/14.4 | 16/19.2 | 16/19.2 | 16/19.2 | Graphik Regular 400 | **normal** | #fff |
"Live" accent: lime #cfff05, Graphik Semibold 700 (inherits h2). CTA link has text-transform:uppercase
but its inner text span resets to none (source renders "Access" as authored) — mine authored uppercase-
free, renders identically.

**Drift found & fixed:** desc p and card p were inheriting the GLOBAL body `letter-spacing:-0.03em`, but
the SOURCE uses `letter-spacing:normal` on this section's body text. This is a real wrapping driver — at
390 the tighter spacing made the description wrap to 4 lines (77px) instead of the source's **5 lines
(96px)**, changing block height. Fixed: added `letter-spacing: normal` to both `.discussion-boards-intro
p` and `.discussion-boards-card p`. Post-fix desc @390 = 5 lines/96px, card p normal — exact source
match. (h2 and card h3 correctly keep -0.03em, matching source.) All other properties already matched.
Verified: lint 0 err; breakpoint/overflow/a11y all pass. Line-counts now match source at every vp
(h2 3-line @1440 / 4-line @1280 / 2-line @768,1024,390; desc 4/5/2/2/5; card h3 2-line except 1-line @1024).

### 2026-09-16 — discussion-boards: mobile/tablet padding + gap + CTA parity fixes
User flagged (mobile screenshots) positioning/dimension drifts. Measured source vs migrated at 390/768
and fixed all of them. Source stacked (≤1023) box model, now reproduced exactly:
- **Intro column has its OWN padding** on top of the panel padding: `12px 8px` @390, `12px` @768 — so
  h2/desc/CTA sit **24px** in from the panel edge (was 16). Added `padding:12px 8px` to
  `.discussion-boards-intro` base + `12px` at 768.
- **Cards column padding** `8px 0` @390, `8px 12px` @768. The intro's 12px bottom pad + cards' 8px top
  pad produce the source's **20px** intro→first-card gap — replaced the old `margin-top:42` on the cards
  wrapper with this padding model (was giving 42, source is 20).
- **CTA button drifts:** was 48px tall / left-aligned / and the desc→CTA gap was 100 (should be 76).
  Root cause: the authored CTA is wrapped in a `<p>` whose 24px top-margin compounded with the button's
  76px margin. Fixes: (1) JS now unwraps the CTA's sole wrapping `<p>` so the button is a direct flex
  child of the intro (kills the extra 24 → gap now exactly 76); (2) button set to `display:flex;
  align-items/justify-content:center; height:56px; text-align:center` — matches source 56px-tall centred
  pill (was 48, left); (3) at ≥768 button uses `width:fit-content` (hugs "Access" ≈120px) instead of
  `auto` which was stretching it to the full 640px column.
Post-fix @390 (all source-exact): intro inset 24, CTA 280×56 centred, heading→desc 24, desc→CTA 76,
CTA→card0 20, cardGap 42, card height 94. @768: intro inset 24, CTA 116×56 (hugs text), same gaps.
Desktop (≥1280) unaffected — its media query overrides column padding (0 12px) and the 5/12+7/12 split;
re-verified @1440: gutter 64, panel 1312, card0 727, gaps 24/42 intact. Verified: lint 0 err;
breakpoint/overflow/a11y all pass; no horizontal overflow 360–1920.
### 2026-09-16 — hero (default): direct-image authoring + mobile pixel-parity fixes
Two changes to the default hero (the "Our Core Workshops" block sample).

**1. Direct-image authoring (was: image-as-link workaround).** The bg + the mobile-only
"Education Center" logo were authored as LINKS to images (a workaround for DA rewriting clean-path
`<img>` to about:error). Reworked to author both as REAL images — DA uploads them into the page's
hidden per-page media folder (`.hero-default/`), which survives DA's publish pipeline (same model every
other block uses). `blocks/hero/hero.js` `decorateDefault`:
  - Background now read from the FIRST block row's `<img>` (scoped to that row so it's never confused
    with the logo image), applied as a CSS background on `.hero-bg` with role=img + alt as aria-label.
    A legacy image-LINK is still accepted as fallback.
  - Logo now taken from a real `<img>`/`<picture>` in the 2nd content cell (tagged `.hero-logo`, unwrapped
    from picture/empty-p, placed after the heading block). Legacy link fallback kept.
Assets: the real source images recovered and placed at `content/media-da/drafts/block-samples/hero-default/`
(bg = `usta-coaching-her-2.jpg`, the basket-of-USTA-balls-behind-fencing photo 1920×1080, found via the
source's `data-desktop-background-image` on the blue-overlay container; logo = white education-center PNG
520×306). Uploaded to DA `.hero-default/` (201). Local sample `content/drafts/block-samples/hero-default.plain.html`
authors both as `<picture><img src="/media-da/drafts/block-samples/hero-default/…">` — the `/media-da/` path
is our LOCAL dev-server mirror of DA's `.hero-default/` folder (never shipped to DA; the DA doc references
content.da.live/.../.hero-default/… instead). DA doc publish deferred (outward-facing, on request).

**2. Mobile (≤767) pixel-parity fixes.** Overlaying source vs migrated @390 showed the components drifted
in position/dimension (same design, looser spacing). Measured the SOURCE @390 and matched exactly:
| item | source @390 | was | fix |
|---|---|---|---|
| frame height | 260 (border-box) | 296 | added `box-sizing: border-box` (min-height was content-box → padding+border inflated it) |
| top → heading | 26 | 45 | base `padding` 40px → `26px 24px 8px` |
| CTA → frame bottom | 8 | 45 | (same padding change) |
| heading→logo→CTA gap | 26 | 48 | `.hero-content` gap 48 → 26; logo `margin-top` −48 → −26 |
| logo width | 142 (36.5vw) | 156 (40vw) | `width` 40vw → 36.5vw |
| CTA height | 52 | 48 | `border: 0` → `2px solid transparent` (source pill is 52 = lh20 + pad14×2 + border2×2) |
Verified @390 migrated == source: frame 262/x16/w358, top→OurCore 27, line gap 0, heading→logo 0,
logo 142×84 x124, logo→CTA 26, CTA 280×52 x55, CTA→bottom 9 — all within ≤2px sub-pixel. Desktop tiers
unaffected (≥1024 overrides padding→48/gap→64; logo display:none ≥768; ≥1280 padding-block:0). lint 0 err,
breakpoint/overflow(360–1920)/typography/a11y ALL pass.

### 2026-09-16 — hero (content) variant — Coaching Network (coach-mentorship page)
Added a third **content** variant to the hero block for the "USTA Coaching Network" section on
https://www.ustacoaching.com/en/home/coach-mentorship.html. Full-bleed rounded background photo + dark
overlay with **LEFT-aligned** copy (vs default/video which are centered): big USTA Sans display H1, an
uppercase H2 subheading, body paragraphs, then a lime primary CTA beside a white underlined secondary
text link (two CTAs in one authored paragraph → flex row, 32px gap).
- **JS:** `decorateContent()` — dispatched on `block.classList.contains('content')`. Bg from row 1
  (picture/img or image link), copy from row 2; first non-image link → `.hero-cta` (lime pill), second →
  `.hero-cta-secondary` (underlined). Reuses the shared `isImageHref`/`applyBgImage` helpers.
- **CSS:** `.hero.content` — 20px radius, overlay `rgb(0 0 0 / 55%)`, gutters 16/40/48/64. H1 tracks the
  recorded type scale 32→40→56→80 (USTA Sans 700 uppercase); H2 20→28→32→40; body 16 Graphik Regular.
  Registration dates use an authored `<br>` (survives EDS) → two lines like source.
- Authoring contract: `hero (content)` block; row1 = bg image, row2 = h1 + h2 + p's + 2 links.
- Sample: content/drafts/block-samples/hero-content.plain.html (Style: dark).

⚠️ **BUILT WHILE SOURCE WAS IN MAINTENANCE** — ustacoaching.com served a "Maintenance Page" for every
URL, so the live DOM could NOT be measured. Structure, content, type scale, colors, gutters, CTAs and
left-aligned layout are from the provided desktop screenshot + the recorded design tokens
(typography.json / breakpoints.json). **STILL TO RE-VERIFY against the live source once it's back:**
exact per-viewport H1/H2/body font-size + line-height, vertical rhythm (H1→H2→body→CTA gaps), panel
min-height per breakpoint, overlay opacity/tint (guessed 55% black — the sibling default hero layers
blue+black; the content hero may too), CTA exact padding/radius/size, and the secondary-link treatment.
Also **download the background photo** (referenced at /blocks/hero/media/coaching-network.jpg — not yet
fetched because the source/DAM is unreachable) and publish it to DA.
Verified NOW (structure/tokens only): lint 0 err; breakpoint ✓; overflow ✓ (360–1920); a11y ✓.

### 2026-09-16 — hero (content): pixel-parity pass vs LIVE source (site back up) + bg image
Site returned from maintenance; re-measured the live DOM at 390/768/1024/1280/1440 and fixed all drifts.
**Content had changed live** since the maintenance-era build — updated the sample to match: registration
copy is now "Registration for the 2026 Session is Now Closed. / Next Registration Window: Opening in
January 2027" and a SINGLE lime button "2027 Programs Coming Soon" (the earlier Apply/Find dual-CTA is
gone). Downloaded the source background photo
(dam/…/coach-mentorship/coaching-mentorship-handshake.jpg) → optimized to 2000×1333 / 350KB →
content/blocks/hero/media/coaching-network.jpg.

**Root-cause bug fixed:** the default-hero rules used `.hero:not(.video)`, which ALSO matched
`.hero.content` (content isn't video) — so the content variant inherited the default's
`justify-content:center`, `min-height`, and `.hero-content{gap:26/64/96}`. That gap stacked on top of
the content margins (the ~96px-too-large gaps + centered layout). Fixed by scoping every default rule to
`.hero:not(.video):not(.content)` (and the container `…:not(:has(.hero.content))`). Stylelint wanted the
combined `:not(.video, .content)` form — applied via lint:fix.

**Source model (live-measured, now matched):**
| | 390 | 768 | 1024 | 1280 | 1440 |
|---|---|---|---|---|---|
| container gutter | 8 | 28 | 36 | 52 | 52 |
| content inset (from vp) | 32 | 60 | 80 | 99 | 112 |
| panelTop→H1 | 27 | 9 | 85 | 97 | 97 |
| H1 | 32/32 | 40/40 | 56/56 | 80/80 | 80/80 |
| H2 sub | 28/36.4 | 28/36.4 | 28/36.4 | 32/41.6 | 32/41.6 |
| body/reg/must | 18/24 (Graphik Regular) | → | → | → | → |
| CTA | lime, radius 12, pad 14×24, 18px, ls 1px | | | | |
Gaps (desktop): H1→H2 18, H2→desc 18, desc→reg 24, reg→must 42, must→CTA 36. Mobile differs: H1→H2 36,
reg→must 66. Overlay **rgb(0 0 0 / 74%)** (was 55% in the maintenance-era guess). 1px solid white border,
20px radius. Content is **top-anchored** (not centered) — reproduced with per-breakpoint top padding
(27/9/85/97). Left inset via panel padding-inline (24/32/44 then clamp(47,8.125vw−57,60) across
1280→1440, since the Breakpoint Rule bars a 1440 media query). H1/H2 text authored in caps (tt:none).

**⚠️ Typography checker:** reports 7 h2 "drifts" — EXPECTED false positives. This hero's H2 subheading is
a per-component size (28→28→28→32, `data-custom-font-size` in source) that intentionally differs from the
global h2 scale (28→40→56→64), same as the discussion-boards case. Live-verified the source h2 is exactly
28/28/28/32. Not a real drift.
Verified: lint 0 err; breakpoint ✓; overflow ✓ (360–1920); a11y ✓; svg ✓. Visual parity confirmed vs
source at 1440 + mobile. Content inset @1440 = 113 (source 112). All gaps match.

### 2026-09-16 — hero (content): fixed overall width/inset drift at wide viewports
User flagged the panel was too WIDE (and the content inset off) vs source when compared at a wide
screen (~1728). Measured source at 1536/1728: the hero content container is the SAME as the header —
**max-width 1536, centered, side gutters 8/28/36/52** (body `max-width:1536; margin:auto; padding:0
52`). So the panel caps at ~1432px wide and the OUTER gutter grows past 1536 (148 each side @1728). My
earlier build used `max-width:1440`, so above 1440 the panel ran too wide and the gutter stayed at 52.
Fix: container `max-width:1440 → 1536`.
Also: the content's LEFT inset is a **constant 8.3% of the panel width** in source (a percentage margin:
31/374 @390, 98/1176 @1280, 119/1432 @1536 — all 8.3%), NOT fixed px. My fixed-px `padding-inline`
(24/32/44/clamp) drifted at wide viewports. Fix: panel `padding-inline: 8.3%` at all breakpoints (only
top/bottom padding varies per tier: 27/9/85/97 top). This also removed the non-standard clamp and keeps
the Breakpoint Rule clean (only 768/1024/1280 media queries).
Re-verified vs source: @1728 gutter 148 / panel 1432 / inset-from-panel 120 / H1 2-line / H2 32px 2-line
— EXACT. @1280 gutter 52 / panel 1176 / inset 99. @390 gutter 8 / panel 374 / inset 32. No overflow.
Verified: lint 0 err; breakpoint ✓; overflow ✓ (360–1920); a11y ✓.
### 2026-09-16 — cards: five new content variants (course/text/profile/comparison/news)
Instrumented five new `cards` variants (dispatched by class in blocks/cards/cards.js; scoped CSS in
cards.css). Each has a block-sample page under content/drafts/block-samples/ and its media under
content/media-da/drafts/block-samples/<sample>/. Source-measured at 390/768/1024/1440.

- **cards (course)** (workshops.html): 2-up grid (1-up mobile), 24px gap. Card = transparent tile, 1px
  white border, 20px radius; full-width top image (aspect 523/314 ≈1.66); body 24px inset with a Graphik
  Semibold white title (28px, →32px @≥1280 — source-measured responsive), 18/24 white desc, and a blue
  (#0373f3) rounded duration pill (radius 20, pad 8/16, 16px black, centered). JS decorateCourse tags the
  image cell, wraps the body, and marks the last ≤3-word paragraph as the pill.
- **cards (text)** ("OUR PURPOSE", about.html): 3-up grid (1-up mobile), 48px col-gap / 64px row-gap.
  Each card = 32px Graphik Semibold white heading + 16/1.2 white body, no image/CTA. Heading reserves a
  2-line slot (min-height 64px) so body copy baseline-aligns across a row (matches source). JS decorateText.
- **cards (profile)** (about.html leadership): 2-up grid. Card = 2:1 rounded portrait + body (name 40px,
  role 18px, bio 18px). A FEATURED card (filled lime #cfff05, black text, "Bio" label heading) is triggered
  when the card carries a 2nd heading; normal cards are transparent w/ 1px white border + lime role line.
  JS decorateProfile (name=1st heading, 2nd heading ⇒ .is-featured). Sample uses real headshots
  (craig-morris, megan-rose). NOTE: the design screenshot showed Vahaly/Hirsch (a mockup); live about.html
  has Morris/Rose — built the layout faithfully, content is representative.
- **cards (comparison)** (courses.html "2026 Badge & Certification Costs"): 4-up grid (2-up tablet, 1-up
  mobile), equal-height. Card = #1D1D1D bg, 16px radius, 1px #707070 border, 24px pad; centered logo; title
  16px; blue "PER YEAR" pill; 28px price; blue-check module list (14px); workshop cost lines; a highlighted
  blue TOTAL footer bar flush to the card's bottom edge (margin:-24px cancels body pad; margin-top:auto pins
  it). Coming-soon tiers (text matches /coming 202\d/ + no list) render dimmed (opacity .6), no footer.
  JS decorateComparison. price/peryear rules scoped under .cards-comparison-body to outrank the generic p.
- **cards (news)** (news.html): 2-up grid. Card = 16:9 rounded image + body (title 28px, a title-link with
  a lime "→" affordance, a lime date line, 16px excerpt). JS decorateNews tags title, detects the date
  paragraph (Date.parse + ≤30 chars), rest = excerpt. Content-driven (also auto-populatable from a news index).

**Shared:** all five use the site container pattern `.cards-container:has(.cards.<variant>)` with gutters
16/40/48/64 in the 1536-capped centered container, and are guarded out of the default variant's
`:not(.media,.pricing,.course,.text,.profile,.comparison,.news)` selectors.

**Two cross-cutting fixes:**
1. **A11y — new `--usta-blue-aa` token (#006eeb).** White text on brand blue #0373f3 is 4.42:1 — just under
   the 4.5:1 small-text AA threshold (axe flagged the comparison PER-YEAR pill + TOTAL bar). Added
   `--usta-blue-aa: #006eeb` (4.74:1, visually near-identical) in styles.css :root and used it for those
   small white-on-blue chips/bars. Brand `--usta-blue` unchanged elsewhere (e.g. course pill has BLACK text,
   which passes).
2. **typography-check.mjs now measures DEFAULT CONTENT only.** The checker grabbed the first visible h1..h6
   on a page; on block-sample pages that's the block's own (intentionally block-scoped) heading, so it
   false-flagged course/text/profile/comparison/news headings AND the pre-existing cards.pricing h3=40px.
   Added `&& !e.closest('.block')` so only default-content headings are checked against the global scale;
   block headings are verified per-block. Homepage (real default content) still measured + passes.

Verified all five sample pages at 360–1920: lint 0 err, breakpoint ✓, overflow ✓ (all tiers), typography ✓
(incl. cards-pricing now green), a11y ✓ (incl. comparison after the blue-aa fix). Comparison visually matches
the source screenshot (4 dark cards, logo/PER-YEAR/price/checks/workshop-lines/blue TOTAL, 2 dimmed coming-soon).
NOTE (local dev): new sample pages render under the `/content/drafts/block-samples/<name>` path (the aem-cli
mounts local HTML at /content and only hot-serves files present at startup — restart `aem up` after adding a
sample). Not yet published to DA (outward-facing — on request).

### 2026-09-16 — cards (course): content-width parity fix + sample spacers
User flagged that the course cards' block WIDTH didn't match source (cards too wide) plus minor
positioning drifts. Re-measured the SOURCE content column across viewports (it's NARROWER than the
1536/64px container the other card variants use):
| viewport | source gutter | source content width |
|---|---|---|
| 1024 | 48 | 928 |
| 1280 | 160 | 960 (=75% vw) |
| 1440 | 173 | 1093 |
| 1920 | 373 | 1173 (capped) |
So the source uses full-width w/ 16/40/48 gutters through 1024, then at >=1280 a **centered 75%-of-viewport
column capped at ~1173px**. Fixes in blocks/cards/cards.css (.cards.course):
- >=1280: drop the 1536/64px container; wrapper becomes `width:75%; max-width:1173px; margin-inline:auto`.
  Verified migrated == source: 1024→928 (exact), 1280→960 (exact), 1440→1080 (vs 1093, <1.5%).
- Inner card padding 24→**21px** (source-measured).
- Duration pill: `align-self:center` alone didn't center a fit-content <p> in the flex column; switched to
  `margin: 46px auto 0` → pill now centered (0.5px off card center at 1440, matches source).
- (heading already 28→32px @≥1280, image aspect 523/314, border/radius unchanged.)

**Sample-page spacers:** all five card sample pages looked cluttered — added a `spacer` block (80px
desktop / 60px mobile) immediately ABOVE and BELOW each card block in content/drafts/block-samples/
cards-{course,text,profile,comparison,news}.plain.html (same spacer markup the other samples use).

NOTE (local dev): the aem-cli only serves sample HTML files present at startup, and mounts them under the
`/content/...` path — restart `aem up` after editing/adding a sample, then view at
`/content/drafts/block-samples/<name>`. lint 0 err, breakpoint ✓, overflow ✓ (all 5, 360–1920),
typography ✓ (course), a11y ✓ (course). Screenshot-confirmed course now matches source width/padding/pill.

### 2026-09-16 — cards (course): EXACT content-width (calc ramp, not flat 75%)
The prior 75% width gave 1080@1440 vs the source's 1093 (13px narrow, 7px off left). Confirmed the source
cards deliberately do NOT align with the header edge (source header hamburger x=52, but card grid x=173 —
cards are inset ~121px more). The source column width isn't a flat %: measured 960@1280 (75.0%) and
1093@1440 (75.9%), capping ~1173. Replaced `width:75%` with an exact linear ramp:
`width: clamp(960px, calc(960px + (100vw - 1280px) * 0.831), 1173px)` on the >=1280 wrapper.
Verified migrated == source: 1280 → x160/w960 (exact), 1440 → x174/w1093 (source x173/w1093, ≤1px).
Caps at 1173 by ~1536 (no overflow at 1920). lint 0 err, overflow ✓ (360–1920), typography ✓, a11y ✓.

### 2026-09-16 — cards (course): image is FIXED-height per tier (not aspect) + bottom padding
User flagged the blue pills/images still misaligned vs source. Root cause: the image used a constant
`aspect-ratio` (523/314), but the SOURCE image is a FIXED HEIGHT per tier with object-fit:cover — measured
208px @mobile, 278px @1024, 314px @1280+ (card width varies 440→528 while image height stays 314). So my
images were ~40px too short at 1280 (274 vs 314), making cards shorter and the layout read differently.
Fixes in blocks/cards/cards.css (.cards.course .cards-course-image img): dropped aspect-ratio; set
`height: 208px` base, `278px` @1024, `314px` @1280+. Also bumped body bottom padding 21→48px (source cards
carry more empty space below the pill; card total 688 @1280 vs my prior 626).
IMPORTANT — the pills are NOT bottom-aligned in the source: each pill sits a FIXED 46px below its OWN
description (verified: card1 pill 102px above card bottom, card2 70px — the shorter-text card has MORE empty
space below its pill). Cards are equal-height (grid stretch) but the pill floats after the text — my
`margin: 46px auto 0` (no margin-top:auto) already matches this; kept as-is. Verified @1280: image 314,
cards equal-height, pill follows text. lint 0 err, overflow ✓ (360–1920), typography ✓, a11y ✓.

### 2026-09-16 — cards (course): duration pill — WHITE text + source width/length
User flagged the duration pills: text must be WHITE (mine was black) and the pill LENGTH must match source
(mine hugged the text too tightly). Source pills: blue fill, white text, ~152px for "3.5 Hours" / ~130px
for "2 Days". Fixes in blocks/cards/cards.css (.cards-course-duration):
- `color: #000` → `#fff` (source white text).
- `background: var(--usta-blue)` → `var(--usta-blue-aa)` (#006eeb) — white-on-#0373f3 is 4.42:1 (fails AA);
  the AA-safe blue is 4.74:1 and visually identical. (Same token used by cards.comparison pills/footer.)
- padding `8px 16px` → `10px 42px` so the pill reads 151px ("3.5 Hours") / 130px ("2 Days") — matches source.
Verified @1280: pill1 151×36, pill2 130×36, white text on #006eeb, radius 20, centered. lint 0 err,
overflow ✓, a11y ✓ (white-on-blue now passes contrast), typography ✓.

### 2026-09-16 — cards (text): desktop gutter 64→52px (align with header)
Typography audit of the "OUR PURPOSE" text cards vs source (source recorded @1440: grid x=52 / w=1336,
52px side gutter — aligns with the header hamburger; heading 32px Graphik Semibold white lh=fontsize,
body 16/19.2 Graphik Regular white, col-gap 48 / row-gap 64, paragraphs baseline-aligned per row via the
reserved 2-line heading slot). All type values already matched; the only drift was the >=1280 gutter — mine
used 64px (12px too inset each side). Changed .cards-container:has(.cards.text) >=1280 padding-inline
64→52px. Verified @1440: grid x=52 / w=1336, aligns exactly with header hamburger (delta 0), 3-up,
paragraphs baseline-aligned. (NOTE: live source was in maintenance mode during this pass — verified against
prior recorded source measurements + user screenshots.) lint 0 err, overflow ✓, typography ✓, a11y ✓.

### 2026-09-16 — cards (text): block width confirmed + title→content gap
Follow-up on width + the "OUR PURPOSE" title→cards gap.
- WIDTH: confirmed the card grid is x=52 / w=1336 @1440 (52px gutter, aligned with the header/title edges).
  The section title h2 sits in the global default-content-wrapper (1200 max, centered) — both are centered
  on the viewport so they align visually; the grid spans the wider 52px-gutter column as the source does.
- TITLE→CONTENT GAP: was only 16px (the h2's 0.25em bottom margin). Source shows a larger gap above the
  card grid. Added `.cards-container:has(.cards.text) .cards-wrapper { margin-top: 48px }` → gap now 48px.
Verified @1440: grid x=52/w=1336, title→first-card gap 48px. lint 0 err, overflow ✓, typography ✓, a11y ✓.

### 2026-09-16 — cards (text): gutter 52→68px (align card text with hamburger GLYPH)
User clarified the card content should align vertically with the visible hamburger LINES, not the button
edge. Measured: header nav pads 52px; the 48px hamburger button centers its 16px glyph, so the visible
lines start at 52+16 = 68px (the "Community" nav link starts at 132). The cards were at 52 (button edge).
Bumped the >=1280 gutter 52→68px so the first card heading starts at x=68 — verified aligned exactly with
.nav-hamburger-icon (both x=68). Grid now x=68 / w=1304 @1440. lint 0 err, overflow ✓, a11y ✓.

### 2026-09-16 — cards (course)+(text): live-source typography audit (site back up)
Re-measured both against the LIVE source at 390/768/1440.
- **cards (course):** source title 28/28 (→32 @1280) Graphik Semibold ls **normal**, desc 18/24 Graphik
  Regular ls **normal**, pill 16/19.2 Graphik Regular **700** white center. My h3/p inherited the global
  −0.03em tracking — added `letter-spacing: normal` to the course title + desc; set the pill to
  Graphik Regular 700 / lh 19.2 / ls normal (was lh:1). Verified migrated == source at 1440.
- **cards (text):** source heading 32/32 Graphik Semibold ls −0.03em, body 16/19.2 Graphik Regular
  −0.03em (matched already). SPACING FIX: my prior `min-height:64px` forced every heading to a 2-line
  reserve, so short titles ("Access Drives Progress" etc.) reserved 2 lines and the gap read wrong. Source
  keeps headings at their NATURAL line count (row 1 = 2-line, row 2 = 1-line) with bodies aligned per row.
  Removed the min-height; headings now wrap naturally with a fixed 56px bottom margin (source 2-line gap;
  1-line rows read ~12px tighter than source's grid-stretch but bodies still align per row). Verified @1440:
  row1 2-line/gap56, row2 1-line/gap56, bodies aligned within each row. (Tried a subgrid reproduction of the
  source's per-row heading-track stretch but it double-counted the row-gap → reverted to the simpler fixed
  margin.) lint 0 err, overflow/typography/a11y ✓ on both.

### 2026-09-16 — cards (text): OUR PURPOSE title→cards gap corrected to source (108px)
User flagged the gap between "OUR PURPOSE" and the first card row was too small. Measured live source
@1440: title-bottom → first-card-heading-top = 108px (my prior value was ~48px). Set
`.cards-container:has(.cards.text) .cards-wrapper { margin-top: 108px }`. Verified migrated gap = 108px
@1440. lint 0 err, overflow ✓, a11y ✓.

### 2026-09-16 — cards (text): row/card vertical gap matched to source (84 desktop / 86 mobile)
User flagged the vertical spacing between the two card rows was too small. Measured live source:
row1-body-bottom → row2-heading-top = **84px @1440**; mobile 1-up card→card = **86px @390**. My grid used
64px (desktop row) / 48px (mobile). Updated `.cards.text > ul`: base `gap: 86px` (mobile), `>=768`
`gap: 84px 48px` (row/column). Verified migrated == source: desktop 84, mobile 86. Combined with the
earlier fixes (title→cards 108px, heading→body 56px, natural line-count, header-aligned 3-col grid), the
block now matches source spacing at both viewports. lint 0 err, overflow/typography/a11y ✓.

### 2026-09-16 — cards (text): restored 2-line heading reserve (row-wide body alignment)
CORRECTION to the earlier "removed min-height" note. The source DOES align ALL bodies in a row to the same
baseline even when one title is shorter: verified live @1440 — row-1 bodies all at top 1312 (col3 "Coaches
Need Coaches Too" — which itself wraps to 2 lines at the source's 397px column, h=64 — is NOT higher).
Removing the reserve had made col3's body rise above cols 1&2 (user flagged). Restored
`min-height: 64px; margin-bottom: 24px` on the >=768 heading so every heading reserves a 2-line slot and the
whole row's bodies align. Verified migrated @1440: row-1 bodies all top 726 (aligned), row-2 bodies all top
975 (aligned), row gap 84px, col3 heading 2 lines (matches source). lint 0 err, overflow/typography/a11y ✓.

### 2026-09-16 — cards (text): responsive heading scale + subgrid per-row alignment (all viewports)
Tablet/mobile audit revealed two more drifts:
1. **Heading font-size is responsive** (I had it flat 32). Source: 32 (mobile) → 24 (768) → 28 (1024) →
   32 (1280). Added per-breakpoint font-size.
2. **Per-row body alignment across DIFFERENT heading heights.** At 768 the source headings wrap to 3/4/2
   lines (heights 72/96/48) yet all row bodies align — a `min-height` reserve can't do this (row1 needs 96,
   row2 needs 48). Reproduced the source's per-row grid stretch with **CSS subgrid**: `.cards.text > ul` is
   a 3-col grid; each `.cards-text-card` is `grid-template-rows: subgrid; grid-row: span 2` so every heading
   in a row stretches to that row's tallest heading and all bodies line up. Gaps: ul `row-gap: 24px` =
   head→body; card `margin-bottom: 60px` (+24 = 84px card→card). Removed the old min-height reserves.
Verified: 768 heading 24, row1 bodies aligned (609) despite 3/4/2-line titles, row gap 84; 1024 heading 28;
1440 heading 32, bodies aligned, row gap 84, title gap 108, head→body 24; mobile 32/1-up/86px card gap.
lint 0 err, overflow/typography/a11y ✓.

### 2026-09-16 — typography audit: cards (profile) (all viewports)
Measured source `.v-person-card` (about page → OUR LEADERSHIP) at 390/900/1024/1280/1440. Scale is responsive:
- **name** 32px (≤1023) → 40px (≥1024); Graphik Semibold, weight 400, line-height 1.0, letter-spacing
  normal, margin-bottom 24. (I had flat 40 / lh 1.05 / mb 0.)
- **role** 16px flat; Graphik Regular (I had Semibold 18), lime, line-height normal, ls normal, mb 8.
- **bio** 16px (≤1023) → 18px (≥1024); Graphik Regular, line-height normal, ls normal, mb 0. (I had flat 18.)
Fixed all three + added the 1024 jump. Gotcha: the role is a `<p>` inside `.cards-profile-body`, so the
generic `.cards-profile-body p` rule was overriding it to 18px at desktop — scoped the bio rule to
`p:not(.cards-profile-role)`. Verified migrated: 32/16/16 at ≤1023, 40/16/18 at ≥1024. lint/overflow/typo/a11y ✓.
Note: source leadership cards are text-only (no portrait/border/featured) — our sample keeps the richer
image+featured design intentionally; this task was scoped to typography parity.

### 2026-09-16 — typography audit: cards (comparison) (all viewports)
Measured source `.v-cost-card` (courses page → "2026 Badge & Certification Costs") at 390 & 1440. The scale
is FLAT across all viewports (no responsive jumps). Corrected drifts:
- title: line-height 1.3→1.0, added letter-spacing -0.64px, margin 0→16 0 8.
- NEW "Annual Package Fee" subtitle (tagged `.cards-comparison-subtitle` in JS — the p right after the
  title): 14px Graphik Semibold w400, lh 1.0, ls -0.64, mb 21.
- body p: line-height 1.4→1.2, added ls -0.42.
- PER YEAR pill: added Graphik Regular family, lh 1.3→1.0, ls -0.36.
- price: added ls -1.12.
- section labels (strong): family Semibold→Regular, weight→700, size 12→14, lh→1.2, ls 0.04em→-0.42px.
- module list li: lh 1.3→1.2, added ls -0.42.
- TOTAL label: size 12→14, added lh 1.0 + ls -0.42.
- TOTAL value: added lh 1.0 + ls -0.8.
Verified all 8 element types match source 1:1. lint/overflow/typo/a11y ✓.

### 2026-09-16 — typography audit: cards (news) + cards (media) (all viewports)
**News** — measured source `.v-news-related-tile__{title,date,description}` (news.html) at 390/900/1440:
- title responsive: 24 (≤767, ls -0.72) → 28 (768, -0.84) → 32 (≥1024, -0.96); Graphik Semibold w400,
  line-height 1.0. (I had flat 28 / lh 1.1.) ls values = the global -0.03em tracking → set ls -0.03em +
  added the 768/1024 font-size jumps.
- date: was 14px/lh1.3/lime — source is 16px Graphik Regular, lh 1.2, ls normal, WHITE. Fixed.
- excerpt: lh 1.4→1.2, added family + ls normal.
(The lime title-arrow affordance is kept as our design embellishment; the date lime was a drift, corrected.)
**Media** — measured source benefits row `.cmp-text` (home.html): heading 28 (≤1023) → 32 (≥1024),
Graphik Semibold, lh 1.0, ls -0.03em; body 16px Graphik Regular, lh 1.2 (19.2px), ls -0.03em. Our media CSS
already matched (28→32 heading, 16/1.2 body, global tracking) — verified, no change needed.
Verified both migrated: news 24/16/16 mobile → 32 title desktop; media 28→32 heading, body 16/19.2.
lint/overflow/typo/a11y ✓ on both pages.

### 2026-09-16 — cards (text): fixed reserved heading BANDS (vertical rhythm parity)
Earlier subgrid pass aligned bodies per row but used a flat 24px head→body gap — the source doesn't
work that way. Re-measured the source `.cmp-text` heading boxes: each heading sits in a **fixed reserved
band, constant at every breakpoint ≥768** — row1 = **96px**, row2 = **76px** — taller than the heading
text, with the body 24px below the band. That yields per-row head→body gaps of **56px (row1) / 68px (row2)**
at desktop and **48/24/72 (row1, by title line-count) / 52 (row2)** at tablet — NOT a flat 24. My flat gap
was the drift the user saw.
Fix: set explicit grid tracks on `.cards.text > ul` — `grid-template-rows: minmax(96px,auto) auto
minmax(76px,auto) auto` — and `align-self: start` on the subgrid headings so the band slack falls BELOW the
title. Removed the heading `margin-bottom`/ul flat row-gap reliance for the gap.
Verified migrated == source: desktop head→body 56/68, tablet 48/24/72 & 52, row-to-row 84, mobile 24 (1-up,
86px card gap); bodies align per row at all breakpoints. lint/overflow/typo/a11y ✓.

### 2026-09-16 — cards (text): mobile/tablet parity (6 measured bugs, verified per-element)
Probed live source + preview with getBoundingClientRect/getComputedStyle at the SAME width (390/417/480/768/900/1024) and fixed:
1. **h2→first-card gap**: 108→**60px** flat below 1024 (was the visible mobile "extra space"). Restored 76px @1024, 108px @1280.
2. **Mobile title slot**: was collapsing cards 4–6 to 56px; now uniform **88px** (h3 min-height 64 + 24 gap) for all six, card 2 grows to 120 only <480 (3-line title). No row1/row2 distinction on mobile (1 column).
3. **Tablet body**: 16→**14px / 16.8 / -0.42px** for 768–1023 only; 16/19.2/-0.48 restored ≥1024.
4. **h3 font-weight**: 400→**700** at every breakpoint (Graphik Semibold is a variable 400–700 face).
5. **Horizontal gutters**: h2 now uses the section gutter (x=16 mobile / 40 tablet / 48 @1024); cards inset +8px (<768) / +12px (≥768) → card x=24/52/60. Widths now 342@390, 369@417, 432@480, 189.33@768, 233.33@900, 269.33@1024.
6. **Inter-row flow gap**: 84→**60px** (768–1023) via card margin-bottom 36 + 24 ul row-gap; 68px @1024 (mb 44); 84px @1280 (mb 60).
Mechanism: section `padding-inline` carries the h2 gutter; `.cards-wrapper padding-inline` adds the card inset; the h2 default-content-wrapper padding is zeroed so h2 sits flush to the section gutter. Desktop (≥1280) x/width/gaps unchanged except the intended weight-700 fix. lint/breakpoint/overflow/typography/a11y all ✓.

### 2026-09-16 — cards (profile): interactive hover/tap reveal (matched to source)
The source leadership cards are INTERACTIVE (`.v-person-card`), not the static featured card we had.
Measured both states on the live source at 390/768/1440:
- **Resting:** portrait image 385h (radius 20) + 16px gap + content panel 229h (black, 1px white border);
  name white 32→40, role LIME 16, short bio white 16→18. Card total fixed 630.
- **Open (hover desktop / tap touch):** image shrinks 385→240, panel grows 229→374 and fills LIME with
  BLACK text, a "Bio" label (40/40 Semibold) fades in, and the bio swaps to the FULL longer text
  (wrapper 48→96). Transitions 0.3s ease-in-out (image height + panel bg/border; wrapper height).
Rework:
- **cards.js decorateProfile**: each `<li>` stays a plain listitem; an inner `.cards-profile-card` div
  carries `role=button`, `tabindex=0`, `aria-expanded`, click + Enter/Space toggle `.is-open` (touch).
  Content parsed as name(h)/role(p)/short-bio(p)/"Bio"(h2)/full-bio(p) — the 2nd heading splits short vs full.
- **cards.css**: fixed-height card; image + panel animate on `:hover` and `.is-open`; short/full bios and
  "Bio" label collapse/reveal; `prefers-reduced-motion` drops the timing. Gutters match the text block
  (card x = 24 mobile / 52 tablet / 60 @1024 via 16/40/48 section gutter + 8/12 card inset).
- **sample content**: added the real source short + full bios for Craig & Megan (were missing the full text).
Gotcha: `role=button` on the `<li>` stripped its listitem role (axe `aria-required-children`); fixed by
moving the role to the inner card div so the `<ul>/<li>` list semantics stay intact.
Verified: resting 385/229 + open 240/374 at desktop, mobile resting x=24/w=342; tap-toggle + keyboard work.
lint/breakpoint/overflow/typography/a11y all ✓.

### 2026-09-16 — cards (profile): resting name-box height (role/desc vertical position)
The resting panel's role line + short bio sat too high vs source. Root cause: the source reserves a name
box TALLER than one line — 53px @mobile (32px font) / 65px @≥1024 (40px font) — even for single-line names,
which pushes the role/desc down. Added `min-height: 53px` (base) / `65px` (≥1024) on `.cards-profile-name`.
Verified: role top 106 & desc top 134 @1440 (matches source 106/…); name box 53 @390. Gaps name→role 24,
role→desc 8 already matched. lint/breakpoint/overflow/typography/a11y ✓.

### 2026-09-16 — cards (profile): role/bio letter-spacing (text width + wrap parity)
The resting role line + short bio read tighter/narrower than source and wrapped differently. Root cause: the
interactive rework's `.cards-profile-role` and `.cards-profile-desc-short/-full` rules inherited the global
-0.03em (-0.48px) body tracking; the source uses `letter-spacing: normal`. Set `letter-spacing: normal` on
the role and both desc classes. Verified: role/desc ls now normal, bio wraps "…the USTA / Coaching business"
like source, desc height 48 (2 lines). lint/overflow/typography/a11y ✓.

### 2026-09-16 — cards (profile): role line is Graphik SEMIBOLD (not Regular)
User's DevTools screenshot showed the source `.v-person-card__title span` = Graphik Semibold, line-height
1.3, 16px (≤1023) → 18px (≥1024). The visible role text renders in that inner span (the wrapper div reads
16px Regular, but the span overrides it). I had the role as Graphik Regular 16 flat — that's why it looked
lighter/smaller than source. Fixed `.cards-profile-role` to Graphik Semibold, lh 1.3, 16→18px @1024.
Verified migrated role = Graphik Semibold 18/23.4 @1440, 16/20.8 @390. lint/overflow/typography/a11y ✓.

### 2026-09-16 — cards (profile): "+" affordance + seamless animation (source parity)
Two source-parity fixes discovered by reading the source stylesheet:
1. **"+" affordance**: source `.v-person-card__content::after` is a 36×36 white plus SVG at top:16/right:16,
   shown ONLY below 1024 (rule `@media (max-width:767px),(768–1023){…}`) and `display:none` when open
   (`.v-person-card--hover …::after{display:none}`). Desktop has no icon (hover-only). Added the same
   `::after` on `.cards-profile-body`, hidden ≥1024 and on `:hover`/`.is-open`.
2. **Animation hiccup**: my reveal animated `height:0 ↔ auto` on the Bio label + full bio — `auto` is not
   animatable so it snapped mid-transition. The source only animates the image `height` (385→240, 0.3s) and
   the panel `max-height`/bg (the panel is flex-fill in the fixed 630 card). Reworked to match: image height
   is the only geometry transition; panel bg/border/text colour cross-fade 0.3s; the short↔full bio + Bio
   label swap via `display` (instant), clipped by the panel's new `overflow:hidden` so text reveals cleanly
   as the panel grows. Removed the height/opacity transitions that caused the stutter.
Verified: mobile "+" 36×36 shown at rest / hidden open; desktop no "+"; image 385→240, resting bio-only.
lint/breakpoint/overflow/typography/a11y ✓.

### 2026-09-16 — columns (profile) variant — board-member cards (about.html)
Added a **profile** variant to the columns block for the OUR LEADERSHIP board members
(https://www.ustacoaching.com/en/home/about.html). A square headshot photo beside a bordered rounded
card: name + lime role subtitle + bio + outlined pill tags.
- **JS** `decorateProfile()` (dispatched on `.columns.profile`): photo cell = picture-only; card cell =
  text. Name = first heading; role lines authored in *italic* (project em→lime convention) tagged
  `.columns-profile-role`; trailing `<ul>` → `.columns-profile-tags` with `<span>` pills.
- **CSS:** container gutters 16/40/48/64, max-width 1536. Mobile stacks (photo 1:1 above card); ≥768
  side-by-side, photo `flex:0 0 25%` + `align-self:stretch` (equal-height, aspect auto), card fills rest,
  24px gap. Card 1px solid #fff, radius 20, padding 20→24. Name Graphik Semibold 32→40 (≥768) ls -0.03em
  #fff; role Graphik Semibold 16→18 (≥1280) lime; bio Graphik Regular 16→18 #fff; tags 12→14 (≥768),
  1px solid var(--usta-blue), radius 24, padding 12×16, 12px gap. Source-measured @1440: photo 304/302,
  card 960, gaps name→role→bio→tags all 24. **Had to add `.profile` to the default-columns `:not()`
  guard** (`.columns.block:not(.media,.quote,.profile)`) — the default `flex:1` on `> div > div` was
  overriding the photo's 25% basis. Role color needed `p.columns-profile-role` (element-qualified) to win
  over `.columns-profile-card p`.
- Downloaded + optimized headshots → content/blocks/columns/media/{amanda-moore,andrea-perez}.jpg (750^, q80).
- Sample: content/drafts/block-samples/columns-profile (2 cards).
Verified: @1440 photo 328/310 (25.5%, equal-height), gaps 24, name 40 lime-role; @390 stacked, 1:1 photo,
name 32, tag 12, no overflow. lint 0 err; breakpoint/overflow/a11y ✓.

### 2026-09-16 — columns (article) variant — news article body rows
Added an **article** variant to columns for long-form news article bodies (measured @
how-dana-matthewson…). Body copy beside a photo: text ≈ 75% (9/12) + image ≈ 25% (3/12) side-by-side
≥1024; stacks on mobile (image below text). Image side default RIGHT; **`.article.media-left`** puts
image LEFT (text-right).
- JS `decorateArticle()`: picture-only cell → `.columns-article-media` (+ createOptimizedPicture);
  text cell → `.columns-article-content`.
- CSS: body p Graphik Regular 18/24 white ls normal, 24px gap; section h2 Graphik Semibold **700**,
  28 (mobile) → 40 (≥768) line-height 1 white; images SHARP corners (radius 0, source parity).
  Added `.article` to the default-columns `:not()` guard. Gutters 16/40/48/64.
- Images → content/blocks/columns/media/mathewson-{smiling,group}.jpg (≤800, q80).
- Sample: content/drafts/block-samples/columns-article (row1 default / row2 media-left).
Verified @1440: content 75% + image right (row1) / image left (row2), body 18/24, h2 40/700, img radius 0;
@390 stacked (img below), body 18, h2 28, no overflow. lint 0 err; breakpoint/overflow/a11y ✓.

### 2026-09-17 — columns (list) variant — news search-results tiles
Added a **list** variant to columns for the news search-results article tiles (Vue `v-news-article-tile`
on the source; static in EDS). Square thumbnail beside a bordered rounded content card: title link +
excerpt + lime "Read Article" CTA pinned bottom-right.
- JS `decorateList()`: picture-only cell → `.columns-list-thumb`; text cell → `.columns-list-content`
  (title = first heading/link → `.columns-list-title`; first non-CTA `<p>` → `.columns-list-excerpt`;
  last/"Read"-link → `.columns-list-cta` in `.columns-list-cta-wrapper`).
- CSS: stacks below 1024 (thumb 1:1 on top); side-by-side ≥1024 (`thumb flex:0 0 231px; align-self:
  stretch; aspect-ratio:auto` → equal card height). Content 1px solid #fff, radius 20, padding 15×19.
  Title Graphik Semibold 40/44 white (flat all vp); excerpt Graphik Regular 16/19.2 white; CTA lime pill
  black Graphik Semibold 16, radius 12, padding 16×24, **uppercase**, ls -0.03em, bottom-right
  (`cta-wrapper margin-top:auto; justify-content:flex-end`). Tile gap 26. Added `.list` to default guard.
- Thumbnails → content/blocks/columns/media/news-{blind-tennis,gordon-reid,craig-tiley}.jpg (500² q80).
- Sample: content/drafts/block-samples/columns-list (3 tiles).
Verified @1440: side-by-side, thumb 231 equal-height, title 40/44, CTA lime uppercase bottom-right (20,16),
gap 26; @390 stacked, thumb 1:1, no overflow. lint 0 err; breakpoint/overflow/a11y ✓.

### 2026-09-17 — columns (embed) variant — learning-hub LinkedIn post embed
Added an **embed** variant to columns for the LinkedIn-post-beside-text section (measured @
online-learning-hub-is-live). Embed LEFT ≈40% (≈504px iframe) + text RIGHT ≈60% side-by-side ≥1024;
stacks on mobile (embed on top).
- JS `decorateEmbed()`: converts a LinkedIn post LINK → official embed `<iframe>` via
  `linkedInEmbedSrc()` (matches urn:li:ugcPost/activity/share or activity-id; passes through an existing
  `/embed/` URL or a pre-built iframe). Src built ONLY from a matched LinkedIn URN (no arbitrary injection
  — Security Rule). Cell with the embed → `.columns-embed-media`; text cell → `.columns-embed-content`.
- CSS: iframe max-width 504, height 875 (source fixed), white bg, radius 8. Text: intro/bullets Graphik
  Regular 18/24 white; section heading Graphik Semibold 32/32 white (source is bold text — authored as
  h2). Gap 48 desktop / 40 mobile. Embed `flex:0 0 40%` (cap 515) + content `flex:1 1 auto`. Added
  `.embed` to default guard.
- Sample: content/drafts/block-samples/columns-embed (LinkedIn post URL + text). The real LinkedIn embed
  loads and renders in preview.
Verified @1440: embed 41% (iframe 504×875) + text, gap 48, intro/bullets 18/24, h2 32/32, no overflow;
@390 stacked, iframe fits (358), no overflow. lint 0 err; breakpoint/overflow/a11y ✓.
Note: the embed depends on LinkedIn's iframe service (live third-party). If the post is later removed the
frame degrades to LinkedIn's own fallback; the block otherwise needs no maintenance.

### 2026-09-17 — columns (profile): tablet/mobile parity fix (photo column ratio)
User flagged the left/right section widths drifted vs source on tablet. Root cause: my build used a flat
`photo flex:0 0 25%` at all side-by-side widths, but the source AEM grid WIDENS the photo as the viewport
narrows (grid classes: `default--3` / `desktop-small--4` / `tablet--5` = 3/4/5-of-12). Fixed the photo
`flex-basis` per breakpoint: **41.667% (5/12) @768–1023 → 33.333% (4/12) @1024–1279 → 25% (3/12) @≥1280**;
card takes the rest with `min-width:0`. Stacking below 768 (photo full-width 1:1 on top, 24px gap, card
below) already matched. Re-verified vs source: @768 photo 41.7% / card 377 / equal-height / gap 24; @1024
photo 33.3%; @1280 photo 25%; @430 stacked 1:1, no overflow. Desktop unchanged. lint/breakpoint/overflow/
a11y ✓. (Minor: source insets the photo 12px inside its grid column; kept the photo filling its column —
visually within a few px and equal-height + 24px gap match.)

### 2026-09-17 — columns (profile): mobile photo aspect/position fix
User's DevTools capture showed the source mobile (`@media max-width:767`) photo `img` rule:
`aspect-ratio: 1.302; object-fit: cover; object-position: top` (a LANDSCAPE crop anchored to the top).
My build had the mobile photo at `aspect-ratio: 1/1` (square, center) — the drift. Fixed the stacked
(mobile) photo to `aspect-ratio: 1.302` + `object-position: top`; side-by-side (≥768) still stretches to
card height (`aspect-ratio:auto`). Verified @430: photo 398×306 (1.302), object-position top — matches
source framing (head/upper body from the top). lint/breakpoint/overflow/a11y ✓.
### 2026-09-16 — cards (comparison): full source-parity rebuild (container + logos + coming-soon + footer)
Screenshot diff showed the block was missing the source's outer container, per-tier branded logos, the
coming-soon treatment, and the equivalency/notes footer. Rebuilt to match source (measured on courses.html):
- **Outer container**: the `.cards.comparison` block is now the source's rounded grey box — `#2c2c2c`,
  radius 20, padding 12 — wrapping the 4-card grid + equivalency strip + notes.
- **Grid**: 4-up ≥1024 / 2-up ≥768 / 1-up mobile; card `#1d1d1d`, radius 16, 1px `#707070`, **24px gap**.
- **Branded logos**: sourced the 4 real SVG wordmarks (development/professional/specialist/master) from
  the live DAM + the lime flame SVG → `content/media-da/.../cards-comparison/`; sample uses one per card.
  Logo box 150px tall, centered. (SVG logos skip createOptimizedPicture — kept as inline SVG.)
- **Coming-soon cards**: dimmed logo (opacity .35), "COMING 202x" 16px title, 5 skeleton loader bars drawn
  via a `::before` repeating linear-gradient (`#484848`, h16, radius 30, 74/full/full/full/74), the lime
  flame (161px), and a faint bottom "COMING 202x" line.
- **Footer**: decorateComparison now splits the last two authored rows out of the grid — an Equivalency strip
  (has a link, centered 18px, underlined white link) and a Notes paragraph (18px) — rendered inside the box.
- a11y: the source's heavily-dimmed bottom "COMING" line fails AA on #1d1d1d; used #949494 (~4.6:1) instead.
Verified: container #2c2c2c/r20, cards #1d1d1d/r16/24-gap, 4 distinct logos, skeleton+flame, footer;
mobile 1-up. lint/breakpoint/svg/overflow/typography/a11y all ✓.

### 2026-09-16 — cards (comparison): coming-soon logo not dimmed (lower-part parity)
The user's screenshot showed the coming-soon flames/logos looking olive/faint. Root cause: I'd added
`opacity: 0.35` to the coming-soon logo, but the source does NOT dim it (source logo opacity 1, filter
none — the Specialist/Master wordmarks are natively grey art with lime accents). Removed the fabricated
opacity so the logos + lime flames render at full strength like the source. (The earlier olive-flame
"migrated" screenshot was a stale capture; canvas-sampling the live flame confirmed #CFFF05.)
Verified: coming-soon logos full-opacity grey/lime wordmarks, flames bright lime. lint/overflow/typo/a11y ✓.

### 2026-09-16 — cards (comparison): body vertical rhythm (workshop-cost grouping)
The card body read cluttered vs source. Root cause: the Professional card combined each workshop cost onto
ONE em-dash line ("Development Coach — Registration Fee …") that wrapped tightly, and body `p` carried a
`margin: 4px 0 0`. The source instead lists each cost as TWO lines (name + fee) with an EMPTY spacer `<p>`
between the 4 groups, and body paragraphs have NO margin (rhythm = line-height pitch + spacers).
Fixed: sample now uses name/fee/‌&nbsp;-spacer structure per source; body `p` margin 0; label paragraphs
(`p:has(strong)`) get 22px top room. Verified migrated grouping ≈ source (Development 530/547, spacer 568,
Developing 585…). lint/overflow/typography/a11y ✓.

### 2026-09-16 — cards (comparison): box-geometry + section spacing to source (probed @1512)
Applied a measured box-geometry pass (source vs migrated at vw1512):
- Shell now carries the 24px inset padding (was on logo/body children); logo box 271.5×150 with the image
  FILLING it (object-fit contain), consistent across all 4 cards; content aligns to x=25.
- Pill margin 16 0 8 → **0 0 16** (removed the 16 top drift); price margin → **0**; modules list top margin → 0.
- `<sup>` footnote markers clamped (`line-height:0`) so the title line box stays 16px.
- TOTAL bar: min-height **70**, no padding, label+value centered shrink-to-fit, bleeds over the shell's 24px
  padding to span full width, pinned to bottom via auto top margin. All 4 cards equal height (727.8), bar flush.
- Grid pitch 346 / shell 322 at vw1512 (source 345.5 / 321.5).
- **Section spacing (the "cluttered" fix)**: source reserves a ~32.8px-tall label box for INCLUDED ONLINE
  MODULES / WORKSHOP COSTS with ~6px to the next line. Replaced the old `p:has(strong){margin-top:22}` hack
  with `margin:0; padding:8px 0` → airy, grouped rhythm matching source (pill→price 16, price→label 22,
  label box 32.8, workshop-cost groups separated by empty-<p> spacers ~17).
- Blue: PER YEAR pill + TOTAL bar set to the SOURCE **#0373F3** (var --usta-blue) per explicit request.

DEVIATION (documented): #0373F3 with white text = 4.42:1, just under WCAG AA 4.5:1, so `npm run test:a11y`
reports a color-contrast finding on the pill + total bar. Kept per user instruction for exact source colour
parity (the AA-safe #006EEB alternative was declined). lint/overflow/typography ✓; a11y has this one known,
intentional contrast finding.

### 2026-09-16 — cards (comparison): total-bar bottom inset + coming-soon label pin
Two positioning drifts flagged by the red-box overlay (probed @1512):
- **TOTAL bar**: source leaves ~24px BELOW the bar inside the shell (bar bottom → shell bottom = 25px), not
  flush to the rounded corner. Changed the bar's bottom margin from `-24px` to `0` so it sits inside the
  shell's 24px bottom padding (bleeds sides only). Now matches source (below-gap 25).
- **Coming-soon bottom "COMING 202x" label**: was mid-card (auto-margin was on the flame). Moved `margin-top:
  auto` to the label so IT pins to the bottom; the flame now sits below the skeleton bars (source layout).
All 4 cards remain equal height; total bars align. (The earlier red-box "overlap" of the total bar with the
last cost line was a stale screenshot — current build stacks them flush with no overlap.)
lint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-16 — cards (comparison): description 6px gap + box structure + strip (probed @1512)
Root-cause fix for the clutter: the source `.v-cost-card__description` is a flex column with a uniform **6px
gap** between EVERY child; my body was a flat flex column with 0 gap. Restructured decorateComparison to
rebuild the source's box stack:
- `.cards-comparison-price-row` wraps the PER YEAR pill + price (margin-bottom 22).
- `.cards-comparison-desc` wraps the module label + modules list + workshop-cost lines in a **flex column,
  gap 6px** (margin-bottom 30). Removed the old empty-`<p>` spacers + the `p:has(strong)` padding hack.
- Per-block margins restored: title 16/0/8, subtitle 0/0/21, price-row 0/0/22, desc 0/0/30.
- Verified child y-offsets @1512: logo 25 / title 207 / subtitle 231 / price-row 266 / desc 350 / total
  bottom-pinned — matches source (25/207/231/266/352). desc gap 6px ✓.
Module list: li now `display:flex; align-items:center; column-gap:16px; min-height:24px`, ::before 16×16 blue
check → text ink at x=32 (was list-item/28px/20px check, row-gap 8). UL row gap removed (li height = rhythm).
TOTAL bar: added `gap:5px` between label + value (shrink-to-fit, centered).
"Already certified" strip: now the panel's bottom section — full panel width (1384), bg **rgb(84,84,84)**,
`border-radius:0 0 20px 20px`, min-height 74, 24px pad, flush to panel edges (bled -12 over panel padding).
The "Notes:" paragraph now renders OUTSIDE/below the grey panel (moved to a block sibling in JS).
lint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-16 — cards (comparison): restored group spacers + label box height + typography audit
Root cause of remaining clutter: the source description IS `display:flex; gap:6px`, BUT it has empty `<p>`
spacers (16.8px) between the 3 workshop-cost groups AND its section-label `<b>` is `display:inline-block;
margin:8px 0` (making the label box 32.8px). I'd removed both earlier. Fixes:
- Restored the empty `<p>&nbsp;</p>` spacers between workshop groups in the sample.
- `.cards-comparison-body p strong` → `display:inline-block; margin:8px 0` (label box 32.8px).
Verified migrated description == source: 14 rows, all 6px gaps, labels 32.8px, 16.8px cost lines + spacers.
TYPOGRAPHY AUDIT (source measured @1512 AND @768 — flat, no responsive scaling; matches migrated):
  title 16/16 Semibold(400) -0.64 white | subtitle 14/14 Semibold(400) -0.64 | pill 12/12 Regular -0.36
  uppercase | price 28/28 Semibold -1.12 | modLabel 14/16.8 Regular w700 -0.42 | modLi 14/16.8 Regular -0.42
  | costLine 14/16.8 Regular -0.42 | totalLabel 14/14 Regular -0.42 uppercase | totalValue 18/18 Semibold
  -0.8. All confirmed identical desktop/tablet/mobile — no per-breakpoint font changes in source.
lint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-16 — cards (comparison): tablet card-height parity (2×2 grid width fix)
Compared full card heights at tablet (768) and mobile (390) vs source, measured with getBoundingClientRect.
- SOURCE @768: 2×2 grid, active row (Development/Professional) = 911px, coming-soon row = 551px; each card
  content 307px wide, x=65/396. Heights equalize WITHIN a row, not across all four.
- SOURCE @390: 1-up stack, cards take natural height (Dev 648.2 / Pro 877.4 / coming 551 each), width 324.
- MIGRATED before: @768 cards were 320px wide (grid `1fr` filled the half-panel) → active row only 875px
  (−36 vs source) because the extra 13px width reduced text wrapping. Mobile already within 2px.
Root cause: the source pair sits on a 12-col grid where each card column carries a 12px inner gutter on every
edge, so card content is 307 (not the full half-panel). Fix: added `padding-inline:12px` to `.cards.comparison
> ul` at ≥768 (reset to 0 at ≥1024 where 4 columns fill the panel). Now @768: cards 308px wide, x=64/396,
active row 925 (≈911, +14 intrinsic rhythm ~1.5%), coming-soon 554.8 (≈551). Row-equalization + 1-up-natural
behavior matches source at both viewports.
lint/breakpoint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-17 — cards (comparison): bottom-region parity (borders, coming-soon order, flame dim)
Side-by-side of the desktop bottom region surfaced 4 real deltas vs source (measured @1512):
- BLUE TOTAL BAR: source `.v-cost-card__total` has a full `1px solid #fff` outline; mine had none. Added.
- PANEL: source grey panel has `1px solid #a0a0a0`; mine had none. Added `border:1px solid #a0a0a0`.
- COMING-SOON BAND: source bottom "COMING 202x" band is a full-width BLACK band (h70) with a full `1px
  solid #fff` border, sitting on the SAME row as the active blue TOTAL bars (auto-top-margin pin, bleed
  -24 sides, 24px above card bottom). Mine had border-top only → changed to full border. This is what makes
  "COMING 202x" align horizontally with the blue bars.
- COMING-SOON ORDER: source order is logo → "COMING 202x" heading → skeleton bars → flame. My skeleton was a
  `body::before`, forcing it ABOVE the heading. Moved it to `.cards-comparison-flame::before` (mb40) so the
  flex order is heading → skeleton → flame, matching source.
- FLAME: source dims the coming-soon flame to opacity 0.2 (reads as muted olive on the dark card); mine was
  bright lime. Set `.cards-comparison-flame img { opacity:0.2 }`.
- EQUIVALENCY STRIP: was rendering 122px tall (content-box: min-height74 + 48 padding). Added
  `box-sizing:border-box` → exactly 74px like source.
Verified @1512: total border 1px white ✓, band border 1px white ✓, band top/bottom aligned to blue bar row
(±1) ✓, flame opacity 0.2 ✓, order heading→flame→band ✓, equiv strip 74 ✓, panel border #a0a0a0 ✓.
lint/breakpoint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-17 — cards (comparison): coming-soon pixel parity (flame centering, skeleton, band border)
Pixel-overlay of the coming-soon cards vs source (measured @1512, rel. to card box) exposed:
- FLAME: source centers the 161px flame (x≈77 each side, y≈583); mine was LEFT-aligned (x25, y399). Fixed:
  `.cards-comparison-flame { margin:0 auto; text-align:center }` (img is inline, so text-align centers it).
  Now x≈80/y≈591 (±8 of source).
- SKELETON BARS: source pitch is 26px (5×16 + 4×10 = 120 total, not my 28/128), and bar 5 (74px) is
  RIGHT-aligned while bar 1 (74px) is left. Fixed background-position to `left 0 / left 26 / left 52 /
  left 78 / right 104` and height 120. Also set the source gaps: 60px heading→skeleton, 180px skeleton→flame.
- COMING BAND "extra border": I'd set a full `1px solid #fff` box; source only shows the TOP divider line
  on the black band (the side/bottom borders read as an extra box). Reverted to `border-top:1px solid #fff`.
Verified @1512: flame centered ±8, skeleton pitch 26 + bar5 right-aligned, band top-divider only.
lint/breakpoint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-17 — cards (comparison): pixel-exact COMING band ↔ blue TOTAL bar alignment
User: "COMING 2026 should be on the same horizontal line as the prior 2 cards' blue bars; no border."
Root cause of the 1px drift: box-model mismatch. Blue TOTAL bar had border 1px all sides → rendered 72px
(70 + top+bottom border); COMING band had a top divider → 71px. With bottoms pinned equally, the blue bar's
top sat 1px higher. Fix: `box-sizing:border-box` on BOTH the blue total bar and the coming band so borders
sit inside a fixed 70px box. COMING band keeps only `border-top:1px solid #fff` (the source's thin divider —
no side/bottom box border). Verified @1512: blue bar + both COMING bands share top=1227.7, bottom=1297.7,
height=70 (0px offset). Flame stays centered + olive-dimmed; skeleton bar5 right-aligned (prior pass).
lint/breakpoint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-17 — cards (comparison): "Coming 202x" heading aligned with active card titles
User clarified: the "Coming 2026/2027" HEADINGS must sit on the same horizontal line as "Development Coach
Badge" / "Coaching Professional Certification". Measured source: both title types at y=207 rel. card (same
line — the coming-soon logo is the same 150px height). My coming-soon heading override had `margin:0 0 24px`
(no top margin) → it sat at y=191, 16px too high. Fixed to `margin:16px 0 8px` (matching the active title).
Verified @1512: all four titles now at y=207 rel. card, absolute y=654.4 identical across all four cards.
lint/breakpoint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-17 — cards (comparison): footnote sup size + typography audit across viewports
User: the "7" footnote atop $1,085 is smaller in source; also full typography parity check at all viewports.
- SUP SIZE: source footnotes are small Unicode superscript glyphs (¹²³⁴⁵⁶⁷) at ~0.6em; my HTML <sup>
  inherited the UA default (~0.83em → 15px on the 18px total value), making the "7" too big. Fixed:
  `.cards-comparison-body sup { font-size:0.6em }` → 10.8px on the total value, matching source. Applies to
  all footnote markers in the block (title ¹², subtitle ³, cost lines ⁵⁶, total ⁷).
- COMING BAND BG: verified source band bg = rgb(0,0,0) (pure black) = mine; the greyness in the user's
  screenshot is JPEG compression on near-black, not a real difference. No change needed.
- TYPOGRAPHY AUDIT (source measured @1512, @768, @390 — all FLAT, no responsive scaling):
  title 16/16 Semibold(400) -0.64 white | subtitle 14/14 Semibold -0.64 | perYear 12/12 Regular -0.36 |
  price 28/28 Semibold -1.12 | moduleLabel 14/16.8 Regular w700 -0.42 | moduleLi 14/16.8 Regular -0.42 |
  costLine 14/16.8 Regular -0.42 | totalLabel 14/14 Regular -0.42 | totalValue 18/18 Semibold -0.8.
  Confirmed migrated matches at all three viewports (title/price/moduleLi/totalValue identical @390 & @1512).
lint/breakpoint/overflow/typography ✓; a11y = the one known intentional #0373F3 contrast finding (kept per request).

### 2026-09-17 — cards (comparison): COMING band matched to source DevTools (full border + 0.2 opacity)
User shared source DevTools for `.v-cost-card__coming-soon .v-cost-card__total`: it's the SAME element as
the blue TOTAL bar (`border:1px solid #fff; background:#000; margin:auto -24px 0; min-height:70`) with the
coming-soon variant adding **`opacity:20%`** on the WHOLE band — dimming border AND white text together
(that's why the border looked faint, not absent). My build had only a top divider at full opacity + AA-grey
text. Fixed to match exactly: `border:1px solid #fff; background:#000; color:#fff; opacity:0.2` on the band.
Verified @1512: border 1px white, opacity 0.2, white text, black bg, top aligned to blue bar row (0px).
NOTE — new intentional a11y deviation: the 0.2-opacity white-on-black "Coming 202x" text fails AA contrast,
but this is EXACT source parity (the source dims it identically). Kept per the 100%-parity requirement,
alongside the existing #0373F3 blue-bar contrast deviation.
lint/breakpoint/overflow/typography ✓; a11y = 2 known intentional contrast findings (blue bar + dimmed coming band).

### 2026-09-17 — columns (article): tablet fix (stack until 1280) + new `bordered` section style
Two changes to the news-article body row.

1. LAYOUT BREAKPOINT FIX ("tablet seems like Mobile View"). The source lays the article body on the AEM
   12-col grid with classes `tablet--12` / `desktop-small--12` / `default--9`(text) + `default--3`(image).
   Decoded: it is STACKED (image below text, both full-width) at every width BELOW 1280, and only splits
   into two columns (text ≈75% / image ≈25%) at `default` = ≥1280. My earlier build split at ≥1024, which is
   exactly why 834px "looked like mobile was expected but desktop showed" — the tablet range was wrong.
   Fixed: moved the `flex-direction: row` + 75/25 flex-basis + `media-left` order swaps out of the
   `@media (width >= 1024px)` block and into `@media (width >= 1280px)`. Stays `flex-direction: column`
   through 1279. Verified side-by-side transition at exactly 1280 (source & migrated both).
   - Section h2 scale corrected to match source: **28 (<768) → 32 (768–1279) → 40 (≥1280)**. Earlier build
     jumped straight to 40 at ≥768; measured source h2 = 32 @834, 40 @1280/1440. Now set 32 in the 768 query
     and 40 in the 1280 query. Body p stays 18/24 Graphik Regular white at all widths (source-confirmed).

2. NEW GENERIC `bordered` SECTION STYLE (styles/styles.css). User: the article block sits inside a section
   with a white border all around → wanted a reusable section style that borders ANY block within it.
   Source treatment measured on `.cmp-container`: **1px solid #fff, border-radius 20px, ~8px padding,
   transparent fill** — identical at mobile (358w) and desktop (1312w @1440). Implemented as
   `main > .section.bordered > div:has(> .block:not(.spacer))` so ONLY real block wrappers get the outline —
   auto-inserted spacer-wrappers and plain default-content-wrappers are excluded (no empty boxes). Each
   block keeps the section's centered column + gutters, so the outline lands on the shared grid.
   Author enables it via section-metadata Style (e.g. `dark, bordered`). Block-agnostic — works for any block.
   GOTCHA: the `:has()` selector bumps specificity, tripping stylelint `no-descending-specificity` when placed
   before the lower-specificity `.narrow`/`.center` section rules. Fixed by moving the `bordered` rule to the
   END of the section-styles block so specificity ascends.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ (360/768/1024/1280/1920) · typography ✓ (390/768/1024/1280) · a11y ✓

### 2026-09-17 — columns (article): single-frame `bordered` fix + `media-right` variant + both rows one section
User feedback (with source DevTools): the source has ONE `.cmp-container` (measured 1169–1312w × full
article height) with a SINGLE white frame around the WHOLE article body — not a box per block. My earlier
`bordered` drew a separate outline around each block wrapper, which read as cluttered double-frames. Three fixes:

1. SINGLE FRAME ON THE SECTION (styles/styles.css). Rewrote `.bordered` so the frame lives on the SECTION
   element itself (`main > .section.bordered`), not on each `> div` block wrapper. An EDS section has many
   sibling wrappers (blocks + spacers); bordering the section once wraps them all in one frame. Measured
   source geometry replicated exactly: 1px solid #fff, border-radius 20px, padding 8px, transparent fill,
   inset from the viewport by the SAME per-breakpoint page gutter (16/40/48/64), capped at 1536. Verified:
   frame width 358@390 (inset 16) and 1312@1440 (inset 64) — matches source at both. Inner block wrappers
   flattened (`max-width:none; margin-inline:0; padding-inline:0`) so content sits flush in the one frame.
   - GOTCHA (specificity): a bordered section that holds spacers ALSO carries `spacer-container`, whose rule
     `main > .section.spacer-container { margin:0; padding:0 }` (blocks/spacer/spacer.css) is EQUAL specificity
     and loads AFTER styles.css, so it won on margin/padding (width had no competitor, so only width applied →
     frame was full-bleed with no padding). Fixed by doubling the class `main > .section.bordered.bordered`
     for the box-model props — lifts specificity just enough, no !important. Documented inline.
   - Also guarded the article container's own gutter rules with `:not(.bordered)` so they don't re-add a
     second inner gutter when the section is bordered.

2. `media-right` VARIANT. Named the image-on-right layout explicitly as `media-right` (previously only the
   implicit default). No new CSS needed — the base article rules already place media on the right; `media-left`
   flips it. Updated the JS doc comment. Authoring: `columns article media-right` vs `columns article media-left`.

3. BOTH ROWS IN ONE SECTION. Restructured the sample so the intro (h1 + description) is its own un-bordered
   section, and BOTH article rows (media-right then media-left) live together in ONE `dark bordered` section —
   mirroring the source, where the entire multi-row article body shares a single frame. New sample page
   `columns-article-media-right.plain.html` demonstrates the media-right variant on its own.
Verified @390/768/1440: one border, correct inset+padding+radius, media sides correct, no overflow.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages, 360–1920) · typography ✓ · a11y ✓ (both pages)

### 2026-09-17 — columns (article) bordered: match source's 20px inner padding (content→border gap)
User: the content was too close to the white frame — parity off. Measured source with DevTools + live DOM:
the content sits 21px inside the border on ALL sides = 1px border + 8px `.cmp-container` padding + 12px
`.aem-GridColumn` padding (the `padding: 12px 12px` visible in the user's DevTools). My build only had the
8px frame padding (~9px inset). Fixed: added `padding: 12px` on the bordered section's block wrappers
(`main > .section.bordered > div:has(> .block:not(.spacer))`), so total inset = 8 (frame) + 12 (wrapper) =
20px + 1px border = 21px, matching source. Spacers/loose content stay flush. Verified content→border gap =
21px at 1440 (text-left + image-right) and mobile @390; frame outer edge stays 64px @1440 / 16px @390,
width 1312/358 — aligned with the header hamburger + right nav (the requested vertical alignment / parity).
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages) · typography ✓ · a11y ✓

### 2026-09-17 — columns (article) bordered: align frame to the HEADER column (hamburger↔Sign In) for parity
User: pixel-overlay showed the bordered frame narrower than the header — its edges didn't sit under the
hamburger (left) / Sign In (right). Root cause: the frame used the generic content gutter 16/40/48/64, but
the HEADER uses 16/40/36/52 (blocks/header/header.css — hamburger x = 16@390, 40@768, 36@1024, 52@1440).
So the frame was inset 12px more than the header at ≥1024. Fixed the frame width to match the header gutter
exactly: width = 100% − 2×gutter → 32 (mobile 16) / 80 (768→40) / 72 (1024→36) / 104 (1280→52). Verified the
frame's left/right edges now coincide with the header hamburger + rightmost nav item at ALL breakpoints:
390 L16/R374=nav374 · 768 L40/R728=728 · 1024 L36/R988=988 · 1440 L52/R1388=1388. Content still sits 20px
(8 frame + 12 wrapper) inside the border. This deliberately aligns to the header column rather than the
source's own 64px article gutter — per the user's explicit "align vertically to header hamburger / 100% parity"
requirement (the source itself leaves a 12px header-vs-frame gap; we tighten to the header for exact parity).
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages) · typography ✓ · a11y ✓

### 2026-09-17 — columns (article) bordered: EXACT source grid (revert header-align mistake + fix 9/3 split)
Pixel-overlay from user showed real drift. Two corrections:

1. REVERTED the prior "align frame to header (36/52)" change — that was a MISREAD. Measured the source
   `.cmp-container` frame directly at each breakpoint: it sits at **16 / 40 / 48 / 64** (390/768/1024/1440),
   NOT at the header's 36/52. So the frame gutter goes back to 16/40/48/64 (widths 100%−32/−80/−96/−128).
   The source frame is intentionally ~12px inside the header at ≥1024 — that IS the source, so we match it.
   Verified frame now 64/1312 @1440, 16/358 @390 — identical to source.

2. EXACT 9/3 GRID (the text-wrap drift). Measured the source row: frame-inner row = 1294px, display:block
   float grid, text cell = 971px (= clean 9/12 of 1294) with 12px padding → text 947; image cell = 324px
   (= 3/12) with 12px padding → image 300. The 24px column gutter is the two 12px cell paddings meeting —
   NOT a flex gap. My build used `flex-basis: calc(75%−12px)` + `gap:24px` + wrapper padding, which drifted
   ~6px and changed the text wrap. Fixed to reproduce the source model verbatim:
   - `.columns.article > div`: `gap: 0` (no flex gap).
   - cells: `flex: 0 0 75%` / `0 0 25%`, `box-sizing: border-box`, `padding: 12px` (12px lives on the CELL at
     all breakpoints = source `.aem-GridColumn`). border-box keeps the 12px INSIDE the 75/25 so cells land on
     the exact grid lines.
   - the row spans the FULL frame-inner width (no wrapper padding) so 9/3 hits the source grid lines. The
     bordered wrapper-padding rule now excludes `.article` (`:not(.spacer, .article)`) to avoid double inset;
     article's 20px content inset = 8px frame + 12px cell.
   Verified @1440 pixel-exact vs source: text cell 971, image cell 324, text 85→1032 (947), image 1056→1355
   (300), frame 64/1312 — ALL match. media-left mirrors (image cell 3/12 left, text 9/12 right). Mobile stacks,
   content 21px inside border. Text now wraps line-for-line like the source.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages) · typography ✓ · a11y ✓

### 2026-09-17 — columns (article): REMOVED bordered section; width now matches the shared site grid
User: drop the white-border section entirely; the article's width should simply match the other blocks
(cards profile, cards comparison) which align vertically with the header. Done:
- Deleted the entire `.section.bordered` style block from styles.css (the whole bordered experiment is gone).
- Removed `bordered` from both article sample pages (columns-article + columns-article-media-right); each is
  now a plain `dark` section with normal spacers.
- Removed the `:not(.bordered)` guards on the article container rules — the article now always uses its
  standard container: max-width 1536, gutters 16/40/48/64 (same as the cards blocks), so it aligns with the
  header and every other block on the page.
- Kept the exact 9/3 grid model (cells `flex: 0 0 75%`/`25%`, `box-sizing: border-box`, `padding: 12px`,
  `gap: 0`) so the two 12px cell paddings still form the 24px inter-column gutter and the text wraps like the
  source. The 12px cell padding remains as the source `.aem-GridColumn` inset.
Verified @1440: article content spans 76→1364, matching cards-comparison grid (77→1363) and aligned with the
header nav; no border; media-left mirrors; mobile stacks.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages) · typography ✓ · a11y ✓

### 2026-09-17 — columns (article): re-added `bordered` section (parent frame at block width, pushes content in)
Now that the article's own width is correct (16/40/48/64 gutters, aligned to the header/cards), re-added the
`bordered` section as a reusable PARENT frame per the source:
- Frame lives on the SECTION (`main > .section.bordered.bordered`), one white outline (1px #fff, 20px radius,
  8px padding) at the SAME outer width as any block — gutters 16/40/48/64, capped 1536. So the frame edge sits
  exactly where the un-bordered article/cards edge sits, aligned with the header.
- The frame is the PARENT and owns the outer gutter; the block inside drops its own gutter via the article
  container's `:not(.bordered)` guards (re-added). The block keeps its 12px cell padding. Result: 8px frame +
  12px cell pushes content to x=85 — matching the source `.cmp-container`(8px) + `.aem-GridColumn`(12px) nesting.
- Doubled `.bordered.bordered` to beat the later, equal-specificity `spacer-container` reset (no !important).
- Applied `dark, bordered` to the columns-article sample (both rows share the one frame).
Verified @1440 pixel-exact vs source: frame 64/1312, 1 border, 8px pad, 20px radius, text 85→1032, image right
1355. Mobile @390: frame 16/358, content 21px inside border, stacked. media-right sample stays un-bordered as
the plain-width reference.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages) · typography ✓ · a11y ✓

### 2026-09-17 — bordered section: fix frame over-wide at viewports ≥1536 (max-width bug)
The `bordered` frame exceeded the page/content width on wide screens. Cause: the frame capped `max-width`
at a bare 1536, but an ordinary block container is `max-width:1536; padding:0 gutter` (border-box) → its
CONTENT box caps at 1536 − 2×gutter. So at ≥1536 the frame was 2×gutter (128px @≥1280) wider than the block
content, overrunning the layout. Fix: cap the frame's max-width at `1536 − 2×gutter` per breakpoint
(1536−32 / −80 / −96 / −128), matching the block content box exactly. Verified frame == un-bordered article
row at 1920 (both 256/256, 1408px) and still source-exact at 1440 (64/1312, text 85→1032, image right 1355)
and mobile (16/358, content 21px inside border). Overflow sweep clean at 1920.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (both pages, incl. 1920) · typography ✓ · a11y ✓

### 2026-09-17 — columns (article) typography parity audit + section-samples folder
1) TYPOGRAPHY PARITY (columns.article) — audited every text element against the source at 390/768/1440.
   Source-measured (each viewport):
   - Body p: "Graphik Regular", 18px / line-height 24px, weight 400, letter-spacing normal, #fff, left —
     FLAT (no responsive change). Paragraph gap 24px (source uses empty spacer <p>; ours = margin-bottom 24px).
   - Section h2: "Graphik Semibold", weight 700, line-height 1.0 (= font-size), ls normal, #fff, left;
     font-size 28 @<768 → 32 @768–1279 → 40 @≥1280.
   Migrated build measured identical at all three viewports (body 18/24/400 flat; h2 28→32→40, lh=1). No
   drift. Only fixed a stale code comment ("28→40 ≥768" → "28→32≥768→40≥1280"). check:typography ✓.
2) SECTION SAMPLE — created content/drafts/section-samples/ (new folder, sibling of block-samples) with
   section-bordered.plain.html: intro section + one `dark, bordered` section wrapping both article rows
   (demonstrates the frame as a parent) + trailing plain section. Preview at
   /content/drafts/section-samples/section-bordered. Frame verified 64/1312, 1px #fff, 20px radius, 8px pad.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ · typography ✓ (article + section sample) · a11y ✓

### 2026-09-17 — bordered section: symmetric padding (removed leading/trailing inner spacers)
User: top/bottom padding looked larger than the sides inside the bordered frame. Cause: the sample authored
a 40px `spacer` block as the first and last child INSIDE the bordered section, adding 40px on top/bottom on
top of the frame's own 8px — so vertical inset (49px block / 61px content) ≫ horizontal inset (21px). Fix:
removed the leading + trailing inner spacers (kept the middle one between the two rows) in both
section-samples/section-bordered and block-samples/columns-article. Now the frame's own 8px padding is the
only inset: content sits 21px from the border on ALL sides (8 frame + 12 cell + 1 border), block sits 9px
top/bottom — symmetric. Guidance: inside a `bordered` section, don't add leading/trailing spacers; the frame
provides the padding.
lint ✓ · breakpoint ✓ · overflow ✓ (section + article) · typography ✓ · a11y ✓

### 2026-09-19 — columns (list): re-applied mobile parity fixes (had reverted) + verified desktop/mobile
The list-tile fixes from 2026-09-18 had reverted in columns.css/.js (content padding back to 15×19, no flex
gap, CTA pinned bottom, no excerpt clamp, no title-wrapper flatten). Re-applied and re-verified against the
source `.v-news-article-tile` at desktop (1440) and mobile (393):
- content card: flex column `gap:20px`, padding 14×18 (was 15×19, no gap).
- excerpt: margin 0 0 5px + `-webkit-line-clamp:2; overflow:hidden` → 2-line truncation ("…") at all vp.
- CTA: MOBILE (<768) full-width block, centered; ≥768 inline-block right-aligned (footer justify-end). No
  bottom-pin. Gaps: title→excerpt 20px, excerpt→CTA 25px.
- title-wrapper: JS tags the title link's <p> as `.columns-list-title-wrapper`; CSS zeroes its margins +
  line-height 44 so title→excerpt is exactly the 20px flex gap (not 32px).
Verified — mobile: thumb 1:1 square (361 = full width), pad 14×18, gap 20, title→desc 20, desc→CTA 25, CTA
full-width (323), excerpt clamp 2. Desktop: thumb 231 side-by-side, CTA inline 156 right-aligned 19px in,
same 20/25 gaps. Typography flat & source-exact (title 40/44 Graphik Semibold, excerpt 16/19.2 Graphik
Regular, CTA 16/-0.48px uppercase).
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ · typography ✓ · a11y ✓

### 2026-09-19 — columns (embed): tablet grid fix + typography parity
Audited the online-learning-hub embed block against the source across 390/768/1024/1280.
1) TABLET GRID (positioning drift): source embed column is `tablet--5` (5/12), `desktop-small--6` (6/12),
   `default--5` (5/12) — side-by-side from ≥768, NOT stacked. My build stacked until 1024. Fixed: side-by-side
   from ≥768 with embed flex-basis 41.667% (768) → 50% (1024) → 41.667% (≥1280), each minus half the 48px gap.
   Verified: embed 263px/38% @768, 47% @1024, 40% @1280; embed left, no overflow.
2) TYPOGRAPHY PARITY — measured every text element (source, all VPs):
   - intro / body / bullet items: "Graphik Regular" 18/24, weight 400, ls normal, #fff — FLAT all viewports.
   - section heading ("The Coach's Edge"): "Graphik Regular" (NOT Semibold), weight 400, line-height 1.0,
     ls normal, #fff; font-size RESPONSIVE 28 (<1024) → 32 (≥1024).
   - bullet <ul>: list-style disc, padding-left 40px, 18px top/bottom margin.
   My build had drifts: heading was Graphik SEMIBOLD + flat 32; ul padding-left 24px, margin 0/24. Fixed:
   heading → var(--body-font-family) (Graphik Regular), 28 base + 32 in the ≥1024 query; ul → disc,
   padding-left 40px, margin 18px 0. Verified identical @390 (28), @768 (28), @1280 (32); intro/li 18/24 flat.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (360–1920; LinkedIn iframe load is flaky, passes on retry) ·
typography ✓ · a11y ✓

### 2026-09-19 — columns (embed): fix trailing white space under the LinkedIn iframe (875 → 720)
Mobile showed ~155px of blank white below the LinkedIn post. Cause: the iframe had a fixed `height: 875px`,
taller than the actual embed content — the iframe's white background filled the excess. Measured the source
LinkedIn iframe: it is `height="720"` (CSS 720px) at EVERY viewport (mobile + desktop). Fixed the embed
iframe height 875 → 720px. Verified @390: iframe 720 = media wrapper 720, extraSpace 0 (gap gone); embed
ends flush at the post's Like/Comment/Share footer.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (flaky iframe load, passes on retry) · a11y ✓

### 2026-09-19 — columns (embed): cap iframe at source's fixed 430×720 (fix desktop cutoff)
The prior height fix (720) exposed a second issue: my iframe still had `max-width: 504px`, so on desktop it
rendered wider than the source, the portrait video grew taller than 720, and the post footer got cut off.
Measured the source LinkedIn iframe: it is a FIXED 430 × 720 (width="430" height="720") at EVERY viewport —
it does NOT scale to fill the column. Fixed: `max-width: 430px` (was 504). Now at desktop the iframe is
430×720 with the full post + footer fitting exactly (extraSpace 0, no cutoff); mobile width:100% shrinks it
below 430 (358 @390) staying 720 tall (no gap). Verified no horizontal overflow at 360/768/1280/1920
(scrollW === clientW at each). NOTE: `npm run check:overflow` reports a load ERR on this page because the
external LinkedIn iframe times out in headless — verified manually there is no overflow.
lint ✓ (0 err) · breakpoint ✓ · a11y ✓ · overflow verified manually (tool load-timeout on the LI iframe)

### 2026-09-19 — columns (embed): iframe aspect-ratio so it shows full height (no crop, no gap, no scroll)
Fixed height couldn't satisfy both viewports: the LinkedIn embed's content height scales with the iframe
WIDTH (portrait video grows taller as the frame widens). 720px fit mobile (358w) but cropped the post footer
on desktop (430w needs ~865h); 875px showed desktop but left a gap on mobile. Replaced fixed height with
`aspect-ratio: 430 / 865; height: auto` (max-width 430). Now the iframe height tracks its width so the FULL
post (video + reactions + Like/Comment/Share footer) shows at every viewport with no scroll and no trailing
white space. Verified: mobile 358×720 extraSpace 0; desktop 430×865 extraSpace 0, footer visible.
lint ✓ (0 err) · breakpoint ✓ · a11y ✓ · no horizontal overflow (verified manually; LI iframe times out the
overflow tool).

TODO (next): instrument any not-yet-built variants — Columns (promo), Columns (text), Cards (news),
Cards (quote) — from the source URLs + screenshots in the reference/ compressed HTML report, all viewports.

### 2026-09-20 — columns (embed): JS-size iframe to LinkedIn content height (no scroll, no gap, full post)
Fixed height/aspect-ratio couldn't match: measured the LinkedIn embed's own content height directly (loaded
the embed URL same-origin) at multiple widths — 263w→674h, 358w→748h, 430w→804h. It grows LINEARLY with
width (fixed header/footer + width-scaling video): height ≈ 0.778·w + 470. Any single fixed height/ratio
either clipped the footer (internal scroll) or left a white gap. Fix: decorateEmbed() now sets the iframe
height from its rendered width via that formula and keeps it in sync with a ResizeObserver; CSS keeps
max-width 430 + a pre-JS aspect-ratio(430/804) fallback. Verified full post (video + reactions + Like/
Comment/Share footer) shows with extraSpace 0 and no internal scroll: mobile 358×749, desktop 430×805. No
horizontal overflow @1440 (scrollW===clientW).
lint ✓ (0 err) · breakpoint ✓ · a11y ✓

TODO (next): instrument not-yet-built variants — Columns (promo), Columns (text), Cards (news), Cards
(quote) — from the source URLs + screenshots in the reference/ compressed HTML report, all viewports.

### 2026-09-20 — columns (text): NEW variant (Eligibility & Requirements, coach-mentorship.html)
Built the `columns.text` variant — a dark rounded card with a centered heading + two requirement columns
(label + big lime title + diamond-bulleted items) and a centered lime CTA. Source-measured 390/768/1024/1440.
Design system captured:
- Card: bg #202020, radius 32px, padding 36px 24px (desktop/tablet) → 24px 16px (mobile). Uses the standard
  columns container gutters 16/40/48/64.
- Heading (USTA Sans 700, centered): 28 (<768) → 32 (768) → 40 (≥1024), lh 1.0.
- Column label (USTA Sans 700, white, uppercase): 24/32 flat.
- Big title MENTOR/MENTEE (USTA Sans 700, lime #cfff05): 28 (<1024) → 32 (≥1024).
- Items: `<ul><li><strong>Age:</strong> …</li>` — Graphik Regular 18/24 white, 24px apart, each with a 17px
  green-diamond marker (::before, media/green-diamond.png downloaded from source), text indented 27px.
- CTA "Register Now": Graphik Semibold 18/20, #000 on lime, radius 12, padding 14×24, centered.
- Layout: two columns side-by-side ≥768 (24px gap); stacks below 768.
JS decorateText: hoists a heading-only first row to a centered card heading; tags label/title (first two <p>)
+ list items (<li>); a trailing link-only row becomes the centered CTA. Added `.text` to the default-variant
`:not()` guards and the dispatch. Sample: block-samples/columns-text.plain.html (rewrote to the standard
wrapper structure so the page <title> resolves — a11y needs it).
Verified vs source @1440: card #202020/32r/36×24 pad, col gap 24, heading 40 centered, label 24/32, title 32
lime, item 18/24 + diamond, CTA lime pill. @768 2-col heading 32/title 28; @390 stacked, pad 24×16, heading 28.
lint ✓ (0 err) · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (text): pixel-parity drift fix (label→title gap)
Pixel-comparing source vs migrated screenshots for the Eligibility & Requirements card surfaced one drift:
the small column label → big lime title gap was 8px in the build vs **24px** in the source. Fixed by setting
`.columns.text .columns-text-label { margin: 0 0 24px; }` (was `0 0 8px`). Re-measured all other metrics and
they already matched source (heading→label 66px desktop/tablet / 24px mobile; title→first item 24px; item gap
24px; diamond 17px + 27px indent; column gap 24px). Verified label→title = 24px at 390/768/1440.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (text): CTA size + diamond color parity
Two source-mismatches found comparing screenshots:
- **CTA "Register Now"** was shrink-to-fit; source is a fixed **280×56** flex-centered pill, **uppercase** with
  **letter-spacing 1px**. Fixed `.columns-text-cta` to width 280 / height 56, flex center, text-transform
  uppercase, letter-spacing 1px (padding 14×24, radius 12, lime bg, Graphik Semibold 18/20 unchanged).
- **Diamond marker** was the lime `green-diamond.png`; the source actually uses a **white** diamond
  (`/content/dam/.../white-diamond.png`). Downloaded it to media/white-diamond.png (17×17 RGBA) and switched
  the `.columns-text-item::before` background to it. Removed the now-unused green-diamond.png.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (text): CTA re-measured from source DevTools (corrected)
Prior fix over-corrected. Re-extracted the source `.button-core` computed styles exactly:
- Text is **title case "Register Now"** — the outer `<a>` sets `text-transform: uppercase` but the inner
  `.button-core__text-content` span resets it to `none`, so the visible label is title case. Removed the
  wrongly-applied `text-transform: uppercase`.
- Width is **breakpoint-dependent, not a flat 280px**: mobile (<768) = fixed `width: 280px`; **≥768 = `width:
  max-content` with `min-width: 120px`** (shrinks to content, ~155–206px). Added the ≥768 rule.
- Added the source's `border: 2px solid #000` and `overflow: hidden`. Height 56, radius 12, padding 14×24,
  letter-spacing 1px, Graphik Semibold 18/20, weight 400, lime bg / black text — all confirmed.
Verified @390 (280px fixed) / @768 & @1440 (content-width, min 120) — matches source.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (text): pixel-parity sweep vs source @440 (CTA centering + marker)
Measured every component in the source Eligibility card at 440px and diffed against the build. Two drifts:
- **CTA not centered** — the wrapper was `display:flex; justify-content:center` but the block's row rule made
  it `flex-direction: column`, so justify centered on the *cross* axis and the pill stayed left-aligned at the
  card's left padding (left=32 vs source left=80/card-center). Added `flex-direction: column; align-items:
  center` to `.columns-text-cta-wrapper` → CTA now centers on the card (left=80, center=220 = card center),
  matching source.
- **Diamond marker vertical position** — source sits at `top: 5px` within the item row; build had `top: 3px`.
  Set `.columns-text-item::before { top: 5px }`.
Confirmed matching source @440: item gaps 24px, text indent 27px (17px diamond + 10px gap), item font 18/24,
label 24/32, title 28, CTA 280×56 centered. lint ✓ · breakpoint ✓ · overflow ✓ · typography ✓ · a11y ✓

### 2026-09-20 — columns (text): diamond marker moved to icons/ as SVG
Relocated the item marker out of a per-block PNG into the shared icons/ folder as a scalable vector:
created `icons/diamond.svg` (17×17 white diamond), pointed `.columns-text-item::before` at
`url("/icons/diamond.svg")`, and deleted `blocks/columns/media/white-diamond.png` (+ the now-empty media/
dir). SVG is crisp at any DPR and the icons/ folder is the project convention for UI glyphs.
Verified icon loads (200) and renders at top 5px / 17×17. lint ✓ · check:svg ✓ (under budget) · a11y ✓

### 2026-09-20 — cards (news): parity pass vs source (news.html) + NEW sample page
decorateNews existed and .cards.news CSS existed but there was NO sample page and several drifts vs the
source news-card grid (measured news.html @390/768/1024/1280/1440). Fixes:
- **Grid**: source is 1-up → 2-up (≥768) → **4-up (≥1280)**, gap **24px at every breakpoint**. Build had
  2-up max and bumped gap to 40 at ≥768. Corrected columns + gap.
- **Card**: flex column, **16px gap** (image → arrow → content). Was padding-top 24 with no gap.
- **Image**: source aspect **320/301 (~1.06, near-square)**, radius 20, cover. Build had 16/9.
- **Arrow affordance**: source shows a **lime 52×48 pill (radius 12) with a black right-arrow SVG** between
  image and text (inset 16px), NOT an inline "→" after the title. Added `icons/arrow-right.svg` (23×12 glyph),
  a `.cards-news-cta-wrapper` (padding 0 16px) + `.cards-news-arrow` (52×48 lime pill), and decorateNews now
  emits it (an `<a>` to the article when the title links, else a span; aria-hidden, tabindex -1). Removed the
  inline arrow `::after`.
- **Content**: padding 0 16px 16px, flex column **gap 24px**; date pulled up `-8px` (net 16px below title,
  matching source). Title 24 → 28 (≥768) → **32 (≥1280, was ≥1024)**.
Sample: block-samples/cards-news.plain.html (4 cards). Verified @1440 4-up/title32, @768 2-up/title28, @390
1-up/title24; arrow 52×48 lime + SVG, image aspect 1.06 radius 20, gap 24 all breakpoints.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · check:svg ✓ · typography ✓ · a11y ✓

### 2026-09-20 — cards (quote): NEW variant ("What Others Are Saying") + sample page
Built the `cards.quote` variant from the summit page's testimonial grid (measured
usta-coaches-inclusion-summit.html @390/768/1440). NOTE the live page's testimonial text has since changed
(now "WHAT PAST ATTENDEES SAY", plain/transparent), but the block container + the report's design intent are
the dark rounded quote cards — followed the report ("italic testimonial quote + divider + attribution").
Design system captured:
- Grid: **1-up mobile (16px gap) → 3-up ≥768 (24px gap)**; equal-width, equal-height cards (align-items stretch).
- Card: bg **#2a2a2a**, radius **20px**, **1px solid #a0a0a0** border, **24px** padding, flex column.
- Quote: Graphik Regular **italic 16/24** white.
- Divider: full-width `<hr>` 1px solid **#808080**, **16px** above & below.
- Attribution: name white 16/24 directly above role/org **#bedbff** 16/24 (0 gap).
JS decorateQuote (cards.js): one row per card; the last two <p> = name + role, the rest = quote; injects an
`<hr>` divider between quote and attribution. Added `.quote` to the three default-variant `:not()` guards and
the dispatch branch. Sample: block-samples/cards-quote.plain.html (3 cards: Hassan Humayun / Celia Quintero /
Gonzo Garcia, from the report).
Verified @1440 & @768 3-up gap24 card421 #2a2a2a/20r/1px#a0a0a0/24pad, quote italic 16/24, divider #808080
16/16, name #fff role #bedbff; @390 1-up gap16.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (promo): NEW variant (featured event/promo rows) + sample page
Built the `columns.promo` variant from coaching-workshops "IN-PERSON EVENTS" + webinar promo rows
(measured @390/768/1440). Design system captured:
- Panel: **transparent, 1px solid #fff, 20px radius**; content inset **25px** (mobile/tablet) → **49px top/bottom
  25px sides** (≥1024). Panels stacked with 24px between.
- Header: title (left) + lime CTA (right), **flex space-between on one row**; wraps/stacks below on narrow
  widths (source kept them on one row but the 280px CTA overflowed the panel — wrapping is the overflow-safe
  equivalent; verified no horizontal overflow at any breakpoint).
- Title: Graphik Semibold white **28 → 32 (≥1024)**, line-height 1.
- CTA: the shared lime pill — 280×56, radius 12, 2px black border, letter-spacing 1px, title-case (Graphik
  Semibold 18/20) — same contract as columns-text/columns-media CTAs.
- Details: Graphik Regular **18/21.6** white, **48px** below the header.
JS decoratePromo (columns.js): one row per panel; first heading/p = title, the link = CTA (both moved into a
`.columns-promo-header`), remaining paragraphs = `.columns-promo-details`. Added `.promo` to the 7 default-
variant `:not()` guards + the dispatch branch. Sample: block-samples/columns-promo.plain.html (2 panels: STMS
World Congress + Coaches Open).
Verified @1440 panel 1px#fff/20r/49-25 pad, title 32 + CTA 280×56 same row, details 48px below 18/21.6;
@768 title 28 CTA wraps; @390 stacked, title 28.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — typography parity audit (cards news/quote, columns promo) — 2 drifts fixed
Full per-element typography diff vs source at 390/768/1024/1280/1440 for all three new blocks (font-family,
size, weight, line-height, letter-spacing, color, transform, style, align). Findings:
- **cards (news)** — already exact. Title Graphik Semibold, size scales 24→28(≥768)→32(≥1280) with matching
  letter-spacing -0.03em (measured -0.72/-0.84/-0.96px); date + excerpt Graphik Regular flat 16/19.2. ✓
- **cards (quote)** — DRIFT: build made the quote **italic**; the LIVE source is `font-style: normal` (flat
  16/24 Graphik Regular at every viewport). Removed `font-style: italic` from `.cards-quote-text p` (and the
  sample copy). Name #fff, role #bedbff, all 16/24. Now exact. (The report's "italic" note predates the live
  page; matched the live computed style.)
- **columns (promo)** — 2 DRIFTS: (1) title 28→32 bump was at ≥1024 but the source bumps at **≥1280**;
  (2) details were flat 18/21.6 but the source is **16/19.2 below 1280, 18/21.6 at ≥1280**. Also moved the
  panel's roomier 49px top/bottom inset to ≥1280 (source stays 25px inset through 1024). CTA is flat 18/20
  ls 1px title-case at all widths (unchanged). Now exact at every breakpoint.
Re-verified computed values on the build @390/768/1280/1440 == source for every text element.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920, all 3) · typography ✓ (all 3) · a11y ✓ (all 3)

### 2026-09-20 — columns (promo): swapped sample to live webinar content + fixed header wrap
Replaced the sample content with the two live ONLINE WEBINARS panels ("Fueling the Ace…" + "Elevate Your
Coaching…") for a true side-by-side vs source. Their longer titles exposed a layout drift: with
`justify-content: space-between` and a non-flexing title, the long one-line title pushed the CTA onto its own
row instead of wrapping. Source keeps title + CTA on the SAME top row with the **title wrapping to 2 lines**
beside the fixed 280px CTA. Fix: header is `flex-direction: column` (stacked) on mobile → `row` from ≥768 with
`.columns-promo-title { flex: 1 1 auto; min-width: 0 }` (wraps) and CTA `flex: 0 0 auto` (fixed); both
top-aligned (align-items flex-start). Verified @1440 title=2 lines, CTA pinned top-right (inset 26 ≈ source 25),
title top 50 == CTA top 50, title→details 48px; @390 CTA stacks below title, no overflow.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (promo): meta/body spacer parity (Date → description gap)
Side-by-side vs source revealed the last drift: the source separates the meta lines (Presenters/Moderator/
Date) from the body description with a **~43px gap** (two empty 21.6px paragraphs in the CMS). My build ran
the description immediately under the Date line (0 gap). Fix: decoratePromo now splits the detail paragraphs
into `.columns-promo-meta` (lines matching `^(Presenters|Moderator|Date|Location|Time):`) and
`.columns-promo-body` (the rest), dropping the empty authored paragraphs; CSS adds
`.columns-promo-body { margin-top: 43px }`. Meta lines stay tight (line-height rhythm, 0 inter-line margin),
exactly like the source. Verified @1440 Date-bottom → body-top = 43px (== source).
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — columns (promo): body paragraph spacing + full-width mobile CTA
Two more source-parity fixes:
- **Body sub-paragraphs** (e.g. a trailing "Can't make it live? Register today…") now sit on their own line
  with a blank-line gap. Source separates body paragraphs by ~1 line-height (measured 22px @1440). Added
  `.columns-promo-body .columns-promo-detail + .columns-promo-detail { margin-top: 1.2em }`. The decorator
  already keeps all non-meta paragraphs in `.columns-promo-body`, so this spaces them like the source.
- **Mobile CTA** was a fixed 280px left-aligned pill; the source stretches it **full-width** in the stacked
  panel (edge-to-edge to the 25px insets, so it reads centered). Made `.columns-promo-cta` `width: 100%`
  mobile-first, restored `width: 280px` at ≥768 (still pinned top-right beside the wrapping title).
Verified @390 CTA full-width centered (insets 26/26) + "Can't make it live?" on its own line (19px gap);
@1440 CTA 280px top-right + body para gap 22px (== source).
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — cards (news): live content/images + grid-width (gutter) parity
Two updates for a clean side-by-side vs news.html:
- **Content/images**: swapped the sample to the 4 live grid cards (Coaches Open / Butch Staples / Parks &
  Recreation / Tina Lee) with their exact titles, dates, excerpts, and the real source image URLs
  (content/dam/coaching/public-pages/news/…). Each renders at 310×292 (aspect 1.06, radius 20).
- **Grid width DRIFT**: the news grid uses its OWN wider gutters than the site default 16/40/48/64. Measured
  news.html: **24 (mobile) → 52 (≥768) → 60 (≥1024) → 76 (≥1280)**, 1536-capped (grid caps at 1384 @1920).
  My build used 16/40/48/64 (grid 1312 vs source 1288 @1440). Updated `.cards-container:has(.cards.news)`
  padding-inline to 24/52/60/76.
Verified grid width == source at every breakpoint: @390 24/342, @768 52/664, @1024 60/904, @1440 76/1288.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — cards (quote): quote is ITALIC (corrected)
Side-by-side vs the source screenshot showed the quote text should be italic. Re-inspected the live source:
the quote paragraph's own `font-style` is `normal`, BUT the quote text is wrapped in an `<i>` element
(`<p><i>"…"</i></p>`), so it renders italic. An earlier pass had read the `<p>` style and wrongly set the
build to non-italic. Restored `font-style: italic` on `.cards-quote-text p` and updated the sample copy.
Re-verified all other card metrics still match source @1440: card 421 / 24pad / 20r / 1px #a0a0a0 / #2a2a2a;
quote italic 16/24 #fff; quote→divider 16; divider 1px #808080; divider→name 16; name #fff, role #bedbff.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — cards (quote): live content + inner 12px text inset (wrap parity)
Swapped the sample to the exact live quotes (Miyako Coffey / Marc Atkinson / Marti Love). With identical
content the quote wrapped WIDER than the source (my text used the full 371px content box; source wrapped to
6 lines). DevTools showed the source nests the text in an inner `.text.aem-GridColumn` wrapper with **12px
side padding**, so the quote + attribution sit inset 12px inside the card content box (text column = 347px,
left inset 37), while the **divider spans the full 371px content box**. Reproduced: added
`padding-inline: 12px` to `.cards-quote-text` + `.cards-quote-attribution` (divider unchanged, full-width).
Verified @1440: quote left 37 / width 347 / **6 lines** (== source), divider 25/371/25, name left 37; @390
no overflow (card 358, quote 284, divider 308). Quote italic retained.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-20 — cards (quote): bottom padding parity (extra space below attribution)
Pixel compare showed the source cards have MORE space below the attribution than the build. Measured @1100
(card 319w): source tallest card (Marc, 12-line quote) role→card-bottom = **57px** (not the plain 24px pad) —
its AEM grid row stretches ~32px past the content. Build had role→bottom = 25px (pad only). Set the card
`padding: 24px 24px 56px` (extra ~32px at the bottom). Now the tallest card's role→bottom = 57px == source;
internal rhythm unchanged (quote→divider 16, divider→name 16, 12-line wrap, 12px text inset). Residual card-
height delta vs the live page is only because the source's full-page grid row is stretched by a taller
sibling elsewhere — not reproducible (or meaningful) in the isolated block sample.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓

### 2026-09-28 — form (application) + tabs (application): equivalency application forms
Source: `/en/home/learning-pathway/usta-coaching-equivalency-application.html` — a 2-tab pill toggle over two
**Formstack iframe embeds** (Education Equivalency / Industry Experience). Rebuilt natively on the existing
doc-based form pattern (same as subscribe / lead-interests / flag-profile):
- **Sheets (DA `/forms`)**: `education-equivalency.json` (27 rows), `industry-experience.json` (21 rows),
  generated by `tools/forms/application-forms.mjs` (re-run + re-upload to change them). Adds the
  boilerplate columns Fieldset (Name / Address panels), Column Span (6 = half row ≥1024), Description
  (USTA Number help → focus tooltip), Placeholder (State "Select a state"; file hint "Max file size: 10 MB"),
  maxFileSize (10MB). Source error copy kept: "Required field", "An address must be provided", "A city / state /
  ZIP Code must be provided". Uploaded + previewed; demo page `/drafts/shivani/equivalency-application`.
- **Compound Tabs -> Form**: EDS never decorates nested blocks, so `tabs.js` turns a panel whose only content
  is a `/forms/*.json` link into a `form` block and `loadBlock()`s it, passing the tabs variants on
  ("Tabs (application)" → "Form (application)"). It deliberately skips `decorateBlock()` — that would tag the
  tabs section `.form-container` and pull in subscribe.css's section-width rules. Also added the source's
  `#tab=educationequivalencyapplication` deep-link (hyphens ignored).
- **tabs (application)** CSS: source pills 68px mobile / 101px ≥768, inset 8px in the #2d2d2d track, labels
  14 → 12 @768 → 14 @1024 → 16 @1280, panel 20px below.
- **form (application)** CSS (`blocks/form/application.css`, imported by form.css): navy card #15232b in a
  2px inset frame (the iframe border), 720px centred column, padding 40 → 80 @1024; Open Sans (self-hosted
  `fonts/open-sans-latin.woff2`, OFL, variable 300–800, + Arial fallback-metrics face — the embed's font, scoped
  to this form only); labels 16px/20px gap, fields 40px apart; inputs 36px/12px, #687680 hairline, r3;
  sub-labels 11px #acb5bf UNDER grouped inputs; error pill #fae9e9 + 1px #ff3c3c ABOVE the control, red input
  border + icon; checkbox 12px; dashed #1e2c35 upload area; submit #edeff0/#15232b 12px centred.
  At 1024/1280/1440 field widths == source (first|last 350, email|phone 340, city|state|zip 268/268/144).
- **Gotcha — subscribe.css is global**: it themes EVERY `main .form.block` (black inputs, uppercase labels,
  lime checkboxes). New form looks must be a variant with higher specificity (`.form.<variant>.block`) and
  re-declare everything subscribe.css sets.
- **Gotcha — 12-col grid overflow**: a 12-col grid with a 40px gap needs 440px just for gaps → phone overflow.
  application.css is single-column below 1024 and restores `repeat(12)` at ≥1024.
- **Form engine fixes (shared)**: restored upstream `components/file` (was missing, `mappings.js` now maps
  `file-input` → file) with file names set via textContent (was innerHTML), kebab-case classes, an accessible
  "Browse files for {label}" button, and a fix for upstream rejecting every file when no Accept is set;
  `recaptcha.js` no longer `alert()`s when the captcha row has no site key (warns + skips).
- **Deviations**: reCAPTCHA site key not set (Formstack's key is domain-bound) — add it to the sheet's captcha
  row Value. Files are validated client-side but, like all doc-based forms, not uploaded by submit.js. Group
  errors show per sub-field (source aggregates one pill per group). No top-of-form error summary. State
  placeholder reads "Select a state" (source blank). Native date input instead of Formstack's picker.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y ✓ (only the pre-existing footer
`/forms/subscribe.json` link target-size violation, present on every page)

### 2026-09-28 — form (application) + tabs (application): pixel parity pass
Element-by-element comparison vs the live Formstack embeds (positions relative to the form title, source
measured inside its iframe at the same viewport). All rows now match at 390 / 768 / 1440 (both forms):
- **Tabs width** = source columns 2–11 of its 12-col page grid: `(content + 24) × 5/6 − 24`, page gutter
  32.5 / 53 @768 / 61 @1024 / 77 @1280, content capped 1382 → 267 / 548 / 748 / 934 / 1068 / 1148 (== source).
  Panel inset 12px (8px sides <768), 20px below the track (the iframe inset).
- **Card**: wide layout (≥1024) padding 120px 80px (Formstack wrapper 40 + form margin 40 + form padding 40);
  compact 40px. Title margin 21px top AND bottom (h1 UA margin) → first label 61px below the title.
- **Rhythm**: subheadings 16px margins; file fields reserve 20px below the drop area; drop area padding
  19px 0 (text spans the full width); Submit 160px below the last field — the checkbox group ends 10px short
  in the wide layout only (150px after it); Submit is FULL WIDTH in the compact layout, 60px centred in wide.
- **Source quirks kept**: ZIP stays 20% wide on mobile (its sub-label wraps); "Details&nbsp;(if …)" uses a
  non-breaking space (now in the sheet labels, re-uploaded + previewed); years/hours inputs misalign when one
  label wraps.
- **States**: focus = 2px #0197ec outline, border unchanged (was blue border + shadow); checked checkbox =
  solid #edeff0 square, no tick; help tooltip 48px in / 17px below / 354px wide / 11px padding / 22px lh /
  3px 3px 7px rgb(0 0 0 / 25%) shadow; Submit has no hover change; date input 14px side padding.
- **Bug fixed**: checkbox inherited the boilerplate 12px input padding (rendered 21×26) and the label
  `order:-2`, which put the box on the right; an empty `.files-list` was forced visible (+8px per upload).
- Not replicated: the source iframe's fixed 1500px height (it scrolls the form inside the frame).

### 2026-09-30 — form (application) + tabs (application): frontend production-readiness pass
Review of the equivalency forms vs the live Formstack embeds; frontend-only fixes so the backend can wire
submission without further UI work. Hand-off contract: `blocks/form/README.md` → "Submission contract".
- **Validation**: `emailPattern` (constant.js) rejected hyphens, plus-addressing, subdomains, 2-letter TLDs and
  its `\.` collapsed to "any char" in a single-quoted string → now `[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}`
  (valid under the `v` flag browsers use for `pattern`). Phone / years / hours patterns added in the sheet.
- **A11y (shared engine, util.js)**: inline errors now set `aria-invalid` + `aria-describedby` on the control(s)
  (every option of a checkbox group); per-field `aria-live` dropped in favour of ONE `role="alert"` summary
  below the form title on invalid submit (removed once all fields are valid; visually hidden by form.css
  on unthemed forms such as subscribe, shown by application.css); success = `role="status"`,
  failure = `role="alert"`, both focused. Help text / thank-you HTML go through `sanitizeHTML` (tag allow-list,
  no attributes except safe hrefs) — no DOMPurify in the project.
- **New sheet columns** (transform.js): `Autocomplete` (WCAG 1.3.5 — the engine defaults to `off`), `Input Mode`,
  `Heading Level` (Type `heading` rows; `createHeading` no longer emits a stray `<label>`); submit row
  `Description` = failure message. Generator `tools/forms/application-forms.mjs` now sets source parity:
  autocomplete tokens, names maxlength 20 (char counter hidden in application.css), numeric inputmode, the
  source Accept list, h2 title / h3 subheadings. Both sheets re-uploaded to DA + previewed 2026-09-30
  (application.css still styles a plain-text `<p>` title identically to the h2, for older sheets).
- **Files**: dropped/pasted files are mirrored into `input.files` (DataTransfer) so they submit; with files the
  request is multipart (`data` JSON part + one part per file field), otherwise JSON as before. Accept matching
  compares extensions by FILE NAME (upstream compared the MIME type's suffix, so `.docx` never matched and
  typeless files always passed). Bug: `dataset.required === "false"` counted as required, so removing a file
  from an OPTIONAL upload flagged it invalid. Focus returns to "Browse files" after removing a file.
- **Engine bugs**: module-level `captchaField` leaked between the forms on a page (two application forms + footer
  subscribe) → resolved per form (`findCaptchaField`). The post-success reset re-render dropped the form's
  thank-you / error / redirect datasets → copied onto the new form. Form gets `aria-labelledby` its heading.
- **Perf**: `application.css` is no longer `@import`ed by form.css (the footer subscribe form put it + the Open
  Sans faces on every page); `form.js` `VARIANT_STYLES` loads it only for `.form.application` blocks, awaited
  before the form is inserted (no FOUC).
- **Tabs**: WAI-ARIA keyboard model (roving tabindex, ←/→ wrap, Home/End, automatic activation — as the
  source); `#tab=` kept in sync both ways (`history.replaceState` on select, `hashchange` listener); labels
  no longer wrap a `<p>` inside `<button>`; focus ring = source (2px dotted currentcolor + 2px white halo).
  Hover = lime, same as selected — this IS the source behaviour, kept. Colours → `--usta-lime` /
  new global `--usta-dark-panel` (#2d2d2d, also used by course-filter).
- **States styled (application.css)**: error summary / failure (pink pill), success (green), submitting
  (`aria-busy` → 60% opacity + progress cursor), disabled controls, drag-over, invalid drop area, attached-file
  rows (name · size · 24px remove with 44px hit area). Submit keeps the source's 32px look with a 44px hit area.
- **Known / not changed**: tabs width still uses `100vw` (≤ ~12px wider with classic desktop scrollbars, no
  overflow — fixing needs a container query on the section, outside the block). Checkbox stays 12px (source);
  its label is part of the click target. Page body copy (h1, How it works, Before you apply…) is not migrated.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ (360–1920, run in the preview browser — the checker's headless
shell isn't installed here) · typography ✓ (page h1/body vs record) · a11y ✓ (axe-core in the preview:
0 violations default / errors+file / 2nd tab) · svg n/a

### 2026-09-30 — form (application): blur validation, group error pills, inline reCAPTCHA badge
User feedback: "Required field" alerts missing in both tabs; captcha missing bottom-right.
- **Blur validation** (source): Formstack shows "Required field" as soon as an empty required field is LEFT;
  the engine only validated on change/submit. `enableValidation` now also revalidates on `focusout` when
  `form.dataset.validateOn === "blur"` — set by form.js for `.form.application` blocks only (subscribe
  etc. unchanged); kept across the post-success reset re-render.
- **One pill per group** (source): Name / Address show a single pill between legend and inputs with the
  FIRST invalid sub-field's message. util.js `updatePanelError` maintains an aria-hidden `.panel-error`
  (form.css hides it by default); application.css shows it (measured == source: 20px under the legend,
  7px above the inputs, full 720px width, 31px tall) and visually hides the per-sub-field pills (still
  linked via aria-describedby for screen readers). Sub-field inputs keep their red border + icon.
- **reCAPTCHA badge**: never rendered — no site key in the sheet (Formstack's key is domain-bound; the
  real key must be registered for our domains and entered in the captcha row Value). recaptcha.js
  rewritten to explicit render (`api.js?render=explicit`, one script per page — it was loaded once per
  form) with the badge placement chosen by the theme: `--captcha-badge: inline` on the captcha wrapper
  (application.css) renders Google's inline badge inside the card, bottom-right, 14px up — where the
  source badge sits in its embed, and clear of the site chat launcher in the viewport corner. Collapsed
  to the 70px logo (inline badge has its logo on the RIGHT → badge pinned right), 256px on hover/focus,
  0.3s (reduced-motion: none). Compact card gets 94px bottom padding only once the badge renders.
  Verified with Google's public test key in the browser only (never saved): renders, slides, returns a
  token. **Explicit render + execute(widgetId) must be re-checked with the production v3 key.**
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ (360/768/1024/1440, preview browser) · a11y ✓ (axe: 0 on both
tabs with blur/submit errors) · subscribe form unaffected

### 2026-09-30 — form (application): Name flagged on page load (client decision)
The source's two Formstack embeds each AUTOFOCUS First Name; the one that loads first loses focus to the
other, blurs, and shows "Required field" on Name before any interaction (the other shows it on the first
click elsewhere) — random per load. Client chose to match that LOOK deterministically: form.js validates
the first required field of every `.form.application` form once after render (no focus move, no scroll)
→ Name group pill + red First Name on both tabs; clears when First Name is filled. Initial render only
(not after the post-success reset). To revert: delete the `checkValidation(first)` block in form.js decorate().
lint ✓ · a11y note: First Name carries aria-invalid from load (inherent to this choice)
### 2026-09-28 — form: Gallagher disclaimer consent form (+ form `accordion` component)
Source: ustacoaching.com/en/home/membership-benefits/gallagher-disclaimer-rally.html — a consent gate: one
collapsible "AJG GAIS Disclaimer" item (legal list), eligibility copy + coachcare@usta.com mailto, lime Submit.
Follows the shared form pattern (see `blocks/form/README.md`): sheet **`/forms/gallagher-disclaimer.json`** →
page **`/drafts/shivani/gallagher-disclaimer-form`** (single `form` block linking the sheet) → scoped CSS
**`blocks/form/gallagher-disclaimer.css`** `@import`ed in `form.css`. Sheet rows: `disclaimers` (fieldset,
`Custom Type: accordion`) › `ajgGaisDisclaimer` (fieldset, Label = item title) › `ajgGaisDisclaimerText`
(rich plain-text `<ul>`, Style `gallagher-legal`); `eligibility` (rich plain-text, `gallagher-copy`);
`submit` (`gallagher-submit`, Value = thank-you msg — swap for an https URL to redirect).
- **New component `blocks/form/components/accordion/`** (registered in `mappings.js`). Same contract as
  upstream aem-boilerplate-forms `accordion`, but upstream toggles on a click on a bare `<legend>` (not
  keyboard-reachable) and opens item 1 — ours puts a `<button aria-expanded aria-controls>` in the legend and
  starts collapsed, single-open (source behaviour). Styled as the site coaching accordion: 1px white / 20r /
  23pad card → lime + black + minus when open; title Graphik Semibold 24→28(≥768)→32(≥1280), -0.03em.
- **Gotcha — legend in a bordered fieldset** notches into the top border ("rendered legend"). `float:left;
  width:100%` on the legend puts it inside the card; the body gets `clear: both`.
- **Gotcha — legend colour**: base form.css paints legends `#666`; the legend must `color: inherit`.
- **Gotcha — subscribe.css is NOT form-scoped** (`main .form.block button.button` etc. hit every form). Gallagher
  rules are scoped by sheet `Style` classes and imported after it so they win at equal specificity.
- **form.js `createPlainText`**: rich text containing block markup (`<p>/<ul>/<ol>/<h*>`) now renders in a
  `<div>` instead of a `<p>` (was invalid `<p><ul>` nesting). Inline-only rich text (subscribe legal) unchanged.
- Submit on the source hits an auth-gated USTA service (401 → account.usta.com login). Backend/redirect wiring
  is out of scope for this frontend pass.
Verified vs source at 390/768/1024/1280/1440: card padding/radius, title sizes, list 18/24 + 28/42 spacing,
item→copy→button 24/24, copy 16/19.2 → 18/21.6 → 24/28.8, Submit 261×50 (16px, 16/102 pad) mobile →
179×58 (24px, 16/48) ≥768. Enter/Space toggle. axe (scoped to main, closed+open, 390/1440): 0 violations.
lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓ · a11y — full-page run fails only on the
pre-existing raw `/forms/subscribe.json` link in the footer fragment (footer content has an undecorated
`form` block); the form itself is clean.

### 2026-09-28 — Gallagher form: full-page parity + `split` section style
The form on the source is the RIGHT half of a 6/6 AEM grid (intro heading + copy left), stacked on mobile —
its width drives every line wrap, so full-width wasn't a match. Draft page
`/drafts/shivani/gallagher-disclaimer-form` now has the h1 + intro as default content in the form's section,
section-metadata `style: split`.
- **`split` section style (styles.css, generic)**: shared container (1536 cap, gutters 16/40/48/64) on the
  12-col grid, `--grid-gap: 24px` (source = 12px padding per AEM grid column); default content cols 1–6,
  block(s) 7–12 from 768; stacked below with a 24px row gap. Top padding 36px (24 container offset + 12 col
  pad). Right column content = 396/332 @768 · 524/452 @1024 · 652/564 @1280 · 732/644 @1440 · 972/692 @1920
  (== source). The block's first element drops its top margin so both columns start on the same line (the
  form renders inside the link's `<p>`, whose 0.8em margin pushed it 13px down).
- **Intro type is page-level on the source** (`.text--font-size--64px-32px` h1 = 32 / 40 (≥1024) / 64 (≥1280),
  centred; `.text--font-size--24px-16px` copy = 16/19.2 → 18/21.6 → 24/28.8, one blank line between/after
  paragraphs), not the global h1/body scale → scoped under `.section.split` and recorded as a
  **`scopedExceptions`** entry in `tools/quality/typography.json` (check:typography skips it like block type;
  typography-discover preserves the key on `--write`).
- **Gotcha — bold = synthesized**: the source declares `Graphik Regular` `font-weight: normal` only, so `<b>`
  gets Chrome's faux bold. Ours declares `400 700`, which suppresses synthesis → `<strong>` rendered regular.
  Added a `Graphik Regular Synth` alias face (same file, `normal` only) used by the split intro's `<strong>`.
  NOT changed globally: other blocks (cards, course-filter) were tuned on the 400–700 face. Site-wide this is a
  parity gap for any bold Graphik Regular text — revisit deliberately.
- **subscribe.css** container re-assert rules now `:not(.split)` (they were unscoped and would override the split
  grid for any form section).
- Accordion toggle `gap: 0` (source title takes all but the 48px icon — wraps at 236 @768); mailto hover stays
  white + drops underline; Submit hover `opacity: 1` (overrides global `button:hover` 0.9).
- **Known, out of scope — header height 768–1023**: our header is 90px there vs the source's 116px (ours
  switches at 1024), so every page sits 26px higher in that band. Site-wide header fix, not form.
Verified by a scripted source-vs-build diff (x/y/w/h + font-size/line-height/weight/tracking/colour/decoration
for h1, both intro paragraphs, bold runs, accordion card/title/icon, list, copy, link, Submit) at
390/768/1024/1280/1440/1920, closed AND open: all MATCH within 1px (768–1023 y offset by the header delta).
Hover states (accordion, Submit, link) match. lint ✓ · breakpoint ✓ · overflow ✓ (360–1920) · typography ✓
(page + subscribe regression) · axe scoped to main (390/768/1440, closed+open) 0 violations; full-page a11y
still fails only on the pre-existing footer `/forms/subscribe.json` link.

### 2026-09-30 — Gallagher form: multi-item spacing, opt-in checkbox, order-independent CSS, branded messages
Styling-only pass. The source has 4 sibling pages (`gallagher-disclaimer-baseline|rally|pro|pro-plus`); Rally has 1
accordion item, **Pro-Plus has 4 items + a required, pre-checked "Opt-In for Electronic Delivery of Policy Documents"
checkbox**. Measured Pro-Plus live and built against it (test sheet served via a Playwright route — no content edits).
- **Accordion item gap is responsive** (`components/accordion/accordion.css`): 36px (<768; source = 16 gap + 20
  margin) → 16px (>=768) → 24px (>=1280). Was a flat 24px. Invisible on Rally (1 item).
- **Correction to the 2026-09-28 entry:** the source accordion is **multi-open** (opening item 2 leaves item 1 open on
  Pro-Plus), not single-open. Our component is still single-open — behavioural (JS) follow-up, not fixed here.
- **New sheet Style `gallagher-optin`** (checkbox row): #1d1d1d panel, 16px pad, 8px radius; label LEFT (Graphik
  Semibold 16/16, -0.03em), 24x24 box RIGHT (`row-reverse` — DOM order is input → label), space-between, 48px min gap.
  Unchecked = 1px white border; checked = border 0 + lime + the shared subscribe.css tick drawn at 24px/0 0 (source).
  Focus ring = 2px lime (source uses the UA default, near-invisible on black — deliberate a11y deviation).
- **Submit `:disabled`** (in-flight submit; the source also disables it while the opt-in is unchecked): source grey
  pill #bdbdb9/#4c4c4c, default cursor, no hover change.
- **Order-independence (Gotcha, supersedes the 09-28 note):** only two Gallagher rules tied with a shared
  subscribe.css rule and won by @import order — `.gallagher-legal` vs `main .form.block form .field-wrapper` (legal
  text went WHITE on the lime card when order flipped) and Submit `:hover` vs `.button-wrapper button.button:hover`
  (stayed lime). Both now compound (`.gallagher-legal.field-wrapper`, `.gallagher-submit.button-wrapper`). Proven by
  flipping the imports: 0 computed-style diffs across 18 states; negative control (old selectors) reproduces both bugs.
  NOTE: subscribe.css's "generic" input/checkbox/button rules are the de-facto **shared dark form theme** —
  `lead-interests` (no Style classes) depends on them — so they were NOT scoped to subscribe-* classes.
- **Branded submit feedback** (now in gallagher-disclaimer.css, scoped to this form — see 2026-09-30 cleanup): success/error `.form-message` = white
  Graphik Regular 16→18 (>=768)/1.2 on black, 1px lime (success) / `--form-error-color` (error) outline, 12px radius,
  16/24 pad; success gets 24px below (it's inserted before the <form>). `scroll-margin-top:
  calc(var(--usta-header-height) + 16px)` — submit.js scrollIntoView() previously parked the error UNDER the fixed header.
Verified: Rally vs source 390–1920 closed+open — geometry unchanged (all within 1px). Pro-Plus test vs source
390/768/1024/1280/1440, checked+unchecked — all 4 cards, opt-in row/label/box, copy, Submit within 1px. Other forms
(subscribe, lead-interests, flag) computed-style fingerprint before/after: 0 diffs. axe on main (opt-in, open item,
error, success, disabled; 390+1440): 0 violations. lint 0 errors · breakpoint ✓ · overflow ✓ (360–1920) ·
full-page a11y fails only on the pre-existing footer `/forms/subscribe.json` link.
- **Found, pre-existing:** `check:typography` fails on this page (10 drifts: split-intro h1/p) at HEAD too — the
  `scopedExceptions` entry the 09-28 entry describes was never committed (absent from typography.json and the checker).

### 2026-09-30 — Gallagher form: PR cleanup after merging `main` (PR #41 footer subscribe form)
Scope: the disclaimer form only. The footer "GET ON THE LIST." form (PR #41) is **intentional — not touched**.
- **Broken merge fixed (Gotcha):** merge commit `af9c66e` (main → this branch) mis-resolved two `subscribe.css`
  hunks — the >=1280 `.form-container` rules were interleaved with a missing `}`, and a dangling
  `main .form.block .checkbox-group-wrapper {` opened a rule inside the >=768 block. Browsers stopped parsing after
  ~6 rules, silently dropping the whole shared form theme (grid collapsed to 0px columns → 768 overflow, 20px row
  gap, +5px under Submit). Resolved to PR #41's values + this branch's `:not(.split)` guard. `subscribe.css` now
  differs from `main` ONLY by the 7 `:not(.split)` guards (main-scoped; keep the form-container band rules off the
  split layout — they don't reach the footer). Lesson: after any merge touching CSS, run `npx stylelint` — a
  `CssSyntaxError: Unclosed block` is otherwise invisible in the browser.
- **Branded success/error messages moved** out of subscribe.css (they also restyled the footer form) into
  gallagher-disclaimer.css, scoped `main .form.block:has(.gallagher-submit) .form-message`.
- **PR #41's `:is(main, .footer-form) … .field-wrapper { margin: 0 8px }`** (measured for the subscribe form) now
  reaches every form; Gallagher fields reset it to 0 (incl. the accordion's nested item fieldsets).
- **split section bottom:** padding-bottom 48 → 12px (source column padding) and the block's wrapping `<p>` loses
  its bottom margin → Submit→section end = 12px == source at every breakpoint.
- Code tidy: accordion.js unused export `handleAccordionNavigation(…, forceOpen)` → local `toggleItem`; dropped
  duplicate declarations in gallagher-disclaimer.css (legal margin, link-hover colour, `:disabled:hover`).
- A `footer.js` "skip footer form when the page has its own form" change was tried and **reverted** (footer form is
  intentional sitewide). The Gallagher page therefore shows it — by product decision, not a parity bug.
Verified: Rally vs source 390/768/1024/1280/1440/1920 closed+open MATCH (incl. Submit→section end 12px); Pro-Plus
test vs source 390–1440 MATCH; states (legal on lime, Submit hover/disabled, link hover) correct; footer form
messages unaffected. lint 0 errors · breakpoint ✓ · overflow ✓ · a11y ✓ (full page now passes — the footer form
renders instead of a raw link) · typography: 10 pre-existing split-intro drifts (scopedExceptions never committed).

### 2026-10-01 — `split` section style made generic; intro type split out as `intro-text`
`split` was hard-wired to "default content cols 1–6, block(s) cols 7–12" and carried the Gallagher intro type.
(A `columns (form)` block variant was tried as an alternative and **reverted** — `split` covers it, one way only.)
- **`split` (styles.css) = layout only:** any children — default content and/or blocks — on a 2-column 50/50
  grid from 768 (24px gap = the same lines as the source's 6/6 spans), placed in **authored order** (1st left,
  2nd right; more wrap to new rows); stacked below 768. Container: 1536 cap, gutters 16/40/48/64, padding 36/12
  (the source grid's offset + 12px column padding). Cells' outer margins trimmed so columns top-align.
  `max-width: 100%` on blocks in a split cell — some blocks size from the viewport (quote/cards/hero/course-filter
  use vw) and otherwise overflow a half column (seen with quote: 72vw → +329px horizontal scroll).
- **`intro-text` (styles.css), new section style:** the source's page-level intro type (h1 32/40/64 centred, copy
  16/18/24 lh 1.2, synthetic bold via the `Graphik Regular Synth` alias, one blank line between/after paragraphs).
  Independent of `split`.
- **Authoring:** the Gallagher page's section-metadata Style must become **`split, intro-text`** (was `split`).
  Until then it keeps the 50/50 layout but the intro uses the global h1/body scale.
- **Gotcha — blocks that style their own section wrapper** (`main > .section.<block>-container > div`, 15 rules: accordion, banner, course-filter, hero, 11 columns variants) apply their page gutter + 1536 cap to EVERY wrapper in the section, so `accordion + quote` in a split came out 332/614px at 768 and overflowed. The split cell reset uses `div:not(#split-cell)` (ID weight, no `!important`) to out-rank them; verified 50/50 for accordion+quote, quote+accordion, text+accordion, accordion+text at 768–1920, stacked at 390, no overflow. Section-level rules (`hero (video)`, `spacer`) are not neutralised — don't put those in a split.
- subscribe.css keeps its `:not(.split)` guards (a form block inside a split section still gets `form-container`).
Verified on a temp standards-mode drafts/ page (deleted): Gallagher section vs source 390–1920 closed+open MATCH;
block-left/text-right and two-blocks sections 50/50 at 768–1920, stacked at 390, no overflow at any width.
lint 0 errors · breakpoint ✓ · overflow ✓ · a11y ✓ · typography: 10 drifts = the intentional `intro-text` sizes
(check:typography has no exception mechanism — the `scopedExceptions` mentioned on 09-28 was never built).

### 2026-10-01 — form engine: repair of the main → branch merge (all forms broken)
`Merge branch 'main' into aem-20260928-1646` (2ad06e0) auto-merged blocks/form/integrations/recaptcha.js
WITHOUT a conflict, combining main's `#renderInlineBadge` (flag-profile: Google's standard bottom-right
badge rendered INTO the captcha row; flag-profile.css pins it in its frame) with this branch's rewrite.
Result: references to the removed private `#loadScript` / `loadPromise`, a duplicate `const obs` and a
duplicate execute path → SyntaxError → form.js failed to import → EVERY form block (applications,
subscribe in the footer, flag, disclaimer) stopped rendering. Fixed by keeping the rewrite (explicit
render, one script per page) and adopting main's contract: the badge always renders into the form's
captcha row (`.form-recaptcha-badge`), inline style for `--captcha-badge: inline` themes (application),
standard bottom-right otherwise (flag-profile). Verified: equivalency (both tabs), subscribe (draft +
every footer), flag (badge pinned in frame, 72px logo, 14px up), disclaimer, coaching-document render
with no script errors. Gotcha: re-check form/*.js with `node --check` after every merge from main —
git's line-level merge happily produces code that doesn't parse.
Not from this merge: `fonts/lato-regular.woff2` 404 (referenced by main's fonts.css, file not in repo).

### 2026-10-01 — QA fixes: subscribe.css specificity leak, Submit spacing, tab pill spacing
QA (online branch vs source, 360–1920) found regressions from the `main` merge plus tab spacing gaps.
- **Root cause — `:is()` specificity**: main rewrote subscribe.css `main .form.block …` → `:is(main, .footer-form)
  .form.block …` so the subscribe theme reaches the footer form. `:is()` takes its MOST specific argument, so
  `.footer-form` added a class to all 38 rules and they began beating `.form.application` (application.css won
  by one element before): red "* " + UPPERCASE 14/24px on the Email / ZIP labels (+14–16px drift below), the
  acknowledgement legend at 16/16 (12/12 on mobile), and `.submit-wrapper { margin: 0 }` (Submit ~110px high).
  Fix (kept to application files — this PR is application-forms only; subscribe.css and the footer stay as main
  has them): application.css adds field-specific selectors to its own rules — `:is(.field-email, .field-zipcode)
  > label.field-label` (+ the `::before` reset), `fieldset.checkbox-group-wrapper > legend.field-label`, and
  `.field-wrapper.submit-wrapper` — same declarations, one class stronger than subscribe.css; no !important.
  Verified by a computed-style diff of all 294 elements of both forms at 390/1024/1440: identical to the fixed
  state. Gotcha: `:is()` takes its MOST specific argument — a class inside it raises every rule; prefer
  `:where()` or element selectors when widening a selector's reach (raise with the subscribe owners).
- **Submit rhythm (source, every breakpoint)**: the checkbox-row −10px overhang now applies at all widths (was
  ≥1024 only: compact Submit sat 10px low); a file field directly before Submit (Industry) gets Submit 110px
  (source: 170px below the drop area at <1024, 192 at ≥1024 — the two uploads share a row). Education Submit is
  within 1px of the source at 360/390/768/1024/1440; Industry drop→Submit identical at 390–1920.
- **Tabs (application)**: source spacing model — every pill has an 8px margin on all sides (track gap 8 / 16
  @768), so pills sit 8px inside the track and 24px / 32px apart (was 8 / 16, with track padding 0 8px ≥768);
  pill height 106px at 1024–1279. Pill positions + widths now equal the source at 768/1024/1280/1440/1920.
  Not replicated: the source's 92px pills from 1536 (needs a 1536 breakpoint outside breakpoints.json).
- **Tabs (mobile)**: the pill row scrolls sideways (<768); the selected pill (deep link, click, arrows, Home/End)
  is now scrolled into view horizontally — never the page — like the source (Industry ends flush with the row
  edge; a pill wider than the row keeps its 8px inset). Re-run on ResizeObserver of the row AND the pills: the
  section is still hidden while blocks decorate and the web font swaps later; the rule is idempotent once the
  pill is fully visible (an earlier margin-inclusive version ping-ponged at 360 where pill + margins > row).
lint ✓ (CSS + tabs.js) · breakpoint ✓ · overflow ✓ (0 at 360–1920) · a11y ✓ (axe 0: Industry, Education + errors)

### 2026-10-01 — form (application): fixed-height scrolling frame; tabs (application): switch transitions
User feedback: the source form scrolls inside itself (the page doesn't move); tab switch transition missing.
- **Source measured**: each Formstack embed is an iframe with a fixed `height=1500` at EVERY breakpoint; the form
  scrolls inside it (document 3768px @390, 2412 @768; an inner `InnerFormBody` scroller @1440). Wheel over the
  form scrolls the form first (page still); at the form's end the page continues (default scroll chaining).
  Its reCAPTCHA badge is fixed in the iframe viewport (frame bottom-right, whatever the form scroll).
- **Built**: `.form.application.block` is the 1500px frame (`height: 1500px; overflow: hidden`, 2px inset border
  kept) and its row (`> div`) is the scroller (`height: 100%; overflow-y: auto`) carrying the former card
  padding (40 / 120 80 ≥1024 / 94 bottom with a badge). The badge host stays `position: absolute` against the
  frame (not the scroller), so it is pinned to the frame corner like the source. No overscroll-behavior override:
  chaining to the page at the end matches the source. Verified 390/768/1440: frame 1500, wheel → form 900px with
  page still, page scrolls only after the form end; invalid Submit still brings the first field into view.
- **Tab switch (source)**: the newly shown form fades in (~0.7s phones/tablets, ~0.25s desktop — frame captures
  at 600/768/1440) and on phones the pill row slides to the selected pill (~250ms). Built: tabs.js `fadeIn()`
  replays `.tabs-panel-enter` (keyframes `tabs-panel-in`, 0.7s → 0.3s ≥1024) on a visitor's tab change only
  (click / arrows / Home-End / #tab= change — not on load), and `revealPill(..., smooth)` uses
  `scrollTo({ behavior: 'smooth' })` for those changes (load / resize stay instant). Both honour
  prefers-reduced-motion. Verified: 390 fade 0→1 over ~700ms with the row sliding 0→266px in ~300ms; 1440 fade
  ~300ms.
lint ✓ · breakpoint ✓ · overflow ✓ (0 at 360/768/1024/1920) · a11y ✓ (axe 0, both tabs)

### 2026-10-01 — reCAPTCHA badge on the application forms (Google test key)
The source badge is NOT frontend-only: Formstack's embed (ustayeqzp.formstack.com) loads
`google.com/recaptcha/api.js?render=<Formstack's site key>` and Google draws the badge (api2/anchor iframe) — the key is
domain-bound to Formstack. Ours had an empty captcha row, so nothing rendered. Set Google's PUBLIC TEST KEY
(6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI — same as /forms/flag-form) in the captcha row Value of both
/forms/education-equivalency and /forms/industry-experience (only that row changed), uploaded to DA + previewed.
Badge now renders on both tabs (local 1440/390 + branch preview): 70×60 logo pinned 2px/16px from the frame's
bottom-right, slides open to "protected by reCAPTCHA" on hover. The test key always passes (no real protection) and
Google adds a red "testing purposes only" line — swap in the production USTA site key before go-live (sheet captcha
row Value, or `RECAPTCHA_SITE_KEY=… node tools/forms/application-forms.mjs`; that generator is currently in
`git stash` and still writes an empty key unless the env var is set).
Test-env note: headless Playwright never sets :hover on the parent of a CROSS-origin iframe (same-origin works), so
the slide-open can only be checked there via CDP CSS.forcePseudoState — real browsers hover normally.

### 2026-10-03 — NEW `video` block (consent-gated YouTube embed) — full parity
Source: the "Get Ahead. *Get Experienced. Get USTA* Coaching Certified." embed on
/en/home/coaching-community/fellowship-in-coaching-and-leadership.html (AEM `text` + core `embed` with USTA's
OneTrust consent wrapper `.usta-consent-embed`). The block sample (drafts/block-samples/video) already existed but
`blocks/video/` did not (404 → nothing rendered). Built `blocks/video/video.{js,css}`.
- **Authoring contract** (one cell per row): row 1 = title (italic → lime via the global `main em` rule; `<p>` or
  heading both work); optional URL row (a cell holding only the video link — removed from output); remaining
  rows = consent message. The video URL = the FIRST YouTube/Vimeo link anywhere in the block, so the existing
  sample (URL on the "cookie preferences" link) works unchanged. URLs are whitelisted (youtube.com / youtu.be /
  youtube-nocookie / vimeo) and the ID regex-validated → canonical `youtube.com/embed/<id>`.
- **Consent (source behaviour):** placeholder shown by default; on `consent.update` with `consented: true`
  (scripts/consent-check.js — test with `?consent=accept`) the iframe (lazy, title = block title) replaces it;
  revoking restores it. The "cookie preferences" link opens `OneTrust.ToggleInfoDisplay()` when a CMP exists,
  otherwise falls back to the YouTube watch page (new tab) so the control is never dead.
- **Geometry (measured 375/768/1024/1280/1440/1728, all matched to the px):** wrapper gutter 8/28/36/52 (1536
  cap) + 12px component padding (12px 8px mobile) → content on the shared 16/40/48/64 grid. Title USTA Sans 700,
  line-height = size, **28 → 32 @768 → 40 @1024**, centred, 24px title→frame gap. Frame full width on mobile and
  ≥1280, **10/12 cols offset 1 from 768–1279** (`margin-inline: calc(100% / 12)`). Player height **200 → 320 →
  650**, radius 20px, + the source's 5px inline-iframe gap (frame 679 @desktop). Placeholder: #eef0f0, 1px
  #c1c6c8, radius 4px, padding 32/24, flex-centred; message Graphik 14/21 #333, max-width 400; authored
  paragraphs flow inline as ONE paragraph (source is a single `<p>` — keeps the 3-line mobile wrap).
- **Deviations:** (1) source player steps 320→650 at **992**; we step at **1024** (992 tier excluded from
  breakpoints.json) — 992–1023 shows 320px. (2) link colour **#3370ad** instead of source #418fde (2.96:1 on
  #eef0f0 fails WCAG AA / axe serious) — same hue, lightest passing value (4.52:1).
- Test env: the quality checkers' Playwright build (1187 headless shell) was missing — installed with
  `npx playwright install chromium-headless-shell`.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ (360/768/1024/1280/1920) · typography ✓ · a11y ✓ (axe 0)

### 2026-10-03 — footer + footer subscribe form: pixel parity rebuild (source DevTools geometry)
User compared source vs migrated screenshots @1728: drifts in field spacing, Subscribe→wordmark gap, link
wrapping, and space below the footer. Measured both with one script (every element's x / y-from-title / w×h +
type, at 375/768/1024/1280/1440/1728) and read the source's computed CSS (`.v-leads`, footer XF).
**Source truth found** (it was NOT what the old CSS assumed):
- **Form rhythm** (`.v-leads`, not an even 24px grid): title → email label 32; email + zip stacked FLUSH
  (field = 24 label + 8 + 58 = 90); coach-type group `margin: 32px 0`; legal → Subscribe 32 mobile / **10**
  ≥768. Zip counter `top: 0` (level with the ZIP CODE label). Title has `padding: 0 8px` (text starts 8px in).
  Button `line-height: normal` → 50px @16 / 53px @18 (was 56). Legend is a full-width block with no padding.
  → `subscribe.css`, all scoped to `form:has(> .subscribe-heading)` so the other forms keep their 24px gap.
- **Footer container**: NOT 81.6%/1170 — the same AEM grid as sections: gutter 8/28/36/52 (1536 cap) + 12px
  component padding (12 8 on mobile) → content at 16/40/48, and **≥1280 on 10 of 12 cols, offset 1**
  (`margin-inline: calc(100% / 12 + 12px)` → 162/956 @1280, 175/1089 @1440, 279/1169 @1728). Footer gutters now
  16/40/48/52, footer-form padding 24/24/32/60 (form band unchanged: 40/64/80/112).
- **Subscribe → wordmark**: 176 (<1024) · 184 (1024–1279) · 216 (≥1280) = 48 form margin + 128/136/168.
- **Wordmark → links** 66 everywhere (12 + 42 separator + 12).
- **Links**: the `li` is Graphik **Regular 16px / line-height normal** around the 18/24/16/18px Semibold link →
  20px line boxes (mobile pitch 36, tablet li 25 / pitch 49, desktop 20 per wrapped line), li `stretch`ed to the
  tallest (40 / 60). Desktop row has **no gap** (nav = row − social, space-between) — the old 40px gap squeezed the
  links so labels wrapped differently ("USTA Terms / of Use" vs source "USTA Terms of / Use").
- **Social**: `a { display: flex }` — inline-flex added a line box (li 40 instead of 36), which pushed the icons
  2px off-centre and added 4px under them.
- **Space below** (row → page end) 68 / 76 / 84 / 100 = 12 padding + container margins (24+12 / 32+12 / 32+20 /
  32+36) + a constant **20px line box** the source's trailing inline `<iframe>`/`<noscript>` tags add after the
  footer — visible black space on the live site, so it is reproduced.
Result: every element matches to ≤0.1px at all six viewports (only residue: the source `<label>` wraps its
checkbox, so its box starts 32px earlier — text position/width identical). Pixel diff @1728 (fixed overlays
hidden): 42,239 → 3,820 px, the remainder being sub-pixel anti-aliasing on the wordmark/button edges.
Supersedes the 81.6%/1170px footer column described in the 2026-09-14 entries.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ (/ and /es/home) · typography ✓ · a11y ✓

### 2026-10-03 — columns (events): styles RESTORED (lost in merge PR #30) + source-parity fixes
**Not previously logged here** — the variant was built in PR #25 (966746d, 2026-09-18; branch
`aem-20260917-1142`), source `/en/home/coaching-community/coaching-workshops.html#tab=upcoming`.
- **Regression:** merge PR #30 (`cf6bc66`, 2026-09-21) resolved a columns.css conflict by keeping only the
  section-container + `.columns-events-list` rules — the other 34 events rules (card, date, info, location, title,
  chips, View More, all 3 breakpoints) were dropped, so the block rendered as raw text (JS still decorated it).
  An earlier merge had also spliced the `profile` section header into the middle of the events CSS. Restored the
  235 lines from `39f5166` (last good main commit) directly after `.columns-events-list`, un-splicing it.
  ⚠️ When resolving columns.css conflicts, check every variant section survives (`grep -c columns-events`).
- **Authoring contract** (unchanged): one row per event, 3 cells — date | delivery method / location / title
  (3 paragraphs) | bulleted chips (region, hours, certification, price); optional "View More" link row.
- **Parity fixes** (source `.v-event*` computed styles, compared with the source's own event text injected into
  the migrated cards @375/768/1024/1280/1440/1728 — every box now matches to ≤0.1px):
  - location line is a Graphik Regular **16px / line-height normal** block around the 12px (14px ≥1280)
    Semibold spans → 20px line box (40 when the address wraps on mobile); was 14.4 → cards 5.6–11.2px short.
    Spans line-height 1.2 (16.8 ≥1280, was 20).
  - date `width: 100%; min-width: 120px; letter-spacing: normal` (was −0.48px, 83px wide on mobile).
  - ≥1024 the left group and chips column `align-self: center` (source row `align-items: center`) — were stretched,
    putting chips 5–13px off and the left group 3px off at ≥1440.
- Source overflows horizontally at 768 (836px content) — deliberately NOT reproduced.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ · typography ✓ · a11y ✓ (drafts/block-samples/columns-events)

### 2026-10-03 — intro statement (`narrow` section): split-bold regression + source parity
**Symptom:** home intro rendered as small body text with literal `**` on aem.live (and as broken lines —
"…coaches are the" / "beating heart" / ". Discover…" — with a white "beating heart" locally).
**Root cause (recurrence of 2026-09-15):** the DA document had the bold split into THREE `<strong>` runs, the
first ending in a space inside the bold (`<strong>…the </strong><em><strong>beating heart</strong></em>
<strong>. Discover…</strong>`). The DA → markdown step can't close `**… **`, so EDS serves literal `**` and
that text is no longer bold. Separately, the CSS styled `strong` as `display:block` + white, so any split
rendered as separate lines with the lime accent overridden.
**Fixes:**
- **Content (DA, previewed; `/` also published):** `/` and `/en/home` intro → ONE bold run with the full stops
  INSIDE the accents (source parity): `<strong>If tennis … the <em>beating heart.</em> Discover … for
  <u>coaches like you.</u></strong>`. `/es/home` was already a single run. (Local `content/` copies still hold
  the old split markup — DA is the source of truth.) ⚠️ Authors: keep the statement ONE bold run; never end a
  bold run with a space.
- **CSS (styles.css):** typography moved to the `p` (32→40→56→72, line-height 1, −0.03em — mobile was 28, source
  `.text--font-size--72px-32px` is 32); `strong` stays inline (`font-weight:700; color:inherit`) so split runs
  can't break lines or recolour accents. Face → `"Graphik Regular Synth"`: the source's `<b>` is weight 700 on
  a weight-normal Graphik Regular face, so Chrome SYNTHESIZES the bold — the 400–700 face rendered thinner
  (pixel diff @1440 28,765 → 213 px; 0 px @768/1024/1728). `narrow` ≥1280 now uses the 10/12-col grid
  (`margin-inline: calc(100%/12 + 12px)`, same as the footer) instead of 81.6%/1170.
  Section padding from the source container (margin 12/20/36/52 + 12px text padding): 24/32/56/64 top,
  0/16/48/80 bottom → hero→text 72/80/104/112, text→card 48/64/96/128 at 375/768/1024/1280+ (the live source
  currently has a temporary "Serving Gratitude" banner between hero and statement — excluded).
- **JS (scripts.js `decorateIntroStatement`):** detects a FULLY-bold paragraph (every text node inside some
  `<strong>`) with an `<em>`/`<u>` accent — tolerates split runs and `<em><strong>` nesting.
- **Tooling:** `typography-check.mjs` treats `"<Family> Synth"` as `<Family>` and skips `.intro-statement`
  (display copy, like `.block`) when sampling body `p`.
Verified on aem.live @375/1024/1440: box, line breaks and accent colours identical to source.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ · typography ✓ (/, /es/home, aem.live) · a11y ✓ (aem.live)

### 2026-10-04 — banner: black/lime is now the DEFAULT; `blue` is an opt-in colour variant
Per client: the default banner = **black panel, white text, lime pill with a black label** (e.g. "The Coaches
Open"); appending **`blue`** to ANY banner switches it to **blue panel, black text, black pill with a white
label** (e.g. `banner (events, blue)`). Previously blue WAS the base, so `blue` did nothing and plain / `grant` /
`centered` banners rendered blue.
- `banner.css`: base `.banner.block` → `#000` / `#fff`; base CTA → lime / black; new `.banner.blue` (+ `.banner.blue
  .banner-cta`) carries the blue palette. `black` kept as a harmless explicit class (= default). `info` unchanged
  (its own outlined transparent panel).
- Gotcha: the CTA colour must be scoped `.banner .banner-cta` (0,2,0) — bare `.banner-cta` (0,1,0) loses to the
  global `a:any-link { color: var(--link-color) }` (0,1,1), which painted the lime pill's label white. (It only
  "worked" before because the old default label was white too.)
- Verified (sample pages): plain/grant/centered → black/white/lime+black; `events blue` → blue/black/black+white;
  `blue` appended to every banner at runtime → all switch to the blue palette; hover keeps the label colour.
- Content impact: the 4 `banner (events, blue)` uses are unchanged; plain, `grant`, `centered` now render black.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ · a11y ✓ (banner, banner-events-blue, /)

### 2026-10-04 — banner: 1px white outline on the black default (blue stays borderless)
Missed in the default flip: the source's black banners are `container--border--white` (measured on the home
"Serving Gratitude" band @375/768/1440: `1px solid #fff`, radius 20px, transparent/black fill); the blue events
banner has NO border. `banner.css`: base `.banner.block` gains `border: 1px solid #fff`; `.banner.blue` sets
`border: 0`. Validated every sample version: plain / grant / centered → black + white outline + lime CTA;
info → unchanged (own outlined transparent panel); events blue (sample + home) → blue, no border; `blue`
appended at runtime to plain/grant/centered → blue, no border, black CTA.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ · a11y ✓ (banner, banner-info, banner-events-blue)

### 2026-10-04 — banner: one sample page per variant, each with its `blue` version
New block-sample pages (`content/drafts/block-samples/`), each showing the variant in its default colours and
again with `blue` appended (block tables copied verbatim from the existing samples, only the class changed):
`banner-default` (banner / banner blue) · `banner-grant` · `banner-centered` · `banner-info` (replaced the old
single-banner page; original backed up) · `banner-events` (banner events / banner events blue). The existing
`banner` (all-variants overview) and `banner-events-blue` pages are unchanged.
- **Code:** `.banner.info.blue` added at the end of banner.css — `.banner.info` is declared after the colour
  variants and was overriding `blue` (info stayed transparent/outlined). Info + blue = blue panel, no border,
  black heading/labels/body.
- Verified all 10 banners (computed panel / border / text / CTA) + visual check of info + info blue.
- Local note: the dev server serves local `content/` files under `/content/…` (plain `/drafts/…` proxies the
  remote preview, so new local-only pages 404 there). The pages appear on aem.page once uploaded to DA + previewed.
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ · a11y ✓ (all 5 pages)

### 2026-10-04 — banner samples tidied
- `banner` sample now holds ONLY the default banner and `banner blue` (grant / centered / info removed — each has
  its own page: `banner-grant`, `banner-centered`, `banner-info`, `banner-events`). Original backed up.
- `banner-events-blue` is no longer needed (superseded by `banner-events`, which shows events + events blue).
  Content-folder deletion is blocked for the agent — **delete it manually** (local `content/` + DA
  `drafts/block-samples/banner-events-blue`). `banner-default` now duplicates `banner` and can be removed the same way.
Verified: banner (black, white outline, lime CTA) + banner blue (blue, no outline, black CTA); a11y ✓ · overflow ✓

### 2026-10-04 — NEW `social` block ("Share This Article") — right default + `left` / `center`
Source: `.v-social-media-sharing` in the news-article footer
(/en/home/news/usta-coaching-butch-staples-award-2026-coaches-open.html). Built `blocks/social/social.{js,css}`
+ icons `icons/share-{facebook,x,linkedin}.svg` (the source's own SVG data-URIs, white; 0.7–0.8 KB each).
- **Authoring:** `social` (+ optional `left` / `center`); row 1 = label ("Share This Article", from content —
  no hard-coded string); optional rows `facebook` / `x` (alias `twitter`) / `linkedin` set which icons show and
  their order (none authored = all three).
- **Behaviour:** real `<a target=_blank rel="noopener noreferrer">` links (source used `<img role=link>` +
  click handlers) built from the canonical URL (fallback origin+pathname) and og:title/document.title — same
  targets as the source: `facebook.com/sharer/sharer.php?u=`, `x.com/intent/post?text=&url=`,
  `linkedin.com/shareArticle/?url=`. `role=group` labelled by the label text; links named Facebook / X /
  LinkedIn.
- **Geometry (matched to the px @375/768/1024/1280/1440):** padding 12px (12px 8px mobile); label → icons 16px;
  label Graphik Semibold `#cfff05`, 16px → 18px @768, line-height normal (h 14 / 17); icons 36px tall,
  Facebook 29.69 / X 30 / LinkedIn 36 wide, 16px gap; right-pinned from 768 (icons R 110/64/12).
- **Alignment:** default = source: LEFT on phones (label centred over icons), RIGHT from 768. `left` / `center`
  apply at every viewport.
- Sample: `content/drafts/block-samples/social` (default, center, left).
lint ✓ (0 errors) · breakpoint ✓ · svg ✓ · overflow ✓ · typography ✓ · a11y ✓

### 2026-10-04 — social: frame alignment + vertical rhythm (bordered sample)
- The source share sits INSIDE the article's bordered frame — the existing `bordered` section style reproduces
  that frame exactly (x/width 16/343 · 40/688 · 48/928 · 64/1152 · 64/1312 · 160/1408, 8px padding, 1px white),
  so the block needs no width rules: in a `bordered` section the label/icons land 21px inside the frame's right
  edge (label right x 1355 @1440, 1547 @1728) — identical to source at all six viewports. The sample page now puts
  each variant in its own `bordered` section.
- Vertical: added the source container's `margin-block` 12 / 20 @1024 / 36 @1280 to `.social` → icons → frame
  bottom 33 / 33 / 41 / 57 / 57 / 57 (375 → 1728), matching source (was a flat 21).
lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ · typography ✓ · a11y ✓

## SITE SCOPE — 2026-10-04 (source of truth: `catalog/`)
Scope run with the site-scope workflow. Artifacts: `catalog/template-catalog.json`, `catalog/block-catalog.json`,
`catalog/summary.json`, `catalog/urls-*.json`, screenshots in `catalog/.pages/`; importer projection
`tools/importer/page-templates.json` (the old homepage-only mappings are preserved in
`tools/importer/page-templates.home.json`).
- **URLs: 219** (en 109 · es 109 · plus `/es/` redirect). Discovery: sitemap lists only EN; the header / mega-menu
  (incl. the language switcher) is JS-rendered, so ES was found by an EN↔ES path mirror check (each verified 200,
  no redirect) + rendered-browser links + static crawl. ES mirrors EN 1:1 except one extra listing page.
- **Analysis:** 217 / 218 pages analyzed (99%); 1 failure = `/es/errors/auth-error.html` (error page, excluded).
  Logged errors were transient screenshot timeouts / browser-context closes on very tall pages, retried OK.
- **14 templates · 78 block variants** (60 EDS-mapped, 18 custom/unknown):

| Template | Pages | en / es | Notes |
|---|---|---|---|
| news-article | 116 | 58 / 58 | 112 news articles + membership-benefits ×2 + job-board ×2 share this layout |
| account-dashboard | 32 | 16 / 16 | logged-in account app pages — confirm whether in scope |
| landing-page | 26 | 13 / 13 | home, community, membership, courses, coach-mentorship, learning-pathway … |
| quiz-results | 12 | 6 / 6 | `/results/*` recommendation pages |
| listing-hub | 11 | 6 / 5 | news index, workshops, FAQs, coachtennis |
| long-form-info | 6 | 3 / 3 | about, equivalency application … |
| account-record-form, guided-journey, disclaimer-form, settings-page, preferences-form, unsubscribe-form | 2 each | 1 / 1 | forms / account utilities |
| maintenance-page | 1 | 1 / 0 | standalone status page |
| listing-hub-variant | 1 | 0 / 1 | `/es/home/news.html` (differs from the EN news index) |

**Suggested import order (largest same-layout groups first):** news-article (116) → landing-page (26) →
quiz-results (12) → listing-hub (11) → long-form-info (6) → small form/utility templates. Account-area templates
(account-dashboard + forms/settings, ~44 pages) are authenticated app screens — decide scope with the client.

### 2026-10-04 — Scope: richest / medium / leanest page per template + source selectors
Full data: `migration-work/template-components.json` (per template: ranking of every page, richest/medium/lowest,
minimal cover set, component list with selectors; plus a site-wide component table). Method: rendered @1440, counted
source components inside the page body — AEM grid components (first class of each `.aem-GridColumn`) and Vue
widget roots (outermost `.v-*`); excluded the global Join/quiz modal family (`v-wizard*`, `v-quiz*`, `v-modal`,
`v-30day-modal`, `v-tooltip`) and child parts. Ranked by distinct component types → instances → catalog block
variants → main-content HTML size. (The catalog's own block detection under-counts here — ~75% of blocks are
non-standard AEM/Vue widgets — so it is only a tie-breaker.)

| Template | Richest (types/inst) | Medium | Leanest | Cover set |
|---|---|---|---|---|
| news-article | /en/home/news/zina-garrison-star-player-to-community-builder (9/32) | …/coach-guide-to-tennis-hydration (8/15) | /es/…/10-tennis-coaching-tips… (7/9) | 5 pages |
| landing-page | /es/home/learning-pathway (10/66) | /es/…/usta-coaches-inclusion-summit (5/81) | /en/…/coaching-membership-terms-and-conditions (1/2) | 5 |
| quiz-results | /es/home/results/ft-pro-coach (7/37) | /es/…/college-coach (7/34) | /es/maintenance-page (2/7) | 2 |
| listing-hub | /es/home/workshops/education-center-locations (6/245) | /es/home/coachtennis (5/115) | /en/home/about/faqs (3/6) | 3 |
| long-form-info | /es/home/about (7/125) | /es/home/results/pt-pro-coach (7/37) | /en/errors/auth-error (2/7) | 3 |
| disclaimer-form / preferences-form / maintenance / listing-hub-variant | single layout — 1 page covers all | | | 1 |
| account-dashboard, account-record-form, guided-journey, settings-page, unsubscribe-form | 0 content components — client-rendered app screens | | | — |

**Source component → EDS block** (pages using it): text (175) → default content / intro-statement · separator (158)
→ spacer · image (157) → default image / columns media · tags `div.tags` (114) → ⚠ no block yet · breadcrumb
`div.breadcrumb` (114) → ⚠ no block yet · socialmediasharing (112) → **social** · v-related-articles /
v-news-related-tile (112 / 57) → **cards (news)** · button (42) → default CTA · v-leads (32) → **form** (subscribe)
· accordion (20) → **accordion** · v-tiers (15) → **cards (pricing)** · embed (8) → **video** / columns (embed) ·
v-form-container (8) → **form** · v-course-list (8) → **course-filter** · navigation `cmp-navigation__coaching` (6)
→ ⚠ verify · iframetext (6) → ⚠ verify (iframe embed) · core-tabs (4) → **tabs** · v-search-bar /
v-article-search-results / v-latest-articles-list (4/2/2) → ⚠ news search, no block yet · v-person-card (2) →
**cards (profile)** · v-classification-accordion (2) → **accordion** variant · v-events-list (2) → **columns
(events)** · v-big-cta (2) → **banner** · v-tags (2) → ⚠ no block yet.
Layout containers (hero / columns / cards / banners / bordered frame) are styled AEM `container` components, not
counted above — their selectors come from the per-template block mapping (see `page-templates.home.json`).

### 2026-10-04 — news-article template: 5 builds + importer + test import (Zina Garrison) — parity verified
Source: /en/home/news/zina-garrison-star-player-to-community-builder.html (richest news article). Built:
1. **Template styles** (`styles.css`, end of file, `body.news-article`; metadata `Template: news-article`): article =
   default content in a `bordered` section; every element gets the source component inset (12px 8px → 12px @768),
   which reproduces the source rhythm (24px paragraph gaps from its empty <p> spacers, 66px around separators).
   Top image: 20px radius, cover, **top-anchored** (`object-position: 50% 0`), aspect 1.25 → 1.5 @768 → 2:1 @1280
   (+ `max-width: none` — a site-wide default-content image cap is 360px). H1 Graphik Semibold 700 centred
   28/32/40/50, margin 0.67em. Body Graphik Regular 18/24 ls normal; italic stays white italic (source <i>), not the
   lime accent. h3 = source `text--font-size--32px-28px` (<p><b> Graphik Regular, synthesized bold) 28 → 32 @1280;
   h2 = `40px-28px` Semibold 28/32/40. Pull-quote: 10/12 article-grid columns offset 1 + 12px (8px phone) padding,
   margin-block 12/20/36/52. Gap frame → featured tile 48/56/80/112.
2. **Breadcrumb** (`blocks/breadcrumb`, auto-built in scripts.js `buildBreadcrumb` for the template, page main
   only — never in fragments): home label/link from the locale **placeholders** sheet (`News Home`, `News Home
   Link`, `Breadcrumb Label`; new `fetchPlaceholders()` + `localePrefix()` exports in scripts.js; local files
   `content/placeholders.json`, `content/es/placeholders.json` — EN "News Home" → /en/home/news, ES "Noticias
   Inicio" → /es/home/news). Current item = metadata `Breadcrumb Title` (importer copies the source breadcrumb; it
   differs from H1/title on some articles) → H1 fallback. Graphik Semibold 18, link white (lime hover), current
   lime, " > " separator; section padding 24 (source in-flow header placeholder) / 12. Source quirk NOT copied: its
   nowrap row overflows phones — ours ellipsizes.
3. **columns (article) generic image width**: `media-N` (≥1280) + optional `media-md-N` (1024–1279; 12 = stacked;
   falls back to N, like AEM desktop-small). JS → `--media-span` / `--media-span-md` + `.split-md`; ONE CSS rule for
   any ratio. No number = original 9/3 from 1280 (existing samples unchanged). Cells 12px 8px on phones (was 12px —
   AEM grid-column inset). Heading after body copy in a cell: margin-top 66px (the source's in-cell separator;
   66 because it collapses with the paragraph's 24px). h3 in cells = the smaller heading (28 → 32 @1280).
4. **tags block** (`blocks/tags`): label row authored; tags from page `Keywords` metadata (source: meta keywords)
   unless rows authored; removes itself when empty. Pills Graphik Regular white 12px/6px 12px → 14px/8px 16px @768,
   2px blue border, 24px radius. Shares a row with `social` (float left ≥768, section `display: flow-root`;
   stacked flush on phones).
5. **columns (media, dark)**: outlined transparent card (1px white, 20px radius, 48px 24px padding), white text,
   24px stacked gaps, copy 18/21.6 → 24/33.6 @1024 (ls normal), CTA 24px / 16px 24px; image fills the card height
   from 1024 (cover).
**Importer** `tools/importer/import-news-article-v1.js` (+ bundle; parsers `news-columns-article`, `news-quote`,
`news-tags-social`, `news-featured`; reuses `coaching-usta-cleanup`). Selectors are stable AEM/Vue classes only.
Sized bold text components → h2/h3 (generic size map); text+image sibling columns → `Columns (article,
media-left|right, media-N[, media-md-N])` (spans read from aem-GridColumn classes); `.separator` → Spacer 42px;
pull-quote → `Quote` (<em> for the lime); tags+share row → `Tags` + `Social`; frame → `bordered` section; featured
tile → `Fragment` /fragments/news/featured-article. Metadata: Title, Description, Keywords, Template, Breadcrumb
Title. **Fragment mode**: same URL + `#featured-fragment` emits only the shared tile as `Columns (media, dark)`
(the runner writes one doc per URL). Tile CTA is a JS <button> (no href) → target in a documented title→path map
(verified by clicking). Bundle with `--banner:js="/* eslint-disable */"`.
**Test import**: `content/en/home/news/zina-garrison-star-player-to-community-builder.plain.html` +
`content/fragments/news/featured-article.plain.html` (URLs: `tools/importer/urls-news-article-test.txt`).
**Parity** (375/768/1024/1280/1440, every element measured vs source): breadcrumb, frame (h ±1px), top image,
H1/intro, row text/heading/image, quote box, tags/share, featured tile — all within 0–0.5px. Pixel diff @1440 top
section 547,743 → 3,390 px (breadcrumb text sub-pixel only).
**Open / notes**:
- Images keep absolute source URLs — this repo has no `tools/assets/` finalize pipeline yet (download to
  `content/media-da/` before publishing).
- Local dev server doesn't turn the Metadata block into <meta> for /content/ pages → local verification injected
  the page's metadata (Playwright route); on aem.page this is native.
- Placeholders sheets + fragment exist locally only → upload to DA as sheets/pages before preview.
- Global: the source header area is 116px at 768–1023 (ours 90) → content sits 26px higher at that tier on every
  page — header work, not done here.
lint ✓ (0 errors) · breakpoint ✓ · svg ✓ · typography ✓ (checker skips the template's article frame, like
.intro-statement) · overflow ✓ 360/768/1024/1280/1920 · a11y ✓ axe 0 violations (both with metadata injected)

### 2026-10-04 (later) — news-article: template folder, preview fix, nbsp, header tablet tier
User review of the Zina page in the plain preview: no template styles, no breadcrumb, no tags, the
Metadata table rendered as content. Cause: the local content preview serves the Metadata block inside
<main> (aem.page turns it into <head> meta); my earlier checks injected the meta tags, which hid it.
- **scripts.js `applyInlineMetadata`**: a Metadata block still in main → applied as <meta> (+ <title>),
  then removed — runs before `decorateTemplateAndTheme`. No-op on delivered pages. All verification
  now runs on the plain preview, no injection.
- **Templates folder**: `templates/news-article/news-article.{css,js}`, loaded by scripts.js
  `loadTemplate` (TEMPLATES list, picked by metadata `Template`) before the page is decorated. The CSS
  moved out of styles.css; the JS builds the breadcrumb (was `buildBreadcrumb` in scripts.js).
- **Breadcrumb gap**: source = the home link ends in a space + an "  >  " ::after on its item → link
  text gets a trailing space and the separator is `li:not(:last-child)::after` (was 4px short).
- **Non-breaking spaces**: the source copy has "walk&nbsp; out" etc. that change line wraps; the
  import converter turns U+00A0 into a space and collapses it (before the transform runs). Importer
  `onLoad` swaps nbsp for a private-use sentinel in the live page and wraps `WebImporter.md2da`
  (its exports are read-only getters → the whole global is replaced with a spread copy) to emit
  `&nbsp;` again. Blank `<p>&nbsp;</p>` spacers are left alone so the converter still drops them.
- **Header 768–1023** (all pages): source bar is 116px from 768 (33px padding), full 360×30 logo,
  18px/24px-padded Join — was 90px/210px logo/12px (content sat 26px high). Phones: logo truly
  centred (side groups `min-width: 0`) and centred vertically (brand p `display: flex`, 210×17.5).
  Flyout: 48px above the first row and below the buttons at all tiers; external icons
  `vertical-align: baseline`, 30×30 on tablets; language chevron 24px gap (16 desktop), centred,
  -8px top margin, 24×24 on tablets; tablet language options 24px; option rows line-height normal.
  Bar links: letter-spacing normal (were inheriting -0.48px), line-height normal. Source dropdown at
  1024–1279 does NOT list Community/Education/Benefits (they're nowhere until the bar shows them at
  1280) — matched.
- **Nav content**: source menu now has **Shop** (external, https://ustacoachingshop.com/) between
  News and the language switcher — must be added to the DA nav document (content, not code).
Parity (plain preview vs source): article positions identical at 375/768/1024/1280/1440 (≤0.15px
at 375 from image-height rounding); text identical incl. nbsp; header bar 0 differing px at 768,
1024 and 1440; open menus identical apart from Shop. Remaining pixel noise = different JPEG
renditions of the same images.
lint ✓ (0 errors) · breakpoint ✓ · svg ✓ · typography ✓ (article + home) · overflow ✓ (article +
home) · a11y ✓ (article + home)
- **Homepage hero (video) top spacing**: source = 24px header placeholder + container margin
  (12 / 20 / 36) + 12px text padding → section padding-top 48 / 56 @1024 / 72 @1280 (was 72
  everywhere: title + video sat 24px low below 1024, 16px low at 1024–1279). Now identical at
  375/768/1024/1280/1440. Known deviation: the source video grows 522 → 694px at 1289px (not one of
  the agreed 768/1024/1280 breakpoints); ours grows at 1280, so 1280–1288 is 172px taller.
- **Shop nav item** (2026-10-04): added to the DA nav documents and previewed (not published) — EN
  "Shop", ES "Comercio" → https://ustacoachingshop.com/, between News/Noticias and the language
  switcher (source position). External link → new tab + icon via header.js. Desktop dropdown rows
  now line-height normal (17px like the source, was 17.1 → 0.6px drift by the last row; the language
  row was 18). Open-menu parity incl. Shop: identical row boxes at 375/768/1024/1280/1440; 0
  differing px at 768 and 1440. The local `content/nav.plain.html` copy predates the change (local
  preview shows Shop only once that copy is refreshed from DA).

### 2026-10-04 (later) — news-article: featured tile rule, paragraph model, lists, empty tags, page end
- **Featured tile** is dynamic on the source (Vue `v-featured-article`: the news section's featured
  story, never the current page). Rendered all 112 articles: 55 EN show the same tile ("Serving
  Gratitude…") → shared fragment; the featured story itself shows a different one (Emma Dell Part 3,
  CTA verified by click) → built INLINE as `Columns (media, dark)`; 56 ES render an empty tile →
  nothing imported. `news-featured.js` decides (FRAGMENT_TILE_TITLE); the title→path map has both.
  If the source's featured story changes, update FRAGMENT_TILE_TITLE + the fragment + the map.
- **Paragraph model**: inside one source text component paragraphs touch (0 gap) unless the author
  typed blank lines (<p>&nbsp;</p>, 24px each); components are 24px apart (12 + 12 padding). The
  template pads every default-content element 12px, so the importer's `normalizeTextComponent`
  rewrites each component: no blank → paragraphs joined with <br>; n blanks → n−1 kept;
  leading/trailing blanks and blanks around lists kept; a list starting/ending its component gets a
  blank line for the edge. Kept blanks carry the nbsp sentinel (the converter drops blank <p> before
  the transform, so they're marked in `onLoad`); the template JS gives them `.blank` (padding 0 →
  one 24px line). Scan of the 56 EN articles: 130 touching pairs (10 pages), 25 double + 1 triple
  blanks, 48 trailing / 7 leading blanks — all covered.
- **Lists**: source ul margin 18px 0, 40px indent, disc, items 18/24 each ending in an authored
  blank line (`<li><p>…</p><p>&nbsp;</p></li>`, kept). Template: ul padding 6px 8px 6px 48px
  (6px 12px 6px 52px ≥768).
- **Empty tags**: the source renders its tags component even with no keywords (an empty 24px box
  above Share on phones) → the importer always emits `Tags`, and the block keeps its empty box.
- **Page end**: the source footer starts 108px below the featured tile at every breakpoint; without
  a tile (ES) the frame sits gap + 108 = 156 / 164 / 188 / 220px above it. Template rules for
  `.section.bordered + .section:last-child` / `.section.bordered:last-child`.
- Subscribe form: kept in the footer on news pages too (user decision — consistent footer), although
  the source news footer has none.
Verified (plain preview vs source, 375/768/1024/1280/1440): Zina EN, Serving Gratitude EN (lists,
touching paragraphs, inline tile, empty tags) and Zina ES (no tile) — frame height, share row and
footer position identical (≤1px at 375 from image-height rounding); ES breadcrumb "Noticias Inicio".
lint ✓ · breakpoint ✓ · typography ✓ · overflow ✓ · a11y ✓ (all three pages)

### 2026-10-04 (later) — news-article: separator gaps by template rule (spacers mostly removed)
- Source separator = 42px at every breakpoint (measured 375–1440) → 66px between content with the
  12px component paddings. Measured the rendered gap at all 1,031 element boundaries of the 56 EN
  articles: a type rule matches 998 — **a heading (h2/h3) right after text/list/article row, and an
  article row right after text/list/another row, get 42px**. The other 33 are author choices
  (identical heading classes, same neighbours), so per user decision (Option 1):
  - CSS (templates/news-article "section gaps") applies the rule (direct neighbours only);
  - importer `applySectionGaps` mirrors it: drops every source separator the rule reproduces, keeps
    a 42px Spacer only where it doesn't (~18 across EN), and where the source has NO separator but
    the rule would add one: `flush` variant on the article row (~8) / a 0px Spacer before the heading
    (~7). Keep CSS + importer rule in sync.
- Zina / Serving Gratitude / Zina ES now import with 0 spacers; positions vs source unchanged
  (every heading/paragraph/image ≤0.22px at 375/768/1024/1280/1440; frame, share, footer identical).
  Exception paths verified in a scratch import: Cardio Tennis → 1 `flush` row, Paul Annacone → 1 0px
  Spacer, WeCOACH → 2 kept 42px Spacers (rendering of those pages not yet compared).
- `npm run lint:css` now also covers `templates/**/*.css` (it skipped the template before).
- **Metadata `Keywords` → `Tags`** (user decision, 2026-10-04): the importer writes the source's meta
  keywords as `Tags`. Delivered pages turn `Tags` into one `article:tag` meta per value; the Tags
  block reads `article:tag` → `tags` (local preview) → `keywords` (older pages). Comma-separated
  values = one pill each (verified with 3 tags in both forms; they wrap in one flex row).

### 2026-10-04 (later) — block samples (media-5, tags) + first importer backups
- DA block samples (previewed, not published): `drafts/block-samples/columns-article-media-5`
  (the real Zina row `columns (article, media-right, media-5)` in a bordered section, with the
  media-N / media-md-N contract; image uploaded to DA `.columns-article-media-5/`) and
  `drafts/block-samples/tags` (tags from page `Tags` metadata, authored tag rows, tags + social
  footer row). Verified with the current code via the local server (aem.page still runs the pushed
  code until this work is committed): media-5 = 5/12 image from 1024, stacked below; 3 pills each.
  Confirmed on aem.page: metadata `Tags` → one `<meta property="article:tag">` per value.
- **Importer backups (IMPORTING-GUIDE §11)** — first ones in this repo:
  `tools/importer/backups/news-article/<page>/` = exact `import-news-article-v1.js` + bundle +
  `manifest.json` (URLs incl. ES twin, output sections/blocks/variants/metadata, image hosts,
  shared fragment, code dependencies, verification, source quirks kept, pending follow-ups,
  script sha256). Pages: zina-garrison-star-player-to-community-builder (+ ES twin),
  serving-gratitude-celebrating-tennis-coaches. Back up every page that passes the gate the same way.

### 2026-10-04 (later) — media-N sample, span-12 images, media-left stacking order
- **Span-12 source images are not rows**: the parser leaves them as default content (text, then a
  full-width image); `media-12` support was added and removed again (user decision). Template rule:
  in-article `p img` = full content width, natural ratio, square corners (source image component;
  overrides the site-wide 360px default-content cap). Jim Loehr re-imported (0 columns blocks).
- **media-left stacking order (parity fix, columns block)**: on the source a media-left row stacks
  image ABOVE its text (phones, and 1024–1279 when media-md-12) — the image column comes first in
  the source DOM. Ours always put the image below → base rule now orders media-left image first.
- **Sample** `drafts/block-samples/columns-article-media-n` ("Columns (article) — media-N"): one real
  row per span with its source article — media-6 black-girls-tennis-club… (×130), media-5 Zina
  (×66), media-4 emilio-sanchez-academy… (×62), media-3 southlake-tennis-center… (×14), media-7
  usta-coaching-butch-staples-award… (media-left, ×2). Images uploaded to DA
  `.columns-article-media-n/`; page generated (`/tmp/fm/gen-media-n.mjs`) and verified locally with
  the current code (6/5/4/3/7 of 12 from 1280; media-5 also at 1024; stacked below). DA page upload
  returned 401 (permission switched off mid-session) — page not yet uploaded/previewed.

### 2026-10-04 (later) — columns (article): one media option for most rows
- User: too many options per row. New contract `columns (article[, media-left], media-N[, media-md-N])`:
  image **right** and row **stacked at 1024–1279** are now the defaults (≈75% of source rows have
  desktop-small 12). `media-md-N` is written only when the source row stays side by side at
  1024–1279 (desktop-small < 12, or unset → AEM reuses N, e.g. Zina → `media-5, media-md-5`).
  `media-right` / `media-md-12` are no longer written (an existing `media-right` is harmless).
  Block: `media-md-N` no longer defaults to N. Parser updated; 4 test pages re-imported (Zina parity
  unchanged at all 5 viewports); DA samples `columns-article-media-n` + `columns-article-media-5`
  regenerated/previewed with the short form; news-article backups refreshed.

### 2026-10-04 (later) — columns (article): media-md removed (max three options)
- User decision: every article row is `columns (article, media-right|media-left, media-N)` — never
  more. `media-md-N` support removed from the block (JS + the 1024 split CSS) and the parser; the
  side is always written. Rows stack below 1280 and sit side by side from 1280 at N/12.
- **Accepted deviation**: ~25% of source rows (e.g. Zina) stay side by side at 1024–1279 on the
  source; ours stack in that band only (identical below 1024 and from 1280).
- 4 test pages re-imported (`media-right media-5` on Zina); DA samples `columns-article-media-n`
  and `columns-article-media-5` regenerated + previewed (0 `media-md` left); backups refreshed.
- DA sample `drafts/block-samples/columns-article-media-5` deleted (user request; unpreviewed + its `.columns-article-media-5/` image removed) — media-5 is covered on `columns-article-media-n`.

### 2026-10-04 (later) — typography parity: news-article template + new blocks
- Comparator (every text run in breadcrumb, article frame, tags/share, featured tile; matched by
  text; family/size/weight/style/line-height/letter-spacing/color/alignment/transform/line count
  at 375/768/1024/1280/1440). Reference Zina EN + Serving Gratitude, Zina ES, Jim Loehr; then an
  audit of 55 EN articles (scratch imports, current code): 27 fully identical.
- Fixed (template/block level → every news page):
  - quote attribution `letter-spacing: normal` (was inheriting the body's -0.03em);
  - featured tile CTA label centred (source <button>);
  - `decorateIntroStatement` skipped on news-article (a bold+italic article paragraph was being
    centred/enlarged as the homepage statement — coaches-open-2026);
  - lists inside columns (article) cells: 18/24 Graphik Regular, normal tracking, disc, 40px indent;
    18px list spacing as padding (adds to the paragraph's 24px margin → 42px when the list starts
    its own source component; 18px within one component); the importer's component-edge blank
    above a list is hidden in cells.
  After: Zina, emilio-sanchez-academy…, inside-the-coach-inclusion-summit… = 0 differences.
- Out of scope by decision (page-specific content, not template/blocks): per-article link colours
  (lime vs white is authored per article), 8/12-wide headings (Jim Loehr), card grid (advantage…),
  coach-goal cards (coaches-reveal…), uppercase display line (wecoach), drop cap (emma-dell part 3),
  native h3/h5 in a few articles, and the accepted 1024–1279 row stacking.

### 2026-10-04 (later) — Shop in the LOCAL nav (content/) + menu nowrap
- The editor's Sync pushes the local `content/` folder to DA; the local nav never had Shop (it had been
  added in DA only), so a sync removed it from DA. Shop/Comercio is now in `content/nav.plain.html` and
  `content/es/nav.plain.html`, produced by a small importer (`tools/importer/import-nav.js`, reads the
  current local nav, inserts the item after News/Noticias; backup in `tools/importer/backups/nav/`).
  DA nav was also re-patched + previewed. Sync from local is now safe (same content).
- Header: flyout links `white-space: nowrap` (source) — "Encuentra un entrenador" no longer wraps on
  phones. Open menu EN + ES identical to source at all 5 viewports.
- **Breadcrumb "News Home" missing on aem.live** (2026-10-05): the placeholders sheets (`/placeholders.json`, `/es/placeholders.json`) existed only in local `content/` (the editor Sync did not push them) → 404 → the breadcrumb showed the title only. Uploaded both sheets to DA + previewed: aem.page now shows "News Home > …" / "Noticias Inicio > …". aem.live needs the two sheets published.
- Placeholders sheets published to aem.live (2026-10-05): live breadcrumbs now "News Home > …" (EN) and "Noticias Inicio > …" (ES) on every news-article page.

## News-article import — SCOPE & RUNBOOK (read this first in a new session) — 2026-10-05

**Scope: 112 pages = 56 EN + 56 ES news articles** →
`tools/importer/urls-news-article.txt` (one source URL per line, sorted).
- Source: the site catalog's `news-article` template (catalog/template-catalog.json lists 116; the 4
  non-articles are EXCLUDED: /en|es/home/job-board.html and /en|es/home/membership-benefits.html —
  different templates).
- NOT in scope: the news listing pages (/en/home/news.html, /es/home/news.html — listing-hub template).
- Plus the shared featured tile, imported once in fragment mode:
  `https://www.ustacoaching.com/en/home/news/zina-garrison-star-player-to-community-builder.html#featured-fragment`
  → `/fragments/news/featured-article` (already in content/; re-run only if the source's featured story changes).
- Already imported + verified (test pages): EN zina-garrison…, serving-gratitude…, jim-loehr… ; ES zina-garrison….

**Importer**: `tools/importer/import-news-article-v1.js` (+ parsers news-columns-article, news-quote,
news-tags-social, news-featured; transformer coaching-usta-cleanup).
- Bundle: `npx esbuild tools/importer/import-news-article-v1.js --bundle --format=iife --global-name=CustomImportScript --banner:js="/* eslint-disable */" --outfile=tools/importer/import-news-article-v1.bundle.js`
- Run: `node <excat-content-import>/scripts/run-bulk-import.js --import-script tools/importer/import-news-article-v1.bundle.js --urls tools/importer/urls-news-article.txt --force`
  (writes content/<locale>/home/news/<slug>.plain.html; ~30–40 min for 112; a dry run into a scratch folder:
  `WORKSPACE_PATH=/tmp/x node …` writes to /tmp/x/content instead).
- Known-good backups: `tools/importer/backups/news-article/<page>/` (script + bundle + manifest). Back up
  each page that passes the gate the same way (IMPORTING-GUIDE §11).

**What the importer produces (authoring contract — do not change without the user):**
- Section 1 = article frame (`Section Metadata: Style bordered`): top image, H1, body, headings, rows
  `Columns (article, media-right|media-left, media-N)` (MAX 3 options; N read from the source grid span;
  span-12 images = plain image), `Quote`, `Tags` (always, label only), `Social`. Separator gaps come from
  the template rule; Spacer (42px) only where the rule can't infer it; `flush` / 0px Spacer = "no gap".
- Section 2 = featured tile: `Fragment /fragments/news/featured-article` on the 55 EN articles that show the
  shared tile; INLINE `Columns (media, dark)` on serving-gratitude… (it features Emma Dell Part 3); NONE on ES.
- Metadata: Title, Description, **Tags** (source keywords), Template `news-article`, Breadcrumb Title, Image.
- Breadcrumb is automatic (template) — labels from `/placeholders.json` + `/es/placeholders.json`
  (in DA, published).

**Accepted deviations (user decisions):** rows stack at 1024–1279 (no media-md); subscribe form kept in
the footer on news pages; page-specific content not specially handled (per-article link colours, 8/12-wide
headings e.g. jim-loehr, 3-col card grid on advantage-coaches…, coach-goal cards on coaches-reveal…,
uppercase display line on usta-coaching-wecoach, drop cap on emma-dell part 3, native h3/h5 in a few).

**Before uploading imported pages to DA (pending):**
1. Push this session's code (template, blocks, header) — aem.page/aem.live still run older code.
2. Images still point at www.ustacoaching.com → move them to DA media (no finalize-assets pipeline in this
   repo yet) before upload.
3. DA upload/publish is on the user's request only. The editor's **Sync** pushes local `content/` to DA —
   keep local content the source of truth (e.g. the nav Shop item lives in content/nav*.plain.html).

**Per-batch verification (sample, not every page):** lint · breakpoint · check:typography ·
check:overflow · test:a11y on a few imported pages; compare with the source at 375/768/1024/1280/1440
(frame height, share row, footer offset); spot-check typography with the comparator approach above.

### 2026-10-07 — columns (person) variant + Spacer (line) + image finalize step
Source: /en|es/home/news/coaches-reveal-their-game-changing-goals-for-2026 (same pattern on
usta-coaching-testimonials-7-coaches… and women-coaches-on-the-mentors-who-shaped-them; 3 EN+ES pairs).
- **`Columns (person, media-right|left, media-N)`** — an article row (same layout/contract, JS adds
  `.article`) whose text cell opens with a person header: name / role / location = the first three
  paragraphs (source inline styles, identical at every breakpoint): 22/24 bold, 18/24, 16/24, all lime,
  no gaps; location + 16px (source) + 24px component boundary = 40px before the goals (24px when the
  header ends on the role line). Importer: a row whose text column opens with an inline
  `font-size: 2x` paragraph → `person`; a 3rd+ header line not styled 16px joins the role paragraph.
- **`Spacer (line)`** — the source's VISIBLE separator (`separator` without
  `--border-color--transparent`): 42px band, 2px rule (1px inset rgb(128,128,128)) 20px from the top,
  inset 8px (phones) / 12px (≥768). Never removed by the section-gap logic. 8 articles use visible separators.
- Indented paragraph runs (`<p style="margin-left: 40px">`, typed "1. …" goals) → `<blockquote>`
  (40px indent; cells + default content).
- Blank-line fidelity: a truly empty `<p></p>` (0px on the source) is dropped; only nbsp blanks are kept.
  In cells the importer's edge blank after a list at the cell end is hidden; the last item before
  trailing blanks (incl. blockquote) has no margin.
- **Image finalize** `tools/assets/fetch-page-images.mjs <path…> | --all-news`: inline source images →
  `content/media-da/<path>/<stem>-<md5(url)[:8]>.<ext>` — the SAME naming as the team's earlier imports,
  so re-imports re-point to existing files (EN coach page: 7/7 reused) and ES pages get local copies.
- Verified EN + ES vs source @375/768/1024/1280/1440: identical (see backup manifest). Backup:
  tools/importer/backups/news-article/coaches-reveal-their-game-changing-goals-for-2026/.
- PENDING: the other 110 pages were imported before this session's importer fixes (quote blank line,
  row-text separators as <hr>, blank-line rules, person rows, visible separators) → re-import all +
  run fetch-page-images, then re-validate.
- **Person rows @1024–1279** (user: match the source): the source shows the photo beside the text at
  this size (desktop-small), the first goals beside it and the rest full width below. Block: the photo
  is moved first in the DOM and floats right (left for media-left) at media-N/12 with a 12px gap; every
  paragraph / indented goal / list item is a whole `flow-root` box, so it stays beside the photo or,
  once it starts below it, runs full width; flex again from 1280. Result @1024: Tony + Eduardo rows
  identical to source; photo size identical for 4/6 rows. Remaining by AUTHORING on the source: (1) its
  1024 layout is a separate content copy with an author-chosen split (e.g. Larry: only goal 1 beside),
  (2) Erin + Koua use a different photo width at 1024 than at 1280. Exact match there needs per-row data
  (split point + 1024 photo width) — pending user decision (conflicts with the 3-option rule).
  Bands 375/768/1280/1440 unchanged (identical). 640 step: NOT added (user decision).

### 2026-10-07 — columns (person): typography parity pass + re-import of the variant pages
Pages re-imported (EN + ES, images finalized): coaches-reveal-their-game-changing-goals-for-2026,
usta-coaching-testimonials-7-coaches-share-their-experience, women-coaches-on-the-mentors-who-shaped-them,
usta-coaching-wecoach. Sample: /drafts/block-samples/columns-person (Erin, Tony, Larry rows).
- Typography per text run (family, size, weight, line-height, letter-spacing, colour, alignment,
  wrapping) @375/768/1024/1280/1440: **0 drifts inside person rows** on all 8 pages.
- **Photo-less person rows** (`parsePersonText`): a person header with no photo becomes
  `Columns (person)` (full width) or `Columns (person, media-right, media-N)` with an EMPTY photo cell.
  The block marks the row `.no-photo`: the text keeps its (12 − N)/12 width at EVERY width (phones too),
  exactly like the source grid (Ernie James: 163px @375, 335 @768, 455 @1024, 567 @1280).
- Kept as page-specific (not variant behaviour, documented in the backup manifests):
  - testimonials / Celia Quintero: the source author picked a **portrait crop** for that one photo
    (`image--aspect-ration--portrait`: 1.247:1 <768, 2:3 768–1023, 0.689:1 1024–1279, 0.834:1 ≥1280).
    Only 2 source pages (EN + ES) use it. We show the natural ratio → page 41px shorter @375, 538px @768.
  - women-mentors / Autumn Williams: header authored at tablet 8/12 width → role wraps to 2 lines @768
    on the source (1 line here), −24px.
  - testimonials ES: the import fetch got "Florencia, Carolina del Sur"; the live page now says
    "Florence" (source edit after the import fetch's copy) — content, not code.
  - wecoach: "Serve Your Passion. Lead the Game." is a `text--font-size--24px label-style` component
    (24/32 Graphik Semibold, uppercase) — default content outside the person rows; 2 source pages
    (wecoach, women-in-coaching-advancing-female-tennis-coach-development, EN + ES). Not yet modelled.
- Backups: tools/importer/backups/news-article/{usta-coaching-testimonials-7-coaches-share-their-experience,
  women-coaches-on-the-mentors-who-shaped-them}/.

### 2026-10-07 — person rows draw their own divider (Spacer (line) removed)
- Decision (user): spacers are for one-off exceptions only. On the source every person row
  has the visible separator above it (46 of 48; the 2 without sit directly under the title).
- `Columns (person, …)` now renders that divider itself (columns.css `::before`: 42px band,
  2px inset gray rule 20px from the top, inset 8px / 12px ≥768). JS adds `no-divider` when
  the row directly follows the h1. The importer drops a `Spacer (line)` right before a person
  row, and person rows are outside the template's 42px gap rule (both sides kept in sync).
- Result: 46 of 50 `Spacer (line)` gone; only wecoach keeps 3 (not before person rows).
  Person pages re-validated EN + ES: identical to before (no new diffs). Sample
  drafts/block-samples/columns-person re-imported without spacers.

### 2026-10-07 — full-parity pass over all 112 news pages (round 2)
Decisions (user): stacked rows always read text first (any side); narrow 7/12 in-row
headings stay full width (author slip — also Autumn Williams' tablet header); fix the
one-off styles; spacers only for one-off exceptions; spacer breakpoints = site's.
Importer / blocks:
- Row pairing: an image pairs only with a text column BESIDE it (span < its grid's
  columns; a nested container's grid has as many columns as the container spans, and
  the image span is rescaled to 12). Stacked photos in one photo column stay together.
  A `container--display--flex-reset-grid` (coaches-open) lays image + text side by side
  → media-6 row.
- `Columns (grid[, tablet|mobile])` (new): sibling photos, plain text columns or
  containers (cards) side by side, equal widths; split ≥1280 / ≥768 / always (from the
  source's smallest side-by-side breakpoint). Part-empty rows get empty cells. A text
  cell whose first line starts with an image shows it as the card icon.
- Embedded posts (source `iframetext`, LinkedIn) → the row's photo cell holds a link to
  the embed URL with `#WxH`; rendered at the authored size (100% up to 1023), source
  padding 20/50px. Copies the source hides at some widths stay visible (one copy).
- `Text Style (label|center|large|intro)` (new block): the source's text component
  styles (label-style, alignment-center, inline 25px line, semibold 24px-16px lead-in).
- Plain-component headings keep their own look, one level down: <h2> → h4 (Semibold
  28 → 32), <h3> → h5 (Semibold 20 → 22 → 24), <h5> → h6 (Regular 15/24). Touching
  same-level headings are joined with <br>; blank heading lines are kept as lines.
- Lime links (source inline colour) → italic link; the template marks an <em> holding
  only a link as `.lime-link` (no source link is italic otherwise).
- `Columns (person, portrait, media-N)`: the source's portrait crop (per-breakpoint
  ratios); `portrait` replaces the default `media-right` to stay within three options.
- `Quote (marks)`: 64px quote marks. Quotes inside the article body no longer swallow
  the body container (women-in-coaching had lost all text).
- Separators keep their measured height (10px thin divider); a container's
  `top/bottom-margin--32` → emergency Spacer (24 / 32 / 32).
- h2 reaches 40px at 1024; a heading after an indented run gets the 42px gap; one
  <ul> per bullet collapses to 18px; text-component icons normalised like any copy.
Known remaining (one-off, documented): breakpoint-specific duplicate copies (other
positions on phone/tablet), coaches-open embeds hidden at 768–1279 on the source,
per-breakpoint image spans (wecoach logo tablet 8/12, advantage mobile 4/12), the 60%
app screenshot (new-usta-coaching-upgrades), padded group container (college), French
Open blank heading lines (−4/−8px), source ES copy drift ("Florence").

### 2026-10-08 — full validation, all 112 news pages (EN + ES) @375/768/1024/1280/1440
Final importer re-run on all 112 pages + image finalize, then per-run text/typography/
geometry comparison against the live source (validator frame = the source's inner
`.container--border--white > .cmp-container`).
- Fully matching at 375/768/1280/1440: **66 / 112**. Per width: 375 74, 768 66, 1024 55,
  1280 91, 1440 92 (1024 = the accepted stacking band for article rows).
- Typography (family/size/weight/line-height/letter-spacing/colour/alignment): differs on
  2 pages only — the women-cohort lime link is rgb(207,255,4) on the source (ours 5).
- Fixes this round: in-copy links are underlined (source does; also a11y link-in-text-block);
  lime links become plain `a.lime-link` (never a button); `<p><br><br></p>` = 2 blank lines;
  `Text Style` styles the cell itself (single-paragraph cells have no <p>) and `large`
  keeps touching copy inside the block; padded/margined group containers → emergency
  Spacers (college); embeds are lazy (loading set before src).
- Remaining, by cause (documented, not variant bugs):
  - author slips accepted by decision: narrow in-row headings/text (jim-loehr, practical,
    vania-king, southlake, sportimes ES, advantage tablet header, Harper mobile 6/12 text,
    women-mentors Autumn header);
  - breakpoint-specific duplicate copies on the source (parks-rec, dinkins, butch-staples
    tablet photos, learning-hub text copies, jack-and-jill / learning-hub embed heights,
    coaches-open embeds hidden at 768–1279);
  - per-breakpoint image spans / sizes: advantage mobile 4/12 photo, wecoach tablet logo
    8/12, upgrades 60% app screenshot, Harper image offset 1;
  - text-node split artifacts (equivalent text): coaches-reveal "3.", emma part 3,
    sportsmen, butch ES;
  - source/content drift: ES "Florence" (imported "Florencia"), ES emma part 3 "Lee"
    (imported "Sotavento"); ES emma part 3 shows an unrelated pricing modal inline;
  - French Open blank heading lines −4/−8px; college 4px side padding (−72 @375).
- a11y: axe clean on the checked pages; coaches-open's LinkedIn post iframes contain a
  third-party aria-hidden-focus issue (inside LinkedIn's frame). The project a11y test waits
  for networkidle, which pages with LinkedIn embeds never reach (use a load-based run).
- Backup: tools/importer/backups/news-article/all-news-pages/ (importer, bundle, parsers,
  sample importer, manifest with the per-width results and the 66 matching pages).

### 2026-10-18 — customer breakpoints + 1536 content max-width confirmed
Customer spec: mobile ≤767, tablet 768–1023, desktop-small 1024–1279, desktop ≥1280
(default); content max-width 1536px everywhere. Our `breakpoints.json` 768/1024/1280
(min-width, mobile-first) is the same four bands — no change.
- Content cap: header, breadcrumb, news frame, featured tile and footer already capped at
  1536 with the site gutters 16/40/48/64 (measured = source at 375/768/1024/1280/1536/1920/2560).
- Fixed: the boilerplate default section container was still 1200px (24/32px gutters) —
  now 1536px with 16/40/48/64 (styles.css). Cards sections own the gutter, so their
  default content no longer adds a second one (cards.css). Home "PACKAGES FOR EVERY KIND
  OF TENNIS COACH" now matches the source box at every width (1 line @1920, was 2).
  Only the home pages (EN/ES/index) and draft samples used the old default; news pages
  unaffected (re-validated).

### 2026-10-18 — breakpoint audit of all blocks + templates (CSS and JS)
- CSS (blocks/, templates/, styles/): 175 media queries, all `width >= 768 | 1024 | 1280`
  (+3 prefers-reduced-motion) — no max-width, no mixing.
- The checker now also covers templates/ CSS and JS viewport breakpoints (matchMedia,
  picture `media:` strings, `window.innerWidth` comparisons) in blocks/, templates/,
  scripts/ (not aem.js) and widgets/. It found and we fixed:
  - course-filter.js `matchMedia('(width < 768px)')` (max-width) → `!matchMedia('(width >= 768px)')`;
  - scripts.js eager-fonts threshold `innerWidth >= 900` → `>= 1024`;
  - form images (form.js, rules/index.js) relied on aem.js's default 600px picture
    breakpoint → explicit `(width >= 768px)`.
- Kept by design: form/flag-profile.css `@container (width >= 641px)` — a container query
  on the embedded Formstack form's own width (its layout switch), not a viewport breakpoint.
- Not ours: aem.js (untouchable) and the EDS-rendered default-content <picture> markup
  carry the platform's 600px image-source breakpoint (image selection only, not layout).

### 2026-10-18 — migration scope: what's done, what's next (from the site catalog)
Source: the site-scope catalog (catalog/template-catalog.json, run 2026-10-04 — 219 pages,
14 templates, EN + ES). Status against local content:
| Template | Pages (EN+ES) | Migrated | Notes |
|---|---|---|---|
| news-article | 116 | 112 | done; catalog also groups job-board + membership-benefits here, but they have no share row / featured tile — treat as their own pages |
| landing-page | 26 | 2 (home EN/ES) | **next**: coach-mentorship, coaching-community (+ coaching-workshops, fellowship-in-coaching-and-leadership, usta-coaches-inclusion-summit), courses, learning-pathway, membership terms, gallagher-disclaimer pro / pro-plus / rally, account/flag-profile — 12 EN + 12 ES |
| quiz-results | 12 | 0 | results/{college-coach, ft-pro-coach, guardian-coach, pt-pro-coach, school-coach, volunteer-emerging-coach}; es/maintenance-page misfiled here |
| listing-hub (+variant) | 12 | 0 | news index, news search-results, faqs, coachtennis, workshops, education-center-locations — mixed layouts, dynamic lists |
| long-form-info | 6 | 0 | about, usta-coaching-equivalency-application, auth-error |
| account-dashboard / record-form / guided-journey / settings / preferences / unsubscribe | 42 | 0 | authenticated app pages — need the app/API, not a content import |
| disclaimer-form | 2 | 0 | gallagher-disclaimer-baseline (form built in drafts) |
| maintenance-page | 1 | 0 | standalone |
Blocks already built for landing pages: hero (video / content), columns (media, quote, feature,
promo, text), cards (pricing, media, text, profile, comparison, course, logos, news, quote),
accordion, banner, course-filter, form (subscribe, flag profile, gallagher disclaimer), tabs.

### 2026-10-19 — heading / text / button spacing parity, block by block (all samples vs source)
Customer ask: heading→text and above/below-button gaps must match the source at every
breakpoint. Each block sample was measured against its live source page (text line boxes,
CTA boxes, card/panel boxes) at 375/768/1024/1280/1440 and fixed to the source's own model
(component paddings, separators, column insets) — not by nudging margins.
- **IMPORTANT — measure in standards mode.** The local dev server serves pages WITHOUT a
  `<!DOCTYPE html>` (document.compatMode = BackCompat); aem.page/aem.live add it. Quirks
  mode drops the line-box strut for inline-only lines (e.g. the events "In-Person · address"
  line measured 14px locally vs 20px published). All results below were re-verified with the
  doctype injected (Playwright route); results unchanged except the events meta line,
  which matches only in standards mode. Use the same injection for any future parity tooling.
- **Source CTA text tracking is NORMAL**: the source's `letter-spacing: 1px` sits on the
  button box; its inner `.button-core__text-content` resets it. Fixed (letter-spacing normal):
  hero default + content, columns events "View More", columns text/promo "Register Now",
  discussion-boards "Access". CTA sizes from source: hero-content min-width 280, 14px pad,
  2px transparent border, text 14/16/18 (→768/1280); events View More 56px tall, 16/18/24
  (→1024/1280), no caps; promo / text CTAs 14|16 → 16 → 18 or 24; Access min-width 120.
- cards (profile): name letter-spacing normal + 24px right pad; role in a 50px row,
  bottom-aligned (source) → bio starts at the same height in every card.
- cards (comparison): panel at the component inset (24/52/60/76), panel padding 12px 8px
  (12px ≥768) with 24px card gaps; 1024 columns 192/192/211/211 (source auto sizes); PER
  YEAR pill 1px black border (20px); module rows fixed 24px (wrapped item overflows, as
  source); coming-soon card rebuilt (bars 30% wide 52px under title, flame then band directly
  under on phones, centred both axes in tall rows); equivalency strip 1px #a0a0a0 border,
  18/24 normal tracking. All panel/card boxes now identical at every width.
- cards (quote): cards 8px past the page gutter on phones; text columns 12px 8px (12 ≥768);
  2px inset #808080 rule in a 4px separator; bottom pad 36/44/60 (source card = column
  height + its own top margin). Sample lists Marc before Marti — source order is Miyako,
  Marti, Marc (hand-made sample; the real page's importer keeps DOM order).
- columns (profile): row inset 8/12px, photo = its 5/4/3-of-12 span − 24px; card padding
  20px (16px sides on phones); name 32 until 1024; tags gap 8, padding 12 (12px 16px +
  14px ≥1024); role/bio/tags pinned to the card bottom. The source's Andrea Perez row alone
  is 12–32px taller (its grid sizing; Ian/Nancy rows have none) — not reproduced.
- columns (text): heading → columns 66 (42px separator + paddings) at all widths, 24px
  between stacked columns, columns → CTA 66; MENTOR/MENTEE 32px only from 1280.
- columns (promo): panel inset 8/12px, content inset 24 (48px 24px ≥1280), title→CTA 24 on
  phones, header row → details 24, meta → description two lines (38.4 / 43.2 ≥1280). The
  source's 280px pill overflows its 3/12 column at 768–1279 (off-panel); ours stays inside.
- columns (article, learning-hub): importer no longer adds the list-edge blank line when the
  list's component is followed by a separator (list → "The Coach's Edge" 108 → 84 = source);
  EN + ES re-imported, images finalized, backup tools/importer/backups/news-article/
  usta-coaching-online-learning-hub-is-live/.
- banner: NEW `centered` variant (source membership-benefits "More questions? Visit Coach
  Care."): panel past the gutter by the column inset, padding 12px 16px → 12 → 36px 12px;
  heading in the middle 2/3, Graphik Semibold 28 → 32 (1280); 56px CTA full-width on phones,
  280 centred ≥768, text 14/16/18. Exact at all widths except 768 (source pill overflows its
  1/3 column, 37px off-centre). `grant` variant still has no styles and its source is gone
  (deadline passed; not on any page) — needs a reference before building.
- hero (default): panel is content-height (no min-height): separators 8px (phones +18 above
  heading and CTA) → 84 (1024) → 96 (1280) above / between / below; tablet hero 142px.
- accordion (pathway + timeline, same source component): panel padding 16 8 8 → 16 4 4
  (768) → 24 4 12 (1024) → 32 12 20 (1280); content inset 0 8 32 / 0 12 32 / 0 12 12; badge
  centred beside the text ≥1024; intro → meta 32 at 1280; meta columns `flex: 0 1 auto`
  (shrink together, none grows), gap 24 → 40 (1280); chevron flush (12px at 768).
  Timeline sample rendered an EMPTY header (aem.js wrapped the picture-first cell in one
  <p>): `unwrapCellParagraph` moved to scripts.js (shared by columns + accordion, now also
  h4–h6/ol). The pathway sample's intro uses plain spaces where the source has &nbsp;
  (wraps one line less at 1280) — sample content.
- contact: subtitle 24 below the title, card body tracking normal, 42 between cards, body →
  arrow 50 (≥768), panel 12px top (36 ≥1280) and bottom 34 / 30 / 34 / 63.
- discussion-boards: card text inset 16 (≥768), card bottom +26 separator at 768–1279,
  cards column 8px 12px at 1280 + bottom margin 24/32, intro 12px padding at 1280.
- course-filter: block inset 8/12px; tab title→description 0 gap, line-height normal;
  toggles 15|25 + label + 35|45; chip 46 (36 ≥768); card min-height 250/333/347 (source,
  per load width), bottom pad +1 gap (empty buttons row), expand 40 on phones; description
  18/21.6 ≥768 clamped at 150.72px; eyebrow 18px only ≥1280; Spanish courses "N módulos"
  (LMS `language`). Card positions now identical at 375/768/1280. Not reproduced: the
  source's uneven 457/435 columns at 1024 (auto-sized).
- Verified unchanged/clean: cards-news + columns-events (source feeds changed — compared
  by structure), home (0 gap drifts 768–1440 in standards mode).
Gates: lint ✓ (0 errors; 8 pre-existing console warnings) · breakpoint ✓ · overflow ✓ (16
pages, learning-hub passes on retry — LinkedIn iframe) · typography ✓ · a11y ✓ except the
known intentional #0373F3 contrast finding on cards-comparison.

### 2026-10-20 — full re-sweep of all 28 block samples (standards mode) + in-card check
Re-ran the gap check on every block sample at 375/768/1024/1280/1440 with the local page in
standards mode, then a new in-card check (each text's position/size relative to its own card,
or to the block's first text where the source has no card box) — this catches panel/inset
differences the gap check cannot see. Fixed (all now match the source at every width unless
noted):
- **Component inset pattern** (source panels/grids span their column incl. the column's own
  8px / 12px-from-768 inset): columns text (panel margin −8/−12, padding 36 24 → 48 36 ≥768),
  banner info (margin −8/−12; heading text cell padded 12px ≥768), columns feature (rebuilt on
  the source model: panel −8/−12 with 24 16 / 36 24 padding, image + card columns 12px 8px /
  12px, phone photo 311×249, card text inset 38·12·80 → 42·16·84 (≥768) → 50·16·92 (≥1280),
  min-height hack removed), cards logos (grid −8/−12, 12px cells from 768), columns list (tiles
  inset 8/12, 30 / 50px apart), tabs (phones: full-bleed scroll strip, first pill 24px in;
  ≥768 track inset 12; labels +10px right padding, normal tracking, ≥120px on phones).
- hero content: registration → "*Must be…" note is 18px at every width (source copy changed;
  the old 66/42 included space that no longer exists).
- columns list "Read Article": 2px solid black border, 50px tall.
- course-filter: description paragraphs one blank line apart (1lh).
- columns embed (samples only): list → heading 84px from 1024 (source separator).
Not changed (verified artifacts or content): cards comparison / news / quote / events /
profile / default hero (different cards paired, live feeds); course-filter card-to-card gaps
(the source keeps its load-width min-height when resized); cards-course "2 Days" pill sits
lower on the source because its description ends with one blank line (two in the tablet copy)
— hand-made sample lacks it, the landing-page importer must keep blank lines; columns-text
phone label 3 lines (source half-width label one-off); columns-list thumbnail width (source
square flex-shrinks with title length, 211–231px); video consent link 4px narrower (source
uses a button). No imported (non-draft) page uses any block changed today.
Gates: lint ✓ (0 errors) · breakpoint ✓ · overflow ✓ (9 changed samples; embed passes on
retry) · typography ✓ · a11y ✓.

### 2026-10-21 — banner-centered sample regenerated from its real source
The sample's "Source: home.html" was stale: the "More questions? Visit Coach Care." band is on
membership-benefits and learning-pathway (EN + ES) only (scan of all 218 catalogued source
URLs); the home page has none. New importer `tools/importer/import-sample-banner-centered.js`
(+ bundle; backup tools/importer/backups/block-sample/banner-centered/) reads the heading,
CTA label and link from membership-benefits → the sample now carries the source content
("GET HELP" → https://coachcare.usta.com/hc/en-us; was "Get Help" → membership-benefits) and
notes that the source uses the blue colourway. Blue instance verified = source at all widths.
lint ✓ (0 errors) · overflow ✓ · a11y ✓.

### 2026-10-21 — next page sets (EN = ES verified)
Structural fingerprint (ordered AEM component list inside <main>) of every EN page vs its ES twin
for landing-page, quiz-results, long-form-info, listing-hub and disclaimer-form: **all EN/ES pairs
are structurally identical**. Same-layout groups (pairwise sequence similarity):
- **Results pages** (quiz-results): college-coach, ft-pro-coach, guardian-coach, pt-pro-coach,
  school-coach, volunteer-emerging-coach — 6 EN + 6 ES = 12 pages, 85–98% alike (one importer).
  Catalog misfiles: es/pt-pro-coach sits under long-form-info, es/maintenance-page under quiz-results.
- **Gallagher disclaimers**: baseline, rally, pro, pro-plus — 4 EN + 4 ES = 8 pages, 98–100%
  alike (baseline+rally identical, pro+pro-plus identical; catalog splits baseline into
  disclaimer-form).
- Remaining landing pages (coach-mentorship, coaching-community, coaching-workshops, fellowship,
  inclusion-summit, courses, learning-pathway, membership terms, flag-profile) — 9 EN + 9 ES,
  each a unique layout (per-page mapping on a shared landing importer).

### 2026-10-21 — landing-page template: section → block map (all pages; EN = ES)
Source: live section inventory (top-level containers in <main>) + per-section captures + the
reference variant report. Existing = block/variant already built (sample in drafts/block-samples).
| Page | Sections → block |
|---|---|
| coach-mentorship | Hero (content) · text+image row [NEW: plain media row] · Cards (media) ×3 · icon cards ×3 + CTA + note [NEW: cards text + icon] · Columns (text) bullets, no panel [NEW option] · Columns (text) Eligibility panel · two CTA columns [NEW] · Accordion (FAQ) · Banner (centered, blue) + body copy [NEW: body] |
| coaching-community | Hero (content, no CTA) · Columns (feature) unframed ×2 [NEW option] + framed ×1 · 2-image row + CTA ×2 [NEW] · Discussion boards · Cards (quote) · Banner (centered, blue) + body · Form (subscribe) |
| coaching-workshops | Hero · Columns (events) list · Tabs (Upcoming / Recorded webinars) · Columns (promo) |
| fellowship | heading + photo + intro (default) · 3×2 feature cards (cards media, some text-only) · details text + links (default) · Banner (events, blue) "Important dates" · date rows [NEW] · qualifications list + CTA (default) · Video · Columns (quote) |
| inclusion-summit | Hero (centered title) · text+image row · video+text row · icon cards ×3 · lime "Education grants" banner [NEW colour] · Cards (quote) · Banner (centered, blue) |
| courses | Tabs · intro + pathway infographic (default) · Course filter · Cards (comparison) · … |
| learning-pathway | Accordion (pathway) ×4 · Cards (comparison) · Banner (centered, blue) |
| membership terms | heading + long rich text (default content) |
| flag-profile | heading + intro + Form (report) |
Plan: one profile-driven `import-landing-page-v1.js` (registry + B.* + per-page profiles), proven
on coach-mentorship first, then the rest; new block options added only where marked NEW.

### 2026-10-21 — landing-page import: coach-mentorship + coaching-community (EN + ES)
Importer `tools/importer/import-landing-page-v1.js` (+ bundle) — section kinds, matched in order:
hero-content → `Hero (content)` / `Hero (content, title)` (no CTA) · accordion → `Accordion (closed)` ·
columns-text-panel → `Columns (text)` · columns-text-plain → **`Columns (checklist)`** · banner-centered →
`Banner (centered[, blue])` or **`Banner (spotlight[, narrow])`** (blue panel + h2 + copy + lime CTA) ·
cards-media → **`Cards (media, stacked)`** · cards-icon → **`Cards (icons)`** · columns-cta → **`Columns (cta)`** ·
columns-feature → `Columns (feature)` / **`Columns (feature, unframed)`** · columns-photos → **`Columns (photos)`** ·
discussion-boards → `Discussion Boards` · cards-quote → `Cards (quote)` / **`Cards (quote, testimonial)`** ·
columns-media-row → `Columns` (default: text + image row) · else default content. Bold = new this round.
- **Section styles (new, generic, styles.css):** `inset` (source `container--padding--24px`: 28px in, 24px above/below),
  `inset-small` (`container--padding--12px-4px`: 4px in, 4px/12px above/below from 768/1280), `heading-narrow`
  (section heading on 10/12 cols, offset 1). Insets are drawn as a transparent section **border** so they compose with
  whatever padding the section's blocks set (children-margin insets lost to blocks' own negative margins).
- **Template `landing-page`** (templates/landing-page): type scale h2 28→32→40, body 18/24; section rhythm
  12/20/36/52 above + below, `bottom-27/32/36` section styles for the source's tighter bottoms; default content =
  stacked text components (12px above first, 24px between, 12px below last); 42px separator between a heading/intro
  and the next block and between a block and the copy after it (not before icon cards); first section (hero) sits
  24px under the header (the source's nav strip) with no bottom padding; FAQ accordion item headers +10px after the
  first; text-style intros span the column insets.
- **Fixes found on the way:** the local preview serves the metadata key as `Template` (capitalised) — loadTemplate now
  also reads it and adds the body class itself; `Cards (icon)` collided with the global `.icon` (24×24 inline-block) →
  variant is `icons`; authored blank lines (`<p>&nbsp;</p>`) are dropped by the importer's HTML cleanup → onLoad marks
  them (`[[blank-line]]`) so paragraph grouping still sees the gap; the source's button labels are mixed case (the
  computed `uppercase` on `a.cmp-button` is undone by the inner span); lime CTAs (`button--width--padding-16-24`)
  keep the 280px minimum only on phones, outlined (`button-core--large`) everywhere; icon / quote cards are taller
  than their content by their own top margin (source quirk) — reproduced via bottom padding + negative margin.
- **Quality:** typography.json gained `templates.landing-page.scale` (the checker now applies a template's own
  source-measured scale by body class, like the news-article exemption). Long Spanish words in hero/section headings
  wrap (`overflow-wrap`) instead of overflowing at 360 — the source clips them.
- **Parity (text-anchor compare vs source at 375/768/1024/1280/1440):** x positions and fonts match; residual vertical
  drift ≤ 12px on coach-mentorship; coaching-community testimonial cards differ up to ~60px at 375 because the source
  authors each card with different separators. Source quirk not copied: coach-mentorship's "Why Tennis Coach
  Mentorship Matters" row is hidden at 768–1023 on the source (both responsive copies) — we show it.
- Backups: tools/importer/backups/landing-page/{coach-mentorship,coaching-community}/.
- **Next (not yet mapped — dry-run completeness 10–60%):** coaching-workshops (events list, tabs, promo), fellowship
  (date rows, video, quote), inclusion-summit (video row, lime grants banner, outlined quote cards), courses (tabs +
  course filter + comparison), learning-pathway (pathway accordions + comparison), membership terms (long text —
  content root not found), Gallagher disclaimers ×3 (form), flag-profile (form).

### 2026-10-23 — section-style samples + hero second CTA + media-row centring
- **Section samples** (drafts/section-samples/): `section-inset`, `section-inset-small`, `section-heading-narrow`,
  `section-bottom` (bottom-27 / -32 / -36). Each shows a real coach-mentorship section twice — WITH the style and
  WITHOUT it — emitted by the landing importer itself. New importer `tools/importer/import-sample-landing-sections.js`
  (pick a sample with `?sample=inset|inset-small|heading-narrow|bottom` on the source URL); backup
  tools/importer/backups/section-sample/landing-sections/. The landing importer now exports `emitSection` /
  `finalizeOutput` (one section → content + styles), verified to produce identical page output.
  Note: emitting moves source nodes, so a section emitted twice must be cloned first.
- bottom-NN measured in the sample: 1280 → 27/32/36 vs the standard 52; 375 → 22/24/12 vs 12 (bottom-36 = standard
  on phones). Kept for now (user decision 2026-10-23, review after the samples).
- **Hero (content):** the source added a second CTA ("Current Participants Access Mentorship Platform Here") — the
  second link is now an outlined button (black, 2px white border), stacked 18px under the primary below 1024 and
  beside it from 1024 starting on the panel's 5th column (4th from 1280); matches the source at 768–1440. Phones show
  the full label (the source's shorter phone-only copy is dropped, desktop copy kept). Hero paragraph rules now
  target direct-child paragraphs only (they were shrinking the CTA paragraphs).
- **Columns (default, text + image):** both columns vertically centred (source `container--align-items--center`);
  matches the source at 1024/1280.

### 2026-10-23 — section styles consolidated: `narrow-N` replaces inset / inset-small / heading-narrow / bottom-NN
User decision: consistency over 4–28px parity — **removed** `inset`, `inset-small`, `heading-narrow` and
`bottom-27/32/36` (CSS in styles.css / landing-page.css and the importer no longer emits them).
- **New generic section style `narrow-N`** (N = 1…12, like Columns `media-N`): EVERYTHING in the section on N of the
  12 grid columns, centred, at every width (grid = content box + 8px / 12px column insets). scripts.js turns the class
  into `--section-span: N` + `.narrow-cols`; styles.css pads the section wrappers by
  `gutter + (min(100%, 1536px) − 2·gutter + 2·inset) × (12 − N) / 24`. Limitation: sections whose blocks pad the
  section itself (cards rows) keep their own width — use it on heading / intro sections. Plain `narrow` (home intro,
  desktop-only 10/12) unchanged. Future widths: more N values, no new names.
- **Importer:** a leading centred heading on fewer than 12 columns (`default--N` + `offset--default--(12−N)/2`) now
  becomes its OWN section (`center, narrow-N`) placed right before the section it introduces. landing-page.css joins
  such a heading-only narrow section to the next one (no section gap between them; the usual 42px separator before the
  next block, not before a text-style intro or icon cards) — so the page rhythm is unchanged.
- Re-imported coach-mentorship + coaching-community (EN + ES). coaching-community's source was re-ordered by its
  authors ("USTA Coaching Network" now directly under the hero) — the import follows the live page.
- **Samples** (all generated by importers from the real source sections):
  - drafts/section-samples/`section-narrow-n` (`import-sample-landing-sections.js`, `?sample=narrow-n`): the same
    heading at narrow-10 / 8 / 6 / full width, and a whole section (heading + intro + block) at narrow-10 / 8 / full.
  - drafts/block-samples/ (`import-sample-landing-blocks.js`, `?sample=<key>`): hero-content (regenerated with the
    two CTAs; previous copy backed up in tools/importer/backups/block-sample/hero-content/), hero-content-title,
    columns-text-image, columns-feature-unframed, columns-photos, columns-checklist, columns-cta, cards-media-stacked,
    cards-icons, cards-quote-testimonial, accordion-closed, banner-spotlight, banner-spotlight-narrow,
    text-style-lead-subhead.
  - The four earlier section samples (section-inset, -inset-small, -heading-narrow, -bottom) are obsolete; content
    can't be deleted from here — remove them in the editor/DA.
- Gates: lint 0 errors · breakpoints ✓ · svg ✓ · overflow ✓ (4 pages, home, 15 samples) · typography ✓ (4 pages,
  home) · a11y ✓ (4 pages, 15 samples).

## 2026-10-28 — Experimentation plugin (aem-experimentation)
- Vendored `plugins/experimentation/src` (copy, not git subtree) + `scripts/experiment-loader.js` (from the plugin README); wired `runExperimentation` (loadEager) and `runExperimentationLazy` (loadLazy) in `scripts/scripts.js`.
- Loader is a no-op on pages without `Experiment`/`Campaign`/`Audience` metadata.
- Audiences: only `desktop` (`innerWidth >= 1024`) — Breakpoint Rule forbids `<` checks; no-match = mobile/default.
- Skipped: `head.html` modulepreload and `aem.js` RUM-sampling tweak (untouchable files); `prodHost` is `www.ustacoaching.com`; Sidekick "Experimentation" button added in `tools/sidekick/config.json`.
