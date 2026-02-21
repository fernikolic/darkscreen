import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Darkscreens",
  description:
    "Privacy Policy for Darkscreens. Learn how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy",
    description:
      "Privacy Policy for Darkscreens. Learn how we collect, use, and protect your data.",
    url: "https://darkscreens.xyz/privacy",
    siteName: "Darkscreens",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Legal
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-[14px] text-text-secondary">
          Last updated: February 2026
        </p>
      </div>

      <div className="space-y-10">
        <Section number={1} title="Information We Collect">
          <p className="mb-3">We collect:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Account information (email, password)</li>
            <li>Usage data (pages viewed, features used)</li>
            <li>Payment information (processed by Stripe)</li>
          </ul>
        </Section>

        <Section number={2} title="How We Use Information">
          <p className="mb-3">We use your information to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Provide and maintain the service</li>
            <li>Process payments</li>
            <li>Send updates and notifications</li>
            <li>Improve our product</li>
          </ul>
        </Section>

        <Section number={3} title="Data Storage and Security">
          We use industry-standard security measures to protect your data.
          Passwords are encrypted. Payment information is processed by Stripe
          and never stored on our servers.
        </Section>

        <Section number={4} title="Third-Party Services">
          <p className="mb-3">We use:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Stripe for payments</li>
            <li>Vercel for hosting</li>
            <li>ProtonMail for email</li>
          </ul>
        </Section>

        <Section number={5} title="Cookies">
          We use cookies to maintain user sessions and analyze usage patterns.
        </Section>

        <Section number={6} title="Your Rights">
          <p className="mb-3">You have the right to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Access your personal data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </Section>

        <Section number={7} title="Data Retention">
          We retain your data as long as your account is active. You can request
          deletion at any time.
        </Section>

        <Section number={8} title="Changes to Privacy Policy">
          We may update this policy. Users will be notified of significant
          changes.
        </Section>

        <Section number={9} title="Contact">
          For privacy questions, contact us at{" "}
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
