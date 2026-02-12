import Link from "next/link";
import Image from "next/image";
import { type CryptoApp, CATEGORY_COLORS } from "@/data/apps";

interface AppCardProps {
  app: CryptoApp;
}

export function AppCard({ app }: AppCardProps) {
  const categoryColor = CATEGORY_COLORS[app.category];

  return (
    <Link href={`/library/${app.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-dark-border/60 bg-dark-card shadow-card transition-all duration-500 ease-out-expo group-hover:border-dark-border group-hover:shadow-card-hover group-hover:-translate-y-1">
        {/* Screenshot or placeholder */}
        <div
          className="relative aspect-[4/3] overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${app.accentColor}08, ${app.accentColor}18)`,
          }}
        >
          {app.thumbnail ? (
            <Image
              src={app.thumbnail}
              alt={`${app.name} screenshot`}
              fill
              className="object-cover object-top transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <>
              {/* Minimal UI chrome */}
              <div
                className="absolute inset-x-0 top-0 flex items-center gap-2 border-b px-4 py-2.5"
                style={{ borderColor: `${app.accentColor}10` }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: `${app.accentColor}30` }}
                />
                <div
                  className="h-1.5 w-14 rounded-full"
                  style={{ background: `${app.accentColor}15` }}
                />
              </div>

              {/* Content skeleton */}
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
                <span
                  className="font-mono text-label uppercase"
                  style={{ color: `${app.accentColor}60` }}
                >
                  {app.name}
                </span>
                <div className="flex w-full max-w-[100px] flex-col gap-2">
                  <div className="h-1 w-full rounded-full" style={{ background: `${app.accentColor}12` }} />
                  <div className="h-1 w-4/5 rounded-full" style={{ background: `${app.accentColor}08` }} />
                  <div className="h-1 w-3/5 rounded-full" style={{ background: `${app.accentColor}05` }} />
                </div>
              </div>
            </>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/70 opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:opacity-100">
            <span className="rounded-xl border border-accent-blue/20 bg-dark-card/80 px-5 py-2.5 text-body-sm font-medium text-accent-blue backdrop-blur-sm">
              {app.detailed ? "View Details" : "Coming Soon"}
            </span>
          </div>
        </div>

        {/* Card info */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">{app.name}</h3>
            <span
              className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium"
              style={{
                background: `${categoryColor}10`,
                color: `${categoryColor}`,
              }}
            >
              {app.category}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="font-mono text-[11px] text-text-tertiary">
              {app.screenshots.filter(s => s.image).length || app.screenshotCount} screens
            </span>
            <span className="text-text-ghost">&middot;</span>
            <span className="text-[11px] text-text-tertiary">
              {app.lastCaptured}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
