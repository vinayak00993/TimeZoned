import { describe, expect, it } from "vitest";
import { formatInTimeZone } from "date-fns-tz";
import {
  bestWindows,
  buildSlots,
  buildShareSummary,
  classifyHour,
  currentSlotIndex,
  findOverlapWindows,
  getDisplayDateString,
  needsHalfHourSlots,
} from "../slots";

describe("classifyHour", () => {
  it("splits the day into work, edge and sleep", () => {
    expect(classifyHour(9)).toBe("work");
    expect(classifyHour(17)).toBe("work");
    expect(classifyHour(18)).toBe("edge");
    expect(classifyHour(7)).toBe("edge");
    expect(classifyHour(22)).toBe("sleep");
    expect(classifyHour(3)).toBe("sleep");
  });
});

describe("buildSlots", () => {
  it("anchors every slot on the reference timezone wall clock", () => {
    const slots = buildSlots("2026-11-02", "Asia/Kolkata", 30);
    expect(slots).toHaveLength(48);
    expect(formatInTimeZone(slots[0].utc, "Asia/Kolkata", "yyyy-MM-dd HH:mm")).toBe("2026-11-02 00:00");
    expect(formatInTimeZone(slots[19].utc, "Asia/Kolkata", "HH:mm")).toBe("09:30");
    // 9:30 AM IST is 11:00 PM the previous day in New York (EST, UTC-5)
    expect(formatInTimeZone(slots[19].utc, "America/New_York", "yyyy-MM-dd HH:mm")).toBe("2026-11-01 23:00");
  });

  it("resolves each slot independently across a DST transition", () => {
    // US spring forward: 2026-03-08, clocks jump from 02:00 to 03:00 in New York
    const slots = buildSlots("2026-03-08", "America/New_York", 60);
    const london = (i: number) => formatInTimeZone(slots[i].utc, "Europe/London", "HH:mm");
    // Before the change New York is UTC-5, so 1 AM NY = 6 AM London
    expect(london(1)).toBe("06:00");
    // After the change New York is UTC-4, so 10 AM NY = 2 PM London (one offset for the day would say 3 PM)
    expect(london(10)).toBe("14:00");
  });

  it("supports hourly granularity", () => {
    const slots = buildSlots("2026-06-01", "Europe/London", 60);
    expect(slots).toHaveLength(24);
    expect(slots[23].hour).toBe(23);
    expect(slots[23].minute).toBe(0);
  });
});

describe("needsHalfHourSlots", () => {
  const at = new Date("2026-06-01T12:00:00Z");
  it("is false for whole-hour offsets", () => {
    expect(needsHalfHourSlots(["America/New_York", "Europe/London", "Asia/Tokyo"], at)).toBe(false);
  });
  it("is true when India is involved", () => {
    expect(needsHalfHourSlots(["America/New_York", "Asia/Kolkata"], at)).toBe(true);
  });
  it("is false when every zone shares the half-hour offset", () => {
    expect(needsHalfHourSlots(["Asia/Kolkata", "Asia/Colombo"], at)).toBe(false);
  });
});

describe("currentSlotIndex", () => {
  it("picks the slot containing now", () => {
    const now = new Date("2026-11-02T14:45:00Z"); // 2:45 PM London (GMT)
    expect(currentSlotIndex(now, "Europe/London", 30)).toBe(29);
    expect(currentSlotIndex(now, "Europe/London", 60)).toBe(14);
  });
});

describe("getDisplayDateString", () => {
  it("applies the day offset in the reference zone", () => {
    const now = new Date("2026-11-02T23:30:00Z"); // already Nov 3 in Tokyo
    expect(getDisplayDateString(now, 0, "Asia/Tokyo")).toBe("2026-11-03");
    expect(getDisplayDateString(now, 1, "Asia/Tokyo")).toBe("2026-11-04");
    expect(getDisplayDateString(now, 0, "America/Los_Angeles")).toBe("2026-11-02");
  });
});

describe("overlap windows", () => {
  it("finds the working-hours overlap between New York and London", () => {
    const slots = buildSlots("2026-11-02", "America/New_York", 60);
    const windows = findOverlapWindows(slots, ["America/New_York", "Europe/London"]);
    const work = windows.filter((w) => w.quality === "work");
    expect(work).toHaveLength(1);
    // 9 AM to 12 PM New York (London 2 PM to 5 PM): slots 9,10,11,12
    expect(work[0]).toMatchObject({ startIndex: 9, endIndex: 12 });
  });

  it("falls back to awake windows when there is no working overlap", () => {
    const slots = buildSlots("2026-11-02", "America/Los_Angeles", 60);
    const best = bestWindows(slots, ["America/Los_Angeles", "Asia/Kolkata"]);
    expect(best.length).toBeGreaterThan(0);
    expect(best.every((w) => w.quality === "awake")).toBe(true);
  });

  it("returns nothing for an empty zone list", () => {
    const slots = buildSlots("2026-11-02", "Europe/London", 60);
    expect(bestWindows(slots, [])).toEqual([]);
  });
});

describe("buildShareSummary", () => {
  it("describes the range in every zone", () => {
    const start = new Date("2026-11-02T14:00:00Z");
    const end = new Date("2026-11-02T16:00:00Z");
    const text = buildShareSummary(
      [
        { label: "New York", timezone: "America/New_York" },
        { label: "Mumbai", timezone: "Asia/Kolkata" },
      ],
      start,
      end
    );
    expect(text).toBe(
      "New York: 9:00 AM – 11:00 AM EST, Mon Nov 2 · Mumbai: 7:30 PM – 9:30 PM GMT+5:30, Mon Nov 2"
    );
  });
});
