import Link from "next/link";
import { PlaceholderScreen } from "./PlaceholderScreen";

const previewApps = [
  { name: "MetaMask", color: "#f6851b", label: "Portfolio" },
  { name: "Phantom", color: "#ab9ff2", label: "Token List" },
  { name: "Coinbase", color: "#0052ff", label: "Markets" },
  { name: "Uniswap", color: "#ff007a", label: "Swap" },
  { name: "Aave", color: "#b6509e", label: "Lending" },
  { name: "OpenSea", color: "#2081e2", label: "Collections" },
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
            See what every crypto
            <br />
            product ships.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
            Visual competitive intelligence for wallets, exchanges, and DeFi.
            Track UI changes. Spot what competitors build before they announce
            it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-6 py-3 text-sm font-semibold text-dark-bg transition-all hover:bg-accent-blue/90 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            >
              Browse the Library
              <span aria-hidden="true">&rarr;</span>
            </Link>
            {/* REPLACE_WITH_TALLY_LINK */}
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-card px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:text-white"
            >
              Get Early Access
            </a>
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
