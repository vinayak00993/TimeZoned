import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { logoDataUri } from "@/lib/logo";

export const alt = "TimeZoned: time zone converter and meeting planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLUMNS = [
  { city: "San Francisco", time: "9:00 AM" },
  { city: "London", time: "5:00 PM" },
  { city: "Mumbai", time: "10:30 PM" },
  { city: "Tokyo", time: "2:00 AM" },
];

export default async function Image() {
  const logo = await logoDataUri();
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36 }}>
          { }
          <img src={logo} width={44} height={44} alt="" />
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 68, lineHeight: 1.1 }}>Find a time that works for everyone.</div>
          <div style={{ fontSize: 30, color: "#7A5C33" }}>
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
                background: "rgba(255,245,220,0.75)",
                border: "2px solid rgba(230,196,127,0.9)",
              }}
            >
              <div style={{ fontSize: 24, color: "#7A5C33" }}>{c.city}</div>
              <div style={{ fontSize: 40 }}>{c.time}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
