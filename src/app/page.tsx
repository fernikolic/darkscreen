import { Hero } from "@/components/Hero";
import { ValueProps } from "@/components/ValueProps";
import { LogoCloud } from "@/components/LogoCloud";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { EmailCapture } from "@/components/EmailCapture";

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
            Stop guessing what competitors are building.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Join product teams at top crypto companies who use Darkscreen to
            track the market and ship better products.
          </p>
          <div className="mt-8 flex justify-center">
            <EmailCapture source="bottom-cta" />
          </div>
        </div>
      </section>
    </>
  );
}
