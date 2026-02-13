"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirectToCheckout } from "@/lib/stripe";
import { TOTAL_APPS } from "@/data/apps";

const tiers = [
  {
    name: "Free" as const,
    price: "$0",
    period: "",
    description: "Browse current screens for 10 apps.",
    features: [
      "10 apps",
      "Current screens only",
      "Browse by category",
      "Basic search",
    ],
    cta: "Get Started",
    highlighted: false,
    plan: null as null,
  },
  {
    name: "Pro" as const,
    price: "$9",
    period: "/mo",
    description: "Full library, 12 months of history, weekly digest.",
    features: [
      `All ${TOTAL_APPS}+ apps`,
      "12 months of history",
      "Before/after comparisons",
      "Weekly change digest",
      "Export screens",
    ],
    cta: "Get Pro",
    highlighted: true,
    plan: "pro" as const,
  },
  {
    name: "Team" as const,
    price: "$12",
    period: "/member/mo",
    description:
      "Everything in Pro plus alerts, API access, custom requests.",
    features: [
      "Everything in Pro",
      "Real-time change alerts",
      "API access",
      "Custom app requests",
      "Slack integration",
      "Priority support",
    ],
    cta: "Get Team",
    highlighted: false,
    plan: "team" as const,
  },
];

export function Pricing() {
  const { user } = useAuth();

  return (
    <section id="pricing" className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          {/* Beta pricing pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-white">
              Beta Pricing
            </span>
          </div>

          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
            Pricing
          </p>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-[14px] text-text-secondary">
            Start free. Upgrade when you need history and alerts.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-dark-border md:grid-cols-3">
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`relative p-10 ${
                tier.highlighted
                  ? "bg-white/[0.03]"
                  : "bg-dark-card"
              } ${i < 2 ? "md:border-r md:border-dark-border" : ""}`}
            >
              {tier.highlighted && (
                <span className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-wider text-white">
                  Popular
                </span>
              )}
              <h3 className="text-[13px] font-medium uppercase tracking-wider text-text-secondary">
                {tier.name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="font-mono text-4xl font-medium text-text-primary">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="ml-1 text-[13px] text-text-tertiary">
                    {tier.period}
                  </span>
                )}
              </div>

              {/* Urgency copy for paid tiers */}
              {tier.plan && (
                <p className="mt-2 text-[11px] text-zinc-300">
                  Lock in this price forever — goes up after beta
                </p>
              )}

              <p className="mt-3 text-[13px] text-text-secondary">
                {tier.description}
              </p>

              {/* Slots progress bar for Pro */}
              {tier.name === "Pro" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-text-tertiary">Beta slots claimed</span>
                    <span className="text-white">72%</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-dark-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-zinc-400 to-white"
                      style={{ width: "72%" }}
                    />
                  </div>
                </div>
              )}

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-[13px] text-text-secondary"
                  >
                    <span className="h-px w-3 bg-text-tertiary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                {tier.name === "Free" ? (
                  <a
                    href="/library"
                    className="block border-b border-dark-border py-3 text-center text-[13px] font-medium text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        redirectToCheckout(tier.plan!, user?.email)
                      }
                      className={`block w-full py-3 text-center text-[13px] font-medium transition-all ${
                        tier.highlighted
                          ? "border border-white/60 bg-white/10 text-white hover:bg-white/20"
                          : "border border-dark-border text-text-secondary hover:border-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {tier.cta}
                    </button>
                    <span className="flex items-center justify-center gap-1.5 text-[11px] text-text-tertiary">
                      or pay with Bitcoin
                      <span className="rounded bg-dark-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                        soon
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
