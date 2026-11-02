"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { TimeTable, type Selection } from "@/components/TimeTable";
import { Button } from "@/components/ui/button";
import { useTimezoneStore } from "@/store/timezone-store";
import { useMounted } from "@/lib/hooks";
import {
  bestWindows,
  buildShareSummary,
  buildSlots,
  currentSlotIndex,
  describeRange,
  formatSlotTime,
  getDisplayDateString,
  needsHalfHourSlots,
  type OverlapWindow,
  type StepMinutes,
} from "@/lib/slots";
import { getDisplayDate } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-shade-work" aria-hidden="true" /> Working hours (9–6)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-shade-edge ring-1 ring-border" aria-hidden="true" /> Early or late
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-shade-sleep ring-1 ring-border" aria-hidden="true" /> Asleep
      </span>
      <span className="hidden sm:inline">Click a start and end time, or drag, to propose a slot.</span>
      <span className="sm:hidden">Tap a start and an end time to propose a slot.</span>
    </div>
  );
}

interface BestTimesProps {
  windows: OverlapWindow[];
  slots: ReturnType<typeof buildSlots>;
  step: StepMinutes;
  refLabel: string;
  onPick: (w: OverlapWindow) => void;
}

function BestTimes({ windows, slots, step, refLabel, onPick }: BestTimesProps) {
  if (windows.length === 0) {
    return (
      <section aria-label="Best meeting times" className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-xs text-muted-foreground sm:text-sm">
        There is no hour today when everyone is awake. Someone will need an early or late slot, or try removing a city.
      </section>
    );
  }
  const quality = windows[0].quality;
  return (
    <section aria-label="Best meeting times" className="rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">
        {quality === "work" ? "Everyone is at work" : "No shared working hours, but everyone is awake"}
        <span className="font-normal"> · times in {refLabel}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {windows.map((w) => {
          const start = slots[w.startIndex];
          const endTotal = (w.endIndex + 1) * step;
          const endLabel = formatSlotTime(Math.floor(endTotal / 60) % 24, endTotal % 60);
          return (
            <button
              key={`${w.startIndex}-${w.endIndex}`}
              type="button"
              onClick={() => onPick(w)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors sm:text-sm",
                quality === "work"
                  ? "border-accent-sage/60 bg-shade-work hover:bg-accent-sage/40"
                  : "border-amber-day/40 bg-shade-edge hover:bg-amber-day/20"
              )}
            >
              {formatSlotTime(start.hour, start.minute)} – {endLabel}
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
      {zones.length >= 2 && (
        <BestTimes
          windows={windows}
          slots={slots}
          step={step}
          refLabel={zones[0].label}
          onPick={(w) => setSelection({ start: w.startIndex, end: w.endIndex })}
        />
      )}
      <Legend />
      <TimeTable
        zones={zones}
        slots={slots}
        refDateStr={refDateStr}
        currentIndex={currentIndex}
        currentTime={currentTime}
        displayDate={displayDate}
        selection={selection}
        onSelectionChange={setSelection}
      />

      {selection && startUtc && endUtc && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
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
