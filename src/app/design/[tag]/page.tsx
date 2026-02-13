import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ELEMENT_TAGS } from "@/data/apps";
import { getElementTagPages, toSlug, fromSlug, ELEMENT_TAG_META } from "@/data/seo";
import { EmailCapture } from "@/components/EmailCapture";

export function generateStaticParams() {
  return getElementTagPages().map((p) => ({ tag: p.slug }));
}

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const meta = ELEMENT_TAG_META[tagSlug];
  const tagName = fromSlug(tagSlug, ELEMENT_TAGS as unknown as string[]);

  if (!meta || !tagName) return {};

  return {
    title: `${meta.title} — Darkscreen`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://darkscreens.xyz/design/${tagSlug}`,
      siteName: "Darkscreen",
      type: "website",
    },
  };
}

export default async function ElementTagPage({ params }: PageProps) {
  const { tag: tagSlug } = await params;
  const pages = getElementTagPages();
  const page = pages.find((p) => p.slug === tagSlug);
  const tagName = fromSlug(tagSlug, ELEMENT_TAGS as unknown as string[]);

  if (!page || !tagName) notFound();

  const meta = ELEMENT_TAG_META[tagSlug];
  const otherTags = pages.filter((p) => p.slug !== tagSlug).slice(0, 8);

  // Group screens by app
  const byApp = new Map<string, typeof page.screens>();
  for (const screen of page.screens) {
    const list = byApp.get(screen.appSlug) || [];
    list.push(screen);
    byApp.set(screen.appSlug, list);
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
          UI Pattern
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {tagName}
        </h1>
        {meta && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            {meta.description}
          </p>
        )}
        <div className="mt-4 flex gap-6">
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {page.screens.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              screens
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {page.appCount}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              apps
            </span>
          </div>
        </div>
      </div>

      {/* Screens grouped by app */}
      {Array.from(byApp.entries()).map(([appSlug, screens]) => (
        <section key={appSlug} className="mb-12 border-t border-dark-border pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link
                href={`/library/${appSlug}`}
                className="font-heading text-lg font-semibold text-text-primary transition-colors hover:text-white"
              >
                {screens[0].appName}
              </Link>
              <span className="ml-3 font-mono text-[11px] text-text-tertiary">
                {screens.length} screen{screens.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Link
              href={`/library/${appSlug}`}
              className="text-[12px] text-text-tertiary transition-colors hover:text-white"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {screens.map((screen, i) => (
              <div key={`${screen.appSlug}-${screen.flow}-${screen.step}-${i}`} className="group">
                <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
                  <div className="relative aspect-[9/16] overflow-hidden bg-dark-bg">
                    {screen.image ? (
                      <Image
                        src={screen.image}
                        alt={`${screen.appName} — ${screen.label}`}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center p-4">
                        <span className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                          {screen.appName}
                        </span>
                        <span className="text-center text-[11px] text-text-tertiary">
                          {screen.label}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dark-border p-3">
                    <p className="line-clamp-2 text-[12px] leading-relaxed text-text-tertiary">
                      {screen.label}
                    </p>
                    <span className="mt-1 inline-block bg-dark-bg px-2 py-0.5 font-mono text-[10px] text-text-tertiary">
                      {screen.flow}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Related patterns */}
      {otherTags.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-10">
          <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
            More UI patterns
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherTags.map((t) => (
              <Link
                key={t.slug}
                href={`/design/${t.slug}`}
                className="border border-dark-border px-3 py-2 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
              >
                {t.tag}
                <span className="ml-2 font-mono text-[10px] text-text-tertiary/60">
                  {t.screens.length}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get notified when we add new {tagName} examples
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We track 35+ crypto products and update screenshots weekly.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`design-${tagSlug}`} />
        </div>
      </section>
    </div>
  );
}
