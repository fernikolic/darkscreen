import Link from "next/link";
import Image from "next/image";
import { type CryptoApp } from "@/data/apps";

interface AppCardProps {
  app: CryptoApp;
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/library/${app.slug}`} className="group block">
      <div className="overflow-hidden border border-dark-border bg-dark-card transition-all card-hover">
        {/* Screenshot or placeholder */}
        <div className="relative aspect-[4/3] overflow-hidden bg-dark-bg">
          {app.thumbnail ? (
            <Image
              src={app.thumbnail}
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

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="border-b border-accent-gold/40 pb-0.5 text-[13px] font-medium text-accent-gold">
              {app.detailed ? "Explore Screens" : "Coming Soon"}
            </span>
          </div>
        </div>

        {/* Card info */}
        <div className="border-t border-dark-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-text-primary">
              {app.name}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              {app.category}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-[11px] text-text-tertiary">
              {app.screenCount} screens
            </span>
            <span className="text-dark-border">/</span>
            <span className="text-[11px] text-text-tertiary">
              {app.chains[0]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
