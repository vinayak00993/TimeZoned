import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "TimeZoned: time zone converter and meeting planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLUMNS = [
  { city: "San Francisco", time: "9:00 AM" },
  { city: "London", time: "5:00 PM" },
  { city: "Mumbai", time: "10:30 PM" },
  { city: "Tokyo", time: "2:00 AM" },
];

export default function Image() {
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
          background: "linear-gradient(135deg, #FEFFCA 0%, #FAE8ED 100%)",
          color: "#2C2416",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: "#B07D6E" }} />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 68, lineHeight: 1.1 }}>Find a time that works for everyone.</div>
          <div style={{ fontSize: 30, color: "#8C7B65" }}>
            Compare cities side by side. Working hours shaded. Copy a proposal in every local time.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {COLUMNS.map((c) => (
            <div
              key={c.city}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "18px 24px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.55)",
                border: "2px solid rgba(212,132,154,0.4)",
              }}
            >
              <div style={{ fontSize: 24, color: "#8C7B65" }}>{c.city}</div>
              <div style={{ fontSize: 40 }}>{c.time}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
