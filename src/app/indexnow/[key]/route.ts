/**
 * Serves the IndexNow key file at /indexnow/<key>.txt so search engines that
 * support IndexNow (Bing, Yandex, Naver, Seznam, Yep) can verify submissions
 * made by scripts/indexnow.mjs. Set INDEXNOW_KEY in the environment.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const expected = process.env.INDEXNOW_KEY;
  const requested = key.endsWith(".txt") ? key.slice(0, -4) : key;
  if (!expected || requested !== expected) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(expected, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}
