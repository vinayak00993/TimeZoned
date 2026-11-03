import { cities, type City } from "@/data/cities";

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const bySlug = new Map<string, City>();
const slugByName = new Map<string, string>();
for (const city of cities) {
  // Two cities can share a name once accents are stripped (San Jose, US and
  // San José, CR). The later one gets its country code appended.
  let slug = slugify(city.name);
  if (bySlug.has(slug)) slug = `${slug}-${city.country.toLowerCase()}`;
  bySlug.set(slug, city);
  slugByName.set(city.name, slug);
}

export function citySlug(city: City): string {
  return slugByName.get(city.name) ?? slugify(city.name);
}

export function findCityBySlug(slug: string): City | undefined {
  return bySlug.get(slug);
}

export function findCityByName(name: string): City | undefined {
  return cities.find((c) => c.name === name);
}

export function pairSlug(from: City, to: City): string {
  return `${citySlug(from)}-to-${citySlug(to)}`;
}

export type TimeRoute =
  | { kind: "city"; city: City }
  | { kind: "pair"; from: City; to: City };

/** Resolve `/time/[slug]` into a single-city page or a city-pair page. */
export function parseTimeSlug(slug: string): TimeRoute | null {
  const single = findCityBySlug(slug);
  if (single) return { kind: "city", city: single };
  const idx = slug.indexOf("-to-");
  if (idx > 0) {
    const from = findCityBySlug(slug.slice(0, idx));
    const to = findCityBySlug(slug.slice(idx + 4));
    if (from && to && from.name !== to.name) return { kind: "pair", from, to };
  }
  return null;
}

/**
 * Cities that get pre-rendered pair pages with every other hub. These are the
 * places people most often search time differences for.
 */
export const HUB_CITY_NAMES = [
  "New York",
  "Los Angeles",
  "Chicago",
  "San Francisco",
  "Seattle",
  "Boston",
  "Austin",
  "Denver",
  "Toronto",
  "Vancouver",
  "Mexico City",
  "São Paulo",
  "Buenos Aires",
  "London",
  "Dublin",
  "Paris",
  "Berlin",
  "Amsterdam",
  "Madrid",
  "Zurich",
  "Stockholm",
  "Istanbul",
  "Moscow",
  "Dubai",
  "Tel Aviv",
  "Cairo",
  "Lagos",
  "Nairobi",
  "Johannesburg",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Karachi",
  "Singapore",
  "Kuala Lumpur",
  "Jakarta",
  "Bangkok",
  "Manila",
  "Hong Kong",
  "Shanghai",
  "Beijing",
  "Tokyo",
  "Seoul",
  "Sydney",
  "Melbourne",
  "Auckland",
] as const;

export function hubCities(): City[] {
  return HUB_CITY_NAMES.map((name) => findCityByName(name)).filter((c): c is City => !!c);
}

/** Every ordered pair among hub cities. */
export function hubPairs(): { from: City; to: City }[] {
  const hubs = hubCities();
  const pairs: { from: City; to: City }[] = [];
  for (const from of hubs) {
    for (const to of hubs) {
      if (from.name !== to.name) pairs.push({ from, to });
    }
  }
  return pairs;
}

/** A short list of the most searched comparisons, used for footer links and prerendering. */
export const FEATURED_PAIRS: [string, string][] = [
  ["New York", "London"],
  ["London", "New York"],
  ["Mumbai", "New York"],
  ["New York", "Mumbai"],
  ["London", "Mumbai"],
  ["Bangalore", "San Francisco"],
  ["San Francisco", "Tokyo"],
  ["London", "Tokyo"],
  ["Sydney", "London"],
  ["New York", "Tokyo"],
  ["Los Angeles", "London"],
  ["Singapore", "London"],
  ["Dubai", "London"],
  ["Berlin", "New York"],
  ["Toronto", "London"],
  ["Chicago", "London"],
  ["New York", "Sydney"],
  ["Delhi", "London"],
  ["Hong Kong", "New York"],
  ["Paris", "New York"],
];

export function featuredPairs(): { from: City; to: City }[] {
  return FEATURED_PAIRS.map(([a, b]) => ({ from: findCityByName(a), to: findCityByName(b) })).filter(
    (p): p is { from: City; to: City } => !!p.from && !!p.to
  );
}

/** Pairs involving `city` with hub cities, used for internal linking on city pages. */
export function pairsFor(city: City, limit = 12): { from: City; to: City }[] {
  return hubCities()
    .filter((hub) => hub.name !== city.name)
    .slice(0, limit)
    .map((hub) => ({ from: city, to: hub }));
}
