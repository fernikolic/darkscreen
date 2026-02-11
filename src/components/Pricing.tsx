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
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-4 text-zinc-400">
            Start free. Upgrade when you need history and alerts.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-8 transition-all card-glow ${
                tier.highlighted
                  ? "border-accent-blue/30 bg-accent-blue/5"
                  : "border-dark-border bg-dark-card"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent-blue px-3 py-1 text-xs font-semibold text-dark-bg">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="font-mono text-4xl font-bold text-white">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="ml-1 text-sm text-zinc-500">
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-zinc-400">{tier.description}</p>
              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-zinc-300"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-accent-blue"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {tier.name === "Free" ? (
                  <a
                    href="#get-access"
                    className="block rounded-lg border border-dark-border bg-dark-hover py-3 text-center text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-600 hover:text-white"
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
