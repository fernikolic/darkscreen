import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-dark-border/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-lg font-bold tracking-tight text-text-primary">
                DARK<span className="text-accent-blue">SCREEN</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-text-tertiary">
              Visual competitive intelligence for crypto product teams. See what
              every product ships.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 font-mono text-label uppercase text-text-tertiary">
              Product
            </h4>
            <div className="flex flex-col gap-3">
              <Link
                href="/library"
                className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Library
              </Link>
              <a
                href="#pricing"
                className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Pricing
              </a>
              <a
                href="#get-access"
                className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Early Access
              </a>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-4 font-mono text-label uppercase text-text-tertiary">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://x.com/darkscreenxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Twitter / X
              </a>
              <a
                href="mailto:hello@darkscreen.xyz"
                className="text-body-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                hello@darkscreen.xyz
              </a>
            </div>
          </div>

          {/* Status */}
          <div>
            <h4 className="mb-4 font-mono text-label uppercase text-text-tertiary">
              Status
            </h4>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse-slow" />
              <span className="text-body-sm text-text-secondary">
                Capturing daily
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-dark-border/40 pt-8 md:flex-row">
          <p className="font-mono text-[11px] text-text-ghost">
            Built by crypto people, for crypto people.
          </p>
          <p className="font-mono text-[11px] text-text-ghost">
            &copy; 2025 Darkscreen
          </p>
        </div>
      </div>
    </footer>
  );
}
