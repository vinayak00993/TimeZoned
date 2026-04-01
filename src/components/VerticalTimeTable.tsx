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

  const currentRowRef = useRef<HTMLTableRowElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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
      <table className="w-full border-collapse">
        {/* Sticky header */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-background">
            {zones.map((zone, index) => {
              const liveTime = formatCurrentTime(currentTime, zone.timezone);
              const abbr = getTimezoneAbbr(displayDate, zone.timezone);
              const headerDate = fmtTz(currentTime, zone.timezone, "MMM d");

              return (
                <th
                  key={zone.id}
                  className={cn(
                    "group relative min-w-[8rem] border-b border-l border-border bg-background p-2 text-left",
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
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="size-3 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      <div>
                        <div className="text-sm font-semibold leading-tight">
                          {zone.label}
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-bold tabular-nums leading-tight">
                          {liveTime}
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground">
                          {abbr} &middot; {headerDate}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeZone(zone.id)}
                      className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      aria-label={`Remove ${zone.label}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {SLOTS.map((slot, slotIdx) => {
            const utcForSlot = getUtcForSlot(slot.hour, slot.minute);
            const isCurrentRow = slotIdx === currentSlotIndex;
            const isHourBoundary = slot.minute === 0;

            return (
              <tr
                key={slotIdx}
                ref={isCurrentRow ? currentRowRef : undefined}
                className={cn(
                  "transition-colors",
                  isHourBoundary && "border-t border-border/50",
                  isCurrentRow && "bg-white/5 ring-1 ring-white/10 ring-inset"
                )}
              >
                {/* One cell per timezone */}
                {zones.map((zone) => {
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
                    <td
                      key={zone.id}
                      className={cn(
                        "whitespace-nowrap border-l border-border px-2 py-1.5 font-mono text-xs tabular-nums",
                        dayDiff === "prev" &&
                          "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
                        dayDiff === "next" &&
                          "bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400",
                        dayDiff === "same" && "text-foreground"
                      )}
                    >
                      <div>{formatSlotTime(zHour, zMinute)}</div>
                      {cellDateLabel && (
                        <div className="text-[10px] opacity-60">
                          {cellDateLabel}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
