# Comicster — Brutalist Redesign Spec

**Date:** 2026-04-29  
**Branch:** `new-design`  
**Scope:** Full frontend redesign — layout, homepage, auth pages, search page

---

## Design Direction

**Style:** Comic Noir Brutalism — Texture + Editorial variant  
**Mood:** Dark, raw, print-inspired. Feels like a zine or vintage comic issue, not a SaaS product.  
**Not:** Chaotic anti-design. Polished brutalism — structured, readable, intentional.

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--c-base` | `#0F0F0F` | Page background |
| `--c-surface` | `#111111` | Card / panel background |
| `--c-border-lo` | `#1E1E1E` | Subtle dividers, grid gaps |
| `--c-border-hi` | `#2A2A2A` | Inputs, visible borders |
| `--c-subtle` | `#555555` | Metadata, labels |
| `--c-muted` | `#888888` | Secondary text, nav links |
| `--c-body` | `#D4D4D4` | Body text, descriptions |
| `--c-bright` | `#E8E8E8` | High-emphasis text |
| `--c-white` | `#FFFFFF` | Headings |
| `--c-accent` | `#E02020` | Red — buttons, rules, active states, borders |

### Typography

| Role | Font | Size | Tracking | Color |
|---|---|---|---|---|
| Display / H1 | Impact | clamp(48px, 6vw, 72px) | -1px | `#FFFFFF` |
| H2 / Section title | Impact | 38–52px | 1px | `#FFFFFF` |
| Card title | Impact | 13–16px | 1px | `#FFFFFF` |
| Section label / eyebrow | Courier New | 8–9px | 5px | `#E02020` |
| Body | Courier New | 13–15px | 1px | `#D4D4D4` |
| UI label / meta | Courier New | 8–10px | 3px | `#888888` |
| Ghost / placeholder | Courier New | 8px | 3px | `#555555` |

All text: `text-transform: uppercase` on labels, eyebrows, buttons, nav links, metadata.

### Texture

- **Dot-grid halftone** on `body::before`: `radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)` at `6px 6px` repeat. Fixed, full-bleed, `z-index: 0`. All content sits at `z-index: 1`.
- Comic cover placeholders use the same dot-grid at `4–5px` repeat with a slight `rgba(255,255,255,0.06)` opacity.

### Key Components

**Buttons**
- Primary: `background #E02020`, Impact font, 13px, letter-spacing 3px, no border-radius, no border
- Secondary: transparent, Courier New 10–11px, `border: 1px solid #2A2A2A`, color `#D4D4D4`
- Ghost: transparent, Courier New, `border: 1px solid #E02020`, color `#E02020`
- All: uppercase, no border-radius

**Inputs**
- No border box — underline only: `border-bottom: 1px solid #2A2A2A`
- On focus: `border-bottom: 2px solid #E02020`
- Background: transparent / `#111`, Courier New 13px

**Cards**
- `background: #111`, `border: 1px solid #1E1E1E`, `border-top: 2px solid #E02020`
- No border-radius

**Badges**
- Red filled: `background #E02020`, white text, Courier New 8px, tracking 3px
- Outline: `border: 1px solid #2A2A2A`, color `#888`
- Issue outline: `border: 1px solid #E02020`, color `#E02020`
- No border-radius

**Dividers**
- Red rule: `height: 2px; background: #E02020` — used at tops of sections, navbar, footer
- Thin separator: `height: 1px; background: #1E1E1E`

**Edition numbering**
- Format: `№ 001` — Courier New, 8–9px, color `#E02020` or `#333`, tracking 4px
- Used in: page headers, card headers, nav, sidebar panels

---

## Layout — `default.vue`

### Navbar

```
[2px red top rule, full width]
[max-w-1100 inner]
  [Logo: red 26×26 square + "C" in Impact] [COMICSTER in Impact 18px tracking-4]
  [nav links: pipe-separated | Feed | Explorer | Journal | Listes | Avis | Stats |]
    — each link: 8px Courier, tracking-3, height 52px, border-right #1A1A1A
    — active: color #E02020, subtle red bg tint
  [№ 2026] [LOGIN_ btn secondary] [S'INSCRIRE btn primary]
```

