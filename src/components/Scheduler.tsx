"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Check, Copy, X } from "lucide-react";
import { TimeTable, type Selection } from "@/components/TimeTable";
import { DayNavigation } from "@/components/DayNavigation";
import { Button } from "@/components/ui/button";
import { useTimezoneStore } from "@/store/timezone-store";
import { useMounted } from "@/lib/hooks";
import {
  bestWindows,
  buildShareSummary,
  buildSlots,
  currentSlotIndex,
  describeRange,
  getDisplayDateString,
  needsHalfHourSlots,
  type OverlapWindow,
  type StepMinutes,
} from "@/lib/slots";
import { getDisplayDate } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1.5 pt-0.5 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-shade-work" aria-hidden="true" /> 9 to 6
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-shade-edge ring-1 ring-border" aria-hidden="true" /> early or late
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-shade-sleep ring-1 ring-border" aria-hidden="true" /> night
      </span>
      <span className="hidden sm:inline">Drag, or click a start and an end, to pick a slot.</span>
      <span className="sm:hidden">Tap a start and an end to pick a slot.</span>
    </div>
  );
}

interface BestTimesProps {
  windows: OverlapWindow[];
  slots: ReturnType<typeof buildSlots>;
  step: StepMinutes;
  zones: { id: string; label: string; timezone: string }[];
  onPick: (w: OverlapWindow) => void;
}

function BestTimes({ windows, slots, step, zones, onPick }: BestTimesProps) {
  if (windows.length === 0) {
    return (
      <section aria-label="Best times to meet" className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-xs text-muted-foreground sm:text-sm">
        No hour today when everyone&apos;s awake. Drop a city, or someone takes a very early or very late call.
      </section>
    );
  }
  const quality = windows[0].quality;
  const others = zones.slice(1);
  return (
    <section aria-label="Best times to meet" className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
      <div className="mb-2 text-xs sm:text-sm">
        <span className="font-medium">{quality === "work" ? "Good times to meet" : "Times when everyone's awake"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {windows.map((w) => {
          const startUtc = slots[w.startIndex].utc;
          const endUtc = new Date(slots[w.endIndex].utc.getTime() + step * 60_000);
          const rangeIn = (tz: string) =>
            `${formatInTimeZone(startUtc, tz, "h:mm a")} – ${formatInTimeZone(endUtc, tz, "h:mm a")}`;
          return (
            <button
              key={`${w.startIndex}-${w.endIndex}`}
              type="button"
              onClick={() => onPick(w)}
              className={cn(
                "flex flex-col items-start rounded-lg border px-3 py-1.5 text-left transition-colors",
                quality === "work"
                  ? "border-accent-sage/60 bg-shade-work hover:bg-accent-sage/40"
                  : "border-amber-day/40 bg-shade-edge hover:bg-amber-day/20"
              )}
            >
              <span className="text-sm font-medium tabular-nums">
                {rangeIn(zones[0].timezone)} <span className="font-normal text-muted-foreground">{zones[0].label}</span>
              </span>
              {others.length > 0 && (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {others.map((z) => `${rangeIn(z.timezone)} ${z.label}`).join(" · ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function Scheduler() {
  const zones = useTimezoneStore((s) => s.zones);
  const currentTime = useTimezoneStore((s) => s.currentTime);
  const dayOffset = useTimezoneStore((s) => s.dayOffset);
  const tick = useTimezoneStore((s) => s.tick);
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [sel, setSel] = useState<{ sig: string; selection: Selection | null }>({ sig: "", selection: null });

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [tick]);

  const timezones = useMemo(() => zones.map((z) => z.timezone), [zones]);
  const refTz = zones[0]?.timezone ?? "UTC";
  const step: StepMinutes = needsHalfHourSlots(timezones, currentTime) ? 30 : 60;
  const refDateStr = getDisplayDateString(currentTime, dayOffset, refTz);
  const displayDate = getDisplayDate(currentTime, dayOffset);

  const slots = useMemo(() => buildSlots(refDateStr, refTz, step), [refDateStr, refTz, step]);
  const windows = useMemo(
    () => (zones.length >= 2 ? bestWindows(slots, timezones) : []),
    [slots, timezones, zones.length]
  );

  // A selection only makes sense for the day and granularity it was made on.
  const sig = `${refDateStr}|${refTz}|${step}`;
  const selection = sel.sig === sig ? sel.selection : null;
  const setSelection = (selection: Selection | null) => setSel({ sig, selection });

  const currentIndex = mounted && dayOffset === 0 ? currentSlotIndex(currentTime, refTz, step) : -1;

  if (zones.length === 0) return null;

  const startUtc = selection ? slots[selection.start].utc : null;
  const endUtc = selection ? new Date(slots[selection.end].utc.getTime() + step * 60_000) : null;
  const summary = startUtc && endUtc ? buildShareSummary(zones, startUtc, endUtc) : "";

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <DayNavigation />
      {zones.length >= 2 && (
        <BestTimes
          windows={windows}
          slots={slots}
          step={step}
          zones={zones}
          onPick={(w) => setSelection({ start: w.startIndex, end: w.endIndex })}
        />
      )}
      <TimeTable
        afterHeader={<Legend />}
        zones={zones}
        slots={slots}
        refDateStr={refDateStr}
        currentIndex={currentIndex}
        currentTime={currentTime}
        displayDate={displayDate}
        selection={selection}
        onSelectionChange={setSelection}
        onDragChange={setDragging}
      />

      {selection && startUtc && endUtc && selection.start === selection.end && !dragging && (
        // A single pick shows a small pill up top so the rows below the start stay clickable.
        <div
          role="status"
          className="fixed left-1/2 top-16 z-30 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-popover px-3 py-1.5 text-xs shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 sm:top-3 sm:text-sm"
        >
          <span className="truncate">
            <span className="font-medium tabular-nums">{formatInTimeZone(startUtc, refTz, "h:mm a")}</span>
            <span className="text-muted-foreground">
              <span className="hidden sm:inline"> picked · click the end time, or drag</span>
              <span className="sm:hidden"> picked · tap the end time</span>
            </span>
          </span>
          <button
            type="button"
            onClick={copySummary}
            className="shrink-0 rounded-full px-2 py-0.5 font-medium text-accent-warm hover:bg-accent"
            title="Copy just this slot"
          >
            {copied ? "Copied" : "Just this slot"}
          </button>
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {selection && startUtc && endUtc && selection.start !== selection.end && !dragging && (
        <div className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl rounded-xl border border-border bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-3">
            <ul className="min-w-0 flex-1 space-y-0.5 text-xs sm:text-sm" aria-label="Selected time in every city">
              {zones.map((z) => (
                <li key={z.id} className="truncate tabular-nums">
                  {describeRange(z, startUtc, endUtc)}
                </li>
              ))}
            </ul>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" onClick={copySummary} aria-live="polite">
                {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setSelection(null)} aria-label="Clear selection">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
