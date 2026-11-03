"use client";

import { Plus } from "lucide-react";
import { makeZoneId, useTimezoneStore } from "@/store/timezone-store";
import { cities } from "@/data/cities";

const STARTERS = ["London", "New York", "Tokyo", "Mumbai", "Singapore", "Sydney", "San Francisco", "Berlin"];

export function StarterChips() {
  const zones = useTimezoneStore((s) => s.zones);
  const addZone = useTimezoneStore((s) => s.addZone);
  if (zones.length !== 1) return null;

  const taken = new Set(zones.map((z) => z.label));
  const options = STARTERS.filter((n) => !taken.has(n))
    .map((n) => cities.find((c) => c.name === n))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .slice(0, 6);

  return (
    <section
      aria-label="Get started"
      className="mx-auto mb-4 max-w-2xl rounded-lg border border-dashed border-border bg-card/50 px-4 py-3"
    >
      <p className="text-sm">
        <span className="font-heading font-medium">Compare {zones[0].label} with another city.</span>{" "}
        <span className="text-muted-foreground">
          Every hour shows side by side with working hours shaded, and the best overlap is picked out for you.
        </span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() =>
              addZone({ id: makeZoneId(city.timezone, city.name), timezone: city.timezone, label: city.name, country: city.country })
            }
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:border-accent-warm hover:text-accent-warm sm:text-sm"
          >
            <Plus className="size-3" aria-hidden="true" />
            {city.name}
          </button>
        ))}
      </div>
    </section>
  );
}
