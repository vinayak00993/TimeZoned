"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, GripVertical, Pencil, X } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";
import { makeZoneId, useTimezoneStore, type TimezoneEntry } from "@/store/timezone-store";
import { useClickOutside } from "@/lib/hooks";
import { formatCurrentTime, getTimezoneAbbr } from "@/lib/time-utils";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";
import type { City } from "@/data/cities";

interface ZoneHeaderProps {
  zone: TimezoneEntry;
  index: number;
  count: number;
  currentTime: Date;
  displayDate: Date;
  dragState: { from: number | null; over: number | null };
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
}

export function ZoneHeader({
  zone,
  index,
  count,
  currentTime,
  displayDate,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ZoneHeaderProps) {
  const [editing, setEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zones = useTimezoneStore((s) => s.zones);
  const removeZone = useTimezoneStore((s) => s.removeZone);
  const replaceZone = useTimezoneStore((s) => s.replaceZone);
  const reorderZones = useTimezoneStore((s) => s.reorderZones);

  useClickOutside(containerRef, editing, () => setEditing(false));

  function handleReplace(city: City) {
    replaceZone(zone.id, {
      id: makeZoneId(city.timezone, city.name),
      timezone: city.timezone,
      label: city.name,
      country: city.country,
    });
    setEditing(false);
  }

  const liveTime = formatCurrentTime(currentTime, zone.timezone);
  const abbr = getTimezoneAbbr(displayDate, zone.timezone);
  const headerDate = formatInTimeZone(currentTime, zone.timezone, "MMM d");
  const isReference = index === 0;

  return (
    <div
      ref={containerRef}
      role="columnheader"
      className={cn(
        "group relative min-w-0 flex-1 rounded-md border border-[#D4849A]/40 bg-[#FAE8ED] px-1 py-2 text-center dark:border-border/60 dark:bg-card sm:px-3 sm:py-3",
        dragState.from === index && "opacity-50",
        dragState.over === index && dragState.from !== null && "border-accent-warm/70 ring-1 ring-accent-warm/40"
      )}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
    >
      {/* Controls: visible on hover or keyboard focus */}
      <div className="absolute inset-x-1 top-1 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex items-center">
          <GripVertical className="hidden size-3 cursor-grab text-muted-foreground sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={() => reorderZones(index, index - 1)}
            disabled={index === 0}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label={`Move ${zone.label} left`}
          >
            <ArrowLeft className="size-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => reorderZones(index, index + 1)}
            disabled={index === count - 1}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            aria-label={`Move ${zone.label} right`}
          >
            <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeZone(zone.id)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label={`Remove ${zone.label}`}
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setEditing((o) => !o)}
        aria-expanded={editing}
        aria-haspopup="dialog"
        className="group/edit inline-flex max-w-full items-center gap-1 font-heading text-sm font-medium tracking-wide text-foreground transition-colors hover:text-accent-warm sm:text-base"
        title="Change city"
      >
        <span className="truncate">{zone.label}</span>
        <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover/edit:opacity-60 group-focus-visible/edit:opacity-60" aria-hidden="true" />
        <span className="sr-only">, change city</span>
      </button>

      <div className="mt-0.5 text-base font-semibold tabular-nums leading-tight sm:text-xl" suppressHydrationWarning>
        {liveTime}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-[11px]" suppressHydrationWarning>
        {abbr}
        <span className="hidden sm:inline"> &middot; {headerDate}</span>
        {isReference && count > 1 && <span className="sr-only">, reference timezone</span>}
      </div>

      {editing && (
        <div
          role="dialog"
          aria-label={`Replace ${zone.label}`}
          className="absolute left-1/2 top-full z-50 mt-2 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-left shadow-xl"
        >
          <CitySearch
            exclude={zones.filter((z) => z.id !== zone.id).map((z) => z.label)}
            onSelect={handleReplace}
            onClose={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
