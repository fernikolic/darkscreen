import Link from "next/link";
import { getAllInsights } from "@/data/helpers";

export function InsightsBanner() {
  const insights = getAllInsights();

  if (insights.length === 0) return null;

  const recent = insights.slice(0, 3);

  return (
    <section className="border-b border-dark-border bg-dark-card/30">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              This week in crypto UX
            </p>
            <p className="mt-1 text-[14px] text-text-primary">
              <span className="font-medium text-white">
                {insights.length} insight{insights.length !== 1 ? "s" : ""} generated
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              {recent.map((insight, i) => (
                <span
                  key={i}
                  className="max-w-[180px] truncate rounded-full border border-dark-border px-2.5 py-1 text-[10px] text-text-tertiary"
                >
                  {insight.title}
                </span>
              ))}
            </div>
            <Link
              href="/insights"
              className="text-[13px] font-medium text-white transition-colors hover:text-white/80"
            >
              View insights &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
