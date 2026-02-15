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
        className="group relative block overflow-hidden rounded-xl border-l-2 border-l-indigo-400 border-y border-r border-y-white/10 border-r-white/10 bg-[#1a1a2e] px-5 py-8 text-center transition-all hover:bg-[#1e1e35]"
      >
        <div className="relative flex flex-col items-center">
          <span className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-indigo-400/80">
            Sponsored
          </span>
          <img
            src={LOGO_URL}
            alt="Perception"
            className="mb-4 h-7 w-auto brightness-125"
          />
          <p className="text-[13px] leading-relaxed text-zinc-300">
            Track crypto narratives across<br />250+ media sources
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-4 py-2 font-mono text-[11px] font-medium text-indigo-300 transition-all group-hover:bg-indigo-500/25 group-hover:text-indigo-200">
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
      className="group relative block overflow-hidden rounded-xl border-l-2 border-l-indigo-400 border-y border-r border-y-white/10 border-r-white/10 bg-[#1a1a2e] px-6 py-4 transition-all hover:bg-[#1e1e35]"
    >
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-indigo-400/80">
            Sponsored
          </span>
          <div className="hidden h-4 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Perception"
              className="h-5 w-auto brightness-125"
            />
            <p className="text-[13px] text-zinc-300">
              Track crypto narratives and sentiment across 250+ media sources
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-500/15 px-4 py-2 font-mono text-[11px] font-medium text-indigo-300 transition-all group-hover:bg-indigo-500/25 group-hover:text-indigo-200">
          Try it free &rarr;
        </span>
      </div>
    </a>
  );
}
