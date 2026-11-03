import { describe, expect, it } from "vitest";
import { citySlug, findCityBySlug, hubCities, HUB_CITY_NAMES, pairSlug, parseTimeSlug, slugify } from "../slugs";
import { cities } from "@/data/cities";

describe("slugify", () => {
  it("strips accents and punctuation", () => {
    expect(slugify("São Paulo")).toBe("sao-paulo");
    expect(slugify("St. Petersburg")).toBe("st-petersburg");
    expect(slugify("Washington DC")).toBe("washington-dc");
    expect(slugify("Ho Chi Minh City")).toBe("ho-chi-minh-city");
  });
});

describe("city slugs", () => {
  it("are unique across the dataset", () => {
    const slugs = cities.map(citySlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("never contain the pair separator", () => {
    expect(cities.some((c) => citySlug(c).includes("-to-"))).toBe(false);
  });
  it("round-trip through findCityBySlug", () => {
    for (const city of cities) expect(findCityBySlug(citySlug(city))?.name).toBe(city.name);
  });
  it("every hub city exists in the dataset", () => {
    expect(hubCities().map((c) => c.name)).toEqual([...HUB_CITY_NAMES]);
  });
});

describe("parseTimeSlug", () => {
  it("resolves single cities", () => {
    expect(parseTimeSlug("mumbai")).toMatchObject({ kind: "city", city: { name: "Mumbai" } });
  });
  it("resolves city pairs", () => {
    expect(parseTimeSlug("mumbai-to-new-york")).toMatchObject({
      kind: "pair",
      from: { name: "Mumbai" },
      to: { name: "New York" },
    });
    expect(parseTimeSlug("toronto-to-tokyo")).toMatchObject({ kind: "pair", from: { name: "Toronto" } });
  });
  it("rejects unknown slugs and same-city pairs", () => {
    expect(parseTimeSlug("atlantis")).toBeNull();
    expect(parseTimeSlug("london-to-london")).toBeNull();
    expect(parseTimeSlug("london-to-atlantis")).toBeNull();
  });
  it("pairSlug builds the parseable form", () => {
    const a = findCityBySlug("sao-paulo")!;
    const b = findCityBySlug("london")!;
    expect(pairSlug(a, b)).toBe("sao-paulo-to-london");
    expect(parseTimeSlug(pairSlug(a, b))).toMatchObject({ kind: "pair" });
  });
});

describe("slug collisions", () => {
  it("keeps San Jose (US) and San José (CR) apart", () => {
    expect(findCityBySlug("san-jose")?.country).toBe("US");
    expect(findCityBySlug("san-jose-cr")?.country).toBe("CR");
  });
});
