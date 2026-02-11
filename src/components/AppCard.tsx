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
      <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card transition-all card-glow">
        {/* Screenshot or placeholder */}
        <div
          className="relative aspect-[4/3] overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${app.accentColor}10, ${app.accentColor}25)`,
          }}
        >
          {app.thumbnail ? (
            <Image
              src={app.thumbnail}
              alt={`${app.name} screenshot`}
              fill
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <>
              {/* Fake UI chrome */}
              <div
                className="absolute inset-x-0 top-0 flex items-center gap-2 border-b px-3 py-2"
                style={{ borderColor: `${app.accentColor}15` }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: `${app.accentColor}40` }}
                />
                <div
                  className="h-1.5 w-16 rounded-full"
                  style={{ background: `${app.accentColor}20` }}
                />
              </div>

              {/* Fake content lines */}
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6">
                <span
                  className="font-mono text-xs font-medium uppercase tracking-widest"
                  style={{ color: `${app.accentColor}80` }}
                >
                  {app.name}
                </span>
                <div className="flex w-full max-w-[120px] flex-col gap-1.5">
                  <div className="h-1.5 w-full rounded-full" style={{ background: `${app.accentColor}18` }} />
                  <div className="h-1.5 w-4/5 rounded-full" style={{ background: `${app.accentColor}12` }} />
                  <div className="h-1.5 w-3/5 rounded-full" style={{ background: `${app.accentColor}08` }} />
                </div>
              </div>
            </>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/60 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="rounded-lg bg-accent-blue/10 px-4 py-2 text-sm font-medium text-accent-blue">
              {app.detailed ? "View Screenshots" : "Coming Soon"}
            </span>
          </div>
        </div>

        {/* Card info */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{app.name}</h3>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `${categoryColor}15`,
                color: `${categoryColor}`,
              }}
            >
              {app.category}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">
              {app.screenshotCount} screens
            </span>
            <span className="text-zinc-700">&middot;</span>
            <span className="text-xs text-zinc-500">
              Updated {app.lastCaptured}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
