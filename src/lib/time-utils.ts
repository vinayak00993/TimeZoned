import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { addDays } from "date-fns";

export function getCurrentHourInTimezone(date: Date, timezone: string): number {
  const zoned = toZonedTime(date, timezone);
  return zoned.getHours();
}

export function getCurrentMinuteInTimezone(date: Date, timezone: string): number {
  const zoned = toZonedTime(date, timezone);
  return zoned.getMinutes();
}

export function formatCurrentTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "h:mm a");
}

export function getDateInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

export function isBusinessHour(hour: number): boolean {
  return hour >= 9 && hour < 18;
}

export function isSleepingHour(hour: number): boolean {
  return hour >= 22 || hour < 7;
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

