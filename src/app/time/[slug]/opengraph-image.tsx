import { ImageResponse } from "next/og";
import { parseTimeSlug } from "@/lib/slugs";
import { formatDurationMinutes, formatUtcOffset, offsetDifferenceMinutes } from "@/lib/time-utils";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = parseTimeSlug(slug);
  const now = new Date();

  let heading = "Time zone converter";
  let sub = "Compare cities side by side";
  let cards: { label: string; value: string }[] = [];

  if (route?.kind === "city") {
    const c = route.city;
    heading = `Current time in ${c.name}`;
    sub = `${c.timezone} · ${formatUtcOffset(c.timezone, now)}`;
    cards = [{ label: c.name, value: formatInTimeZone(now, c.timezone, "h:mm a") }];
  } else if (route?.kind === "pair") {
    const { from, to } = route;
    const diff = offsetDifferenceMinutes(from.timezone, to.timezone, now);
    heading = `${from.name} to ${to.name}`;
    sub =
      diff === 0
        ? "Both cities are on the same time"
        : `${to.name} is ${formatDurationMinutes(diff)} ${diff > 0 ? "ahead of" : "behind"} ${from.name}`;
    // Show what 9 AM in `from` looks like in `to`, which is the question people actually ask.
    const todayStr = formatInTimeZone(now, from.timezone, "yyyy-MM-dd");
    const nineAm = fromZonedTime(`${todayStr}T09:00:00`, from.timezone);
    const toDate = formatInTimeZone(nineAm, to.timezone, "yyyy-MM-dd");
    const dayNote = toDate > todayStr ? " · next day" : toDate < todayStr ? " · previous day" : "";
    cards = [
      { label: from.name, value: "9:00 AM" },
      { label: `${to.name}${dayNote}`, value: formatInTimeZone(nineAm, to.timezone, "h:mm a") },
    ];
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #FFE5AB 0%, #FFF0CC 100%)",
          color: "#3B2A12",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, color: "#7A5C33" }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: "#B5542B" }} />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 72, lineHeight: 1.1 }}>{heading}</div>
          <div style={{ fontSize: 32, color: "#7A5C33" }}>{sub}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {cards.map((c) => (
            <div
              key={c.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "20px 28px",
                borderRadius: 16,
                background: "rgba(255,245,220,0.75)",
                border: "2px solid rgba(230,196,127,0.9)",
              }}
            >
              <div style={{ fontSize: 26, color: "#7A5C33" }}>{c.label}</div>
              <div style={{ fontSize: 48 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
