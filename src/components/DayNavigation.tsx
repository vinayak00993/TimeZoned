"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimezoneStore } from "@/store/timezone-store";
import { useMounted } from "@/lib/hooks";
import { formatDisplayDate, getDisplayDate } from "@/lib/time-utils";

export function DayNavigation() {
  const dayOffset = useTimezoneStore((s) => s.dayOffset);
  const incrementDay = useTimezoneStore((s) => s.incrementDay);
  const decrementDay = useTimezoneStore((s) => s.decrementDay);
  const resetDay = useTimezoneStore((s) => s.resetDay);
  const currentTime = useTimezoneStore((s) => s.currentTime);
  const zones = useTimezoneStore((s) => s.zones);
  const mounted = useMounted();

  const displayTz = zones[0]?.timezone ?? "UTC";
  const dateLabel = mounted ? formatDisplayDate(getDisplayDate(currentTime, dayOffset), displayTz) : " ";

  return (
    <nav aria-label="Day" className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={decrementDay} aria-label="Previous day">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <button
        type="button"
        onClick={resetDay}
        className="min-w-[9ch] rounded-md px-1.5 py-1 text-sm font-medium tabular-nums transition-colors hover:bg-accent sm:px-2"
        title="Back to today"
      >
        {dateLabel}
        {dayOffset !== 0 && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({dayOffset > 0 ? "+" : ""}
            {dayOffset}d)
          </span>
        )}
      </button>
      <Button variant="ghost" size="icon-sm" onClick={incrementDay} aria-label="Next day">
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

