import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTION_TYPES, type SectionType } from "@/data/apps";
import { toSlug, fromSlug, SECTION_META, getAppsBySection } from "@/data/seo";
import { EmailCapture } from "@/components/EmailCapture";
import { screenshotUrl } from "@/lib/screenshot-url";

export function generateStaticParams() {
  return SECTION_TYPES.filter((s) => getAppsBySection(s).length > 0).map((s) => ({
    slug: toSlug(s),
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = SECTION_META[slug];
  if (!meta) return {};

  return {
    title: `${meta.title} — Darkscreens`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://darkscreens.xyz/section/${slug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const sectionName = fromSlug(slug, SECTION_TYPES as unknown as string[]) as SectionType | undefined;

  if (!sectionName) notFound();

  const meta = SECTION_META[slug];
  const sectionApps = getAppsBySection(sectionName);
  const otherSections = SECTION_TYPES.filter(
    (s) => toSlug(s) !== slug && getAppsBySection(s).length > 0
  );

  // Group by category
  const byCategory = new Map<string, typeof sectionApps>();
  for (const app of sectionApps) {
    const list = byCategory.get(app.category) || [];
    list.push(app);
    byCategory.set(app.category, list);
  }

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
          Section
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {sectionName}
        </h1>
        {meta && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            {meta.intro}
          </p>
        )}
        <div className="mt-4">
          <span className="block font-mono text-2xl font-medium text-text-primary">
            {sectionApps.length}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            products with this section
          </span>
        </div>
      </div>

      {/* Apps grouped by category */}
      {Array.from(byCategory.entries()).map(([category, catApps]) => (
        <section key={category} className="mb-10 border-t border-dark-border pt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              {category}
            </h2>
            <Link
              href={`/category/${toSlug(category)}`}
              className="text-[12px] text-text-tertiary transition-colors hover:text-white"
            >
              All {category.toLowerCase()} &rarr;
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catApps.map((app) => (
              <Link
                key={app.slug}
                href={`/library/${app.slug}`}
                className="group block"
              >
                <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
                  <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
                    {app.thumbnail ? (
                      <Image
                        src={screenshotUrl(app.thumbnail)!}
                        alt={`${app.name} screenshot`}
                        fill
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                          {app.name}
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-medium text-text-primary">{app.name}</h3>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                        {app.category}
                      </span>
                    </div>
                    <span className="mt-2 block font-mono text-[11px] text-text-tertiary">
                      {app.screenCount} screens
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Other sections */}
      <section className="mb-12 border-t border-dark-border pt-10">
        <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
          Other sections
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherSections.map((s) => (
            <Link
              key={s}
              href={`/section/${toSlug(s)}`}
              className="border border-dark-border px-3 py-2 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
            >
              {s}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get updates on {sectionName.toLowerCase()} design trends
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We track {sectionApps.length} products with {sectionName.toLowerCase()} sections.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`section-${slug}`} />
        </div>
      </section>
    </div>
  );
}
