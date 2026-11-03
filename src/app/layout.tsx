import type { Metadata, Viewport } from "next";
import { Inter, Shippori_Mincho } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Time Zone Converter & Meeting Planner`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "time zone converter",
    "time difference",
    "meeting planner",
    "world clock",
    "timezone comparison",
    "schedule across time zones",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} — Time Zone Converter & Meeting Planner`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Time Zone Converter & Meeting Planner`,
    description: SITE_DESCRIPTION,
  },
  // Paste the tokens from Search Console / Bing Webmaster Tools into the
  // GOOGLE_SITE_VERIFICATION and BING_SITE_VERIFICATION environment variables.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FEFFCA" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1810" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applies the stored theme before first paint so dark-mode visitors never see a light flash.
const themeScript = `try{if(localStorage.getItem("timezoned-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${shipporiMincho.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="relative flex min-h-full flex-col font-sans">
        {/* Cherry blossom decorative art, kept in the right margin so it never sits behind the table. */}
        <div
          className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-[calc(50vw-23rem)] max-w-[480px] overflow-hidden opacity-[0.07] lg:block dark:opacity-[0.04]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 800 900" xmlns="http://www.w3.org/2000/svg" className="absolute right-0 top-0 h-full w-auto" fill="none">
            <path d="M680 900 C660 800 620 700 580 580 C550 480 540 380 560 260 C570 190 590 130 610 80" stroke="currentColor" strokeWidth="18" strokeLinecap="round"/>
            <path d="M590 200 C540 170 480 150 410 140 C360 133 310 138 270 150" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
            <path d="M565 310 C510 290 450 275 380 268 C330 263 280 268 240 278" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
            <path d="M605 150 C640 120 690 100 740 90 C770 83 790 82 800 82" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
            <path d="M480 143 C470 120 460 95 450 68 C443 48 438 30 436 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            <path d="M380 152 C370 130 362 108 356 82" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M440 270 C430 248 422 224 418 196" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M320 272 C310 252 304 228 300 200" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <g transform="translate(268,148)">
              <circle cx="0" cy="-7" r="5" fill="currentColor"/><circle cx="7" cy="-2" r="5" fill="currentColor"/>
              <circle cx="4" cy="6" r="5" fill="currentColor"/><circle cx="-4" cy="6" r="5" fill="currentColor"/>
              <circle cx="-7" cy="-2" r="5" fill="currentColor"/><circle cx="0" cy="0" r="3" fill="currentColor" opacity="0.6"/>
            </g>
            <g transform="translate(310,138)">
              <circle cx="0" cy="-6" r="4" fill="currentColor"/><circle cx="6" cy="-2" r="4" fill="currentColor"/>
              <circle cx="4" cy="5" r="4" fill="currentColor"/><circle cx="-4" cy="5" r="4" fill="currentColor"/>
              <circle cx="-6" cy="-2" r="4" fill="currentColor"/>
            </g>
            <g transform="translate(436,10)">
              <circle cx="0" cy="-6" r="4" fill="currentColor"/><circle cx="6" cy="-2" r="4" fill="currentColor"/>
              <circle cx="4" cy="5" r="4" fill="currentColor"/><circle cx="-4" cy="5" r="4" fill="currentColor"/>
              <circle cx="-6" cy="-2" r="4" fill="currentColor"/>
            </g>
            <g transform="translate(240,278)">
              <circle cx="0" cy="-7" r="5" fill="currentColor"/><circle cx="7" cy="-2" r="5" fill="currentColor"/>
              <circle cx="4" cy="6" r="5" fill="currentColor"/><circle cx="-4" cy="6" r="5" fill="currentColor"/>
              <circle cx="-7" cy="-2" r="5" fill="currentColor"/>
            </g>
            <g transform="translate(300,200)">
              <circle cx="0" cy="-5" r="4" fill="currentColor"/><circle cx="5" cy="-2" r="4" fill="currentColor"/>
              <circle cx="3" cy="4" r="4" fill="currentColor"/><circle cx="-3" cy="4" r="4" fill="currentColor"/>
              <circle cx="-5" cy="-2" r="4" fill="currentColor"/>
            </g>
            <ellipse cx="200" cy="320" rx="5" ry="3" fill="currentColor" transform="rotate(-20 200 320)"/>
            <ellipse cx="160" cy="400" rx="5" ry="3" fill="currentColor" transform="rotate(15 160 400)"/>
            <ellipse cx="350" cy="420" rx="4" ry="2.5" fill="currentColor" transform="rotate(-35 350 420)"/>
            <ellipse cx="280" cy="490" rx="5" ry="3" fill="currentColor" transform="rotate(25 280 490)"/>
            <ellipse cx="180" cy="560" rx="4" ry="2.5" fill="currentColor" transform="rotate(-10 180 560)"/>
            <ellipse cx="400" cy="350" rx="4" ry="2.5" fill="currentColor" transform="rotate(40 400 350)"/>
          </svg>
        </div>
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
