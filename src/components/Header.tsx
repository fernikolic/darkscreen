"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border/50 bg-dark-bg/70 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-dark-border bg-dark-card">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-purple/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative font-display text-sm font-bold text-accent-blue">D</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-text-primary">
            DARK<span className="text-accent-blue">SCREEN</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/library"
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Library
          </Link>
          <a
            href="#pricing"
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Pricing
          </a>
          <div className="ml-3 h-5 w-px bg-dark-border" />
          <a
            href="#get-access"
            className="ml-3 rounded-lg border border-accent-blue/20 bg-accent-blue/5 px-5 py-2 text-body-sm font-medium text-accent-blue transition-all duration-300 hover:border-accent-blue/40 hover:bg-accent-blue/10 hover:shadow-glow"
          >
            Get Early Access
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="relative rounded-lg p-2 text-text-tertiary transition-colors hover:bg-dark-card hover:text-text-primary md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-dark-border/50 px-6 py-5 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/library"
              className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Library
            </Link>
            <a
              href="#pricing"
              className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </a>
            <div className="my-2 h-px bg-dark-border/50" />
            <a
              href="#get-access"
              className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 py-3 text-center text-body-sm font-medium text-accent-blue"
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
