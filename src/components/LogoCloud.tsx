import { apps } from "@/data/apps";

export function LogoCloud() {
  const appNames = apps.slice(0, 28).map((app) => app.name);
  // Duplicate for seamless marquee loop
  const doubled = [...appNames, ...appNames];

  return (
    <section className="relative overflow-hidden">
      <div className="precision-line" />
      <div className="py-20">
        {/* Section label */}
        <p className="mb-12 text-center font-mono text-label uppercase text-text-tertiary">
          Tracking across the crypto ecosystem
        </p>

        {/* Marquee */}
        <div className="marquee-track relative">
          <div className="marquee-content flex animate-marquee items-center gap-10">
            {doubled.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 whitespace-nowrap font-mono text-body-sm text-text-ghost transition-colors duration-300 hover:text-text-secondary"
              >
                {name}
              </span>
            ))}
          </div>
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-dark-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-dark-bg to-transparent" />
        </div>
      </div>
    </section>
  );
}
