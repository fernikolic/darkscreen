import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-dark-border">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <span className="font-serif text-lg italic text-text-primary">
            Darkscreen
          </span>
          <div className="flex items-center gap-8">
            <Link
              href="/library"
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Library
            </Link>
            <a
              href="#pricing"
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Pricing
            </a>
            <a
              href="https://x.com/darkscreenxyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Twitter
            </a>
            <a
              href="mailto:hello@darkscreen.xyz"
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
