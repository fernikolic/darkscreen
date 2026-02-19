import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPatternPages, PATTERN_META, toSlug } from "@/data/seo";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/JsonLd";
import { EmailCapture } from "@/components/EmailCapture";
import { screenshotUrl } from "@/lib/screenshot-url";

export function generateStaticParams() {
  return getPatternPages().map((p) => ({ slug: p.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = PATTERN_META[slug];
  if (!meta) return {};

  return {
    title: `${meta.title} — Darkscreens`,
    description: meta.description,
    alternates: { canonical: `/patterns/${slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://darkscreens.xyz/patterns/${slug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function PatternPage({ params }: PageProps) {
  const { slug } = await params;
  const pages = getPatternPages();
  const page = pages.find((p) => p.slug === slug);

  if (!page) notFound();

  const meta = PATTERN_META[slug];
  const otherPatterns = pages.filter((p) => p.slug !== slug).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Darkscreens", url: "https://darkscreens.xyz" },
          { name: "Library", url: "https://darkscreens.xyz/library" },
          { name: `${page.category} ${page.flow}`, url: `https://darkscreens.xyz/patterns/${slug}` },
        ]}
      />
      <CollectionPageJsonLd
        name={meta?.title || `${page.category} ${page.flow} Patterns`}
        description={meta?.description || `${page.category} ${page.flow} flow patterns across crypto products.`}
        url={`https://darkscreens.xyz/patterns/${slug}`}
        itemCount={page.apps.length}
      />
      <Link
        href="/library"
        className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
        Back to Library
      </Link>

      {/* Header */}
      <div className="mb-14">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          {page.category} &middot; {page.flow} Flow
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {meta?.title || `${page.category} ${page.flow} Patterns`}
        </h1>
        {meta && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            {meta.description}
          </p>
        )}
        <div className="mt-4">
          <span className="block font-mono text-2xl font-medium text-text-primary">
            {page.apps.length}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            products with this flow
          </span>
        </div>
      </div>

      {/* Each app's implementation */}
      {page.apps.map((app) => {
        const flowScreens = app.screens
          .filter((s) => s.flow === page.flow)
          .sort((a, b) => a.step - b.step);

        return (
          <section key={app.slug} className="mb-10 border-t border-dark-border pt-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Link
                  href={`/library/${app.slug}`}
                  className="font-heading text-lg font-semibold text-text-primary transition-colors hover:text-white"
                >
                  {app.name}
                </Link>
                <span className="ml-3 font-mono text-[11px] text-text-tertiary">
                  {flowScreens.length} screen{flowScreens.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/screenshots/${app.slug}`}
                  className="text-[12px] text-text-tertiary transition-colors hover:text-white"
                >
                  All screenshots &rarr;
                </Link>
              </div>
            </div>
            {flowScreens.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-4">
                {flowScreens.map((screen, i) => (
                  <div
                    key={`${app.slug}-${screen.step}-${i}`}
                    className="w-[150px] shrink-0 overflow-hidden border border-dark-border bg-dark-card"
                  >
                    <div className="relative aspect-[9/16] bg-dark-bg">
                      {screen.image ? (
                        <Image
                          src={screenshotUrl(screen.image)!}
                          alt={`${app.name} ${page.flow} — step ${screen.step}`}
                          fill
                          className="object-cover object-top"
                          sizes="150px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2">
                          <span className="text-center text-[10px] text-text-tertiary">
                            {screen.label}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-dark-border p-2">
                      <p className="line-clamp-1 text-[10px] text-text-tertiary">
                        {screen.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-[13px] text-text-tertiary">
                {app.name} supports {page.flow.toLowerCase()} but screenshots are coming soon.
              </p>
            )}
          </section>
        );
      })}

      {/* Related patterns */}
      {otherPatterns.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-10">
          <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
            More design patterns
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherPatterns.map((p) => (
              <Link
                key={p.slug}
                href={`/patterns/${p.slug}`}
                className="border border-dark-border px-3 py-2 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
              >
                {p.category} {p.flow}
                <span className="ml-2 font-mono text-[10px] text-text-tertiary/60">
                  {p.apps.length}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get updates on {page.category.toLowerCase()} {page.flow.toLowerCase()} design
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We track {page.apps.length} products and update screenshots weekly.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`pattern-${slug}`} />
        </div>
      </section>
    </div>
  );
}
