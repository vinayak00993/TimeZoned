"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cities, type City } from "@/data/cities";
import { useTimezoneStore } from "@/store/timezone-store";

export function AddTimezone() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { zones, addZone } = useTimezoneStore();

  const filtered = query.trim()
    ? cities.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.timezone.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : cities;

  const available = filtered.filter(
    (c) => !zones.some((z) => z.timezone === c.timezone && z.label === c.name)
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function handleSelect(city: City) {
    addZone({
      id: `${city.timezone}-${city.name}`.toLowerCase().replace(/[\s/]/g, "-"),
      timezone: city.timezone,
      label: city.name,
      country: city.country,
    });
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
      >
        <Plus className="size-3.5" />
        Add timezone
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-popover p-2 shadow-xl">
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city or timezone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No timezones found
              </p>
            ) : (
              available.map((city) => (
                <button
                  key={`${city.timezone}-${city.name}`}
                  onClick={() => handleSelect(city)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                >
                  <span className="font-medium">
                    {city.name}
                    <span className="ml-1.5 text-muted-foreground">
                      {city.country}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground truncate ml-2 max-w-[140px]">
                    {city.timezone}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
