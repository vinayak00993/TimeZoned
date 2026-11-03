import { ImageResponse } from "next/og";
import { logoDataUri } from "@/lib/logo";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default async function Icon() {
  const src = await logoDataUri();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={48} height={48} alt="" />
      </div>
    ),
    size
  );
}
