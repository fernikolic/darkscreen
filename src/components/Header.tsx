"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border/50 bg-dark-bg/90 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl italic text-text-primary">
            Darkscreen
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-10 md:flex">
          <Link
            href="/library"
            className="text-[13px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
          >
            Library
          </Link>
          <a
            href="#pricing"
            className="text-[13px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
          >
            Pricing
          </a>
          <a
            href="#get-access"
            className="border-b border-accent-gold/40 pb-0.5 text-[13px] font-medium text-accent-gold transition-colors hover:border-accent-gold"
          >
            Get Access
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="text-text-secondary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-dark-border/50 px-6 py-6 md:hidden">
          <div className="flex flex-col gap-5">
            <Link
              href="/library"
              className="text-[13px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Library
            </Link>
            <a
              href="#pricing"
              className="text-[13px] font-medium uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#get-access"
              className="text-[13px] font-medium text-accent-gold"
              onClick={() => setMobileOpen(false)}
            >
              Get Access
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
