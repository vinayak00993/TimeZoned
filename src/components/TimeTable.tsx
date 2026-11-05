"use client";

import { useCallback, useEffect, useRef } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { ZoneHeader } from "@/components/ZoneHeader";
import { useReorderDrag } from "@/components/useReorderDrag";
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
  /** Reports when a pointer drag across rows starts and ends. */
  onDragChange?: (dragging: boolean) => void;
  /** Rendered between the pinned headers and the first row. */
  afterHeader?: React.ReactNode;
  /** Slot indices whose hours work for every city; drawn as a band across the row. */
  goodSlots: Set<number>;
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
  onDragChange,
  afterHeader,
  goodSlots,
}: TimeTableProps) {
  const reorderZones = useTimezoneStore((s) => s.reorderZones);
  const columnDrag = useReorderDrag(zones.length, reorderZones);
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

  const gridRef = useRef<HTMLDivElement>(null);

  // Once a range is complete, make sure its end row is not hidden under the copy bar.
  const revealRow = useCallback((index: number) => {
    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-slot-index="${index}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, []);

  // Click semantics shared by pointer and keyboard:
  // 1st click picks a start, 2nd click on another row completes the range,
  // clicking the only selected row clears it, any click after a range starts over.
  const clickRow = useCallback(
    (i: number, prev: Selection | null) => {
      if (isSingle(prev, i)) onSelectionChange(null);
      else if (isSingle(prev)) {
        onSelectionChange(range(prev!.start, i));
        revealRow(i);
      } else onSelectionChange({ start: i, end: i });
    },
    [onSelectionChange, revealRow]
  );

  useEffect(() => {
    function onUp() {
      const press = pressRef.current;
      if (!press) return;
      pressRef.current = null;
      onDragChange?.(false);
      if (!press.moved) clickRow(press.anchor, press.prev);
      else if (selection) revealRow(selection.end === press.anchor ? selection.start : selection.end);
    }
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clickRow, selection, revealRow, onDragChange]);

  useEffect(() => {
    if (!selection) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSelectionChange(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, onSelectionChange]);

  function onPointerDown(e: React.PointerEvent, i: number) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.shiftKey && selection) {
      // Shift-click extends the existing selection, like a spreadsheet.
      pressRef.current = { anchor: selection.start, moved: true, prev: selection };
      onSelectionChange(range(selection.start, i));
      return;
    }
    pressRef.current = { anchor: i, moved: false, prev: selection };
    if (e.pointerType === "mouse") {
      onDragChange?.(true);
      onSelectionChange({ start: i, end: i });
    }
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

  return (
    <div ref={gridRef} role="grid" aria-label="Time comparison table" aria-multiselectable="true" className="select-none">
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
              lifted={columnDrag.lifted === index}
              cardRef={columnDrag.setEl(index)}
              onPointerDown={columnDrag.onPointerDown(index)}
              onClickCapture={columnDrag.onClickCapture}
            />
          ))}
        </div>
      </div>

      {afterHeader}

      <div className="pt-1">
        {slots.map((slot) => {
          const i = slot.index;
          const isCurrent = i === currentIndex;
          const isSelected = !!selection && i >= selection.start && i <= selection.end;
          const isSelStart = isSelected && selection!.start === i;
          const isSelEnd = isSelected && selection!.end === i;
          const isGood = goodSlots.has(i);

          return (
            <div
              key={i}
              ref={isCurrent ? currentRowRef : undefined}
              role="row"
              tabIndex={0}
              data-slot-index={i}
              aria-selected={isSelected}
              aria-label={`${formatSlotTime(slot.hour, slot.minute)} in ${zones[0]?.label ?? "reference"}`}
              className={cn(
                "flex cursor-pointer items-stretch gap-1 outline-none transition-[background-color,box-shadow] duration-100 scroll-mt-32 scroll-mb-44 sm:gap-2",
                "hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring",
                !isSelected && "rounded-md",
                isGood && !isSelected && "bg-shade-work",
                isCurrent && !isSelected && "ring-1 ring-inset ring-highlight",
                // A selected run is drawn as one block: side rails on every row, caps on the ends.
                isSelected && "bg-accent-warm/20",
                isSelected && !isSelStart && !isSelEnd && "shadow-[inset_2px_0_0_var(--accent-warm),inset_-2px_0_0_var(--accent-warm)]",
                isSelStart && !isSelEnd && "rounded-t-md shadow-[inset_2px_0_0_var(--accent-warm),inset_-2px_0_0_var(--accent-warm),inset_0_2px_0_var(--accent-warm)]",
                isSelEnd && !isSelStart && "rounded-b-md shadow-[inset_2px_0_0_var(--accent-warm),inset_-2px_0_0_var(--accent-warm),inset_0_-2px_0_var(--accent-warm)]",
                isSelStart && isSelEnd && "rounded-md shadow-[inset_0_0_0_2px_var(--accent-warm)]"
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
                      "flex min-w-0 flex-1 items-center justify-center whitespace-nowrap px-1 py-1 text-center text-xs tabular-nums sm:px-3 sm:py-1.5 sm:text-sm",
                      part === "work" && "font-medium",
                      part === "sleep" && "text-muted-foreground/70"
                    )}
                  >
                    <span className="leading-none">{formatSlotTime(hour, minute)}</span>
                    {dayDiff !== "same" && (
                      <span
                        className={cn("ml-1 text-[9px] font-medium", dayDiff === "next" ? "text-violet-day" : "text-amber-day")}
                        aria-label={dayDiff === "next" ? "next day" : "previous day"}
                      >
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
