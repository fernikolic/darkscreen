"use client";

import Link from "next/link";

interface PaywallOverlayProps {
  message?: string;
}

export function PaywallOverlay({
  message = "Upgrade to Pro for full access to all screens and change history.",
}: PaywallOverlayProps) {
  return (
    <div className="relative">
      {/* Gradient blur overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/95 to-transparent" />

      {/* CTA card */}
      <div className="relative z-10 flex flex-col items-center py-16 text-center">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-accent-gold">
          Pro Feature
        </p>
        <p className="max-w-sm text-[14px] leading-relaxed text-text-secondary">
          {message}
        </p>
        <Link
          href="/#pricing"
          className="mt-6 inline-flex items-center gap-2 border border-accent-gold bg-accent-gold/10 px-6 py-3 text-[13px] font-medium text-accent-gold transition-colors hover:bg-accent-gold/20"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
