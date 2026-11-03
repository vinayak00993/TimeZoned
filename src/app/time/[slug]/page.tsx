import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TimezoneApp } from "@/components/TimezoneApp";
import {
  CityBody,
  CityIntro,
  PairBody,
  PairIntro,
  cityFacts,
  pairFacts,
  pairFaq,
} from "@/components/seo/time-content";
import { cities } from "@/data/cities";
import { citySlug, featuredPairs, pairSlug, parseTimeSlug } from "@/lib/slugs";
import { jsonLd, SITE_NAME, SITE_URL } from "@/lib/site";
import { formatDurationMinutes } from "@/lib/time-utils";

// Pages are prerendered for every city and the featured pairs; any other hub
// pair renders on first request and is then cached. Everything regenerates
// hourly so the offset text stays right across daylight saving changes.
export const revalidate = 3600;

export function generateStaticParams() {
  return [
    ...cities.map((city) => ({ slug: citySlug(city) })),
    ...featuredPairs().map(({ from, to }) => ({ slug: pairSlug(from, to) })),
  ];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const route = parseTimeSlug(slug);
  if (!route) return { title: "Not found" };

  if (route.kind === "city") {
    const { city } = route;
    const f = cityFacts(city);
    const title = `Current time in ${city.name}, ${city.country} (${f.offset})`;
    const description = `What time is it in ${city.name}? ${city.name} is on ${f.longName}, ${f.offset}. ${f.dstSentence} Compare ${city.name} with your own time zone.`;
    return {
      title,
      description,
      alternates: { canonical: `/time/${slug}` },
      openGraph: { title, description, url: `/time/${slug}`, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  const { from, to } = route;
  const f = pairFacts(from, to);
  const gap = f.diffMinutes === 0 ? "same time" : `${formatDurationMinutes(f.diffMinutes)} ${f.diffMinutes > 0 ? "ahead" : "behind"}`;
  const title = `${from.name} to ${to.name} time difference (${gap})`;
  const description = `${f.sentence}. See every hour side by side, the best time to call, and a ${from.name} to ${to.name} conversion table. Working hours shaded, daylight saving aware.`;
  return {
    title,
    description,
    alternates: { canonical: `/time/${slug}` },
    openGraph: { title, description, url: `/time/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TimePage({ params }: Props) {
  const { slug } = await params;
  const route = parseTimeSlug(slug);
  if (!route) notFound();

  const pageUrl = `${SITE_URL}/time/${slug}`;
  const breadcrumbs = (last: string) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Time zones", item: `${SITE_URL}/time` },
      { "@type": "ListItem", position: 3, name: last, item: pageUrl },
    ],
  });

  if (route.kind === "city") {
    const { city } = route;
    const facts = cityFacts(city);
    const structured = [
      breadcrumbs(city.name),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Current time in ${city.name}`,
        url: pageUrl,
        description: `${city.name} is on ${facts.longName} (${facts.offset}). ${facts.dstSentence}`,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        about: { "@type": "City", name: city.name, address: { "@type": "PostalAddress", addressCountry: city.country } },
      },
    ];
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
        <TimezoneApp
          mode="embed"
          addLocal
          initialZones={[{ id: "seed", timezone: city.timezone, label: city.name, country: city.country }]}
          intro={<CityIntro city={city} facts={facts} />}
        >
          <CityBody city={city} facts={facts} />
        </TimezoneApp>
      </>
    );
  }

  const { from, to } = route;
  const facts = pairFacts(from, to);
  const faq = pairFaq(from, to, facts);
  const structured = [
    breadcrumbs(`${from.name} to ${to.name}`),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <TimezoneApp
        mode="embed"
        initialZones={[
          { id: "seed-from", timezone: from.timezone, label: from.name, country: from.country },
          { id: "seed-to", timezone: to.timezone, label: to.name, country: to.country },
        ]}
        intro={<PairIntro from={from} to={to} facts={facts} />}
      >
        <PairBody from={from} to={to} facts={facts} />
      </TimezoneApp>
    </>
  );
}
