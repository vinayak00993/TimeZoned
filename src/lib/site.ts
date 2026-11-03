export const SITE_URL = "https://www.gettimezoned.com";
export const SITE_NAME = "TimeZoned";
export const SITE_DESCRIPTION =
  "Free time zone converter and meeting planner. Compare cities hour by hour, see working hours at a glance, and find the best time for everyone.";

/** Escape for safe embedding of JSON-LD inside a script tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
