"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, GripVertical } from "lucide-react";
import { useTimezoneStore } from "@/store/timezone-store";
import {
  getDisplayDate,
  getTimezoneAbbr,
  formatCurrentTime,
  isBusinessHour,
  isSleepingHour,
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
            {/* Empty corner cell for the time column */}
            <th className="w-24 min-w-[6rem] border-b border-border bg-background p-2 text-left text-xs font-medium text-muted-foreground md:w-28">
              Time
            </th>
            {zones.map((zone, index) => {
              const liveTime = formatCurrentTime(currentTime, zone.timezone);
              const abbr = getTimezoneAbbr(displayDate, zone.timezone);

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
                          {abbr}
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

            // Determine row color based on the slot hour (reference tz)
            const sleeping = isSleepingHour(slot.hour);
            const business = isBusinessHour(slot.hour);

            return (
              <tr
                key={slotIdx}
                ref={isCurrentRow ? currentRowRef : undefined}
                className={cn(
                  "transition-colors",
                  isHourBoundary && "border-t border-border/50",
                  isCurrentRow &&
                    "!bg-blue-500/15 dark:!bg-blue-400/15 ring-1 ring-blue-500/30 ring-inset",
                  !isCurrentRow && sleeping && "bg-indigo-500/5 dark:bg-indigo-400/5",
                  !isCurrentRow && business && "bg-emerald-500/5 dark:bg-emerald-400/5",
                  !isCurrentRow && !sleeping && !business && "bg-transparent"
                )}
              >
                {/* Time label column */}
                <td
                  className={cn(
                    "whitespace-nowrap px-2 py-1.5 font-mono text-xs tabular-nums",
                    isCurrentRow
                      ? "font-bold text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground",
                    !isHourBoundary && "text-muted-foreground/60"
                  )}
                >
                  {formatSlotTime(slot.hour, slot.minute)}
                </td>

                {/* One cell per timezone */}
                {zones.map((zone) => {
                  const zoned = toZoned(utcForSlot, zone.timezone);
                  const zHour = zoned.getHours();
                  const zMinute = zoned.getMinutes();
                  const zoneDateStr = fmtTz(utcForSlot, zone.timezone, "yyyy-MM-dd");

                  // Detect date difference from reference
                  let dateBadge: string | null = null;
                  if (zoneDateStr !== refDateStr) {
                    dateBadge =
                      zoneDateStr > refDateStr ? "+1 day" : "\u20131 day";
                  }

                  const cellSleeping = isSleepingHour(zHour);
                  const cellBusiness = isBusinessHour(zHour);

                  return (
                    <td
                      key={zone.id}
                      className={cn(
                        "whitespace-nowrap border-l border-border/30 px-2 py-1.5 font-mono text-xs tabular-nums",
                        isCurrentRow
                          ? "font-semibold text-blue-600 dark:text-blue-400"
                          : cellSleeping
                            ? "text-muted-foreground/50"
                            : cellBusiness
                              ? "text-foreground"
                              : "text-muted-foreground"
                      )}
                    >
                      <span>{formatSlotTime(zHour, zMinute)}</span>
                      {dateBadge && (
                        <span className="ml-1.5 rounded bg-accent px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                          {dateBadge}
                        </span>
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
