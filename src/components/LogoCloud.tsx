import { apps } from "@/data/apps";

export function LogoCloud() {
  return (
    <section className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-zinc-500">
          Tracking 50+ crypto products across wallets, exchanges, DeFi, and
          infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {apps.slice(0, 24).map((app) => (
            <span
              key={app.slug}
              className="whitespace-nowrap font-mono text-sm text-zinc-600 transition-colors hover:text-zinc-400"
            >
              {app.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
