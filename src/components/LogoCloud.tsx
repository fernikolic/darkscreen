import { apps } from "@/data/apps";

export function LogoCloud() {
  return (
    <section className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Currently tracking
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {apps.slice(0, 24).map((app, i) => (
            <span
              key={app.slug}
              className="whitespace-nowrap text-[14px] text-text-secondary/50 transition-colors hover:text-text-primary"
            >
              {app.name}
              {i < 23 && <span className="ml-6 text-dark-border">/</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
