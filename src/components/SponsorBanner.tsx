"use client";

import { useSubscription } from "@/contexts/SubscriptionContext";

interface SponsorBannerProps {
  placement: string;
  variant?: "inline" | "card";
}

const SPONSOR_URL = "https://perception.to/?ref=darkscreens";
const LOGO_URL = "https://perception.to/logos/perception-logo-dark.png";

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
        className="group relative block overflow-hidden rounded-xl border border-[#2a2a35] bg-[#12121a] px-5 py-8 text-center transition-all hover:border-[#4a3f6b]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,220,0.08),transparent_70%)]" />
        <div className="relative flex flex-col items-center">
          <span className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary/60">
            Sponsored
          </span>
          <img
            src={LOGO_URL}
            alt="Perception"
            className="mb-4 h-7 w-auto"
          />
          <p className="text-[12px] leading-relaxed text-text-secondary">
            Track crypto narratives across<br />250+ media sources
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-4 py-1.5 font-mono text-[11px] text-white/70 transition-all group-hover:bg-white/[0.12] group-hover:text-white/90">
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
      className="group relative block overflow-hidden rounded-xl border border-[#2a2a35] bg-[#12121a] px-6 py-4 transition-all hover:border-[#4a3f6b]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(120,80,220,0.08),transparent_60%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-tertiary/60">
            Sponsored
          </span>
          <div className="hidden h-4 w-px bg-white/[0.08] sm:block" />
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Perception"
              className="h-5 w-auto"
            />
            <p className="text-[13px] text-text-secondary">
              Track crypto narratives and sentiment across 250+ media sources
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.07] px-4 py-1.5 font-mono text-[11px] text-white/70 transition-all group-hover:bg-white/[0.12] group-hover:text-white/90">
          Try it free &rarr;
        </span>
      </div>
    </a>
  );
}
