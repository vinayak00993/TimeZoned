# TimeZoned

A time zone converter and meeting planner. Compare cities hour by hour, see who is at work, find the best overlap, and copy a proposal everyone can read in their own time.

**Live:** [www.gettimezoned.com](https://www.gettimezoned.com) · **Deployed on:** Railway · **Domain via:** Squarespace

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
|--------|--------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (prerenders every city page and the featured pairs) |
| `npm run lint` | ESLint with the Next.js and React Compiler rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests for the time math, overlap engine, slugs and search |

CI runs all four on every pull request (`.github/workflows/ci.yml`).

---

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn/ui primitives
- **Zustand** for client state
- **date-fns-tz** for DST-aware time zone math
- **Vitest** for unit tests
- **Shippori Mincho** (Google Fonts) for headings, Inter for body text

---

## Design system — "Warm Japanese Hospitality"

Inspired by Grand Seiko Shunbun (spring equinox). Warm, textured, restrained.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| Background | `#FEFFCA` | `#1C1810` | Warm ecru canvas |
| Card | `#FFFEE0` | `#241F17` | Panels and popovers |
| Header cards | `#FAE8ED` | card | Cherry blossom pink column headers |
| Accent | `#B07D6E` | `#D4957A` | Dusty rose, selection ring |
| Previous day | `#C4832A` | `#D4952F` | Amber |
| Next day | `#9A5A3C` | `#9B8FC0` | Muted terracotta / soft mauve |
| Working hours | sage tint | sage tint | `--shade-work` |
| Early or late | faint amber | faint amber | `--shade-edge` |
| Asleep | warm grey | near black | `--shade-sleep` |

Canvas texture: SVG turbulence noise at ~3% opacity + raking light gradient + vignette. The cherry blossom art lives in the right margin on wide screens only, so it never sits behind the table.

---

## Project structure

```
src/
  app/
    layout.tsx              # Fonts, metadata defaults, theme script, footer, background art
    page.tsx                # Home: converter + WebApplication structured data
    opengraph-image.tsx     # Default social preview image
    sitemap.ts, robots.ts, manifest.ts, not-found.tsx
    time/
      page.tsx              # Index of every city, grouped by country
      [slug]/page.tsx       # /time/mumbai (city) and /time/mumbai-to-new-york (pair)
      [slug]/opengraph-image.tsx
  components/
    TimezoneApp.tsx         # Shell: header, day navigation, URL sync (home) or seeded zones (embed)
    Scheduler.tsx           # Slots, best-time chips, legend, selection + copy bar
    TimeTable.tsx           # The grid: pinned headers, shading, drag / tap / keyboard selection
    ZoneHeader.tsx          # Column header: live time, edit, remove, reorder
    CitySearch.tsx          # Shared combobox used by Add and Edit
    AddTimezone.tsx, StarterChips.tsx, ThemeToggle.tsx, SiteFooter.tsx
    seo/time-content.tsx    # Server-rendered content for city and pair pages
  lib/
    slots.ts                # Slot math, DST-safe per-slot UTC, overlap engine, share summary
    slugs.ts                # City slugs, pair slugs, hub cities, featured pairs
    time-utils.ts           # Offsets, DST detection, difference sentences
    city-search.ts          # Ranked search over the city list
    hooks.ts, site.ts, utils.ts
  data/
    cities.ts               # 209 cities
    countries.ts            # Country code → name
  store/
    timezone-store.ts       # Zustand store: zones, theme, day offset, persistence flag
```

---

## Key behaviours

- **URL format (home):** `?tz=America/Los_Angeles:Los%20Angeles,Asia/Kolkata:Chennai` — `timezone:CityName`, so the exact city survives reload and share links.
- **First column is the reference.** Rows are that city's day; other columns show the matching local time with a date chip when it crosses midnight.
- **Hourly rows by default**, half-hour rows only when a zone sits at a non-whole-hour offset (India, Nepal, Adelaide, …).
- **Shading:** working hours 9–6, awake 7–10, asleep otherwise, per cell.
- **Best times:** the longest windows where every city is at work, or at least awake, shown as chips above the table. Clicking one selects it.
- **Selection:** drag with a mouse, tap a start and an end on touch, or use Enter / Shift+Enter on the keyboard. The copy bar lists the range in every city.
- **Theme:** stored in `localStorage` and applied by an inline script before first paint, so there is no light flash.
- **City pages** (`/time/[city]`) seed the table with that city and the visitor's own zone. **Pair pages** seed both cities. Neither writes to `localStorage`.
- **Logo click on the home page** clears saved zones and starts fresh.

---

## SEO

- One page per city (209) and per ordered pair of 48 hub cities (2,256), all listed in `/sitemap.xml`.
- City pages and the featured pairs are prerendered at build time; other pairs render on first request and are cached. Every page revalidates hourly so offset text stays correct across daylight saving changes.
- Each page has its own title, description, canonical URL, Open Graph / Twitter card, generated preview image, breadcrumb structured data, and (for pairs) FAQ structured data.
- Pair pages carry crawlable content: the difference in words, DST notes, the best time to call, a 24-row conversion table, FAQ, and links to the reverse pair and related comparisons.

---

## Roadmap

### Phase 1 — Polish ✅
- Vertical table with pinned headers, working-hours shading, phone layout
- Warm Japanese design, light and dark
- 209 cities, keyboard-navigable search, editable columns
- DST-safe per-slot math, unit tests, CI

### Phase 2 — Meeting scheduler ✅
- Drag, tap, or keyboard range selection
- Best-overlap suggestions
- One-click copy of the proposal in every local time

### Phase 3 — Discovery ✅
- City and city-pair landing pages with structured data
- Sitemap, robots, manifest, social preview images

### Phase 4 — Collaboration (next)
- Named team views with shareable links
- Working-hours profiles per person
- Google Calendar integration
- Embeddable widget

### Phase 5 — Product
- Free tier: up to 5 zones
- Pro: unlimited zones, team views, calendar integration
- Team: shared workspace, embeds, history

---

## Deployment

**Railway** auto-deploys from `main` on merge.

**Custom domain:** `www.gettimezoned.com` via Squarespace DNS → Railway CNAME. Root `gettimezoned.com` forwards to `www` (301, maintain paths).

**Branch rules:** Never push directly to `main`. Always a feature branch + PR.

After deploying, submit `https://www.gettimezoned.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools so the new pages are crawled promptly.

---

## Domain notes

- `gettimezoned.com` — owned, live
- `timezoned.com` — taken (expires March 2027, worth monitoring)
- `timezoned.app` — taken
