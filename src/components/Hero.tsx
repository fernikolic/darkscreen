import Link from "next/link";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { TOTAL_APPS, TOTAL_SCREENS, TOTAL_FLOWS } from "@/data/apps";

const previewApps = [
  { name: "MetaMask", color: "#f6851b", label: "Portfolio" },
  { name: "Phantom", color: "#ab9ff2", label: "Token List" },
  { name: "Coinbase", color: "#0052ff", label: "Markets" },
  { name: "Uniswap", color: "#ff007a", label: "Swap" },
  { name: "Aave", color: "#b6509e", label: "Lending" },
  { name: "OpenSea", color: "#2081e2", label: "Collections" },
];

const stats = [
  { value: `${TOTAL_APPS}+`, label: "Apps" },
  { value: `${TOTAL_SCREENS.toLocaleString()}+`, label: "Screens" },
  { value: `${TOTAL_FLOWS}+`, label: "Flows" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-blue/5 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-accent-purple/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:pt-32">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            The world&apos;s largest library
            <br />
            of crypto product design
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
            Explore screens, flows, and UI patterns from {TOTAL_APPS}+ wallets,
            exchanges, and DeFi protocols. The design reference built for crypto
            product teams.
          </p>

          {/* Stats row */}
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8">
                {i > 0 && (
                  <span className="text-dark-border">|</span>
                )}
                <div className="text-center">
                  <span className="block font-mono text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs text-zinc-500">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-6 py-3 text-sm font-semibold text-dark-bg transition-all hover:bg-accent-blue/90 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            >
              Explore the Library
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Preview grid */}
        <div className="relative mt-20">
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
            {previewApps.map((app) => (
              <PlaceholderScreen
                key={app.name}
                color={app.color}
                label={app.label}
                appName={app.name}
              />
            ))}
          </div>
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-dark-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-dark-bg to-transparent" />
        </div>
      </div>
    </section>
  );
}
