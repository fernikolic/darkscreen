const steps = [
  {
    number: "01",
    title: "We Capture",
    description:
      "AI-powered automation screenshots every major crypto product across their key flows — onboarding, swaps, sends, staking, and more.",
  },
  {
    number: "02",
    title: "We Detect",
    description:
      "Weekly re-crawls with visual diff analysis spot every change — new features, redesigns, copy updates, layout shifts.",
  },
  {
    number: "03",
    title: "You Decide",
    description:
      "Browse the library, follow competitors, get alerts. Make product decisions based on what the market is actually shipping.",
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
            From capture to competitive advantage in three steps.
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
