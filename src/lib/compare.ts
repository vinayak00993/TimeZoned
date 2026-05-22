import { formatInTimeZone } from "date-fns-tz";
import { cities, type City } from "@/data/cities";

export type CompareCity = City & { slug: string };

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Curated set of globally significant cities used to generate SEO landing
// pages. Kept intentionally focused (vs. the full 200+ dataset) so every
// generated page targets a high-intent "X to Y time" search and stays useful.
const FEATURED_NAMES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "San Francisco",
  "Toronto",
  "Mexico City",
  "São Paulo",
  "London",
  "Paris",
  "Berlin",
  "Madrid",
  "Moscow",
  "Dubai",
  "Istanbul",
  "Mumbai",
  "Bangalore",
  "Singapore",
  "Hong Kong",
  "Tokyo",
  "Shanghai",
  "Seoul",
  "Sydney",
  "Auckland",
];

export const compareCities: CompareCity[] = FEATURED_NAMES.map((name) => {
  const city = cities.find((c) => c.name === name);
  if (!city) throw new Error(`Featured city not found in dataset: ${name}`);
  return { ...city, slug: slugify(city.name) };
});

const bySlug = new Map(compareCities.map((c) => [c.slug, c]));

export function findCityBySlug(slug: string): CompareCity | undefined {
  return bySlug.get(slug);
}

export interface CityPair {
  from: CompareCity;
  to: CompareCity;
}

export function allPairs(): CityPair[] {
  const pairs: CityPair[] = [];
  for (const from of compareCities) {
    for (const to of compareCities) {
      if (from.slug !== to.slug) pairs.push({ from, to });
    }
  }
  return pairs;
}

// Hand-picked high-volume pairs surfaced on the hub page and site footer.
const POPULAR: [string, string][] = [
  ["new-york", "london"],
  ["london", "new-york"],
  ["london", "tokyo"],
  ["new-york", "los-angeles"],
  ["san-francisco", "london"],
  ["london", "mumbai"],
  ["new-york", "bangalore"],
  ["london", "sydney"],
  ["los-angeles", "tokyo"],
  ["london", "singapore"],
  ["dubai", "london"],
  ["new-york", "tokyo"],
];

export function popularPairs(): CityPair[] {
  return POPULAR.map(([f, t]) => {
    const from = bySlug.get(f);
    const to = bySlug.get(t);
    if (!from || !to) throw new Error(`Popular pair references unknown slug: ${f}/${t}`);
    return { from, to };
  });
}

/** Minutes east of UTC for a timezone at a given instant (DST-aware). */
export function offsetMinutes(date: Date, timezone: string): number {
  const s = formatInTimeZone(date, timezone, "xxx"); // e.g. "+05:30", "-08:00", "+00:00"
  const sign = s.startsWith("-") ? -1 : 1;
  const [h, m] = s.slice(1).split(":").map(Number);
  return sign * (h * 60 + m);
}

function humanizeDuration(absMinutes: number): string {
  const h = Math.floor(absMinutes / 60);
  const m = absMinutes % 60;
  const parts = [
    h ? `${h} hour${h !== 1 ? "s" : ""}` : "",
    m ? `${m} minute${m !== 1 ? "s" : ""}` : "",
  ].filter(Boolean);
  return parts.join(" ") || "0 minutes";
}

export interface Relation {
  minutes: number; // a relative to b (positive => a is ahead of b)
  same: boolean;
  /** e.g. "5 hours 30 minutes ahead of" / "8 hours behind" / "the same time as" */
  phrase: string;
}

/** Describe how city `a` relates to city `b` at the given instant. */
export function relation(date: Date, a: CompareCity, b: CompareCity): Relation {
  const minutes = offsetMinutes(date, a.timezone) - offsetMinutes(date, b.timezone);
  const abs = Math.abs(minutes);
  if (abs === 0) return { minutes, same: true, phrase: "the same time as" };
  const dir = minutes > 0 ? "ahead of" : "behind";
  return { minutes, same: false, phrase: `${humanizeDuration(abs)} ${dir}` };
}

export function formatClock(totalMinutes: number): string {
  const t = ((totalMinutes % 1440) + 1440) % 1440;
  let h = Math.floor(t / 60);
  const m = t % 60;
  const ampm = h < 12 ? "AM" : "PM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export interface ConversionRow {
  fromLabel: string;
  toLabel: string;
  dayDelta: number; // -1 | 0 | +1 relative to the `from` day
  overlap: boolean; // within 09:00–18:00 in BOTH cities
}

/** Hour-by-hour mapping of `from` local time to `to` local time. */
export function conversionTable(date: Date, from: CompareCity, to: CompareCity): ConversionRow[] {
  const delta = offsetMinutes(date, to.timezone) - offsetMinutes(date, from.timezone);
  const rows: ConversionRow[] = [];
  for (let h = 0; h < 24; h++) {
    const fromMin = h * 60;
    const toRaw = fromMin + delta;
    const toHour = ((Math.floor(toRaw / 60) % 24) + 24) % 24;
    rows.push({
      fromLabel: formatClock(fromMin),
      toLabel: formatClock(toRaw),
      dayDelta: Math.floor(toRaw / 1440),
      overlap: h >= 9 && h < 18 && toHour >= 9 && toHour < 18,
    });
  }
  return rows;
}

/** Deep link into the interactive tool with both zones preselected. */
export function toolUrl(from: CompareCity, to: CompareCity): string {
  const enc = (c: CompareCity) => `${c.timezone}:${encodeURIComponent(c.name)}`;
  return `/?tz=${enc(from)},${enc(to)}`;
}