- Fixed top, `background: #0F0F0F`, `border-bottom: 1px solid #1E1E1E`
- On scroll: no change (already opaque)
- No `bg-transparent` hero bleed — navbar always solid

### Footer

```
[2px red rule full width]
[max-w-1100 inner, flex space-between]
  [COMICSTER — TON JOURNAL DE COMICS, Impact tracking-4, color #333]
  [Explorer | RGPD | Mentions — Courier 9px tracking-3, color #555, pipe borders]
```

---

## Pages

### `/` — Homepage (`index.vue`)

**Layout:** Two-column hero (content left, sidebar right) + features section

**Hero left:**
- Eyebrow: `№ — TON JOURNAL DE COMICS` in red, with red 20px left rule
- H1: `SUIS. / NOTE. (outline/ghost). / PARTAGE.` — middle word uses `-webkit-text-stroke: 1px rgba(255,255,255,0.2); color: transparent`
- Subtitle: 15px Courier, `#D4D4D4`, lh 1.9
- CTA row: `COMMENCER ▶` (primary) + `SE CONNECTER_` (secondary)
- Stats bar (border-top `#1E1E1E`): `10K+`, `GRATUIT`, `MARVEL` — Impact 30px white, label 10px `#888`

**Hero right (sidebar panel):**
- `border: 1px solid #1E1E1E; border-top: 2px solid #E02020`
- Header: `TENDANCES` label (red) + `№ 024` number
- 4 comic rows: 36×50 cover placeholder (dot-grid) + title (Impact) + meta + status badge (red outline)

**Features section:**
- Eyebrow + `TOUT CE QU'IL TE FAUT` heading + ghost `04` number far right
- 4-column grid, `gap: 1px; background: #1E1E1E` (creates 1px border illusion)
- Each cell: `background: #0F0F0F`, 24px red rule top-left, feature name in Impact, desc in Courier 13px `#D4D4D4`, ghost number top-right

**Logged-in redirect:** keep existing `navigateTo('/feed')` logic — no change.

---

### `/auth/login` — Login (`login.vue`)

`layout: false` — standalone page, no navbar.

**Structure:** Centered single card, max-width 380px

**Card** (`border-top: 2px solid #E02020`):
- Header: logo + `№ 002`
- Body:
  - H1: `CONNEXION` (Impact 30px)
  - Tagline: `TON UNIVERS COMICS T'ATTEND` (Courier 11px `#555`)
  - Email field (underline input)
  - Password field (underline input, red on focus)
  - `SE CONNECTER ▶` submit (full-width primary)
  - `ou` divider (thin lines)
  - OAuth grid (2 cols): Google + GitHub — `border: 1px solid #2A2A2A`, hover `border-color: #E02020`
- Footer: `Pas de compte ? S'inscrire →` (link in red)

**2FA state** (same card, swapped content):
- H1: `VÉRIFICATION`
- Tagline: `CODE DE TON APPLICATION 2FA`
- TOTP input: Impact font 28px, letter-spacing 12px, centered, underline red
- Hint: `CODE À 6 CHIFFRES — EXPIRE DANS 30S`
- `VÉRIFIER ▶` submit
- `← Retour` text link below

---

### `/auth/register` — Register (`register.vue`)

`layout: false` — standalone page, no navbar.

**Structure:** Centered single card, max-width 420px

**Card** (`border-top: 2px solid #E02020`):
- Header: logo + `№ 003`
- Marketing strip (border-bottom `#1E1E1E`):
  - `POURQUOI COMICSTER ?` eyebrow in red
  - 4 rows: large red Impact number (01–04) + feature title (Impact 13px) + desc (Courier 12px `#D4D4D4`)
- Body:
  - H1: `CRÉER UN COMPTE` (Impact 30px)
  - Tagline: `GRATUIT · SANS CARTE BANCAIRE`
  - Email, Username, Password (+ strength bar: 4 segments, height 2px), Confirm password fields
  - `COMMENCER GRATUITEMENT ▶` submit (full-width primary)
