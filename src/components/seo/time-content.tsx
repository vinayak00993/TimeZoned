import Link from "next/link";
import type { City } from "@/data/cities";
import { bestWindows, buildSlots, formatSlotTime, classifyHour, hourInZone } from "@/lib/slots";
import { citySlug, hubCities, pairSlug, pairsFor } from "@/lib/slugs";
import {
  describeDifference,
  formatDurationMinutes,
  formatUtcOffset,
  observesDst,
  offsetDifferenceMinutes,
  timezoneLongName,
} from "@/lib/time-utils";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";

/* ---------- shared pieces ---------- */

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground hover:underline">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-10">
      <h2 className="mb-3 font-heading text-xl font-medium sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export function PairLinks({ title, pairs }: { title: string; pairs: { from: City; to: City }[] }) {
  if (pairs.length === 0) return null;
  return (
    <nav aria-label={title} className="mt-6">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {pairs.map(({ from, to }) => (
          <li key={pairSlug(from, to)}>
            <Link href={`/time/${pairSlug(from, to)}`} className="hover:text-accent-warm hover:underline">
              {from.name} to {to.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- facts used by both pages and metadata ---------- */

export interface PairFacts {
  now: Date;
  diffMinutes: number;
  sentence: string;
  seasonal: string | null;
  fromDst: boolean;
  toDst: boolean;
  fromOffset: string;
  toOffset: string;
  fromName: string;
  toName: string;
  bestSentence: string;
  bestQuality: "work" | "awake" | null;
}

export function pairFacts(from: City, to: City, now = new Date()): PairFacts {
  const year = now.getUTCFullYear();
  const jan = new Date(Date.UTC(year, 0, 15));
  const jul = new Date(Date.UTC(year, 6, 15));
  const diffMinutes = offsetDifferenceMinutes(from.timezone, to.timezone, now);
  const diffJan = offsetDifferenceMinutes(from.timezone, to.timezone, jan);
  const diffJul = offsetDifferenceMinutes(from.timezone, to.timezone, jul);
  const sentence = describeDifference(from.name, from.timezone, to.name, to.timezone, now);
  const fromDst = observesDst(from.timezone, year);
  const toDst = observesDst(to.timezone, year);

  let seasonal: string | null = null;
  if (diffJan !== diffJul) {
    const word = (m: number) => `${formatDurationMinutes(m)} ${m > 0 ? "ahead" : "behind"}`;
    seasonal = `The gap changes with daylight saving time: in January ${to.name} is ${word(diffJan)}, in July it is ${word(diffJul)}.`;
  }

  const todayStr = formatInTimeZone(now, from.timezone, "yyyy-MM-dd");
  const slots = buildSlots(todayStr, from.timezone, 60);
  const windows = bestWindows(slots, [from.timezone, to.timezone], 1);
  let bestSentence = `There is no hour when both ${from.name} and ${to.name} are awake and at work, so one side will need an early or late call.`;
  let bestQuality: PairFacts["bestQuality"] = null;
  if (windows.length > 0) {
    const w = windows[0];
    bestQuality = w.quality;
    const start = slots[w.startIndex];
    const endHour = (w.endIndex + 1) % 24;
    const fromRange = `${formatSlotTime(start.hour, 0)} to ${formatSlotTime(endHour, 0)}`;
    const toStart = formatInTimeZone(start.utc, to.timezone, "h:mm a");
    const toEnd = formatInTimeZone(new Date(slots[w.endIndex].utc.getTime() + 3_600_000), to.timezone, "h:mm a");
    bestSentence =
      w.quality === "work"
        ? `The best time for a call is between ${fromRange} in ${from.name}, which is ${toStart} to ${toEnd} in ${to.name}. Both cities are inside normal working hours (9 AM to 6 PM).`
        : `There are no shared working hours. The most comfortable window is ${fromRange} in ${from.name} (${toStart} to ${toEnd} in ${to.name}), when both cities are at least awake.`;
  }

  return {
    now,
    diffMinutes,
    sentence,
    seasonal,
    fromDst,
    toDst,
    fromOffset: formatUtcOffset(from.timezone, now),
    toOffset: formatUtcOffset(to.timezone, now),
    fromName: timezoneLongName(from.timezone, now),
    toName: timezoneLongName(to.timezone, now),
    bestSentence,
    bestQuality,
  };
}

export function pairFaq(from: City, to: City, f: PairFacts): { q: string; a: string }[] {
  return [
    { q: `What is the time difference between ${from.name} and ${to.name}?`, a: `${f.sentence}. ${from.name} is on ${f.fromName} (${f.fromOffset}) and ${to.name} is on ${f.toName} (${f.toOffset}).` },
    {
      q: `When is the best time to call ${to.name} from ${from.name}?`,
      a: f.bestSentence,
    },
    {
      q: `Does the ${from.name} to ${to.name} time difference change during the year?`,
      a: f.seasonal ?? `No. Neither ${from.name} nor ${to.name} changes its clocks, so the difference stays the same all year.`,
    },
    {
      q: `When it is 9 AM in ${from.name}, what time is it in ${to.name}?`,
      a: `When it is 9:00 AM in ${from.name}, it is ${convertAt(from, to, 9, f.now)} in ${to.name}.`,
    },
  ];
}

function convertAt(from: City, to: City, hour: number, now: Date): string {
  const todayStr = formatInTimeZone(now, from.timezone, "yyyy-MM-dd");
  const slot = buildSlots(todayStr, from.timezone, 60)[hour];
  const same = formatInTimeZone(slot.utc, to.timezone, "yyyy-MM-dd") === todayStr;
  const t = formatInTimeZone(slot.utc, to.timezone, "h:mm a");
  if (same) return t;
  return `${t} ${formatInTimeZone(slot.utc, to.timezone, "yyyy-MM-dd") > todayStr ? "the next day" : "the previous day"}`;
}

/* ---------- pair page body ---------- */

export function PairIntro({ from, to, facts }: { from: City; to: City; facts: PairFacts }) {
  return (
    <div className="mx-auto mb-5 max-w-2xl">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Time zones", href: "/time" }, { name: `${from.name} to ${to.name}` }]} />
      <h1 className="font-heading text-2xl font-medium sm:text-3xl">
        {from.name} to {to.name} time difference
      </h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        <strong className="font-medium text-foreground">{facts.sentence}.</strong> {from.name} uses {facts.fromName} ({facts.fromOffset}) and{" "}
        {to.name} uses {facts.toName} ({facts.toOffset}). {facts.seasonal ?? "Neither city changes its clocks, so the gap is the same all year."}
      </p>
    </div>
  );
}

export function PairBody({ from, to, facts }: { from: City; to: City; facts: PairFacts }) {
  const todayStr = formatInTimeZone(facts.now, from.timezone, "yyyy-MM-dd");
  const slots = buildSlots(todayStr, from.timezone, 60);
  const faq = pairFaq(from, to, facts);
  const hubs = hubCities();
  const fromPairs = hubs.filter((h) => h.name !== from.name && h.name !== to.name).slice(0, 9).map((h) => ({ from, to: h }));
  const toPairs = hubs.filter((h) => h.name !== from.name && h.name !== to.name).slice(0, 9).map((h) => ({ from: to, to: h }));

  return (
    <article className="mx-auto max-w-2xl">
      <Section title={`Best time to call ${to.name} from ${from.name}`}>
        <p className="text-sm sm:text-base">{facts.bestSentence}</p>
      </Section>

      <Section title={`${from.name} to ${to.name} conversion table`}>
        <p className="mb-3 text-sm text-muted-foreground">
          Every hour of the day in {from.name} and the matching time in {to.name}. Shaded rows fall inside working hours in both cities.
        </p>
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-card text-left">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  {from.name} ({formatInTimeZone(facts.now, from.timezone, "zzz")})
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  {to.name} ({formatInTimeZone(facts.now, to.timezone, "zzz")})
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const toHour = hourInZone(slot.utc, to.timezone);
                const bothWork = classifyHour(slot.hour) === "work" && classifyHour(toHour) === "work";
                const toDate = formatInTimeZone(slot.utc, to.timezone, "yyyy-MM-dd");
                const dayNote = toDate > todayStr ? " (next day)" : toDate < todayStr ? " (previous day)" : "";
                return (
                  <tr key={slot.index} className={cn("border-t border-border/40", bothWork && "bg-shade-work")}>
                    <td className="px-3 py-1.5">{formatSlotTime(slot.hour, 0)}</td>
                    <td className="px-3 py-1.5">
                      {formatInTimeZone(slot.utc, to.timezone, "h:mm a")}
                      <span className="text-muted-foreground">{dayNote}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Frequently asked questions">
        <dl className="space-y-4">
          {faq.map((item) => (
            <div key={item.q}>
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground sm:text-base">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Related comparisons">
        <p className="text-sm">
          <Link href={`/time/${pairSlug(to, from)}`} className="text-accent-warm hover:underline">
            {to.name} to {from.name}
          </Link>
          {" · "}
          <Link href={`/time/${citySlug(from)}`} className="text-accent-warm hover:underline">
            Current time in {from.name}
          </Link>
          {" · "}
          <Link href={`/time/${citySlug(to)}`} className="text-accent-warm hover:underline">
            Current time in {to.name}
          </Link>
        </p>
        <PairLinks title={`${from.name} and other cities`} pairs={fromPairs} />
        <PairLinks title={`${to.name} and other cities`} pairs={toPairs} />
      </Section>
    </article>
  );
}

/* ---------- city page body ---------- */

export interface CityFacts {
  now: Date;
  offset: string;
  longName: string;
  dst: boolean;
  dstSentence: string;
}

export function cityFacts(city: City, now = new Date()): CityFacts {
  const year = now.getUTCFullYear();
  const dst = observesDst(city.timezone, year);
  const winter = formatUtcOffset(city.timezone, new Date(Date.UTC(year, 0, 15)));
  const summer = formatUtcOffset(city.timezone, new Date(Date.UTC(year, 6, 15)));
  return {
    now,
    offset: formatUtcOffset(city.timezone, now),
    longName: timezoneLongName(city.timezone, now),
    dst,
    dstSentence: dst
      ? `${city.name} observes daylight saving time: ${winter} in January and ${summer} in July.`
      : `${city.name} does not observe daylight saving time, so it stays on ${winter} all year.`,
  };
}

export function CityIntro({ city, facts }: { city: City; facts: CityFacts }) {
  return (
    <div className="mx-auto mb-5 max-w-2xl">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Time zones", href: "/time" }, { name: city.name }]} />
      <h1 className="font-heading text-2xl font-medium sm:text-3xl">Current time in {city.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        {city.name}, {city.country} is on <strong className="font-medium text-foreground">{facts.longName}</strong> ({city.timezone}),{" "}
        {facts.offset}. {facts.dstSentence} Your own time zone is shown alongside so you can compare at a glance.
      </p>
    </div>
  );
}

export function CityBody({ city, facts }: { city: City; facts: CityFacts }) {
  const pairs = pairsFor(city, 15);
  return (
    <article className="mx-auto max-w-2xl">
      <Section title={`About the ${city.name} time zone`}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Time zone</dt>
            <dd className="font-medium">{facts.longName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">IANA identifier</dt>
            <dd className="font-medium">{city.timezone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">UTC offset now</dt>
            <dd className="font-medium">{facts.offset}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Daylight saving time</dt>
            <dd className="font-medium">{facts.dst ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </Section>
      <Section title={`${city.name} time difference with other cities`}>
        <PairLinks title="" pairs={pairs} />
      </Section>
    </article>
  );
}
