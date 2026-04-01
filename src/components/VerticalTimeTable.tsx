"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, GripVertical } from "lucide-react";
import { useTimezoneStore } from "@/store/timezone-store";
import {
  getDisplayDate,
  getTimezoneAbbr,
  formatCurrentTime,
} from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { formatInTimeZone as fmtTz, toZonedTime as toZoned } from "date-fns-tz";

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
        <div className="sticky top-0 z-20 flex bg-background border-b border-border">
          {zones.map((zone, index) => {
            const liveTime = formatCurrentTime(currentTime, zone.timezone);
            const abbr = getTimezoneAbbr(displayDate, zone.timezone);
            const headerDate = fmtTz(currentTime, zone.timezone, "MMM d");

            return (
              <div
                key={zone.id}
                className={cn(
                  "group relative min-w-[140px] flex-1 border-l border-border bg-background px-3 py-2 text-left",
                  dragIndex === index && "opacity-50",
                  overIndex === index &&
                    dragIndex !== null &&
                    "border-l-2 border-l-blue-500"
                )}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex flex-col items-center text-center relative py-1">
                  {/* Drag handle — top left */}
                  <GripVertical className="absolute left-0 top-1 size-3 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  {/* Remove button — top right */}
                  <button
                    onClick={() => removeZone(zone.id)}
                    className="absolute right-0 top-1 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    aria-label={`Remove ${zone.label}`}
                  >
                    <X className="size-3" />
                  </button>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {zone.label}
                  </div>
                  <div className="font-mono text-2xl font-bold tabular-nums leading-tight mt-0.5" suppressHydrationWarning>
                    {liveTime}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {abbr} &middot; {headerDate}
                  </div>
                </div>
              </div>
            );
          })}
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
                  isCurrentRow && !isSelected && !isHovered && "bg-white/5 ring-1 ring-white/10 ring-inset",
                  // Hovered state
                  isHovered && "bg-foreground/5 border-border/60",
                  // Selected state (highest priority)
                  isSelected && "bg-blue-500/20 border-blue-400/50 ring-1 ring-blue-400/30"
                )}
                onMouseEnter={() => setHoveredSlot(slotIdx)}
                onMouseLeave={() => setHoveredSlot(null)}
                onClick={() => setSelectedSlot(selectedSlot === slotIdx ? null : slotIdx)}
              >
                {/* One cell per timezone */}
                {zones.map((zone, index) => {
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
                      key={zone.id}
                      className={cn(
                        "min-w-[140px] flex-1 whitespace-nowrap font-mono text-sm tabular-nums px-3 text-center",
                        index > 0 && "border-l border-border/50",
                        dayDiff === "prev" &&
                          "text-amber-700 dark:text-amber-400",
                        dayDiff === "next" &&
                          "text-violet-700 dark:text-violet-400",
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
