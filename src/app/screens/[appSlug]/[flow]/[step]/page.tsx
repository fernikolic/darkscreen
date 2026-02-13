import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { apps, type ElementTag } from "@/data/apps";
import { getAllScreens, getScreenPath, type EnrichedScreen } from "@/data/helpers";

export function generateStaticParams() {
  const screens = getAllScreens();
  return screens.map((s) => ({
    appSlug: s.appSlug,
    flow: s.flow.toLowerCase(),
    step: String(s.step),
  }));
}

interface PageProps {
  params: Promise<{ appSlug: string; flow: string; step: string }>;
}

export default async function ScreenDetailPage({ params }: PageProps) {
  const { appSlug, flow, step } = await params;
  const stepNum = parseInt(step, 10);

  const app = apps.find((a) => a.slug === appSlug);
  if (!app) notFound();

  const screen = app.screens.find(
    (s) => s.flow.toLowerCase() === flow && s.step === stepNum
  );
  if (!screen) notFound();

  // Get all screens in this flow, sorted by step
  const flowScreens = app.screens
    .filter((s) => s.flow.toLowerCase() === flow)
    .sort((a, b) => a.step - b.step);

  const currentIndex = flowScreens.findIndex((s) => s.step === stepNum);
  const prevScreen = currentIndex > 0 ? flowScreens[currentIndex - 1] : null;
  const nextScreen = currentIndex < flowScreens.length - 1 ? flowScreens[currentIndex + 1] : null;

  function makeEnriched(s: typeof screen): EnrichedScreen {
    return {
      ...s!,
      appSlug: app!.slug,
      appName: app!.name,
      appCategory: app!.category,
      appChains: app!.chains,
      accentColor: app!.accentColor,
    };
  }

  const tags = screen.tags || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[13px]">
        <Link
          href="/screens"
          className="text-text-tertiary transition-colors hover:text-text-secondary"
        >
          Screens
        </Link>
        <span className="text-text-tertiary">/</span>
        <Link
          href={`/library/${appSlug}`}
          className="text-text-tertiary transition-colors hover:text-text-secondary"
        >
          {app.name}
        </Link>
        <span className="text-text-tertiary">/</span>
        <span className="text-text-tertiary">{screen.flow}</span>
        <span className="text-text-tertiary">/</span>
        <span className="text-text-primary">Step {screen.step}</span>
      </nav>

      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Screen image */}
          <div className="relative aspect-[16/10] w-full overflow-hidden border border-dark-border bg-dark-card">
            {screen.image ? (
              <Image
                src={screen.image}
                alt={`${app.name} - ${screen.label}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 70vw"
                priority
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <span className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
                  {app.name}
                </span>
                <span className="text-[14px] text-text-tertiary">
                  {screen.label}
                </span>
              </div>
            )}
          </div>

          {/* Label */}
          <h1 className="mt-6 text-[18px] font-medium leading-relaxed text-text-primary">
            {screen.label}
          </h1>

          {/* Prev / Next navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-dark-border pt-6">
            {prevScreen ? (
              <Link
                href={getScreenPath(makeEnriched(prevScreen))}
                className="group flex items-center gap-3 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
              >
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Previous</span>
                  <span className="block text-text-secondary">Step {prevScreen.step}</span>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextScreen ? (
              <Link
                href={getScreenPath(makeEnriched(nextScreen))}
                className="group flex items-center gap-3 text-right text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
              >
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-text-tertiary">Next</span>
                  <span className="block text-text-secondary">Step {nextScreen.step}</span>
                </div>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          {/* App info */}
          <div className="border border-dark-border bg-dark-card p-5">
            <Link
              href={`/library/${appSlug}`}
              className="text-[15px] font-medium text-text-primary transition-colors hover:text-accent-gold"
            >
              {app.name}
            </Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              {app.category} / {app.chains[0]}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
              {app.description}
            </p>
            <a
              href={app.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[12px] text-text-tertiary transition-colors hover:text-accent-gold"
            >
              {app.website.replace("https://", "")} &nearr;
            </a>
          </div>

          {/* Actions */}
          {screen.image && (
            <div className="mt-4 flex gap-2">
              <a
                href={screen.image}
                download={`${appSlug}-${screen.flow.toLowerCase()}-${screen.step}.png`}
                className="flex-1 border border-dark-border py-2.5 text-center text-[12px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
              >
                Download
              </a>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-6">
              <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
                Element Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: ElementTag) => (
                  <Link
                    key={tag}
                    href={`/screens?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-dark-border px-2.5 py-1 text-[10px] font-medium text-text-tertiary transition-colors hover:border-[#00d4ff]/30 hover:text-[#00d4ff]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Flow steps */}
          <div className="mt-6">
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              {screen.flow} flow ({flowScreens.length} steps)
            </span>
            <div className="space-y-1">
              {flowScreens.map((s) => {
                const isActive = s.step === stepNum;
                return (
                  <Link
                    key={s.step}
                    href={getScreenPath(makeEnriched(s))}
                    className={`flex items-center gap-3 rounded px-3 py-2 text-[12px] transition-colors ${
                      isActive
                        ? "bg-dark-bg text-text-primary"
                        : "text-text-tertiary hover:bg-dark-bg/50 hover:text-text-secondary"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {s.step}
                    </span>
                    <span className="line-clamp-1">{s.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
