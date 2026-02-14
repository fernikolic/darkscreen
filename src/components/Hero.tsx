import Link from "next/link";
import Image from "next/image";
import { TOTAL_APPS, TOTAL_SCREENS, apps } from "@/data/apps";
import { AppLogo } from "@/components/AppLogo";
import { screenshotUrl } from "@/lib/screenshot-url";

const featuredApps = apps.filter((a) => a.detailed && a.thumbnail).slice(0, 5);

// Floating logos — left side (top to bottom), right side (top to bottom)
const floatingLogos = {
  left: [
    { src: "/logos/coinbase.png", alt: "Coinbase", size: 64, top: "8%", left: "8%", duration: "6s", delay: "0s" },
    { src: "/logos/metamask.png", alt: "MetaMask", size: 56, top: "34%", left: "3%", duration: "7s", delay: "1s" },
    { src: "/logos/curve.png", alt: "Curve", size: 44, top: "56%", left: "11%", duration: "5.5s", delay: "0.5s" },
    { src: "/logos/kraken.png", alt: "Kraken", size: 40, top: "75%", left: "6%", duration: "6.2s", delay: "0.3s" },
  ],
  right: [
    { src: "/logos/uniswap.png", alt: "Uniswap", size: 56, top: "12%", right: "6%", duration: "6.5s", delay: "0.8s" },
    { src: "/logos/mempool.png", alt: "Mempool", size: 48, top: "42%", right: "4%", duration: "5s", delay: "1.5s" },
    { src: "/logos/phantom.png", alt: "Phantom", size: 44, top: "65%", right: "9%", duration: "5.8s", delay: "1.2s" },
    { src: "/logos/aave.png", alt: "Aave", size: 40, top: "20%", right: "12%", duration: "6.8s", delay: "0.5s" },
  ],
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28 lg:pt-32">

        {/* Floating logos — left */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          {floatingLogos.left.map((logo) => (
            <div
              key={logo.alt}
              className="animate-float absolute rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 shadow-lg shadow-black/20 backdrop-blur-sm"
              style={{
                top: logo.top,
                left: logo.left,
                animationDuration: logo.duration,
                animationDelay: logo.delay,
                width: logo.size + 16,
                height: logo.size + 16,
              }}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.size}
                height={logo.size}
                className="rounded-xl"
              />
            </div>
          ))}

          {/* Floating logos — right */}
          {floatingLogos.right.map((logo) => (
            <div
              key={logo.alt}
              className="animate-float absolute rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 shadow-lg shadow-black/20 backdrop-blur-sm"
              style={{
                top: logo.top,
                right: logo.right,
                animationDuration: logo.duration,
                animationDelay: logo.delay,
                width: logo.size + 16,
                height: logo.size + 16,
              }}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.size}
                height={logo.size}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>

        {/* Centered headline */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-white">
              Product & design intelligence for crypto
            </span>
          </div>
          <h1 className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.08] text-text-primary">
            See how every crypto product{" "}
            <span className="text-white">actually ships</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
            {TOTAL_SCREENS.toLocaleString()}+ screens and flows from {TOTAL_APPS}+
            {" "}wallets, exchanges, and DeFi protocols &mdash;
            systematically captured so you can study what the best teams are building.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <Link
              href="/library"
              className="group inline-flex items-center gap-3 border-b border-white/25 pb-1 text-[14px] font-medium text-white transition-colors hover:border-white/60"
            >
              See what shipped this week
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
              5
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-wider text-text-tertiary">
              Intel layers
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
              { name: "Coinbase", slug: "coinbase" },
              { name: "MetaMask", slug: "metamask" },
              { name: "Uniswap", slug: "uniswap" },
              { name: "Kraken", slug: "kraken" },
              { name: "Aave", slug: "aave" },
              { name: "Phantom", slug: "phantom" },
              { name: "Binance", slug: "binance" },
              { name: "Jupiter", slug: "jupiter" },
              { name: "Lido", slug: "lido" },
            ].map((app) => (
              <span
                key={app.slug}
                className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-text-tertiary/40 transition-colors hover:text-text-primary"
              >
                <AppLogo slug={app.slug} name={app.name} size={20} />
                {app.name}
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
                    src={screenshotUrl(app.thumbnail)!}
                    alt={app.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="flex items-center gap-1.5 truncate text-[12px] font-medium text-text-primary">
                    <AppLogo slug={app.slug} name={app.name} size={16} />
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
