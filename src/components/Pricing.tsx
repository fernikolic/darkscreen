"use client";

import { EmailCapture } from "./EmailCapture";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Browse current screenshots for 10 apps. No history.",
    features: [
      "10 apps",
      "Current screenshots only",
      "Browse by category",
      "Basic search",
    ],
    cta: "Get Started",
    highlighted: false,
    accent: "#5a5a6e",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "Full library, 12 months of history, weekly digest.",
    features: [
      "All 50+ apps",
      "12 months of history",
      "Before/after comparisons",
      "Weekly change digest",
      "Export screenshots",
    ],
    cta: "Get Early Access",
    highlighted: true,
    accent: "#00d4ff",
  },
  {
    name: "Team",
    price: "$79",
    period: "/mo",
    description:
      "Everything in Pro + alerts, API access, custom app requests.",
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
    accent: "#8b5cf6",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative">
      <div className="precision-line" />

      <div className="mx-auto max-w-7xl px-6 py-28">
        {/* Header */}
        <div className="mb-20 text-center">
          <span className="mb-4 block font-mono text-label uppercase text-text-tertiary">
            Pricing
          </span>
          <h2 className="font-display text-display-md text-text-primary md:text-display-lg">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-body-md text-text-secondary">
            Start free. Upgrade when you need history and alerts.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`group relative rounded-2xl border p-8 transition-all duration-500 ease-out-expo ${
                tier.highlighted
                  ? "border-accent-blue/20 bg-accent-blue/[0.03]"
                  : "border-dark-border/40 bg-dark-card/50 hover:border-dark-border hover:bg-dark-card"
              }`}
            >
              {/* Highlight glow */}
              {tier.highlighted && (
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-accent-blue/10 via-transparent to-transparent opacity-60" />
              )}

              {tier.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full border border-accent-blue/20 bg-dark-bg px-3 py-1 font-mono text-[10px] font-medium text-accent-blue">
                  Most Popular
                </span>
              )}

              <div className="relative">
                <h3 className="text-body-md font-semibold text-text-primary">{tier.name}</h3>
                <div className="mt-5 flex items-baseline">
                  <span className="font-display text-[3rem] font-bold leading-none text-text-primary">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="ml-1.5 text-body-sm text-text-tertiary">
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-body-sm text-text-secondary">{tier.description}</p>

                <ul className="mt-8 space-y-3.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-body-sm text-text-secondary"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0"
                        style={{ color: tier.accent }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  {tier.name === "Free" ? (
                    <a
                      href="#get-access"
                      className="block rounded-xl border border-dark-border bg-dark-elevated py-3.5 text-center text-body-sm font-semibold text-text-secondary transition-all duration-300 hover:border-dark-hover hover:text-text-primary"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
