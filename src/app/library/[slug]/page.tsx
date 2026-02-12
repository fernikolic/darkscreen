import Link from "next/link";
import { notFound } from "next/navigation";
import { apps } from "@/data/apps";
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

  // Coming soon state for non-detailed apps
  if (!app.detailed) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <Link
          href="/library"
          className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">
            &larr;
          </span>
          Back to Library
        </Link>

        <div className="py-20 text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
            Coming Soon
          </p>
          <h1 className="font-display text-3xl font-bold text-text-primary">{app.name}</h1>
          <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            {app.category}
          </span>
          <p className="mx-auto mt-6 max-w-md text-[14px] text-text-secondary">
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
        className="group mb-10 inline-flex items-center gap-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">
          &larr;
        </span>
        Back to Library
      </Link>

      {/* App header */}
      <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            {app.category} / {app.chains[0]}
          </p>
          <h1 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
            {app.name}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
            {app.description}
          </p>
          <a
            href={app.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[13px] text-text-tertiary transition-colors hover:text-accent-gold"
          >
            {app.website.replace("https://", "")} &nearr;
          </a>
        </div>
        <div className="flex gap-8 sm:text-right">
          <div>
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {app.screenCount}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              screens
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
      </div>

      {/* Screenshot gallery */}
      <section className="mb-16 border-t border-dark-border pt-10">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Screens
        </p>
        <h2 className="mb-8 font-display font-semibold text-xl text-text-primary">
          UI Gallery
        </h2>
        <ScreenGallery
          screens={app.screens}
          accentColor={app.accentColor}
          appName={app.name}
          flows={app.flows}
        />
      </section>

      {/* Change timeline */}
      <section className="mb-16 border-t border-dark-border pt-10">
        <ChangeTimeline changes={app.changes} />
      </section>

      {/* CTA */}
      <section className="border-t border-dark-border pt-10 text-center">
        <p className="font-display font-semibold text-xl text-text-primary">
          Want alerts when {app.name} ships changes?
        </p>
        <p className="mt-3 text-[13px] text-text-secondary">
          Get early access to change notifications, weekly digests, and
          before/after comparisons.
        </p>
        <div className="mt-8 flex justify-center">
          <EmailCapture source={`app-${app.slug}-cta`} />
        </div>
      </section>
    </div>
  );
}
