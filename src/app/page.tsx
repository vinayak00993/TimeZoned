"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTimezoneStore } from "@/store/timezone-store";
import { TimelineGrid } from "@/components/TimelineGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddTimezone } from "@/components/AddTimezone";
import { cities } from "@/data/cities";
import { Globe } from "lucide-react";

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
    // Debounce replaceState to avoid "called too frequently" errors
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
          <div className="flex items-center gap-2">
            <AddTimezone />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <TimelineGrid />
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
