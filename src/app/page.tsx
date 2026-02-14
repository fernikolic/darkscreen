import { Hero } from "@/components/Hero";
import { ValueProps } from "@/components/ValueProps";
import { LogoCloud } from "@/components/LogoCloud";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { IntelLayerShowcase } from "@/components/IntelLayerShowcase";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <ValueProps />
      <IntelLayerShowcase />
      <LogoCloud />
      <HowItWorks />
      <Pricing />

      {/* Bottom CTA */}
      <section id="get-access" className="border-t border-dark-border">
        <div className="mx-auto max-w-7xl px-6 py-28 text-center">
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
            Start exploring crypto competitive intelligence
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[14px] text-text-secondary">
            Browse screens, pricing pages, marketing copy, and hiring signals
            from every major crypto product. Free to get started.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/library"
              className="group inline-flex items-center gap-3 border-b border-white/25 pb-1 text-[14px] font-medium text-white transition-colors hover:border-white/60"
            >
              Explore the Library
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
