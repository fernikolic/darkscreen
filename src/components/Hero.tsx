import Link from "next/link";
import Image from "next/image";
import { apps } from "@/data/apps";

const featuredApps = apps.filter((a) => a.thumbnail).slice(0, 6);

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        {/* Gradient orbs */}
        <div className="orb-blue absolute -top-[200px] left-1/2 h-[800px] w-[800px] -translate-x-1/2" />
        <div className="orb-purple absolute -right-[200px] top-[300px] h-[600px] w-[600px]" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-dark-bg to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-32 pt-24 md:pt-36">
        {/* Badge */}
        <div className="mb-8 flex justify-center opacity-0 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-dark-border/60 bg-dark-card/60 px-4 py-1.5 backdrop-blur-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse-slow" />
            <span className="font-mono text-[11px] text-text-secondary">
              Tracking 50+ crypto products
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="mx-auto max-w-4xl font-display text-display-lg leading-[1.05] text-text-primary opacity-0 animate-fade-up stagger-1 md:text-display-xl">
            See what every crypto
            <br />
            <span className="text-glow text-accent-blue">product ships.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-body-lg text-text-secondary opacity-0 animate-fade-up stagger-2">
            Visual competitive intelligence for wallets, exchanges, and DeFi.
            Track UI changes. Spot what competitors build before they announce it.
          </p>

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 opacity-0 animate-fade-up stagger-3 sm:flex-row">
            <Link
              href="/library"
              className="group relative inline-flex items-center gap-2.5 rounded-xl bg-accent-blue px-7 py-3.5 text-body-sm font-semibold text-dark-bg transition-all duration-300 hover:shadow-glow-lg"
            >
              Browse the Library
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-border px-7 py-3.5 text-body-sm font-medium text-text-secondary transition-all duration-300 hover:border-dark-hover hover:bg-dark-card hover:text-text-primary"
            >
              View Pricing
            </a>
          </div>
        </div>

        {/* Preview grid — real screenshots */}
        <div className="relative mt-24 opacity-0 animate-fade-up stagger-5">
          {/* Precision line above */}
          <div className="precision-line mb-8" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
            {featuredApps.map((app, i) => (
              <Link
                key={app.slug}
                href={`/library/${app.slug}`}
                className="group relative overflow-hidden rounded-xl border border-dark-border/40 bg-dark-card transition-all duration-500 ease-out-expo hover:border-dark-border hover:shadow-card-hover hover:-translate-y-1"
                style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={app.thumbnail!}
                    alt={app.name}
                    fill
                    className="object-cover object-top transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-transparent to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span className="font-mono text-[10px] font-medium text-text-secondary">
                    {app.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-dark-bg to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-dark-bg to-transparent" />
        </div>
      </div>
    </section>
  );
}
