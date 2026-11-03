import type { Metadata } from "next";
import { TimezoneApp } from "@/components/TimezoneApp";
import { jsonLd, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Compare up to any number of cities side by side",
    "Working hours shaded for every time zone",
    "Best meeting time suggestions",
    "Copy a time proposal in every participant's local time",
    "Daylight saving time aware",
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <h1 className="sr-only">TimeZoned: time zone converter and meeting planner</h1>
      <TimezoneApp mode="home" />
    </>
  );
}
