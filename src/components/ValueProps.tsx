const props = [
  {
    number: "01",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    title: "Every Crypto App, Captured",
    description:
      "Systematic screenshots of wallets, exchanges, bridges, and DeFi protocols. Browse by app, flow, or UI pattern.",
  },
  {
    number: "02",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Track Changes Over Time",
    description:
      "We re-capture every app weekly. See exactly what changed with AI-powered diff detection and annotated before/after comparisons.",
  },
  {
    number: "03",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: "Built for Product Teams",
    description:
      "Not just design inspiration — competitive intelligence for PMs, founders, and growth teams who need to know what the market is building.",
  },
];

export function ValueProps() {
  return (
    <section className="relative">
      <div className="precision-line" />
      <div className="mx-auto max-w-7xl px-6 py-28">
        {/* Section label */}
        <div className="mb-16 text-center">
          <span className="font-mono text-label uppercase text-text-tertiary">
            Why Darkscreen
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {props.map((prop) => (
            <div
              key={prop.title}
              className="group relative rounded-2xl border border-dark-border/40 bg-dark-card/50 p-8 transition-all duration-500 ease-out-expo hover:border-dark-border hover:bg-dark-card"
            >
              {/* Number watermark */}
              <span className="absolute right-6 top-6 font-display text-[4rem] font-extrabold leading-none text-dark-border/30">
                {prop.number}
              </span>

              {/* Icon */}
              <div className="relative mb-6 inline-flex rounded-xl border border-accent-blue/10 bg-accent-blue/5 p-3 text-accent-blue">
                {prop.icon}
              </div>

              <h3 className="relative mb-3 font-display text-display-sm text-text-primary">
                {prop.title}
              </h3>
              <p className="relative text-body-sm leading-relaxed text-text-secondary">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
