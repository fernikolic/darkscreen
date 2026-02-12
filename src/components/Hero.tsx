import Link from "next/link";
import Image from "next/image";
import { TOTAL_APPS, TOTAL_SCREENS, apps } from "@/data/apps";

const featuredApps = apps.filter((a) => a.detailed && a.thumbnail).slice(0, 5);

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28 lg:pt-32">
        {/* Centered headline */}
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            Product intelligence for crypto
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.08] text-text-primary">
            Every screen from every{" "}
            <span className="text-accent-gold">crypto product,</span>{" "}
            documented.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            Browse {TOTAL_SCREENS.toLocaleString()}+ screens and flows from {TOTAL_APPS}+ wallets,
            exchanges, and DeFi protocols. The design reference built for
            product teams who ship in crypto.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/library"
              className="group inline-flex items-center gap-3 border-b border-accent-gold/40 pb-1 text-[14px] font-medium text-accent-gold transition-colors hover:border-accent-gold"
            >
              Explore the library
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto mt-16 flex max-w-md items-center justify-center gap-10">
          <div className="text-center">
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {TOTAL_APPS}+
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-wider text-text-tertiary">
              Products
            </span>
          </div>
          <div className="h-8 w-px bg-dark-border" />
          <div className="text-center">
            <span className="block font-mono text-2xl font-medium text-text-primary">
              {TOTAL_SCREENS.toLocaleString()}+
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-wider text-text-tertiary">
              Screens
            </span>
          </div>
          <div className="h-8 w-px bg-dark-border" />
          <div className="text-center">
            <span className="block font-mono text-2xl font-medium text-text-primary">
              6
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-wider text-text-tertiary">
              Flow types
            </span>
          </div>
        </div>

        {/* Logo cloud */}
        <div className="mx-auto mt-16 max-w-3xl">
          <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
            Tracking products you know
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {[
              "Coinbase",
              "MetaMask",
              "Uniswap",
              "Kraken",
              "Aave",
              "Phantom",
              "Binance",
              "Jupiter",
              "Lido",
            ].map((name) => (
              <span
                key={name}
                className="text-[15px] font-semibold tracking-tight text-text-tertiary/40 transition-colors hover:text-text-primary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Featured screenshots */}
        <div className="mt-20 overflow-hidden">
          <div className="flex gap-4">
            {featuredApps.map((app, i) => (
              <Link
                key={app.slug}
                href={`/library/${app.slug}`}
                className="group relative flex-1 min-w-0 overflow-hidden border border-dark-border bg-dark-card transition-all card-hover"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={app.thumbnail!}
                    alt={app.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="truncate text-[12px] font-medium text-text-primary">
                    {app.name}
                  </span>
                  <span className="ml-2 shrink-0 font-mono text-[10px] text-text-tertiary">
                    {app.screenCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
