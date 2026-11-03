import { describe, expect, it } from "vitest";
import { describeDifference, formatDurationMinutes, formatUtcOffset, observesDst, offsetDifferenceMinutes } from "../time-utils";
import { searchCities } from "../city-search";

const winter = new Date("2026-01-15T12:00:00Z");
const summer = new Date("2026-07-15T12:00:00Z");

describe("formatUtcOffset", () => {
  it("formats whole and half-hour offsets", () => {
    expect(formatUtcOffset("Asia/Kolkata", winter)).toBe("UTC+5:30");
    expect(formatUtcOffset("America/Los_Angeles", winter)).toBe("UTC-8");
    expect(formatUtcOffset("America/Los_Angeles", summer)).toBe("UTC-7");
    expect(formatUtcOffset("Europe/London", winter)).toBe("UTC");
  });
});

describe("offset differences", () => {
  it("is signed and DST aware", () => {
    expect(offsetDifferenceMinutes("America/New_York", "Asia/Kolkata", winter)).toBe(630);
    expect(offsetDifferenceMinutes("America/New_York", "Asia/Kolkata", summer)).toBe(570);
    expect(offsetDifferenceMinutes("Asia/Kolkata", "America/New_York", winter)).toBe(-630);
  });
  it("describes the difference in words", () => {
    expect(describeDifference("New York", "America/New_York", "Mumbai", "Asia/Kolkata", winter)).toBe(
      "Mumbai is 10 hours 30 minutes ahead of New York"
    );
    expect(describeDifference("Mumbai", "Asia/Kolkata", "New York", "America/New_York", summer)).toBe(
      "New York is 9 hours 30 minutes behind Mumbai"
    );
    expect(describeDifference("London", "Europe/London", "Dublin", "Europe/Dublin", winter)).toBe(
      "Dublin and London are on the same time"
    );
    expect(formatDurationMinutes(60)).toBe("1 hour");
  });
});

describe("observesDst", () => {
  it("knows which zones change clocks", () => {
    expect(observesDst("America/New_York", 2026)).toBe(true);
    expect(observesDst("Asia/Kolkata", 2026)).toBe(false);
    expect(observesDst("Asia/Tokyo", 2026)).toBe(false);
  });
});

describe("searchCities", () => {
  it("ranks prefix matches first and excludes chosen cities", () => {
    const results = searchCities("lon");
    expect(results[0].name).toBe("London");
    expect(searchCities("lon", ["London"]).some((c) => c.name === "London")).toBe(false);
  });
  it("matches on country and timezone", () => {
    expect(searchCities("IN").every((c) => c.country === "IN" || c.name.toLowerCase().includes("in") || c.timezone.toLowerCase().includes("in"))).toBe(true);
    expect(searchCities("kolkata").some((c) => c.name === "Mumbai")).toBe(true);
  });
  it("returns everything for an empty query", () => {
    expect(searchCities("").length).toBeGreaterThan(200);
  });
});
