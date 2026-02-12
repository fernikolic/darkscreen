import Link from "next/link";
import { notFound } from "next/navigation";
import { apps, CATEGORY_COLORS } from "@/data/apps";
import { ScreenGallery } from "@/components/ScreenGallery";
import { ChangeTimeline } from "@/components/ChangeTimeline";
import { EmailCapture } from "@/components/EmailCapture";

export function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AppDetail({ params }: PageProps) {
  const { slug } = await params;
  const app = apps.find((a) => a.slug === slug);

  if (!app) {
    notFound();
  }

  const categoryColor = CATEGORY_COLORS[app.category];

  // Coming soon state for non-detailed apps
  if (!app.detailed) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <Link
          href="/library"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> Back to Library
        </Link>

        <div className="py-20 text-center">
          <div
            className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `${app.accentColor}15` }}
          >
            <span
              className="font-mono text-lg font-bold"
              style={{ color: app.accentColor }}
            >
              {app.name.charAt(0)}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">{app.name}</h1>
          <span
            className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            {app.category}
          </span>
          <p className="mx-auto mt-6 max-w-md text-zinc-400">
            We&apos;re adding screens for {app.name}. Get early access to be
            notified when full screens and change tracking are available.
          </p>
          <div className="mt-8 flex justify-center">
            <EmailCapture source={`app-${app.slug}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Back link */}
      <Link
        href="/library"
        className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-white"
      >
        <span aria-hidden="true">&larr;</span> Back to Library
      </Link>

      {/* App header */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{app.name}</h1>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: `${categoryColor}15`,
                color: categoryColor,
              }}
            >
              {app.category}
            </span>
          </div>
          <p className="mt-2 text-zinc-400">{app.description}</p>
          <a
            href={app.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-zinc-600 transition-colors hover:text-accent-blue"
          >
            {app.website.replace("https://", "")} &nearr;
          </a>
        </div>
        <div className="flex gap-6">
          <div>
            <span className="block font-mono text-2xl font-bold text-white">
              {app.screenCount}
            </span>
            <span className="text-xs text-zinc-500">screens</span>
          </div>
          <div>
            <span className="block text-sm font-medium text-white">
              {app.lastUpdated}
            </span>
            <span className="text-xs text-zinc-500">last updated</span>
          </div>
        </div>
      </div>

      {/* Screenshot filmstrip */}
      <section className="mb-16 rounded-xl border border-dark-border bg-dark-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-white">Screens</h2>
        <ScreenGallery
          screens={app.screens}
          accentColor={app.accentColor}
          appName={app.name}
          flows={app.flows}
        />
      </section>

      {/* Change timeline */}
      <section className="mb-16 rounded-xl border border-dark-border bg-dark-card p-6">
        <ChangeTimeline changes={app.changes} />
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-dark-border bg-dark-card p-8 text-center">
        <p className="text-lg font-medium text-white">
          Want alerts when {app.name} ships changes?
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Get early access to change notifications, weekly digests, and
          before/after comparisons.
        </p>
        <div className="mt-6 flex justify-center">
          <EmailCapture source={`app-${app.slug}-cta`} />
        </div>
      </section>
    </div>
  );
}
