import type { Metadata } from "next";
import Link from "next/link";
import { cities } from "@/data/cities";
import { citySlug, featuredPairs, pairSlug } from "@/lib/slugs";
import { Breadcrumbs } from "@/components/seo/time-content";
import { countryName } from "@/data/countries";

export const metadata: Metadata = {
  title: "Time zones by city",
  description:
    "Current time, UTC offset and daylight saving rules for over 200 cities, plus time difference pages for the most common city pairs.",
  alternates: { canonical: "/time" },
};

export default function TimeIndexPage() {
  const byCountry = new Map<string, typeof cities>();
  for (const city of cities) {
    const list = byCountry.get(city.country) ?? [];
    list.push(city);
    byCountry.set(city.country, list);
  }
  const groups = [...byCountry.entries()].sort((a, b) => countryName(a[0]).localeCompare(countryName(b[0])));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-6">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Time zones" }]} />
      <h1 className="font-heading text-3xl font-medium">Time zones by city</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Pick a city for its current time, UTC offset and daylight saving rules, or jump straight to a comparison. Every
        page opens the converter with that city already in place.
      </p>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-medium">Popular comparisons</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3 md:grid-cols-4">
          {featuredPairs().map(({ from, to }) => (
            <li key={pairSlug(from, to)}>
              <Link href={`/time/${pairSlug(from, to)}`} className="hover:text-accent-warm hover:underline">
                {from.name} to {to.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-heading text-xl font-medium">All cities</h2>
        <div className="columns-2 gap-8 sm:columns-3 md:columns-4">
          {groups.map(([code, list]) => (
            <div key={code} className="mb-5 break-inside-avoid">
              <h3 className="mb-1 text-sm font-medium">{countryName(code)}</h3>
              <ul className="space-y-0.5 text-sm text-muted-foreground">
                {list.map((city) => (
                  <li key={city.name}>
                    <Link href={`/time/${citySlug(city)}`} className="hover:text-accent-warm hover:underline">
                      {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
