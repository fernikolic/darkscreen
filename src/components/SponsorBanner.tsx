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
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dark-border bg-dark-card/50 px-4 py-8 text-center"
      >
        <span className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">
          Sponsored
        </span>
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Your brand here — reach crypto builders
        </p>
        <a
          href="mailto:hello@darkscreens.xyz?subject=Sponsorship"
          className="mt-3 font-mono text-[11px] text-text-tertiary transition-colors hover:text-white"
        >
          Learn more &rarr;
        </a>
      </div>
    );
  }

  return (
    <div
      data-placement={placement}
      className="flex items-center justify-between rounded-xl border border-dashed border-dark-border bg-dark-card/50 px-6 py-4"
    >
      <div className="flex items-center gap-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">
          Sponsored
        </span>
        <p className="text-[13px] text-text-secondary">
          Your brand here — reach crypto builders and product teams
        </p>
      </div>
      <a
        href="mailto:hello@darkscreens.xyz?subject=Sponsorship"
        className="shrink-0 font-mono text-[11px] text-text-tertiary transition-colors hover:text-white"
      >
        Learn more &rarr;
      </a>
    </div>
  );
}
