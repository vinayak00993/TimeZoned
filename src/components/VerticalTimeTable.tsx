"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, GripVertical, Search, Pencil } from "lucide-react";
import { useTimezoneStore, type TimezoneEntry } from "@/store/timezone-store";
import {
  getDisplayDate,
  getTimezoneAbbr,
  formatCurrentTime,
} from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { formatInTimeZone as fmtTz, toZonedTime as toZoned } from "date-fns-tz";
import { cities, type City } from "@/data/cities";

interface EditZoneProps {
  zone: TimezoneEntry;
  onReplace: (zone: TimezoneEntry) => void;
}

function EditZone({ zone, onReplace }: EditZoneProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { zones } = useTimezoneStore();

  const filtered = query.trim()
    ? cities.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.timezone.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : cities;

  // Exclude cities already shown as other zones, but keep the current one so
  // the menu shows what you're replacing.
  const available = filtered.filter(
    (c) => c.name === zone.label || !zones.some((z) => z.label === c.name)
  );

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(
      `[data-index="${activeIndex}"]`
    ) as HTMLElement;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function handleSelect(city: City) {
    onReplace({
      id: `${city.timezone}-${city.name}-${Date.now()}`
        .toLowerCase()
        .replace(/[\s/]/g, "-"),
      timezone: city.timezone,
      label: city.name,
      country: city.country,
    });
    setOpen(false);
    setQuery("");
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || available.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, available.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (available[activeIndex]) handleSelect(available[activeIndex]);
      } else if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    },
    [open, available, activeIndex]
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="group/edit inline-flex items-center gap-1 text-base font-heading font-medium tracking-wide text-foreground hover:text-accent-warm transition-colors"
        title="Change city"
      >
        <span>{zone.label}</span>
        <Pencil className="size-3 opacity-0 group-hover/edit:opacity-60 transition-opacity" />
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 text-left shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search city or timezone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div ref={listRef} className="mt-2 max-h-64 overflow-y-auto">
            {available.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No timezones found
              </p>
            ) : (
              available.map((city, idx) => (
                <button
                  key={`${city.timezone}-${city.name}`}
                  data-index={idx}
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    idx === activeIndex ? "bg-accent" : "hover:bg-accent"
                  }`}
                >
                  <span className="font-medium">
                    {city.name}
                    <span className="ml-1.5 text-muted-foreground">
                      {city.country}
                    </span>
                  </span>
                  <span className="ml-2 max-w-[120px] truncate text-xs text-muted-foreground">
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

// Generate 48 half-hour slots
const SLOTS = Array.from({ length: 48 }, (_, i) => ({
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}));

function formatSlotTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

export function VerticalTimeTable() {
  const {
    zones,
    removeZone,
    replaceZone,
    reorderZones,
    currentTime,
    dayOffset,
    tick,
  } = useTimezoneStore();

  const currentRowRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Tick every 60s
  useEffect(() => {
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [tick]);

  // Auto-scroll to current time row on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      currentRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Drag handlers for column reorder
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setOverIndex(index);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorderZones(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, reorderZones]);

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">No timezones added</p>
        <p className="text-sm">Click &quot;Add timezone&quot; to get started</p>
      </div>
    );
  }

  // The display date (with offset applied)
  const displayDate = getDisplayDate(currentTime, dayOffset);

  // Use the first zone as the reference for slot times
  const referenceTimezone = zones[0].timezone;

  // Build a reference zoned time to anchor our slots
  const refZoned = toZoned(displayDate, referenceTimezone);
  const refYear = refZoned.getFullYear();
  const refMonth = refZoned.getMonth();
  const refDay = refZoned.getDate();

  // For each slot, compute the UTC time that corresponds to that slot
  // in the reference timezone on the display date
  const refOffset = refZoned.getTime() - displayDate.getTime();

  function getUtcForSlot(slotHour: number, slotMinute: number): Date {
    const refSlotLocal = new Date(
      refYear,
      refMonth,
      refDay,
      slotHour,
      slotMinute,
      0,
      0
    );
    return new Date(refSlotLocal.getTime() - refOffset);
  }

  // Determine the "current" slot index (closest to now) — only when viewing today
  const nowInRef = toZoned(currentTime, referenceTimezone);
  const nowSlotIndex =
    dayOffset === 0
      ? Math.round((nowInRef.getHours() * 60 + nowInRef.getMinutes()) / 30)
      : -1;
  // Clamp to valid range
  const currentSlotIndex = nowSlotIndex >= 0 && nowSlotIndex < 48 ? nowSlotIndex : nowSlotIndex === 48 ? 47 : -1;

  // Reference date string (for the first timezone) to detect date rollovers
  const refDateStr = `${refYear}-${String(refMonth + 1).padStart(2, "0")}-${String(refDay).padStart(2, "0")}`;

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto max-w-2xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-background pb-2 pt-1">
          <div className="flex gap-2">
            {zones.map((zone, index) => {
              const zoneKey = `${zone.id}-${index}`;
              const liveTime = formatCurrentTime(currentTime, zone.timezone);
              const abbr = getTimezoneAbbr(displayDate, zone.timezone);
              const headerDate = fmtTz(currentTime, zone.timezone, "MMM d");

              return (
                <div
                  key={zoneKey}
                  className={cn(
                    "group relative min-w-[140px] flex-1 rounded-md border border-[#D4849A]/40 dark:border-border/60 bg-[#FAE8ED] dark:bg-card px-4 py-3 text-center",
                    dragIndex === index && "opacity-50",
                    overIndex === index && dragIndex !== null && "border-accent-warm/70"
                  )}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <GripVertical className="absolute left-2 top-2 size-3 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  <button
                    onClick={() => removeZone(zone.id)}
                    className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    aria-label={`Remove ${zone.label}`}
                  >
                    <X className="size-3" />
                  </button>
                  <EditZone
                    zone={zone}
                    onReplace={(newZone) => replaceZone(zone.id, newZone)}
                  />

                  <div className="font-mono text-xl font-bold tabular-nums leading-tight mt-1" suppressHydrationWarning>
                    {liveTime}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {abbr} &middot; {headerDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slot rows */}
        <div className="pt-1">
          {SLOTS.map((slot, slotIdx) => {
            const utcForSlot = getUtcForSlot(slot.hour, slot.minute);
            const isCurrentRow = slotIdx === currentSlotIndex;
            const isSelected = selectedSlot === slotIdx;
            const isHovered = hoveredSlot === slotIdx && !isSelected;

            return (
              <div
                key={slotIdx}
                ref={isCurrentRow ? currentRowRef : undefined}
                className={cn(
                  "flex items-center gap-0 rounded-md border mb-1 py-1.5 transition-colors cursor-pointer overflow-hidden",
                  // Default state
                  "border-border/40",
                  // Current time row (lowest priority highlight)
                  isCurrentRow && !isSelected && !isHovered && "bg-highlight/20 ring-1 ring-highlight/30 ring-inset",
                  // Hovered state
                  isHovered && "bg-foreground/5 border-border/60",
                  // Selected state (highest priority)
                  isSelected && "bg-highlight/30 border-highlight/50 ring-1 ring-highlight/40"
                )}
                onMouseEnter={() => setHoveredSlot(slotIdx)}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={() => setSelectedSlot(selectedSlot === slotIdx ? null : slotIdx)}
              >
                {/* One cell per timezone */}
                {zones.map((zone, index) => {
                  const zoneKey = `${zone.id}-${index}`;
                  const zoned = toZoned(utcForSlot, zone.timezone);
                  const zHour = zoned.getHours();
                  const zMinute = zoned.getMinutes();
                  const zoneDateStr = fmtTz(utcForSlot, zone.timezone, "yyyy-MM-dd");

                  // Detect date difference from reference
                  let dayDiff: "prev" | "same" | "next" = "same";
                  if (zoneDateStr < refDateStr) {
                    dayDiff = "prev";
                  } else if (zoneDateStr > refDateStr) {
                    dayDiff = "next";
                  }

                  const cellDateLabel =
                    dayDiff !== "same"
                      ? fmtTz(utcForSlot, zone.timezone, "MMM d")
                      : null;

                  return (
                    <div
                      key={zoneKey}
                      className={cn(
                        "min-w-[140px] flex-1 whitespace-nowrap font-mono text-base font-semibold tabular-nums px-3 text-center",
                        index > 0 && "border-l border-border/50",
                        dayDiff === "prev" &&
                          "text-amber-day",
                        dayDiff === "next" &&
                          "text-violet-day",
                        dayDiff === "same" && "text-foreground"
                      )}
                    >
                      <span className="leading-none">{formatSlotTime(zHour, zMinute)}</span>
                      {cellDateLabel && <span className="ml-1.5 text-[9px] opacity-50">{cellDateLabel}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
