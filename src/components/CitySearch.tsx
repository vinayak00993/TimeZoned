"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchCities } from "@/lib/city-search";
import type { City } from "@/data/cities";
import { cn } from "@/lib/utils";

interface CitySearchProps {
  /** City names to leave out of the results. */
  exclude: string[];
  onSelect: (city: City) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CitySearch({
  exclude,
  onSelect,
  onClose,
  placeholder = "Search city, country or timezone…",
  autoFocus = true,
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = searchCities(query, exclude);
  const active = results[Math.min(activeIndex, Math.max(results.length - 1, 0))];

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active) onSelect(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={active ? `${listId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div ref={listRef} id={listId} role="listbox" className="mt-2 max-h-64 overflow-y-auto">
        {results.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No cities found</p>
        ) : (
          results.map((city, idx) => (
            <button
              key={`${city.timezone}-${city.name}`}
              id={`${listId}-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              data-index={idx}
              type="button"
              onClick={() => onSelect(city)}
              onMouseMove={() => {
                if (idx !== activeIndex) setActiveIndex(idx);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                idx === activeIndex && "bg-accent"
              )}
            >
              <span className="font-medium">
                {city.name}
                <span className="ml-1.5 text-muted-foreground">{city.country}</span>
              </span>
              <span className="ml-2 max-w-[130px] truncate text-xs text-muted-foreground">{city.timezone}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
