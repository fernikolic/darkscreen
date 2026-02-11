import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark-bg">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              DARK<span className="text-accent-blue">SCREEN</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/library"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Library
            </Link>
            <a
              href="#pricing"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Pricing
            </a>
            <a
              href="https://x.com/darkscreenxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Twitter
            </a>
            <a
              href="mailto:hello@darkscreen.xyz"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-dark-border pt-6 text-center">
          <p className="text-xs text-zinc-600">
            Built by crypto people, for crypto people.
          </p>
        </div>
      </div>
    </footer>
  );
}
