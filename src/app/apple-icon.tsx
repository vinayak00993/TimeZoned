import { ImageResponse } from "next/og";
import { logoDataUri } from "@/lib/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const src = await logoDataUri();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFE5AB",
        }}
      >
        { }
        <img src={src} width={140} height={140} alt="" />
      </div>
    ),
    size
  );
}
