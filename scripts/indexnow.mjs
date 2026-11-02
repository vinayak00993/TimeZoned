#!/usr/bin/env node
/**
 * Submit every URL in the live sitemap to IndexNow, which feeds Bing, Yandex,
 * Naver, Seznam and Yep in one call. Google does not support IndexNow; submit
 * the sitemap in Search Console for Google.
 *
 * Usage:
 *   INDEXNOW_KEY=<key> node scripts/indexnow.mjs            # submit
 *   INDEXNOW_KEY=<key> node scripts/indexnow.mjs --dry-run  # list only
 *   SITE_URL=https://staging.example.com ...                # another host
 *
 * The same INDEXNOW_KEY must be set on the deployed site so that
 * https://<host>/indexnow/<key>.txt serves the key.
 */

const SITE_URL = (process.env.SITE_URL ?? "https://www.gettimezoned.com").replace(/\/$/, "");
const KEY = process.env.INDEXNOW_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 10_000;

if (!KEY) {
  console.error("INDEXNOW_KEY is not set. Generate one with: openssl rand -hex 16");
  process.exit(1);
}

const sitemapUrl = `${SITE_URL}/sitemap.xml`;
const res = await fetch(sitemapUrl);
if (!res.ok) {
  console.error(`Could not fetch ${sitemapUrl}: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (urls.length === 0) {
  console.error("The sitemap contained no <loc> entries.");
  process.exit(1);
}
console.log(`Found ${urls.length} URLs in ${sitemapUrl}`);

const host = new URL(SITE_URL).host;
const keyLocation = `${SITE_URL}/indexnow/${KEY}.txt`;

const keyCheck = await fetch(keyLocation);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  console.error(`The key file at ${keyLocation} is missing or does not match. Set INDEXNOW_KEY on the deployed site first.`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log(urls.slice(0, 20).join("\n") + (urls.length > 20 ? `\n… and ${urls.length - 20} more` : ""));
  process.exit(0);
}

for (let i = 0; i < urls.length; i += BATCH) {
  const urlList = urls.slice(i, i + BATCH);
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
  });
  // 200 and 202 both mean accepted.
  console.log(`Batch ${i / BATCH + 1}: submitted ${urlList.length} URLs, response ${r.status}`);
  if (r.status >= 400) {
    console.error(await r.text());
    process.exit(1);
  }
}
console.log("Done. Bing usually reflects IndexNow submissions within a day.");
