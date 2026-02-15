"use client";

import { useSubscription } from "@/contexts/SubscriptionContext";

interface SponsorBannerProps {
  placement: string;
  variant?: "inline" | "card";
}

export function SponsorBanner({ placement, variant = "inline" }: SponsorBannerProps) {
  const { isPro } = useSubscription();

  if (isPro) return null;

  if (variant === "card") {
    return (
      <div
        data-placement={placement}
        className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-dark-card to-dark-card px-5 py-10 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_70%)]" />
        <div className="relative">
          <span className="mb-4 inline-block rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/80">
            Sponsored
          </span>
          <p className="text-[14px] font-medium text-text-primary/80">
            Your brand here
          </p>
          <p className="mt-1 text-[12px] text-text-tertiary">
            Reach crypto builders and product teams
          </p>
          <a
            href="mailto:hello@darkscreens.xyz?subject=Sponsorship"
            className="mt-4 inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 font-mono text-[11px] text-amber-400/70 transition-colors hover:border-amber-500/40 hover:text-amber-300"
          >
            Learn more &rarr;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      data-placement={placement}
      className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-dark-card to-dark-card px-6 py-5"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(245,158,11,0.06),transparent_60%)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/80">
            Sponsored
          </span>
          <p className="text-[13px] text-text-secondary">
            Your brand here — reach crypto builders and product teams
          </p>
        </div>
        <a
          href="mailto:hello@darkscreens.xyz?subject=Sponsorship"
          className="shrink-0 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 font-mono text-[11px] text-amber-400/70 transition-colors hover:border-amber-500/40 hover:text-amber-300"
        >
          Learn more &rarr;
        </a>
      </div>
    </div>
  );
}
