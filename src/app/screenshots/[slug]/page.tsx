import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apps } from "@/data/apps";
import { toSlug } from "@/data/seo";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
import { EmailCapture } from "@/components/EmailCapture";
import { screenshotUrl } from "@/lib/screenshot-url";

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

  const title = `${app.name} Screenshots — UI Design & Screens`;
  const description = `Browse ${app.screenCount} screenshots from ${app.name}. See every screen, flow, and UI pattern in this ${app.category.toLowerCase()} product. Updated ${app.lastUpdated}.`;

  return {
    title: `${title} — Darkscreens`,
    description,
    openGraph: {
      title,
      description,
      url: `https://darkscreens.xyz/screenshots/${slug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function ScreenshotsPage({ params }: PageProps) {
  const { slug } = await params;
  const app = apps.find((a) => a.slug === slug);

  if (!app) notFound();

  // Group screens by flow
  const byFlow = new Map<string, typeof app.screens>();
  for (const screen of app.screens) {
    const list = byFlow.get(screen.flow) || [];
    list.push(screen);
    byFlow.set(screen.flow, list);
  }

  // Related apps for cross-linking
  const relatedApps = apps
    .filter((a) => a.slug !== slug && a.category === app.category)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Darkscreens", url: "https://darkscreens.xyz" },
          { name: "Library", url: "https://darkscreens.xyz/library" },
          { name: app.name, url: `https://darkscreens.xyz/library/${app.slug}` },
          { name: "Screenshots", url: `https://darkscreens.xyz/screenshots/${app.slug}` },
        ]}
      />
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
          Screenshots
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {app.name} Screenshots
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Every screen from {app.name}, organized by user flow.
          {app.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {app.screenCount}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              screens
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {app.flows.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              flows
            </span>
          </div>
          <div>
            <span className="block text-[14px] font-medium text-text-primary">
              {app.lastUpdated}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              updated
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/library/${app.slug}`}
            className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
          >
            Full profile
          </Link>
          <Link
            href={`/changelog/${app.slug}`}
            className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
          >
            Changelog
          </Link>
          <Link
            href={`/alternatives/${app.slug}`}
            className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
          >
            Alternatives
          </Link>
          <Link
            href={`/category/${toSlug(app.category)}`}
            className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
          >
            {app.category}
          </Link>
        </div>
      </div>

      {/* Screenshots by flow */}
      {Array.from(byFlow.entries()).map(([flow, screens]) => {
        const sorted = [...screens].sort((a, b) => a.step - b.step);
        const firstLabel = sorted[0]?.label;
        const lastLabel = sorted[sorted.length - 1]?.label;
        return (
        <section key={flow} className="mb-10 border-t border-dark-border pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              {flow}
            </h2>
            <Link
              href={`/flows/${toSlug(flow)}`}
              className="text-[12px] text-text-tertiary transition-colors hover:text-white"
            >
              Compare {flow.toLowerCase()} flows &rarr;
            </Link>
          </div>
          <p className="mb-6 text-[12px] text-text-tertiary">
            {screens.length} step{screens.length !== 1 ? "s" : ""}{firstLabel && lastLabel && screens.length > 1 ? ` — from "${firstLabel}" to "${lastLabel}"` : ""}.
          </p>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {screens.sort((a, b) => a.step - b.step).map((screen, i) => (
              <div key={`${flow}-${screen.step}-${i}`} className="overflow-hidden border border-dark-border bg-dark-card">
                <div className="relative aspect-[9/16] bg-dark-bg">
                  {screen.image ? (
                    <Image
                      src={screenshotUrl(screen.image)!}
                      alt={`${app.name} ${flow} — ${screen.label}`}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3">
                      <span className="text-center text-[10px] text-text-tertiary">
                        {screen.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dark-border p-2">
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-text-tertiary">
                    {screen.label}
                  </p>
                  {screen.tags && screen.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {screen.tags.slice(0, 2).map((tag) => (
                        <Link
                          key={tag}
                          href={`/design/${toSlug(tag)}`}
                          className="bg-dark-bg px-1 py-0.5 font-mono text-[8px] uppercase tracking-wider text-text-tertiary transition-colors hover:text-white"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        );
      })}

      {app.screens.length === 0 && (
        <section className="mb-12 border-t border-dark-border pt-8">
          <div className="py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
              Screenshots coming soon
            </p>
            <p className="mt-3 text-[13px] text-text-secondary">
              We&apos;re adding screenshots for {app.name}. Get notified when they&apos;re ready.
            </p>
            <div className="mt-6 flex justify-center">
              <EmailCapture source={`screenshots-${slug}`} />
            </div>
          </div>
        </section>
      )}

      {/* Related apps */}
      {relatedApps.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-10">
          <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
            More {app.category.toLowerCase()} screenshots
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedApps.map((a) => (
              <Link
                key={a.slug}
                href={`/screenshots/${a.slug}`}
                className="group border border-dark-border p-4 transition-all hover:border-white/20"
              >
                <h3 className="text-[13px] font-medium text-text-primary group-hover:text-white">
                  {a.name} Screenshots
                </h3>
                <span className="mt-1 block font-mono text-[11px] text-text-tertiary">
                  {a.screenCount} screens
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get notified when we capture new {app.name} screens
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We re-crawl {app.name} weekly and track every UI change.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`screenshots-${slug}-cta`} />
        </div>
      </section>
    </div>
  );
}
