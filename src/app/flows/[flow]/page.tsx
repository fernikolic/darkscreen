import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FLOW_TYPES, TOTAL_APPS, type FlowType } from "@/data/apps";
import { getAllFlows } from "@/data/helpers";
import { toSlug, fromSlug, FLOW_META } from "@/data/seo";
import { EmailCapture } from "@/components/EmailCapture";
import { screenshotUrl } from "@/lib/screenshot-url";

export function generateStaticParams() {
  return FLOW_TYPES.map((f) => ({ flow: toSlug(f) }));
}

interface PageProps {
  params: Promise<{ flow: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { flow: flowSlug } = await params;
  const meta = FLOW_META[flowSlug];
  if (!meta) return {};

  return {
    title: `${meta.title} — Darkscreens`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://darkscreens.xyz/flows/${flowSlug}`,
      siteName: "Darkscreens",
      type: "website",
    },
  };
}

export default async function FlowPage({ params }: PageProps) {
  const { flow: flowSlug } = await params;
  const flowName = fromSlug(flowSlug, FLOW_TYPES as unknown as string[]) as FlowType | undefined;

  if (!flowName) notFound();

  const meta = FLOW_META[flowSlug];
  const allFlows = getAllFlows().filter((f) => f.flowType === flowName);
  const otherFlows = FLOW_TYPES.filter((f) => toSlug(f) !== flowSlug);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <Link
        href="/flows"
        className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
        All Flows
      </Link>

      {/* Header */}
      <div className="mb-14">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Flow Type
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          {flowName} Flow
        </h1>
        {meta && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            {meta.intro}
          </p>
        )}
        <div className="mt-4 flex gap-6">
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {allFlows.length}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              implementations
            </span>
          </div>
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {allFlows.reduce((sum, f) => sum + f.count, 0)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              total screens
            </span>
          </div>
        </div>
      </div>

      {/* Each app's implementation of this flow */}
      {allFlows.map((flow) => (
        <section key={flow.appSlug} className="mb-10 border-t border-dark-border pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link
                href={`/library/${flow.appSlug}`}
                className="font-heading text-lg font-semibold text-text-primary transition-colors hover:text-white"
              >
                {flow.appName}
              </Link>
              <span className="ml-3 font-mono text-[11px] text-text-tertiary">
                {flow.count} step{flow.count !== 1 ? "s" : ""}
              </span>
              <span className="ml-3 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                {flow.appCategory}
              </span>
            </div>
            <Link
              href={`/library/${flow.appSlug}`}
              className="text-[12px] text-text-tertiary transition-colors hover:text-white"
            >
              View app &rarr;
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {flow.screens.map((screen, i) => (
              <div
                key={`${screen.appSlug}-${screen.step}-${i}`}
                className="w-[160px] shrink-0 overflow-hidden border border-dark-border bg-dark-card"
              >
                <div className="relative aspect-[9/16] bg-dark-bg">
                  {screen.image ? (
                    <Image
                      src={screenshotUrl(screen.image)!}
                      alt={`${screen.appName} ${flowName} — step ${screen.step}`}
                      fill
                      className="object-cover object-top"
                      sizes="160px"
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
                  <p className="line-clamp-1 text-[11px] text-text-tertiary">
                    {screen.label}
                  </p>
                  <span className="font-mono text-[10px] text-text-tertiary/60">
                    Step {screen.step}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {allFlows.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-text-tertiary">
            No {flowName.toLowerCase()} flows tracked yet.
          </p>
        </div>
      )}

      {/* Other flows */}
      <section className="mb-12 border-t border-dark-border pt-10">
        <h2 className="mb-6 font-heading text-lg font-semibold text-text-primary">
          Other flow types
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherFlows.map((f) => (
            <Link
              key={f}
              href={`/flows/${toSlug(f)}`}
              className="border border-dark-border px-3 py-2 text-[12px] text-text-tertiary transition-colors hover:border-white/20 hover:text-white"
            >
              {f}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-heading text-xl font-semibold text-text-primary">
          Get updates when new {flowName.toLowerCase()} flows are added
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          We screenshot {TOTAL_APPS}+ crypto products and track how their flows evolve.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`flow-${flowSlug}`} />
        </div>
      </section>
    </div>
  );
}
