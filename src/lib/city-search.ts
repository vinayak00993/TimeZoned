import { cities, type City } from "@/data/cities";

/**
 * Rank cities for a search box: exact name prefix first, then name substring,
 * then country or timezone matches. Cities in `exclude` (by name) are dropped.
 */
export function searchCities(query: string, exclude: string[] = []): City[] {
  const q = query.trim().toLowerCase();
  const excluded = new Set(exclude);
  const pool = cities.filter((c) => !excluded.has(c.name));
  if (!q) return pool;

  const scored: { city: City; score: number }[] = [];
  for (const city of pool) {
    const name = city.name.toLowerCase();
    const tz = city.timezone.toLowerCase();
    const country = city.country.toLowerCase();
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 1;
    else if (name.includes(q)) score = 2;
    else if (country === q) score = 3;
    else if (tz.includes(q)) score = 4;
    if (score >= 0) scored.push({ city, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.city);
}
