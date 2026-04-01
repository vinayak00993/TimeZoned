# TimeZoned

A beautiful timezone comparison tool for scheduling across international timezones.

**Live:** [www.gettimezoned.com](https://www.gettimezoned.com) · **Deployed on:** Railway · **Domain via:** Squarespace

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Zustand** for state
- **date-fns-tz** for timezone calculations (DST-aware)
- **Shippori Mincho** (Google Fonts) for headings

---

## Design System — "Warm Japanese Hospitality"

Inspired by Grand Seiko Shunbun (spring equinox). Warm, textured, restrained.

| Token | Value | Use |
|-------|-------|-----|
| Background | `#FEFFCA` | Warm ecru — golden, not sandy |
| Card | `#FFFEE0` | Slightly lighter |
| Header cards | `#FAE8ED` | Cherry blossom pink |
| Accent | `#B07D6E` | Dusty rose |
| Next-day (light) | `#A8290E` | Torii vermilion |
| Next-day (dark) | `#9B8FC0` | Soft mauve |
| Font | Shippori Mincho | Headings/city names only |

Canvas texture: SVG turbulence noise at ~3% opacity + raking light gradient + vignette.

---

## Project Structure

```
src/
  app/
    page.tsx          # Main app, URL param handling, day navigation
    layout.tsx        # Fonts, cherry blossom SVG background art
    globals.css       # Full design token system (light + dark)
  components/
    VerticalTimeTable.tsx   # Main table — 48 rows × N timezone columns
    AddTimezone.tsx         # City search with keyboard navigation
    ThemeToggle.tsx         # Light/dark toggle
  data/
    cities.ts         # 209 cities globally
  store/
    timezone-store.ts # Zustand store — zones, dayOffset, theme, currentTime
  lib/
    time-utils.ts     # DST-aware helpers (date-fns-tz)
```

---

## Key Behaviours

- **URL format:** `?tz=America/Los_Angeles:Los%20Angeles,Asia/Kolkata:Chennai`
  - Encodes `timezone:CityName` — preserves exact city on reload/share
- **Logo click** → clears localStorage + URL, fresh start
- **Day navigation** → offset entire table ±1 day (prev/next buttons)
- **Hover/click rows** → highlights the selected time across all zones
- **Auto-scroll** → jumps to current time row on load

---

## Roadmap

### Phase 1 — Polish ✅ (April 2026)
- Vertical table layout with 30-min slots
- Warm Japanese design overhaul
- 209 cities globally including full Indian city set
- Keyboard navigation in search
- City names persist correctly in URLs
- DST-aware calculations
- Dark mode

### Phase 2 — Meeting Scheduler (next)
- Click + drag to select a time range
- Color-coded overlap: green = everyone awake, yellow = early/late, red = asleep
- One-click copy: "Proposing 9 AM PT / 9:30 PM IST — does this work?"
- Saved meeting slots with names

### Phase 3 — Collaboration
- Named team views with shareable links (no login required)
- Embeddable widget for Notion/Confluence
- Google Calendar integration — paste event link, see it highlighted
- City-specific background art (Tokyo → cherry blossoms, Mumbai → Gateway of India, etc.)

### Phase 4 — Smart Features
- Natural language: "Find me a time that works for LA, Mumbai and London"
- Working hours profiles per person
- "Best time" engine — surfaces top 3 overlap windows per day

### Phase 5 — Product
- Free tier: up to 5 zones
- Pro ($5/mo): unlimited zones, team views, calendar integration
- Team ($15/mo): shared workspace, embeds, history
- SEO pages for top city-pair searches

---

## Deployment

**Railway** auto-deploys from `main` on merge.

**Custom domain:** `www.gettimezoned.com` via Squarespace DNS → Railway CNAME.
Root `gettimezoned.com` forwards to `www` via Squarespace domain forwarding (301, maintain paths).

**Branch rules:** Never push directly to `main`. Always `agent/<feature>` branch + PR.

---

## Domain Notes

- `gettimezoned.com` — owned, live
- `timezoned.com` — taken (expires March 2027, worth monitoring)
- `timezoned.app` — taken
