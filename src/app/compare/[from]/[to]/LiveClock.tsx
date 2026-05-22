"use client";

import { useEffect, useState } from "react";

interface Zone {
  label: string;
  timezone: string;
}

function timeIn(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

function dateIn(tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

export function LiveClock({ zones }: { zones: Zone[] }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {zones.map((z) => (
        <div
          key={`${z.timezone}-${z.label}`}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="text-sm text-muted-foreground">{z.label}</div>
          <div
            className="font-heading text-2xl md:text-3xl tabular-nums"
            suppressHydrationWarning
          >
            {timeIn(z.timezone)}
          </div>
          <div
            className="text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {dateIn(z.timezone)}
          </div>
        </div>
      ))}
    </div>
  );
}
