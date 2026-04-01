"use client";

import { useState, useEffect } from "react";
import { X, GripVertical } from "lucide-react";
import { useTimezoneStore, type TimezoneEntry } from "@/store/timezone-store";
import {
  formatCurrentTime,
  getDateInTimezone,
  getCurrentHourInTimezone,
  getCurrentMinuteInTimezone,
  isBusinessHour,
  isSleepingHour,
} from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import { getTimezoneOffset } from "date-fns-tz";

interface TimezoneRowProps {
  zone: TimezoneEntry;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
}

export function TimezoneRow({
  zone,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
}: TimezoneRowProps) {
  const { hoveredHourIndex, setHoveredHourIndex, removeZone, currentTime, zones } =
    useTimezoneStore();

  const currentHour = getCurrentHourInTimezone(currentTime, zone.timezone);
  const currentMinute = getCurrentMinuteInTimezone(currentTime, zone.timezone);
  const [localTimezone, setLocalTimezone] = useState("UTC");
  useEffect(() => {
    setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  const localDate = getDateInTimezone(currentTime, localTimezone);
  const zoneDate = getDateInTimezone(currentTime, zone.timezone);

  // Calculate offset from first zone in whole hours
  const firstZone = zones[0];
  const offsetMs = firstZone
    ? getTimezoneOffset(zone.timezone, currentTime) -
      getTimezoneOffset(firstZone.timezone, currentTime)
    : 0;
  const offsetHours = Math.round(offsetMs / 3_600_000);

  function getHourForColumn(columnHour: number): number {
    return ((columnHour + offsetHours) % 24 + 24) % 24;
  }

  // Find which column the current hour falls in (inverse of getHourForColumn)
  const currentColumn = ((currentHour - offsetHours) % 24 + 24) % 24;

  const dateDiff =
    zoneDate !== localDate
      ? zoneDate > localDate
        ? "+1 day"
        : "-1 day"
      : null;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      className="group flex items-stretch"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
    >
      {/* Row label */}
      <div className="flex w-44 shrink-0 items-center gap-2 pr-3 md:w-52">
        <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{zone.label}</span>
            <span className="text-xs text-muted-foreground">{zone.country}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              {formatCurrentTime(currentTime, zone.timezone)}
            </span>
            {dateDiff && (
              <span className="rounded bg-accent px-1 py-0.5 text-[10px] font-medium">
                {dateDiff}
              </span>
            )}
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

      {/* Timeline cells */}
      <div className="relative flex flex-1 gap-px overflow-hidden rounded-lg">
        {hours.map((columnHour) => {
          const displayHour = getHourForColumn(columnHour);
          const isCurrent = columnHour === currentColumn;
          const h = displayHour % 12 || 12;
          const ampm = displayHour < 12 ? "AM" : "PM";

          return (
            <div
              key={columnHour}
              className={cn(
                "relative flex flex-1 cursor-default items-center justify-center py-3 text-[11px] font-medium transition-colors select-none",
                isBusinessHour(displayHour) &&
                  "bg-emerald-500/8 dark:bg-emerald-400/8",
                isSleepingHour(displayHour) &&
                  "bg-indigo-500/10 dark:bg-indigo-400/10",
                !isBusinessHour(displayHour) &&
                  !isSleepingHour(displayHour) &&
                  "bg-muted/30",
                isCurrent &&
                  "!bg-blue-500/20 dark:!bg-blue-400/20 font-bold text-blue-600 dark:text-blue-400",
                hoveredHourIndex === columnHour &&
                  !isCurrent &&
                  "!bg-foreground/10"
              )}
              onMouseEnter={() => setHoveredHourIndex(columnHour)}
              onMouseLeave={() => setHoveredHourIndex(null)}
              title={`${zone.label}: ${h}:00 ${ampm}`}
            >
              <span className="hidden md:inline">
                {h}
                {ampm.charAt(0).toLowerCase()}
              </span>
              <span className="md:hidden">
                {columnHour % 3 === 0
                  ? `${h}${ampm.charAt(0).toLowerCase()}`
                  : ""}
              </span>
            </div>
          );
        })}

        {/* Current minute indicator line */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 z-10"
          style={{
            left: `${((currentColumn * 60 + currentMinute) / (24 * 60)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
