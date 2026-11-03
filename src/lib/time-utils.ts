import { toZonedTime, formatInTimeZone, getTimezoneOffset } from "date-fns-tz";
import { addDays } from "date-fns";

export function getCurrentHourInTimezone(date: Date, timezone: string): number {
  return toZonedTime(date, timezone).getHours();
}

export function formatCurrentTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "h:mm a");
}

export function getDateInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

/** Get display date with dayOffset applied */
export function getDisplayDate(now: Date, dayOffset: number): Date {
  return addDays(now, dayOffset);
}

/** Format timezone abbreviation (e.g. PST, IST) */
export function getTimezoneAbbr(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "zzz");
}

/** Format date for header display */
export function formatDisplayDate(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "EEE, MMM d, yyyy");
}

/** "UTC+5:30", "UTC-8", "UTC" */
export function formatUtcOffset(timezone: string, at: Date): string {
  const minutes = Math.round(getTimezoneOffset(timezone, at) / 60_000);
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** Signed difference in minutes: how far `to` is ahead of `from` at `at`. */
export function offsetDifferenceMinutes(from: string, to: string, at: Date): number {
  return Math.round((getTimezoneOffset(to, at) - getTimezoneOffset(from, at)) / 60_000);
}

/** "9 hours 30 minutes", "1 hour", "the same time" */
export function formatDurationMinutes(minutes: number): string {
  const abs = Math.abs(minutes);
  if (abs === 0) return "the same time";
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** "Mumbai is 9 hours 30 minutes ahead of New York" */
export function describeDifference(
  fromLabel: string,
  fromTz: string,
  toLabel: string,
  toTz: string,
  at: Date
): string {
  const diff = offsetDifferenceMinutes(fromTz, toTz, at);
  if (diff === 0) return `${toLabel} and ${fromLabel} are on the same time`;
  const dir = diff > 0 ? "ahead of" : "behind";
  return `${toLabel} is ${formatDurationMinutes(diff)} ${dir} ${fromLabel}`;
}

/** Whether a timezone changes its offset within the given year. */
export function observesDst(timezone: string, year: number): boolean {
  const jan = getTimezoneOffset(timezone, new Date(Date.UTC(year, 0, 1)));
  const jul = getTimezoneOffset(timezone, new Date(Date.UTC(year, 6, 1)));
  return jan !== jul;
}

/** Long timezone name such as "India Standard Time". */
export function timezoneLongName(timezone: string, at: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "long" }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}
