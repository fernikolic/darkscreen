import Link from "next/link";
import { getChangeStats, getRecentChanges } from "@/data/helpers";

export function ChangeHeroBanner() {
  const stats = getChangeStats();
  const recent = getRecentChanges(3);

  if (stats.totalChanges === 0) return null;

  return (
    <section className="border-b border-dark-border bg-dark-card/50">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              Change feed
            </p>
            <p className="mt-1 text-[14px] text-text-primary">
              <span className="font-medium text-white">
                {stats.thisWeekCount > 0
                  ? `${stats.thisWeekCount} change${stats.thisWeekCount !== 1 ? "s" : ""} this week`
                  : `${stats.totalChanges} changes tracked`}
              </span>
              <span className="ml-2 text-text-secondary">
                across {stats.appsWithChanges} products
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Recent change previews */}
            <div className="hidden items-center gap-2 md:flex">
              {recent.map((c, i) => (
                <span
                  key={i}
                  className="max-w-[140px] truncate rounded-full border border-dark-border px-2.5 py-1 text-[10px] text-text-tertiary"
                >
                  {c.appName}: {c.type}
                </span>
              ))}
            </div>

            <Link
              href="/changes"
              className="text-[13px] font-medium text-white transition-colors hover:text-white/80"
            >
              View all &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
