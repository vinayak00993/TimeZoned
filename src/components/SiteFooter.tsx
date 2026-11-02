import Link from "next/link";
import { featuredPairs, pairSlug } from "@/lib/slugs";

export function SiteFooter() {
  const pairs = featuredPairs().slice(0, 12);
  return (
    <footer className="border-t border-border px-4 py-8 text-sm text-muted-foreground md:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <p className="font-heading text-base font-medium text-foreground">TimeZoned</p>
          <p>
            A time zone converter and meeting planner. Compare cities hour by hour, see who is at work, and copy a
            proposal everyone can read in their own time.
          </p>
        </div>
        <nav aria-label="Popular comparisons" className="md:col-span-2">
          <p className="mb-2 font-medium text-foreground">Popular comparisons</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {pairs.map(({ from, to }) => (
              <li key={pairSlug(from, to)}>
                <Link href={`/time/${pairSlug(from, to)}`} className="hover:text-foreground hover:underline">
                  {from.name} to {to.name}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            <Link href="/time" className="hover:text-foreground hover:underline">
              All cities and time zones →
            </Link>
          </p>
        </nav>
      </div>
    </footer>
  );
}
