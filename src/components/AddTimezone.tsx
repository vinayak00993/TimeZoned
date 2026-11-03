"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CitySearch } from "@/components/CitySearch";
import { makeZoneId, useTimezoneStore } from "@/store/timezone-store";
import { useClickOutside } from "@/lib/hooks";
import type { City } from "@/data/cities";

export function AddTimezone() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zones = useTimezoneStore((s) => s.zones);
  const addZone = useTimezoneStore((s) => s.addZone);

  useClickOutside(containerRef, open, () => setOpen(false));

  function handleSelect(city: City) {
    addZone({
      id: makeZoneId(city.timezone, city.name),
      timezone: city.timezone,
      label: city.name,
      country: city.country,
    });
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="gap-1.5"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Add city</span>
        <span className="sr-only">Add a city to compare</span>
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Add a city"
          className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-2 shadow-xl"
        >
          <CitySearch exclude={zones.map((z) => z.label)} onSelect={handleSelect} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
