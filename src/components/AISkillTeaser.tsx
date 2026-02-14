export function AISkillTeaser() {
  return (
    <section id="ai-skills" className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-card">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

          <div className="relative px-10 py-14 md:px-16 md:py-20">
            {/* Coming soon pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/60" />
              </span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                Coming Soon
              </span>
            </div>

            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">
                  AI-powered design intelligence
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-text-secondary">
                  We&apos;re turning our library into a skill for AI coding
                  tools. Ask how any crypto product handles onboarding, swaps, or
                  wallet connect — and get answers grounded in real
                  implementations, not hallucinated patterns.
                </p>
                <p className="mt-3 text-[13px] text-text-tertiary">
                  Works with Claude Code, Codex, and any tool supporting the
                  Agent Skills standard.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Product Design",
                    description:
                      "UI patterns, components, and layouts from 100+ live crypto apps",
                  },
                  {
                    label: "User Flows",
                    description:
                      "Step-by-step flow analysis — onboarding, trading, DeFi, and more",
                  },
                  {
                    label: "Copywriting",
                    description:
                      "CTA language, error messages, security copy, and tone analysis",
                  },
                ].map((pillar) => (
                  <div
                    key={pillar.label}
                    className="rounded-md border border-dark-border/60 bg-dark-bg/50 px-5 py-4"
                  >
                    <span className="text-[13px] font-medium text-text-primary">
                      {pillar.label}
                    </span>
                    <p className="mt-1 text-[12px] leading-relaxed text-text-tertiary">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
