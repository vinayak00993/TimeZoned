"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { ZoneHeader } from "@/components/ZoneHeader";
import { useTimezoneStore, type TimezoneEntry } from "@/store/timezone-store";
import { classifyHour, formatSlotTime, type Slot } from "@/lib/slots";
import { cn } from "@/lib/utils";

export interface Selection {
  start: number;
  end: number;
}

interface TimeTableProps {
  zones: TimezoneEntry[];
  slots: Slot[];
  /** yyyy-MM-dd of the reference zone's day. */
  refDateStr: string;
  currentIndex: number;
  currentTime: Date;
  displayDate: Date;
  selection: Selection | null;
  onSelectionChange: (selection: Selection | null) => void;
}

function range(a: number, b: number): Selection {
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

function isSingle(sel: Selection | null, i?: number) {
  return !!sel && sel.start === sel.end && (i === undefined || sel.start === i);
}

export function TimeTable({
  zones,
  slots,
  refDateStr,
  currentIndex,
  currentTime,
  displayDate,
  selection,
  onSelectionChange,
}: TimeTableProps) {
  const reorderZones = useTimezoneStore((s) => s.reorderZones);
  const [drag, setDrag] = useState<{ from: number | null; over: number | null }>({ from: null, over: null });
  const currentRowRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  const pressRef = useRef<{ anchor: number; moved: boolean; prev: Selection | null } | null>(null);

  // Scroll the current time into view once, when it becomes known after hydration.
  useEffect(() => {
    if (scrolledRef.current || currentIndex < 0) return;
    scrolledRef.current = true;
    const timer = setTimeout(() => {
      currentRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Click semantics shared by pointer and keyboard:
  // 1st click picks a start, 2nd click on another row completes the range,
  // clicking the only selected row clears it, any click after a range starts over.
  const clickRow = useCallback(
    (i: number, prev: Selection | null) => {
      if (isSingle(prev, i)) onSelectionChange(null);
      else if (isSingle(prev)) onSelectionChange(range(prev!.start, i));
      else onSelectionChange({ start: i, end: i });
    },
    [onSelectionChange]
  );

  useEffect(() => {
    function onUp() {
      const press = pressRef.current;
      if (!press) return;
      pressRef.current = null;
      if (!press.moved) clickRow(press.anchor, press.prev);
    }
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clickRow]);

  function onPointerDown(e: React.PointerEvent, i: number) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pressRef.current = { anchor: i, moved: false, prev: selection };
    if (e.pointerType === "mouse") onSelectionChange({ start: i, end: i });
  }

  function onPointerEnter(i: number) {
    const press = pressRef.current;
    if (!press || press.anchor === i) return;
    press.moved = true;
    onSelectionChange(range(press.anchor, i));
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.shiftKey && selection) onSelectionChange(range(selection.start, i));
      else clickRow(i, selection);
    } else if (e.key === "Escape" && selection) {
      onSelectionChange(null);
    }
  }

  const handleDragEnd = () => {
    if (drag.from !== null && drag.over !== null && drag.from !== drag.over) reorderZones(drag.from, drag.over);
    setDrag({ from: null, over: null });
  };

  return (
    <div role="grid" aria-label="Time comparison table" aria-multiselectable="true" className="select-none">
      {/* Column headers stay pinned while the day scrolls. */}
      <div role="row" className="sticky top-0 z-20 bg-background/95 pb-2 pt-1 backdrop-blur-sm">
        <div className="flex gap-1 sm:gap-2">
          {zones.map((zone, index) => (
            <ZoneHeader
              key={zone.id}
              zone={zone}
              index={index}
              count={zones.length}
              currentTime={currentTime}
              displayDate={displayDate}
              dragState={drag}
              onDragStart={(i) => setDrag({ from: i, over: i })}
              onDragOver={(i) => setDrag((d) => ({ ...d, over: i }))}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      <div className="pt-1">
        {slots.map((slot) => {
          const i = slot.index;
          const isCurrent = i === currentIndex;
          const isSelected = !!selection && i >= selection.start && i <= selection.end;
          const isHour = slot.minute === 0;

          return (
            <div
              key={i}
              ref={isCurrent ? currentRowRef : undefined}
              role="row"
              tabIndex={0}
              aria-selected={isSelected}
              aria-label={`${formatSlotTime(slot.hour, slot.minute)} in ${zones[0]?.label ?? "reference"}`}
              className={cn(
                "flex cursor-pointer items-stretch gap-1 rounded-md outline-none transition-colors sm:gap-2",
                "hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring",
                isHour ? "mt-0.5" : "",
                isCurrent && !isSelected && "ring-1 ring-inset ring-highlight",
                isSelected && "bg-accent-warm/20 ring-2 ring-inset ring-accent-warm/70"
              )}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerEnter={() => onPointerEnter(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {zones.map((zone) => {
                const hour = Number(formatInTimeZone(slot.utc, zone.timezone, "H"));
                const minute = Number(formatInTimeZone(slot.utc, zone.timezone, "m"));
                const zoneDateStr = formatInTimeZone(slot.utc, zone.timezone, "yyyy-MM-dd");
                const dayDiff = zoneDateStr < refDateStr ? "prev" : zoneDateStr > refDateStr ? "next" : "same";
                const part = classifyHour(hour);

                return (
                  <div
                    key={zone.id}
                    role="gridcell"
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-sm px-1 py-1 text-center text-xs tabular-nums sm:px-3 sm:py-1.5 sm:text-base",
                      part === "work" && "bg-shade-work font-semibold",
                      part === "edge" && "bg-shade-edge font-medium",
                      part === "sleep" && "bg-shade-sleep text-muted-foreground",
                      dayDiff === "prev" && "text-amber-day",
                      dayDiff === "next" && "text-violet-day"
                    )}
                  >
                    <span className="leading-none">{formatSlotTime(hour, minute)}</span>
                    {dayDiff !== "same" && (
                      <span className="ml-1 text-[9px] opacity-60" aria-label={dayDiff === "next" ? "next day" : "previous day"}>
                        <span className="hidden sm:inline">{formatInTimeZone(slot.utc, zone.timezone, "MMM d")}</span>
                        <span className="sm:hidden">{dayDiff === "next" ? "+1" : "−1"}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
