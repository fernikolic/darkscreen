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
      <section id="get-access" className="relative">
        <div className="precision-line" />
        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center">
          {/* Background orb */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="orb-blue h-[400px] w-[400px]" />
          </div>

          <div className="relative">
            <span className="mb-4 block font-mono text-label uppercase text-text-tertiary">
              Get Started
            </span>
            <h2 className="font-display text-display-md text-text-primary md:text-display-lg">
              Stop guessing what
              <br />
              competitors are building.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-body-md text-text-secondary">
              Join product teams at top crypto companies who use Darkscreen to
              track the market and ship better products.
            </p>
            <div className="mt-10 flex justify-center">
              <EmailCapture source="bottom-cta" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
