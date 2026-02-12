"use client";

import { EmailCapture } from "./EmailCapture";

const tiers = [
  {
    name: "Free",
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
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    description: "Full library, 12 months of history, weekly digest.",
    features: [
      "All 35+ apps",
      "12 months of history",
      "Before/after comparisons",
      "Weekly change digest",
      "Export screens",
    ],
    cta: "Get Early Access",
    highlighted: true,
  },
  {
    name: "Team",
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
    cta: "Get Early Access",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
            Pricing
          </p>
          <h2 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
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
                  ? "bg-accent-gold/[0.03]"
                  : "bg-dark-card"
              } ${i < 2 ? "md:border-r md:border-dark-border" : ""}`}
            >
              {tier.highlighted && (
                <span className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-wider text-accent-gold">
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
              <p className="mt-3 text-[13px] text-text-secondary">
                {tier.description}
              </p>
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
                    href="#get-access"
                    className="block border-b border-dark-border py-3 text-center text-[13px] font-medium text-text-secondary transition-colors hover:border-text-secondary hover:text-text-primary"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <EmailCapture
                    variant={tier.highlighted ? "primary" : "secondary"}
                    source={`pricing-${tier.name.toLowerCase()}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
