import Link from "next/link";
import { notFound } from "next/navigation";
import { apps, CATEGORY_COLORS } from "@/data/apps";
import { ScreenshotStrip } from "@/components/ScreenshotStrip";
import { ChangeTimeline } from "@/components/ChangeTimeline";
import { EmailCapture } from "@/components/EmailCapture";

export function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

interface PageProps {
  params: { slug: string };
}

export default function AppDetail({ params }: PageProps) {
  const app = apps.find((a) => a.slug === params.slug);

  if (!app) {
    notFound();
  }

  const categoryColor = CATEGORY_COLORS[app.category];

  // Coming soon state for non-detailed apps
  if (!app.detailed) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 dot-grid opacity-15" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <Link
            href="/library"
            className="group mb-10 inline-flex items-center gap-2 text-body-sm text-text-tertiary transition-colors hover:text-text-primary"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Library
          </Link>

          <div className="py-24 text-center">
            <div
              className="mx-auto mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl border"
              style={{
                background: `${app.accentColor}08`,
                borderColor: `${app.accentColor}15`,
              }}
            >
              <span
                className="font-display text-2xl font-bold"
                style={{ color: app.accentColor }}
              >
                {app.name.charAt(0)}
              </span>
            </div>
            <h1 className="font-display text-display-md text-text-primary">{app.name}</h1>
            <span
              className="mt-4 inline-block rounded-full border px-4 py-1.5 font-mono text-[11px] font-medium"
              style={{
                background: `${categoryColor}08`,
                borderColor: `${categoryColor}15`,
                color: categoryColor,
              }}
            >
              {app.category}
            </span>
            <p className="mx-auto mt-8 max-w-md text-body-md text-text-secondary">
              We&apos;re actively capturing {app.name}. Get early access to be
              notified when full screenshots and change tracking are available.
            </p>
            <div className="mt-10 flex justify-center">
              <EmailCapture source={`app-${app.slug}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 dot-grid opacity-15" />
        <div
          className="absolute left-0 top-0 h-[400px] w-[600px] opacity-30"
          style={{
            background: `radial-gradient(circle, ${app.accentColor}08 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Back link */}
        <Link
          href="/library"
          className="group mb-10 inline-flex items-center gap-2 text-body-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Library
        </Link>

        {/* App header */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="font-display text-display-md text-text-primary">{app.name}</h1>
              <span
                className="rounded-full border px-3 py-1 font-mono text-[11px] font-medium"
                style={{
                  background: `${categoryColor}08`,
                  borderColor: `${categoryColor}15`,
                  color: categoryColor,
                }}
              >
                {app.category}
              </span>
            </div>
            <p className="mt-3 max-w-lg text-body-md text-text-secondary">{app.description}</p>
            <a
              href={app.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-body-sm text-text-ghost transition-colors hover:text-accent-blue"
            >
              {app.website.replace("https://", "")}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <span className="number-shine block font-mono text-3xl font-bold">
                {app.screenshotCount}
              </span>
              <span className="mt-1 block font-mono text-[11px] text-text-ghost">screenshots</span>
            </div>
            <div className="h-12 w-px bg-dark-border/30" />
            <div>
              <span className="block text-body-sm font-medium text-text-primary">
                {app.lastCaptured}
              </span>
              <span className="mt-1 block font-mono text-[11px] text-text-ghost">last captured</span>
            </div>
          </div>
        </div>

        {/* Screenshot filmstrip */}
        <section className="mb-12 rounded-2xl border border-dark-border/30 bg-dark-card/40 p-6 backdrop-blur-sm md:p-8">
          <h2 className="mb-6 font-display text-display-sm text-text-primary">Screenshots</h2>
          <ScreenshotStrip
            screenshots={app.screenshots}
            accentColor={app.accentColor}
            appName={app.name}
            flows={app.flows}
          />
        </section>

        {/* Change timeline */}
        <section className="mb-12 rounded-2xl border border-dark-border/30 bg-dark-card/40 p-6 backdrop-blur-sm md:p-8">
          <ChangeTimeline changes={app.changes} />
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-2xl border border-dark-border/30 bg-dark-card/40 p-8 text-center backdrop-blur-sm md:p-12">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="h-[300px] w-[300px] opacity-20"
              style={{
                background: `radial-gradient(circle, ${app.accentColor}15 0%, transparent 70%)`,
              }}
            />
          </div>
          <div className="relative">
            <p className="font-display text-display-sm text-text-primary">
              Want alerts when {app.name} ships changes?
            </p>
            <p className="mt-3 text-body-sm text-text-secondary">
              Get early access to change notifications, weekly digests, and
              before/after comparisons.
            </p>
            <div className="mt-8 flex justify-center">
              <EmailCapture source={`app-${app.slug}-cta`} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
