import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STYLE_TYPES, type StyleType } from "@/data/apps";
import { toSlug, fromSlug, STYLE_META, getAppsByStyle } from "@/data/seo";
import { BreadcrumbJsonLd, CollectionPageJsonLd } from "@/components/JsonLd";
import { EmailCapture } from "@/components/EmailCapture";
import { screenshotUrl } from "@/lib/screenshot-url";

export function generateStaticParams() {
  return STYLE_TYPES.map((s) => ({ slug: toSlug(s) }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = STYLE_META[slug];
  if (!meta) return {};

  return {
    title: `${meta.title} — Darkscreens`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://darkscreens.xyz/style/${slug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function StylePage({ params }: PageProps) {
  const { slug } = await params;
  const styleName = fromSlug(slug, STYLE_TYPES as unknown as string[]) as StyleType | undefined;

  if (!styleName) notFound();

  const meta = STYLE_META[slug];
  const styleApps = getAppsByStyle(styleName);
  const otherStyles = STYLE_TYPES.filter((s) => toSlug(s) !== slug);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Darkscreens", url: "https://darkscreens.xyz" },
          { name: "Library", url: "https://darkscreens.xyz/library" },
          { name: styleName, url: `https://darkscreens.xyz/style/${slug}` },
        ]}
      />
      <CollectionPageJsonLd
        name={meta?.title || `${styleName} Apps`}
        description={meta?.description || `${styleName} products tracked by Darkscreens.`}
        url={`https://darkscreens.xyz/style/${slug}`}
        itemCount={styleApps.length}
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
          Design Style
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {styleName}
        </h1>
        {meta && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            {meta.intro}
          </p>
        )}
        <div className="mt-4">
          <span className="block font-mono text-2xl font-medium text-text-primary">
            {styleApps.length}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            products
          </span>
        </div>
      </div>

      {/* App grid */}
      <section className="mb-12 border-t border-dark-border pt-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {styleApps.map((app) => (
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
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
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
                  <div className="mt-2 flex flex-wrap gap-1">
                    {app.styles
                      .filter((s) => s !== styleName)
                      .slice(0, 3)
                      .map((s) => (
                        <span
                          key={s}
                          className="rounded bg-dark-bg px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-tertiary"
                        >
                          {s}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Showcase: featured screenshots from this style */}
      {(() => {
        const screensWithImages = styleApps
          .flatMap((app) =>
            app.screens
              .filter((s) => s.image)
              .slice(0, 3)
              .map((s) => ({ ...s, appName: app.name, appSlug: app.slug }))
          )
          .slice(0, 12);

        if (screensWithImages.length === 0) return null;

        return (
          <section className="mb-12 border-t border-dark-border pt-10">
            <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
              Screen examples
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {screensWithImages.map((screen, i) => (
                <Link
                  key={`${screen.appSlug}-${i}`}
                  href={`/library/${screen.appSlug}`}
                  className="group overflow-hidden border border-dark-border bg-dark-card transition-all hover:border-white/20"
                >
                  <div className="relative aspect-[9/16] bg-dark-bg">
                    <Image
                      src={screenshotUrl(screen.image)!}
                      alt={`${screen.appName} — ${screen.label}`}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 50vw, 16vw"
                    />
                  </div>
                  <div className="border-t border-dark-border p-2">
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {screen.appName}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Other styles */}
      <section className="mb-12 border-t border-dark-border pt-10">
        <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
          Other design styles
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherStyles.map((s) => (
            <Link
              key={s}
              href={`/style/${toSlug(s)}`}
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
          Get notified about {styleName.toLowerCase()} design trends
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We track design changes across {styleApps.length} products with this style.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`style-${slug}`} />
        </div>
      </section>
    </div>
  );
}
