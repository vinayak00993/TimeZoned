import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The logo as a data URI, for ImageResponse routes (icons and social images). */
export async function logoDataUri(): Promise<string> {
  const svg = await readFile(join(process.cwd(), "src/app/icon0.svg"), "utf8");
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
