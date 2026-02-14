const props = [
  {
    number: "01",
    title: "Every Screen, Organized",
    description:
      "Browse screens from wallets, exchanges, bridges, and DeFi protocols. Filter by category, flow type, or chain to find exactly what you need.",
  },
  {
    number: "02",
    title: "Beyond Product UI",
    description:
      "Track pricing pages, marketing copy, job listings, and company pages alongside product screens. Five intelligence layers in one platform.",
  },
  {
    number: "03",
    title: "Built for Strategy Teams",
    description:
      "PMs benchmark product UI. BD teams track pricing moves. Founders monitor hiring signals. One platform for competitive intelligence.",
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
              <h3 className="mb-4 font-heading font-semibold text-xl text-text-primary">
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
