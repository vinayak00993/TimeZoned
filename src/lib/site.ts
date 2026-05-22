export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gettimezoned.com"
).replace(/\/+$/, "");

export const SITE_NAME = "TimeZoned";

export const SITE_DESCRIPTION =
  "Compare time zones side by side on a 24-hour timeline and find the best time to meet across the world.";
