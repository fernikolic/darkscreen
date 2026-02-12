const steps = [
  {
    number: "01",
    title: "Search",
    description:
      "Find the screen or flow you need. Browse by app, category, chain, or UI pattern across every major crypto product.",
  },
  {
    number: "02",
    title: "Compare",
    description:
      "See how different apps solve the same problem. Compare onboarding flows, swap UIs, staking experiences side by side.",
  },
  {
    number: "03",
    title: "Ship",
    description:
      "Use real-world references to make better product decisions. Stop guessing and start designing with data.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
            How it works
          </p>
          <h2 className="font-serif text-3xl text-text-primary md:text-4xl">
            From search to shipping
          </h2>
        </div>
        <div className="grid gap-16 md:grid-cols-3 md:gap-10">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="mb-6 block font-mono text-4xl font-medium text-dark-border">
                {step.number}
              </span>
              <h3 className="mb-3 text-lg font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
