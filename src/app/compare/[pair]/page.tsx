import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apps } from "@/data/apps";
import { getComparisonPairs, getSharedFlows, toSlug } from "@/data/seo";
import { EmailCapture } from "@/components/EmailCapture";
import { screenshotUrl } from "@/lib/screenshot-url";

export function generateStaticParams() {
  return getComparisonPairs().map((p) => ({ pair: p.slug }));
}

interface PageProps {
  params: Promise<{ pair: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const found = getComparisonPairs().find((p) => p.slug === pair);
  if (!found) return {};

  const title = `${found.appA.name} vs ${found.appB.name} — UI Comparison`;
  const description = `Side-by-side UI comparison of ${found.appA.name} and ${found.appB.name}. Compare screens, flows, and design patterns from two ${found.appA.category.toLowerCase()} products.`;

  return {
    title: `${title} — Darkscreens`,
    description,
    openGraph: {
      title,
      description,
      url: `https://darkscreens.xyz/compare/${pair}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { pair } = await params;
  const found = getComparisonPairs().find((p) => p.slug === pair);

  if (!found) notFound();

  const { appA, appB } = found;
  const sharedFlows = getSharedFlows(appA, appB);

  // Get same-category comparisons for cross-linking
  const relatedPairs = getComparisonPairs()
    .filter((p) => p.slug !== pair && p.appA.category === appA.category)
    .slice(0, 6);

  const featureRow = (label: string, valA: string, valB: string) => (
    <tr key={label} className="border-b border-dark-border">
      <td className="py-3 pr-4 font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
        {label}
      </td>
      <td className="py-3 px-4 text-[13px] text-text-primary">{valA}</td>
      <td className="py-3 pl-4 text-[13px] text-text-primary">{valB}</td>
    </tr>
  );

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
          {appA.category} Comparison
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {appA.name} vs {appB.name}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Side-by-side comparison of two {appA.category.toLowerCase()} products.
          Compare UI patterns, screen designs, and user flows.
        </p>
      </div>

      {/* Quick stats comparison */}
      <section className="mb-12 overflow-x-auto border-t border-dark-border pt-8">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-dark-border">
              <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-tertiary" />
              <th className="pb-3 text-left text-[14px] font-semibold text-text-primary">
                <Link href={`/library/${appA.slug}`} className="transition-colors hover:text-white">
                  {appA.name}
                </Link>
              </th>
              <th className="pb-3 text-left text-[14px] font-semibold text-text-primary">
                <Link href={`/library/${appB.slug}`} className="transition-colors hover:text-white">
                  {appB.name}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {featureRow("Category", appA.category, appB.category)}
            {featureRow("Chains", appA.chains.join(", "), appB.chains.join(", "))}
            {featureRow("Screens", String(appA.screenCount), String(appB.screenCount))}
            {featureRow("Flows", appA.flows.join(", "), appB.flows.join(", "))}
            {featureRow("Styles", appA.styles.join(", "), appB.styles.join(", "))}
            {featureRow("Sections", appA.sections.join(", "), appB.sections.join(", "))}
            {featureRow("Last Updated", appA.lastUpdated, appB.lastUpdated)}
          </tbody>
        </table>
      </section>

      {/* Side-by-side screenshots for shared flows */}
      {sharedFlows.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-8">
          <h2 className="mb-8 font-heading text-xl font-semibold text-text-primary">
            Flow-by-flow comparison
          </h2>
          {sharedFlows.map((flow) => {
            const screensA = appA.screens.filter((s) => s.flow === flow);
            const screensB = appB.screens.filter((s) => s.flow === flow);
            if (screensA.length === 0 && screensB.length === 0) return null;

            return (
              <div key={flow} className="mb-10">
                <h3 className="mb-4 font-mono text-[12px] uppercase tracking-wider text-text-tertiary">
                  {flow}
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* App A screens */}
                  <div>
                    <p className="mb-3 text-[13px] font-medium text-text-secondary">
                      {appA.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {screensA.slice(0, 6).map((screen, i) => (
                        <div key={`a-${flow}-${i}`} className="overflow-hidden border border-dark-border bg-dark-card">
                          <div className="relative aspect-[9/16] bg-dark-bg">
                            {screen.image ? (
                              <Image
                                src={screenshotUrl(screen.image)!}
                                alt={`${appA.name} ${flow} — ${screen.label}`}
                                fill
                                className="object-cover object-top"
                                sizes="(max-width: 768px) 25vw, 16vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center p-2">
                                <span className="text-center text-[10px] text-text-tertiary">
                                  {screen.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* App B screens */}
                  <div>
                    <p className="mb-3 text-[13px] font-medium text-text-secondary">
                      {appB.name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {screensB.slice(0, 6).map((screen, i) => (
                        <div key={`b-${flow}-${i}`} className="overflow-hidden border border-dark-border bg-dark-card">
                          <div className="relative aspect-[9/16] bg-dark-bg">
                            {screen.image ? (
                              <Image
                                src={screenshotUrl(screen.image)!}
                                alt={`${appB.name} ${flow} — ${screen.label}`}
                                fill
                                className="object-cover object-top"
                                sizes="(max-width: 768px) 25vw, 16vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center p-2">
                                <span className="text-center text-[10px] text-text-tertiary">
                                  {screen.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Individual app links */}
      <section className="mb-12 border-t border-dark-border pt-8">
        <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
          Explore each product
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[appA, appB].map((app) => (
            <Link
              key={app.slug}
              href={`/library/${app.slug}`}
              className="group border border-dark-border p-6 transition-all hover:border-white/20"
            >
              <h3 className="text-[14px] font-medium text-text-primary group-hover:text-white">
                {app.name}
              </h3>
              <p className="mt-1 text-[12px] text-text-tertiary">{app.description}</p>
              <div className="mt-3 flex gap-4">
                <span className="font-mono text-[11px] text-text-tertiary">
                  {app.screenCount} screens
                </span>
                <span className="font-mono text-[11px] text-text-tertiary">
                  {app.flows.length} flows
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Related comparisons */}
      {relatedPairs.length > 0 && (
        <section className="mb-12 border-t border-dark-border pt-10">
          <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
            More {appA.category.toLowerCase()} comparisons
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedPairs.map((p) => (
              <Link
                key={p.slug}
                href={`/compare/${p.slug}`}
                className="border border-dark-border px-3 py-2 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
              >
                {p.appA.name} vs {p.appB.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Track design changes across crypto products
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          Get alerts when {appA.name} or {appB.name} ships UI updates.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`compare-${pair}`} />
        </div>
      </section>
    </div>
  );
}
