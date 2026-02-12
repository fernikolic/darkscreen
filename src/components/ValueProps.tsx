const props = [
  {
    number: "01",
    title: "Every Screen, Organized",
    description:
      "Browse screens from wallets, exchanges, bridges, and DeFi protocols. Filter by category, flow type, or chain to find exactly what you need.",
  },
  {
    number: "02",
    title: "Flows, Not Just Screens",
    description:
      "See complete user journeys from onboarding to staking. Understand how the best crypto products guide users through every step.",
  },
  {
    number: "03",
    title: "Built for Product Teams",
    description:
      "Designers find UI patterns. PMs benchmark competitors. Marketers study copy and positioning. One library for your whole team.",
  },
];

export function ValueProps() {
  return (
    <section className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-px overflow-hidden rounded-lg border border-dark-border md:grid-cols-3">
          {props.map((prop, i) => (
            <div
              key={prop.title}
              className={`bg-dark-card p-10 ${i < 2 ? "md:border-r md:border-dark-border" : ""}`}
            >
              <span className="mb-6 block font-mono text-[11px] text-text-tertiary">
                {prop.number}
              </span>
              <h3 className="mb-4 font-serif text-xl text-text-primary">
                {prop.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-text-secondary">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
