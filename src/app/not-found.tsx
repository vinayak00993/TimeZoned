import Link from "next/link";
import { featuredPairs, pairSlug } from "@/lib/slugs";

export default function NotFound() {
  const pairs = featuredPairs().slice(0, 6);
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-heading text-3xl font-medium">That page is in a time zone we don&apos;t know.</p>
      <p className="mt-3 text-muted-foreground">
        Try the converter, or one of these popular comparisons.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
          Open the converter
        </Link>
        {pairs.map(({ from, to }) => (
          <Link
            key={pairSlug(from, to)}
            href={`/time/${pairSlug(from, to)}`}
            className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent-warm"
          >
            {from.name} to {to.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
