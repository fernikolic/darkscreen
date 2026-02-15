"use client";

import { useSubscription } from "@/contexts/SubscriptionContext";

interface SponsorBannerProps {
  placement: string;
  variant?: "inline" | "card";
}

const SPONSOR_URL = "https://perception.to/?ref=darkscreens";

export function SponsorBanner({ placement, variant = "inline" }: SponsorBannerProps) {
  const { isPro } = useSubscription();

  if (isPro) return null;

  if (variant === "card") {
    return (
      <a
        href={SPONSOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-placement={placement}
        className="group relative block overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-dark-card to-dark-card px-5 py-10 text-center transition-colors hover:border-amber-500/30"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_70%)]" />
        <div className="relative">
          <span className="mb-4 inline-block rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/80">
            Sponsored
          </span>
          <p className="text-[14px] font-medium text-text-primary/80">
            Perception
          </p>
          <p className="mt-1 text-[12px] text-text-tertiary">
            Track crypto narratives across 250+ media sources
          </p>
          <span className="mt-4 inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 font-mono text-[11px] text-amber-400/70 transition-colors group-hover:border-amber-500/40 group-hover:text-amber-300">
            Try Perception &rarr;
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={SPONSOR_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-placement={placement}
      className="group relative block overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-dark-card to-dark-card px-6 py-5 transition-colors hover:border-amber-500/30"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(245,158,11,0.06),transparent_60%)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/80">
            Sponsored
          </span>
          <p className="text-[13px] text-text-secondary">
            <span className="font-medium text-text-primary/80">Perception</span>
            {" "}&mdash; Track crypto narratives and sentiment across 250+ media sources
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 font-mono text-[11px] text-amber-400/70 transition-colors group-hover:border-amber-500/40 group-hover:text-amber-300">
          Try Perception &rarr;
        </span>
      </div>
    </a>
  );
}
