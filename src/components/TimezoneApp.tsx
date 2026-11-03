"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { AddTimezone } from "@/components/AddTimezone";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Scheduler } from "@/components/Scheduler";
import { StarterChips } from "@/components/StarterChips";
import {
  clearStoredZones,
  makeZoneId,
  readStoredTheme,
  readStoredZones,
  useTimezoneStore,
  type TimezoneEntry,
} from "@/store/timezone-store";
import { cities } from "@/data/cities";

function zoneFromTimezone(tz: string, nameHint?: string | null): TimezoneEntry {
  const city = nameHint
    ? cities.find((c) => c.timezone === tz && c.name === nameHint) || cities.find((c) => c.timezone === tz)
    : cities.find((c) => c.timezone === tz);
  const label = nameHint || city?.name || tz.split("/").pop()?.replace(/_/g, " ") || tz;
  return { id: makeZoneId(tz, label), timezone: tz, label, country: city?.country || "" };
}

export function encodeZones(zones: TimezoneEntry[]): string {
  return zones.map((z) => `${z.timezone}:${encodeURIComponent(z.label)}`).join(",");
}

function parseTzParam(param: string): TimezoneEntry[] {
  return param
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const colon = entry.indexOf(":");
      const tz = colon > -1 ? entry.slice(0, colon) : entry;
      const hint = colon > -1 ? decodeURIComponent(entry.slice(colon + 1)) : null;
      return zoneFromTimezone(tz, hint);
    });
}

/** Home page only: load zones from the URL, then storage, then the visitor's own timezone; keep the URL in sync. */
function UrlSync() {
  const searchParams = useSearchParams();
  const zones = useTimezoneStore((s) => s.zones);
  const hydrate = useTimezoneStore((s) => s.hydrate);
  const lastParam = useRef<string | null>(null);

  useEffect(() => {
    const tzParam = searchParams.get("tz");
    if (tzParam !== null && tzParam === lastParam.current) return;
    lastParam.current = tzParam;

    if (tzParam) {
      const fromUrl = parseTzParam(tzParam);
      if (fromUrl.length > 0) {
        hydrate(fromUrl);
        return;
      }
    }
    const stored = readStoredZones();
    if (stored) {
      hydrate(stored);
      return;
    }
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    hydrate([zoneFromTimezone(localTz)]);
  }, [searchParams, hydrate]);

  useEffect(() => {
    if (zones.length === 0) return;
    const tzParam = encodeZones(zones);
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tz") !== tzParam) {
        url.searchParams.set("tz", tzParam);
        lastParam.current = tzParam;
        window.history.replaceState({}, "", url.toString());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [zones]);

  return null;
}

interface BaseProps {
  /** Server-rendered content shown above the table (page heading, summary). */
  intro?: React.ReactNode;
  /** Server-rendered content shown below the table (tables, FAQ, links). */
  children?: React.ReactNode;
}

type TimezoneAppProps =
  | (BaseProps & { mode: "home" })
  | (BaseProps & {
      mode: "embed";
      initialZones: TimezoneEntry[];
      /** Append the visitor's own timezone after the given zones when it is not already there. */
      addLocal?: boolean;
    });

export function TimezoneApp(props: TimezoneAppProps) {
  const setTheme = useTimezoneStore((s) => s.setTheme);
  const hydrate = useTimezoneStore((s) => s.hydrate);
  const { mode, intro, children } = props;
  const initialZones = props.mode === "embed" ? props.initialZones : null;
  const addLocal = props.mode === "embed" ? !!props.addLocal : false;

  useEffect(() => {
    setTheme(readStoredTheme());
  }, [setTheme]);

  useEffect(() => {
    if (!initialZones) return;
    const zones = initialZones.map((z) => ({ ...z, id: makeZoneId(z.timezone, z.label) }));
    if (addLocal) {
      const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!zones.some((z) => z.timezone === localTz)) zones.push(zoneFromTimezone(localTz));
    }
    hydrate(zones, { persist: false });
  }, [initialZones, addLocal, hydrate]);

  return (
    <div className="flex min-h-screen flex-col">
      {mode === "home" && (
        <Suspense fallback={null}>
          <UrlSync />
        </Suspense>
      )}
      <header className="border-b border-border px-3 py-2.5 sm:px-4 md:px-6 md:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
            onClick={(e) => {
              if (mode === "home") {
                e.preventDefault();
                clearStoredZones();
                window.location.href = "/";
              }
            }}
            title="TimeZoned home"
          >
            <Globe className="size-5 text-accent-warm" aria-hidden="true" />
            <span className="font-heading text-lg font-medium tracking-wide md:text-xl">TimeZoned</span>
            <span className="sr-only">TimeZoned home</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <AddTimezone />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-3 py-4 pb-44 sm:px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          {intro}
          <StarterChips />
          <Scheduler />
          {children}
        </div>
      </main>
    </div>
  );
}
