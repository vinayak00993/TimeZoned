"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTimezoneStore } from "@/store/timezone-store";
import { VerticalTimeTable } from "@/components/VerticalTimeTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddTimezone } from "@/components/AddTimezone";
import { cities } from "@/data/cities";
import { Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDisplayDate, formatDisplayDate } from "@/lib/time-utils";

function DayNavigation() {
  const { dayOffset, incrementDay, decrementDay, resetDay, currentTime, zones } =
    useTimezoneStore();

  // Use first zone or local timezone for date display
  const displayTz =
    zones.length > 0
      ? zones[0].timezone
      : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const displayDate = getDisplayDate(currentTime, dayOffset);
  const dateLabel = formatDisplayDate(displayDate, displayTz);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={decrementDay}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <button
        onClick={resetDay}
        className="rounded-md px-2 py-1 text-sm font-medium tabular-nums hover:bg-accent transition-colors"
        title="Go to today"
      >
        {dateLabel}
        {dayOffset !== 0 && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({dayOffset > 0 ? "+" : ""}
            {dayOffset}d)
          </span>
        )}
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={incrementDay}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function TimezoneApp() {
  const { setZones, zones, setTheme } = useTimezoneStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tzParam = searchParams.get("tz");
    if (tzParam) {
      const tzList = tzParam.split(",").filter(Boolean);
      const zonesFromUrl = tzList.map((tz) => {
        const city = cities.find((c) => c.timezone === tz);
        return {
          id: `${tz}-${city?.name || tz}`.toLowerCase().replace(/[\s/]/g, "-"),
          timezone: tz,
          label: city?.name || tz.split("/").pop()?.replace(/_/g, " ") || tz,
          country: city?.country || "",
        };
      });
      if (zonesFromUrl.length > 0) {
        setZones(zonesFromUrl);
      }
    } else {
      try {
        const stored = localStorage.getItem("timezoned-zones");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setZones(parsed);
          }
        }
      } catch {}
    }

    const storedTheme = localStorage.getItem("timezoned-theme");
    const theme = storedTheme === "light" ? "light" : "dark";
    setTheme(theme);
  }, [searchParams, setZones, setTheme]);

  useEffect(() => {
    const tzParam = zones.map((z) => z.timezone).join(",");
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      const current = url.searchParams.get("tz");
      if (current !== tzParam) {
        url.searchParams.set("tz", tzParam);
        window.history.replaceState({}, "", url.toString());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [zones]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-blue-500" />
            <h1 className="text-lg font-bold tracking-tight">TimeZoned</h1>
          </div>
          <DayNavigation />
          <div className="flex items-center gap-2">
            <AddTimezone />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <VerticalTimeTable />
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TimezoneApp />
    </Suspense>
  );
}
