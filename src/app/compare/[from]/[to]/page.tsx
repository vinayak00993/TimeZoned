import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, ArrowRight } from "lucide-react";
import {
  allPairs,
  findCityBySlug,
  relation,
  conversionTable,
  toolUrl,
  popularPairs,
  type CompareCity,
} from "@/lib/compare";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { LiveClock } from "./LiveClock";

export const dynamicParams = false;
export const revalidate = 3600;

interface Params {
  from: string;
  to: string;
}

export function generateStaticParams(): Params[] {
  return allPairs().map(({ from, to }) => ({ from: from.slug, to: to.slug }));
}

function resolve(params: Params): { from: CompareCity; to: CompareCity } | null {
  const from = findCityBySlug(params.from);
  const to = findCityBySlug(params.to);
  if (!from || !to || from.slug === to.slug) return null;
  return { from, to };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const resolved = resolve(await params);
  if (!resolved) return {};
  const { from, to } = resolved;
  const rel = relation(new Date(), from, to);
  const path = `/compare/${from.slug}/${to.slug}`;
  const title = `${from.name} to ${to.name} Time Converter & Time Difference`;
  const description = rel.same
    ? `${from.name} and ${to.name} are in the same time zone. See the current time in both cities and an hour-by-hour conversion table.`
    : `${from.name} is ${rel.phrase} ${to.name}. Convert any time between ${from.name} and ${to.name}, see the current time in both, and find the best meeting times.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolved = resolve(await params);
  if (!resolved) notFound();
  const { from, to } = resolved;

  const now = new Date();
  const rel = relation(now, from, to); // `from` relative to `to`
  const rows = conversionTable(now, from, to);
  const overlapCount = rows.filter((r) => r.overlap).length;
  const related = popularPairs()
    .filter((p) => !(p.from.slug === from.slug && p.to.slug === to.slug))
    .slice(0, 6);

  const headline = rel.same
    ? `${from.name} and ${to.name} are in the same time zone`
    : `${from.name} is ${rel.phrase} ${to.name}`;

  const nineAm = rows[9];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Time zone conversions",
            item: `${SITE_URL}/compare`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${from.name} to ${to.name}`,
            item: `${SITE_URL}/compare/${from.slug}/${to.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is the time difference between ${from.name} and ${to.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: rel.same
                ? `${from.name} and ${to.name} are in the same time zone, so there is no time difference.`
                : `${from.name} is ${rel.phrase} ${to.name}.`,
            },
          },
          {
            "@type": "Question",
            name: `What time is it in ${to.name} when it is 9:00 AM in ${from.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `When it is 9:00 AM in ${from.name}, it is ${nineAm.toLabel}${
                nineAm.dayDelta > 0
                  ? " the next day"
                  : nineAm.dayDelta < 0
                    ? " the previous day"
                    : ""
              } in ${to.name}.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <header className="border-b border-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Globe className="size-5 text-accent-warm" />
            <span className="font-heading text-lg font-medium tracking-wide">
              {SITE_NAME}
            </span>
          </Link>
          <Link
            href="/compare"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            All conversions
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:px-6">
        <article className="mx-auto max-w-4xl">
          <nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/compare" className="hover:text-foreground">
              Conversions
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">
              {from.name} → {to.name}
            </span>
          </nav>

          <h1 className="font-heading text-3xl md:text-4xl font-medium tracking-wide">
            {from.name} to {to.name} Time Converter
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{headline}.</p>

          <div className="mt-6">
            <LiveClock
              zones={[
                { label: `${from.name} (${from.country})`, timezone: from.timezone },
                { label: `${to.name} (${to.country})`, timezone: to.timezone },
              ]}
            />
          </div>

          <div className="mt-5">
            <Link
              href={toolUrl(from, to)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              Open the interactive timeline
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <section className="mt-10">
            <h2 className="font-heading text-2xl font-medium tracking-wide">
              Hourly conversion: {from.name} to {to.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {overlapCount > 0
                ? `Highlighted rows mark working hours (9 AM–6 PM) that overlap in both cities — ${overlapCount} hour${overlapCount !== 1 ? "s" : ""} of overlap.`
                : "Working hours (9 AM–6 PM) do not overlap — consider early mornings or late evenings to connect."}
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary text-secondary-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">{from.name}</th>
                    <th className="px-4 py-2.5 text-left font-medium">{to.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-t border-border ${
                        r.overlap ? "bg-accent-sage/15" : ""
                      }`}
                    >
                      <td className="px-4 py-2 tabular-nums">{r.fromLabel}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {r.toLabel}
                        {r.dayDelta !== 0 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            ({r.dayDelta > 0 ? "+1 day" : "−1 day"})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Times account for daylight saving time and refresh hourly. For a
              specific date, use the{" "}
              <Link href={toolUrl(from, to)} className="text-accent-warm hover:underline">
                interactive timeline
              </Link>
              .
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-heading text-2xl font-medium tracking-wide">
              Reverse &amp; related conversions
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href={`/compare/${to.slug}/${from.slug}`}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm hover:border-accent-warm transition-colors"
              >
                {to.name} to {from.name}
              </Link>
              {related.map((p) => (
                <Link
                  key={`${p.from.slug}-${p.to.slug}`}
                  href={`/compare/${p.from.slug}/${p.to.slug}`}
                  className="rounded-lg border border-border bg-card px-4 py-3 text-sm hover:border-accent-warm transition-colors"
                >
                  {p.from.name} to {p.to.name}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