- Footer: `Déjà un compte ? Se connecter →` (link in red)

**Password strength bar:** 4 segments, `height: 2px`, transition colors: `#E02020` (1) → `#F0A500` (2–3) → `#22C55E` (4)

---

### `/comics/search` — Search (`search.vue`)

**Page header** (border-bottom):
- Eyebrow: `BIBLIOTHÈQUE · {total} COMICS`
- H1: `EXPLORER` (Impact 52px)

**Search bar** (full-width strip, border-bottom):
- `QUERY_` prefix (Courier, `#333`, border-right `#1E1E1E`)
- Text input (Courier 14px, placeholder `#333`)
- `RECHERCHER ▶` submit (red, flush right, no gap)

**Filters strip** (border-bottom):
- `FILTRES` label (Courier 8px `#555`, border-right)
- Genre select (appearance: none, custom chevron, pipe borders between selects)
- Author/publisher select
- `× RÉINITIALISER` button (right-aligned, border `#2A2A2A`, hover `border-color: #E02020`)

**Results meta:**
- Count: `{n} résultats pour "{query}"` — n in Impact red, rest Courier `#888`
- Page counter right: `Page 1 / {total}`

**Comics grid:**
- 5 columns (lg), `gap: 1px; background: #1A1A1A` (border illusion)
- Each cell: `background: #0F0F0F`
- Cover: `aspect-ratio: 2/3`, `filter: grayscale(15%)` → `grayscale(0%)` on hover, scale 1.03
- Overlay on hover: gradient bottom → `VOIR →` in red Impact
- Cover placeholder: dot-grid bg + red number
- Info strip (border-top `#1A1A1A`): title Impact 13px, author Courier 10px `#888`

**Pagination:**
- Border-connected buttons (no border-radius, `border-right: none` except last)
- Active: `background: #E02020`, white text
- Prev/Next: Courier uppercase `← PRÉC` / `SUIV →`

**Empty state:**
- Ghost Impact text `AUCUN RÉSULTAT` in `#1E1E1E`
- Sub: Courier `#333` tracking-3

---

## CSS Changes (`main.css`)

Remove the current Bebas Neue + Inter Google Fonts imports entirely. Both replacement fonts are system fonts:
- **Impact** — universally available system font, no import needed
- **Courier New** — universally available system font, no import needed

Update CSS custom properties and base layer:
- `body`: `background: #0F0F0F`, `color: #D4D4D4`, `font-family: 'Courier New', Courier, monospace`
- `body::before`: dot-grid texture (fixed, full-bleed)
- `h1, h2, h3`: `font-family: impact, sans-serif`, `text-transform: uppercase`

Update component classes:
- `.btn-primary`: red bg, Impact font, no border-radius
- `.btn-ghost`: red border+text, Courier, no border-radius
- `.card`: `#111` bg, `border: 1px solid #1E1E1E`, `border-top: 2px solid #E02020`, no border-radius
- `.input`: underline-only, red focus indicator
- `.badge`: red bg, Courier, no border-radius

---

## Files to Modify

| File | Change |
|---|---|
| `frontend/app/assets/css/main.css` | Full replacement — new design tokens, base, components |
| `frontend/app/layouts/default.vue` | New navbar (red top rule, pipe nav, edition №) + footer |
| `frontend/app/pages/index.vue` | Two-column hero + features grid |
| `frontend/app/pages/auth/login.vue` | New card layout, underline inputs, 2FA redesign |
| `frontend/app/pages/auth/register.vue` | New card with marketing strip, underline inputs |
| `frontend/app/pages/comics/search.vue` | New header, search bar, filters strip, grid, pagination |

All Vue logic (API calls, reactive state, composables) stays untouched — only templates and class names change.

---

## Out of Scope

- Other pages (`/feed`, `/journal`, `/dashboard`, `/admin`, etc.) — redesigned separately
- Backend changes — none
- New features — none
- Mobile breakpoints — implement sensible stacking, not a full mobile-first redesign pass
