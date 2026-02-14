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
        className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-dark-card px-5 py-10 text-center"
      >
        <span className="mb-4 inline-block rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">
          Sponsored
        </span>
        <p className="text-[14px] font-medium text-text-secondary">
          Your brand here
        </p>
        <p className="mt-1 text-[12px] text-text-tertiary">
          Reach crypto builders and product teams
        </p>
        <a
          href="mailto:hello@darkscreens.xyz?subject=Sponsorship"
          className="mt-4 inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-white/20 hover:text-white"
        >
          Learn more &rarr;
        </a>
      </div>
    );
  }

  return (
    <div
      data-placement={placement}
      className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-dark-card px-6 py-5"
    >
      <div className="flex items-center gap-4">
        <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary">
          Sponsored
        </span>
        <p className="text-[13px] text-text-secondary">
          Your brand here — reach crypto builders and product teams
        </p>
      </div>
      <a
        href="mailto:hello@darkscreens.xyz?subject=Sponsorship"
        className="shrink-0 rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:border-white/20 hover:text-white"
      >
        Learn more &rarr;
      </a>
    </div>
  );
}
