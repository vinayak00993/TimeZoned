import { toZonedTime, formatInTimeZone } from "date-fns-tz";

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
