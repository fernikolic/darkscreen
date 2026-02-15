import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apps } from "@/data/apps";
import { toSlug } from "@/data/seo";
import { BreadcrumbJsonLd } from "@/components/JsonLd";
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

  const title = `${app.name} UI Changelog — Design Changes & Updates`;
  const description = `Track UI changes and design updates from ${app.name}. Visual changelog showing new features, redesigns, copy changes, and layout shifts.`;

  return {
    title: `${title} — Darkscreens`,
    description,
    openGraph: {
      title,
      description,
      url: `https://darkscreens.xyz/changelog/${slug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

const CHANGE_TYPE_COLORS: Record<string, string> = {
  "New Feature": "text-emerald-400 border-emerald-400/30",
  Redesign: "text-purple-400 border-purple-400/30",
  "Copy Change": "text-blue-400 border-blue-400/30",
  "Layout Shift": "text-amber-400 border-amber-400/30",
  Removed: "text-red-400 border-red-400/30",
};

export default async function ChangelogPage({ params }: PageProps) {
  const { slug } = await params;
  const app = apps.find((a) => a.slug === slug);

  if (!app) notFound();

  // Group changes by month
  const changesByMonth = new Map<string, typeof app.changes>();
  for (const change of app.changes) {
    const date = new Date(change.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    const list = changesByMonth.get(monthLabel) || [];
    list.push(change);
    changesByMonth.set(monthLabel, list);
  }

  // Related changelogs: same category
  const relatedApps = apps
    .filter((a) => a.slug !== slug && a.category === app.category && a.changes.length > 0)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Darkscreens", url: "https://darkscreens.xyz" },
          { name: "Library", url: "https://darkscreens.xyz/library" },
          { name: app.name, url: `https://darkscreens.xyz/library/${app.slug}` },
          { name: "Changelog", url: `https://darkscreens.xyz/changelog/${app.slug}` },
        ]}
      />
      <Link
        href={`/library/${app.slug}`}
        className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
        Back to {app.name}
      </Link>

      {/* Header */}
      <div className="mb-14">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Changelog
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {app.name} UI Changes
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Visual changelog tracking design updates, new features, and UI changes for {app.name}.
          {app.changes.length > 0 && ` ${app.changes.length} changes tracked so far.`}
        </p>
        <div className="mt-4 flex gap-6">
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {app.changes.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              changes
            </span>
          </div>
          <div>
            <span className="block text-[14px] font-medium text-text-primary">
              {app.lastUpdated}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              last updated
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/library/${app.slug}`}
            className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
          >
            View screens
          </Link>
          <Link
            href={`/category/${toSlug(app.category)}`}
            className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
          >
            {app.category}
          </Link>
          {app.chains.map((chain) => (
            <Link
              key={chain}
              href={`/chain/${toSlug(chain)}`}
              className="border border-dark-border px-3 py-1.5 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
            >
              {chain}
            </Link>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {app.changes.length > 0 ? (
        <section className="mb-12 border-t border-dark-border pt-8">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-dark-border" />

            {Array.from(changesByMonth.entries()).map(([month, changes]) => (
              <div key={month} className="mb-8">
                <h3 className="mb-4 ml-6 font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
                  {month}
                </h3>
                {changes.map((change, i) => {
                  const colors = CHANGE_TYPE_COLORS[change.type] || "text-text-tertiary border-dark-border";
                  return (
                    <div key={`${change.date}-${i}`} className="mb-4 flex gap-4">
                      {/* Dot */}
                      <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-dark-border bg-dark-bg" />
                      {/* Content */}
                      <div className="flex-1 border border-dark-border p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="font-mono text-[11px] text-text-tertiary">
                            {change.date}
                          </span>
                          <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${colors}`}>
                            {change.type}
                          </span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-text-primary">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-12 border-t border-dark-border pt-8">
          <div className="py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
              No changes tracked yet
            </p>
            <p className="mt-3 text-[13px] text-text-secondary">
              We&apos;ll start tracking UI changes for {app.name} soon.
            </p>
          </div>
        </section>
      )}

      {/* Related changelogs */}
      {relatedApps.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-10">
          <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
            Other {app.category.toLowerCase()} changelogs
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedApps.map((a) => (
              <Link
                key={a.slug}
                href={`/changelog/${a.slug}`}
                className="group border border-dark-border p-4 transition-all hover:border-white/20"
              >
                <h3 className="text-[13px] font-medium text-text-primary group-hover:text-white">
                  {a.name}
                </h3>
                <span className="mt-1 block font-mono text-[11px] text-text-tertiary">
                  {a.changes.length} change{a.changes.length !== 1 ? "s" : ""} tracked
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get alerts when {app.name} ships UI changes
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          Weekly digests and instant alerts for design changes, new features, and redesigns.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`changelog-${slug}`} />
        </div>
      </section>
    </div>
  );
}
