import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Darkscreens",
  description:
    "Terms of Service for Darkscreens, the competitive intelligence platform for crypto product teams.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service",
    description:
      "Terms of Service for Darkscreens, the competitive intelligence platform for crypto product teams.",
    url: "https://darkscreens.xyz/terms",
    siteName: "Darkscreens",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Legal
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Last updated: February 2026
        </p>
      </div>

      <div className="space-y-10">
        <Section number={1} title="Acceptance of Terms">
          By accessing and using Darkscreens, you accept and agree to be bound
          by these Terms of Service.
        </Section>

        <Section number={2} title="Description of Service">
          Darkscreens is a competitive intelligence platform that provides
          screenshots and UI analysis of crypto products for research purposes.
        </Section>

        <Section number={3} title="User Accounts">
          Users must provide accurate information when creating accounts. Users
          are responsible for maintaining the security of their account
          credentials.
        </Section>

        <Section number={4} title="Acceptable Use">
          <p className="mb-3">Users agree not to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Use the service for any illegal purpose</li>
            <li>
              Attempt to gain unauthorized access to any part of the service
            </li>
            <li>
              Use automated means to access the service without permission
            </li>
            <li>Resell or redistribute content without authorization</li>
          </ul>
        </Section>

        <Section number={5} title="Subscription and Billing">
          Paid subscriptions are billed monthly. Users can cancel at any time.
          Refunds are provided at our discretion.
        </Section>

        <Section number={6} title="Intellectual Property">
          All content and materials available on Darkscreens are the property of
          Darkscreens and are protected by copyright and trademark law.
        </Section>

        <Section number={7} title="Limitation of Liability">
          Darkscreens shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages.
        </Section>

        <Section number={8} title="Changes to Terms">
          We reserve the right to modify these terms at any time. Users will be
          notified of significant changes.
        </Section>

        <Section number={9} title="Contact">
          For questions about these Terms, contact us at{" "}
          <a
            href="mailto:clawdentials@proton.me"
            className="text-text-primary underline underline-offset-2 transition-colors hover:text-white"
          >
            clawdentials@proton.me
          </a>
        </Section>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-lg font-semibold text-text-primary">
        {number}. {title}
      </h2>
      <div className="text-[14px] leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );
}
