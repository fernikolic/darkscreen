const steps = [
  {
    number: "01",
    title: "Search",
    description:
      "Find the screen or flow you need. Browse by app, category, or UI pattern across every major crypto product.",
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
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-zinc-400">
            From search to shipping, in three steps.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <span className="mb-4 block font-mono text-5xl font-bold text-dark-border">
                {step.number}
              </span>
              <h3 className="mb-3 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
