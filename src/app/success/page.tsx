import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-gold">
        Payment Confirmed
      </p>
      <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
        Welcome to Darkscreen Pro
      </h1>
      <p className="mx-auto mt-6 max-w-md text-[14px] leading-relaxed text-text-secondary">
        Your account has been upgraded. You now have full access to every app,
        screen, flow, and change history in the library.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 border border-accent-gold bg-accent-gold/10 px-6 py-3 text-[13px] font-medium text-accent-gold transition-colors hover:bg-accent-gold/20"
        >
          Browse the full library
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-dark-border px-6 py-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
