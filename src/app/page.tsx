import { Hero } from "@/components/Hero";
import { ValueProps } from "@/components/ValueProps";
import { LogoCloud } from "@/components/LogoCloud";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueProps />
      <LogoCloud />
      <HowItWorks />
      <Pricing />

      {/* Bottom CTA */}
      <section id="get-access" className="border-t border-dark-border">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Start exploring crypto product design
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Browse screens, flows, and UI patterns from every major crypto
            product. Free to get started.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-6 py-3 text-sm font-semibold text-dark-bg transition-all hover:bg-accent-blue/90 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            >
              Explore the Library
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
