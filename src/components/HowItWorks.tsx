const steps = [
  {
    number: "01",
    title: "We Capture",
    description:
      "AI-powered automation screenshots every major crypto product across their key flows — onboarding, swaps, sends, staking, and more.",
    accent: "#00d4ff",
  },
  {
    number: "02",
    title: "We Detect",
    description:
      "Weekly re-crawls with visual diff analysis spot every change — new features, redesigns, copy updates, layout shifts.",
    accent: "#8b5cf6",
  },
  {
    number: "03",
    title: "You Decide",
    description:
      "Browse the library, follow competitors, get alerts. Make product decisions based on what the market is actually shipping.",
    accent: "#34d399",
  },
];

export function HowItWorks() {
  return (
    <section className="relative">
      <div className="precision-line" />

      <div className="mx-auto max-w-7xl px-6 py-28">
        {/* Section header */}
        <div className="mb-20 text-center">
          <span className="mb-4 block font-mono text-label uppercase text-text-tertiary">
            How it works
          </span>
          <h2 className="font-display text-display-md text-text-primary md:text-display-lg">
            From capture to
            <br />
            <span className="text-gradient">competitive advantage</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connecting line (desktop) */}
          <div className="pointer-events-none absolute top-16 hidden h-px w-full md:block">
            <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-dark-border to-transparent" />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative text-center md:text-left">
              {/* Number */}
              <div
                className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border md:mx-0"
                style={{
                  borderColor: `${step.accent}20`,
                  background: `${step.accent}08`,
                }}
              >
                <span
                  className="font-mono text-body-sm font-bold"
                  style={{ color: step.accent }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="mb-3 font-display text-display-sm text-text-primary">
                {step.title}
              </h3>
              <p className="mx-auto max-w-sm text-body-sm leading-relaxed text-text-secondary md:mx-0">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
