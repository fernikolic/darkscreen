import Link from "next/link";
import Image from "next/image";
import { type CryptoApp } from "@/data/apps";
import { AppLogo } from "@/components/AppLogo";
import { screenshotUrl } from "@/lib/screenshot-url";

interface AppCardProps {
  app: CryptoApp;
  bookmarkButton?: React.ReactNode;
}

export function AppCard({ app, bookmarkButton }: AppCardProps) {
  const hasScreens = app.screens.length > 0;

  const card = (
    <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
      {/* Screenshot or placeholder */}
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
            <div className="flex w-full max-w-[100px] flex-col gap-1.5">
              <div className="h-px w-full bg-dark-border" />
              <div className="h-px w-4/5 bg-dark-border" />
              <div className="h-px w-3/5 bg-dark-border" />
            </div>
          </div>
        )}

        {/* Coming Soon badge for empty apps */}
        {!hasScreens && (
          <div className="absolute left-3 top-3 z-10">
            <span className="rounded bg-dark-bg/80 px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-wider text-text-tertiary backdrop-blur-sm">
              Coming Soon
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="border-b border-white/25 pb-0.5 text-[13px] font-medium text-white">
            {hasScreens ? "Explore Screens" : "Coming Soon"}
          </span>
        </div>
      </div>

      {/* Card info */}
      <div className="border-t border-dark-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo slug={app.slug} name={app.name} size={20} />
            <h3 className="text-[14px] font-medium text-text-primary">
              {app.name}
            </h3>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
            {app.category}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          {hasScreens ? (
            <span className="font-mono text-[11px] text-text-tertiary">
              {app.screens.length} screens
            </span>
          ) : (
            <span className="font-mono text-[11px] text-text-tertiary/50">
              Screens coming soon
            </span>
          )}
          <span className="text-dark-border">/</span>
          <span className="text-[11px] text-text-tertiary">
            {app.chains[0]}
          </span>
        </div>
        {/* Platform badges */}
        {app.platforms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {app.platforms.map((platform) => (
              <span
                key={platform}
                className="rounded bg-dark-bg px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-tertiary"
              >
                {platform}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (hasScreens) {
    return (
      <div className="group relative">
        <Link href={`/library/${app.slug}`} className="block">
          {card}
        </Link>
        {bookmarkButton && (
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
            {bookmarkButton}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group relative cursor-default opacity-75">
      {card}
    </div>
  );
}
