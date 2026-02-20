"use client";

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
      }}
      className="absolute right-3 top-3 rounded border border-white/10 bg-white/5 p-1.5 text-text-tertiary transition-colors hover:bg-white/10 hover:text-text-secondary"
      title="Copy"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h5.5A1.5 1.5 0 0 1 14 3.5V11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 11V3.5Z" />
        <path d="M3.5 5A1.5 1.5 0 0 0 2 6.5V13a1.5 1.5 0 0 0 1.5 1.5H8A1.5 1.5 0 0 0 9.5 13v-.5h-3A1.5 1.5 0 0 1 5 11V5h-.5Z" />
      </svg>
    </button>
  );
}

export function AISkillTeaser() {
  return (
    <section id="ai-skills" className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-card">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

          <div className="relative px-10 py-14 md:px-16 md:py-20">
            {/* Platform pills */}
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5">
                <ClaudeIcon className="h-3.5 w-3.5 text-[#D97757]" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  Claude Code
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5">
                <span className="text-sm leading-none">🦀</span>
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  OpenClaw
                </span>
              </div>
            </div>

            <div className="grid gap-12 md:grid-cols-2 md:items-start">
              <div>
                <h2 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">
                  Build better crypto products
                  <br />
                  with real market context
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-text-secondary">
                  Our entire library — distilled into an AI skill. Gives
                  designers, PMs, and marketers instant access to design
                  patterns, user flows, and copywriting from 105 crypto
                  products. Real data, not guesswork.
                </p>

                {/* Three pillars */}
                <div className="mt-8 space-y-3">
                  {[
                    {
                      label: "Product Design",
                      description:
                        "Layouts, components, navigation patterns, color schemes, and typography across 105 apps.",
                    },
                    {
                      label: "User Flows",
                      description:
                        "Onboarding, swap, send/receive, staking, and settings flows with step counts and complexity analysis.",
                    },
                    {
                      label: "Copywriting",
                      description:
                        "CTA language, error messages, trust signals, tone analysis, and data formatting patterns.",
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

              {/* Setup instructions */}
              <div>
                <h3 className="mb-4 font-mono text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Setup
                </h3>

                {/* Step 1 */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-text-secondary">
                      1
                    </span>
                    <span className="text-[13px] font-medium text-text-primary">
                      Clone the skill
                    </span>
                  </div>
                  <div className="relative rounded-md border border-dark-border/60 bg-dark-bg p-4">
                    <CopyButton text="git clone https://github.com/fernikolic/darkscreen.git && cd darkscreen/crypto-product-design" />
                    <code className="block pr-8 font-mono text-[12px] leading-relaxed text-text-secondary">
                      <span className="text-text-tertiary">$</span> git clone https://github.com/fernikolic/darkscreen.git{"\n"}
                      <span className="text-text-tertiary">$</span> cd darkscreen/crypto-product-design
                    </code>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-text-secondary">
                      2
                    </span>
                    <span className="text-[13px] font-medium text-text-primary">
                      Add to your project
                    </span>
                  </div>
                  <div className="relative rounded-md border border-dark-border/60 bg-dark-bg p-4">
                    <CopyButton text="cp -r crypto-product-design/ /path/to/your-project/" />
                    <code className="block pr-8 font-mono text-[12px] leading-relaxed text-text-secondary">
                      <span className="text-text-tertiary">$</span> cp -r crypto-product-design/ /path/to/your-project/
                    </code>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-text-tertiary">
                    Claude Code auto-detects SKILL.md in your project directory.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-text-secondary">
                      3
                    </span>
                    <span className="text-[13px] font-medium text-text-primary">
                      Start asking questions
                    </span>
                  </div>
                  <div className="rounded-md border border-dark-border/60 bg-dark-bg p-4">
                    <code className="block font-mono text-[12px] leading-loose text-text-secondary">
                      <span className="text-text-tertiary">&gt;</span> What&apos;s the most common swap flow pattern?{"\n"}
                      <span className="text-text-tertiary">&gt;</span> How do top exchanges handle error states?{"\n"}
                      <span className="text-text-tertiary">&gt;</span> Compare navigation patterns across DeFi apps{"\n"}
                      <span className="text-text-tertiary">&gt;</span> What CTA text do wallets use for onboarding?
                    </code>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "105", label: "Apps" },
                    { value: "2,588", label: "Screenshots" },
                    { value: "8", label: "Categories" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-md border border-dark-border/60 bg-dark-bg/50 px-3 py-3 text-center"
                    >
                      <div className="font-heading text-lg font-bold text-text-primary">
                        {stat.value}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
