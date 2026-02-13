import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apps } from "@/data/apps";
import { toSlug, getAlternatives } from "@/data/seo";
import { EmailCapture } from "@/components/EmailCapture";

export function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = apps.find((a) => a.slug === slug);
  if (!app) return {};

  const alts = getAlternatives(app);
  const altNames = alts.slice(0, 4).map((a) => a.name).join(", ");
  const title = `${app.name} Alternatives — ${alts.length} ${app.category} Products Compared`;
  const description = `Looking for alternatives to ${app.name}? Compare ${alts.length} ${app.category.toLowerCase()} products including ${altNames}. Side-by-side UI comparison with screenshots.`;

  return {
    title: `${title} — Darkscreen`,
    description,
    openGraph: {
      title,
      description,
      url: `https://darkscreens.xyz/alternatives/${slug}`,
      siteName: "Darkscreen",
      type: "website",
    },
  };
}

export default async function AlternativesPage({ params }: PageProps) {
  const { slug } = await params;
  const app = apps.find((a) => a.slug === slug);

  if (!app) notFound();

  const alternatives = getAlternatives(app);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <Link
        href={`/library/${app.slug}`}
        className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
        {app.name} Overview
      </Link>

      {/* Header */}
      <div className="mb-14">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Alternatives
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {app.name} Alternatives
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          {alternatives.length} {app.category.toLowerCase()} products you can compare with {app.name}.
          Browse screenshots and UI patterns from each alternative to find the right fit.
        </p>
      </div>

      {/* Comparison table */}
      <section className="mb-12 overflow-x-auto border-t border-dark-border pt-8">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="pb-3 text-left text-[13px] font-medium text-text-primary">Product</th>
              <th className="pb-3 text-left font-mono text-[11px] uppercase tracking-wider text-text-tertiary">Chains</th>
              <th className="pb-3 text-left font-mono text-[11px] uppercase tracking-wider text-text-tertiary">Screens</th>
              <th className="pb-3 text-left font-mono text-[11px] uppercase tracking-wider text-text-tertiary">Flows</th>
              <th className="pb-3 text-left font-mono text-[11px] uppercase tracking-wider text-text-tertiary">Styles</th>
              <th className="pb-3 text-left font-mono text-[11px] uppercase tracking-wider text-text-tertiary">Compare</th>
            </tr>
          </thead>
          <tbody>
            {/* Source app row */}
            <tr className="border-b border-dark-border bg-dark-card/50">
              <td className="py-3 pr-4">
                <Link href={`/library/${app.slug}`} className="text-[13px] font-medium text-white">
                  {app.name}
                </Link>
              </td>
              <td className="py-3 px-4 text-[12px] text-text-secondary">{app.chains.join(", ")}</td>
              <td className="py-3 px-4 font-mono text-[12px] text-text-secondary">{app.screenCount}</td>
              <td className="py-3 px-4 text-[12px] text-text-secondary">{app.flows.length}</td>
              <td className="py-3 px-4 text-[12px] text-text-secondary">{app.styles.slice(0, 2).join(", ")}</td>
              <td className="py-3 pl-4 text-[11px] text-text-tertiary">—</td>
            </tr>
            {/* Alternative rows */}
            {alternatives.map((alt) => {
              const [first, second] = [app.slug, alt.slug].sort();
              const compareSlug = `${first}-vs-${second}`;
              return (
                <tr key={alt.slug} className="border-b border-dark-border">
                  <td className="py-3 pr-4">
                    <Link href={`/library/${alt.slug}`} className="text-[13px] font-medium text-text-primary transition-colors hover:text-white">
                      {alt.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-text-secondary">{alt.chains.join(", ")}</td>
                  <td className="py-3 px-4 font-mono text-[12px] text-text-secondary">{alt.screenCount}</td>
                  <td className="py-3 px-4 text-[12px] text-text-secondary">{alt.flows.length}</td>
                  <td className="py-3 px-4 text-[12px] text-text-secondary">{alt.styles.slice(0, 2).join(", ")}</td>
                  <td className="py-3 pl-4">
                    <Link
                      href={`/compare/${compareSlug}`}
                      className="font-mono text-[11px] text-text-tertiary transition-colors hover:text-white"
                    >
                      Compare &rarr;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Alternative cards with thumbnails */}
      <section className="mb-12 border-t border-dark-border pt-8">
        <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
          Browse each alternative
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {alternatives.map((alt) => (
            <Link
              key={alt.slug}
              href={`/library/${alt.slug}`}
              className="group block"
            >
              <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
                <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
                  {alt.thumbnail ? (
                    <Image
                      src={alt.thumbnail}
                      alt={`${alt.name} screenshot`}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6">
                      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                        {alt.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="border-b border-white/25 pb-0.5 text-[13px] font-medium text-white">
                      Explore Screens
                    </span>
                  </div>
                </div>
                <div className="border-t border-dark-border p-4">
                  <h3 className="text-[14px] font-medium text-text-primary">{alt.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[12px] text-text-tertiary">{alt.description}</p>
                  <div className="mt-2 flex gap-3">
                    <span className="font-mono text-[11px] text-text-tertiary">{alt.screenCount} screens</span>
                    <span className="text-dark-border">/</span>
                    <span className="text-[11px] text-text-tertiary">{alt.chains[0]}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Track design changes across all {app.category.toLowerCase()} products
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          Get weekly digests comparing UI updates from {app.name} and its alternatives.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`alternatives-${slug}`} />
        </div>
      </section>
    </div>
  );
}
