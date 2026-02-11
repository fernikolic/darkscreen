import { Hero } from "@/components/Hero";
import { ValueProps } from "@/components/ValueProps";
import { LogoCloud } from "@/components/LogoCloud";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueProps />
      <LogoCloud />
      <HowItWorks />
      <Pricing />

      {/* Bottom CTA */}
      <section className="border-t border-dark-border">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Stop guessing what competitors are building.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Join product teams at top crypto companies who use Darkscreen to
            track the market and ship better products.
          </p>
          {/* REPLACE_WITH_TALLY_LINK */}
          <a
            href="#"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent-blue px-8 py-3.5 text-sm font-semibold text-dark-bg transition-all hover:bg-accent-blue/90 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
          >
            Get Early Access
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>
    </>
  );
}
