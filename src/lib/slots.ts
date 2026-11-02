import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime, getTimezoneOffset } from "date-fns-tz";

/** Coarse time-of-day classification used for shading and overlap search. */
export type DayPart = "work" | "edge" | "sleep";

export const WORK_START = 9;
export const WORK_END = 18;
export const AWAKE_START = 7;
export const AWAKE_END = 22;

export function classifyHour(hour: number): DayPart {
  if (hour >= WORK_START && hour < WORK_END) return "work";
  if (hour >= AWAKE_START && hour < AWAKE_END) return "edge";
  return "sleep";
}

export interface Slot {
  index: number;
  hour: number;
  minute: number;
  /** The instant this slot starts at, in the reference timezone's day. */
  utc: Date;
}

export type StepMinutes = 30 | 60;

/** The calendar day (yyyy-MM-dd) that `now` shifted by `dayOffset` falls on in `tz`. */
export function getDisplayDateString(now: Date, dayOffset: number, tz: string): string {
  return formatInTimeZone(addDays(now, dayOffset), tz, "yyyy-MM-dd");
}

/** True when any zone sits at a non-whole-hour offset from the first one. */
export function needsHalfHourSlots(timezones: string[], at: Date): boolean {
  if (timezones.length === 0) return false;
  const base = getTimezoneOffset(timezones[0], at);
  return timezones.some((tz) => (getTimezoneOffset(tz, at) - base) % 3_600_000 !== 0);
}

/**
 * Build the day's slots anchored on the reference timezone. Each slot's UTC
 * instant is resolved independently, so DST transitions inside the day are
 * handled per slot rather than with one offset copied across all rows.
 */
export function buildSlots(dateStr: string, refTz: string, step: StepMinutes): Slot[] {
  const count = (24 * 60) / step;
  return Array.from({ length: count }, (_, index) => {
    const total = index * step;
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return {
      index,
      hour,
      minute,
      utc: fromZonedTime(`${dateStr}T${hh}:${mm}:00`, refTz),
    };
  });
}

/** Index of the slot that contains `now` in the reference timezone. */
export function currentSlotIndex(now: Date, refTz: string, step: StepMinutes): number {
  const [h, m] = formatInTimeZone(now, refTz, "H:m").split(":").map(Number);
  const count = (24 * 60) / step;
  return Math.min(Math.floor((h * 60 + m) / step), count - 1);
}

export function hourInZone(instant: Date, tz: string): number {
  return Number(formatInTimeZone(instant, tz, "H"));
}

export function formatSlotTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

export interface OverlapWindow {
  /** Inclusive slot indices. */
  startIndex: number;
  endIndex: number;
  /** "work": every zone is inside working hours. "awake": nobody is asleep. */
  quality: "work" | "awake";
}

/** Find contiguous runs of slots where every zone is at work, or at least awake. */
export function findOverlapWindows(slots: Slot[], timezones: string[]): OverlapWindow[] {
  if (timezones.length === 0) return [];
  const quality = slots.map((slot) => {
    let allWork = true;
    let allAwake = true;
    for (const tz of timezones) {
      const part = classifyHour(hourInZone(slot.utc, tz));
      if (part !== "work") allWork = false;
      if (part === "sleep") allAwake = false;
    }
    return allWork ? "work" : allAwake ? "awake" : null;
  });

  const windows: OverlapWindow[] = [];
  let i = 0;
  while (i < quality.length) {
    const q = quality[i];
    if (!q) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < quality.length && quality[j + 1] === q) j++;
    windows.push({ startIndex: i, endIndex: j, quality: q });
    i = j + 1;
  }
  return windows;
}

/**
 * The best meeting windows for the day: the longest "everyone at work" runs,
 * or the longest "everyone awake" runs when no working overlap exists.
 */
export function bestWindows(slots: Slot[], timezones: string[], limit = 3): OverlapWindow[] {
  const all = findOverlapWindows(slots, timezones);
  const len = (w: OverlapWindow) => w.endIndex - w.startIndex + 1;
  const pick = (q: OverlapWindow["quality"]) =>
    all
      .filter((w) => w.quality === q)
      .sort((a, b) => len(b) - len(a))
      .slice(0, limit)
      .sort((a, b) => a.startIndex - b.startIndex);
  const work = pick("work");
  return work.length > 0 ? work : pick("awake");
}

export interface SummaryZone {
  label: string;
  timezone: string;
}

/** Per-zone description of a range, e.g. "London: 5:00 PM – 7:00 PM GMT, Mon Nov 3". */
export function describeRange(zone: SummaryZone, startUtc: Date, endUtc: Date): string {
  const start = formatInTimeZone(startUtc, zone.timezone, "h:mm a");
  const end = formatInTimeZone(endUtc, zone.timezone, "h:mm a");
  const abbr = formatInTimeZone(startUtc, zone.timezone, "zzz");
  const date = formatInTimeZone(startUtc, zone.timezone, "EEE MMM d");
  return `${zone.label}: ${start} – ${end} ${abbr}, ${date}`;
}

/** One-line, paste-ready summary of a selected range across all zones. */
export function buildShareSummary(zones: SummaryZone[], startUtc: Date, endUtc: Date): string {
  return zones.map((z) => describeRange(z, startUtc, endUtc)).join(" · ");
}
