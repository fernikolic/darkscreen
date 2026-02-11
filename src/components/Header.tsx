"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            DARK<span className="text-accent-blue">SCREEN</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/library"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Library
          </Link>
          <a
            href="#pricing"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Pricing
          </a>
          <a
            href="#get-access"
            className="rounded-lg bg-accent-blue/10 px-4 py-2 text-sm font-medium text-accent-blue transition-all hover:bg-accent-blue/20"
          >
            Get Early Access
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="text-zinc-400 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-dark-border px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/library"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Library
            </Link>
            <a
              href="#pricing"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#get-access"
              className="rounded-lg bg-accent-blue/10 px-4 py-2 text-center text-sm font-medium text-accent-blue"
              onClick={() => setMobileOpen(false)}
            >
              Get Early Access
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
