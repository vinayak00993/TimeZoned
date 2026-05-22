import type { Metadata } from "next";
import Link from "next/link";
import { Globe } from "lucide-react";
import { compareCities, popularPairs } from "@/lib/compare";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Time Zone Converter — Compare Any Two Cities",
  description:
    "Browse time zone conversions and time differences between major world cities. Pick two cities to see the current time, an hourly conversion table, and the best meeting times.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: `Time Zone Converter — Compare Any Two Cities | ${SITE_NAME}`,
    description:
      "Browse time zone conversions and time differences between major world cities.",
    url: "/compare",
    type: "website",
  },
};

export default function CompareHubPage() {
  const popular = popularPairs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Time zone conversions",
        item: `${SITE_URL}/compare`,
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
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Globe className="size-5 text-accent-warm" />
            <span className="font-heading text-lg font-medium tracking-wide">
              {SITE_NAME}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-5xl">
          <nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Conversions</span>
          </nav>

          <h1 className="font-heading text-3xl md:text-4xl font-medium tracking-wide">
            Time Zone Converter
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Compare the time difference between major world cities. Choose a pair
            to see the current time in both, an hour-by-hour conversion table, and
            overlapping working hours for scheduling meetings.
          </p>

          <section className="mt-8">
            <h2 className="font-heading text-2xl font-medium tracking-wide">
              Popular conversions
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((p) => (
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

          <section className="mt-10">
            <h2 className="font-heading text-2xl font-medium tracking-wide">
              All conversions by city
            </h2>
            <div className="mt-4 space-y-6">
              {compareCities.map((origin) => (
                <div key={origin.slug}>
                  <h3 className="font-heading text-lg font-medium">
                    {origin.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    {compareCities
                      .filter((dest) => dest.slug !== origin.slug)
                      .map((dest) => (
                        <Link
                          key={dest.slug}
                          href={`/compare/${origin.slug}/${dest.slug}`}
                          className="hover:text-accent-warm hover:underline"
                        >
                          {dest.name}
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
