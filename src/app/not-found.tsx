import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
        404
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold text-text-primary sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-white/10"
        >
          Go home
        </Link>
        <Link
          href="/library"
          className="rounded-lg border border-dark-border px-5 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
        >
          Browse library
        </Link>
      </div>
    </div>
  );
}
