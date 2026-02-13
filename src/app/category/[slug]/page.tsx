import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, type AppCategory, CATEGORY_COLORS } from "@/data/apps";
import { toSlug, fromSlug, CATEGORY_META, getAppsByCategory, getComparisonPairs } from "@/data/seo";
import { EmailCapture } from "@/components/EmailCapture";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: toSlug(c) }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) return {};

  return {
    title: `${meta.title} — Darkscreen`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://darkscreens.xyz/category/${slug}`,
      siteName: "Darkscreen",
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categoryName = fromSlug(slug, CATEGORIES as unknown as string[]) as AppCategory | undefined;

  if (!categoryName) notFound();

  const meta = CATEGORY_META[slug];
  const categoryApps = getAppsByCategory(categoryName);
  const accentColor = CATEGORY_COLORS[categoryName];
  const detailedApps = categoryApps.filter((a) => a.detailed);
  const otherCategories = CATEGORIES.filter((c) => toSlug(c) !== slug);

  // Get some comparison pairs for this category
  const pairs = getComparisonPairs()
    .filter((p) => p.appA.category === categoryName)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
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
          Category
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {meta?.plural || categoryName}
        </h1>
        {meta && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            {meta.intro}
          </p>
        )}
        <div className="mt-4 flex gap-6">
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {categoryApps.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              products
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {categoryApps.reduce((sum, a) => sum + a.screenCount, 0)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              screens
            </span>
          </div>
        </div>
      </div>

      {/* App grid */}
      <section className="mb-12 border-t border-dark-border pt-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryApps.map((app) => {
            const hasScreens = app.screens.length > 0;
            return (
              <Link
                key={app.slug}
                href={`/library/${app.slug}`}
                className="group block"
              >
                <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
                  <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
                    {app.thumbnail ? (
                      <Image
                        src={app.thumbnail}
                        alt={`${app.name} screenshot`}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                          {app.name}
                        </span>
                        <div className="flex w-full max-w-[100px] flex-col gap-1.5">
                          <div className="h-px w-full bg-dark-border" />
                          <div className="h-px w-4/5 bg-dark-border" />
                          <div className="h-px w-3/5 bg-dark-border" />
                        </div>
                      </div>
                    )}
                    {!hasScreens && (
                      <div className="absolute left-3 top-3 z-10">
                        <span className="rounded bg-dark-bg/80 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-wider text-text-tertiary backdrop-blur-sm">
                          Coming Soon
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="border-b border-white/25 pb-0.5 text-[13px] font-medium text-white">
                        {hasScreens ? "Explore Screens" : "Coming Soon"}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-dark-border p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-medium text-text-primary">{app.name}</h3>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="font-mono text-[11px] text-text-tertiary">
                        {app.screenCount} screens
                      </span>
                      <span className="text-dark-border">/</span>
                      <span className="text-[11px] text-text-tertiary">{app.chains[0]}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Head-to-head comparisons */}
      {pairs.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-10">
          <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
            Head-to-head comparisons
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map((p) => (
              <Link
                key={p.slug}
                href={`/compare/${p.slug}`}
                className="group border border-dark-border p-4 transition-all hover:border-white/20"
              >
                <span className="text-[13px] font-medium text-text-primary group-hover:text-white">
                  {p.appA.name} vs {p.appB.name}
                </span>
                <p className="mt-1 text-[11px] text-text-tertiary">
                  Compare screens and flows
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other categories */}
      <section className="mb-12 border-t border-dark-border pt-10">
        <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
          Other categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCategories.map((c) => (
            <Link
              key={c}
              href={`/category/${toSlug(c)}`}
              className="border border-dark-border px-3 py-2 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get notified when we add new {(meta?.plural || categoryName).toLowerCase()}
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We track {categoryApps.length} {(meta?.plural || categoryName).toLowerCase()} and update screenshots weekly.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`category-${slug}`} />
        </div>
      </section>
    </div>
  );
}
