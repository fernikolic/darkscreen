"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { truncateAddress } from "@/lib/wallet-auth";
import { SuggestAppModal } from "./SuggestAppModal";

const intelLinks = [
  { href: "/intel/pricing", label: "Pricing Intelligence" },
  { href: "/intel/marketing", label: "Marketing & Copy" },
  { href: "/intel/careers", label: "Hiring Signals" },
  { href: "/intel/company", label: "Company Intel" },
  { href: "/techstack", label: "Tech Stack" },
  { href: "/performance", label: "Performance" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const { user, loading, openSignIn, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border/50 bg-dark-bg/70 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/darkscreen-logo.png"
            alt="Darkscreens"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-heading text-lg font-bold tracking-tight text-text-primary">
            dark<span className="text-accent-blue">screens</span>
          </span>
          <span className="rounded-full border border-dark-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
            Beta
          </span>
        </Link>

        {/* Platform nav */}
        <div className="hidden items-center gap-0.5 md:flex ml-6">
          {(["Web", "Extension", "Desktop", "iOS", "Android"] as const).map((platform) => (
            <Link
              key={platform}
              href={`/library?platform=${platform}`}
              className="rounded-lg px-3 py-1.5 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
            >
              {platform}
            </Link>
          ))}
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/library"
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Library
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setIntelOpen(true)}
            onMouseLeave={() => setIntelOpen(false)}
          >
            <button
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
            >
              Intel
              <svg className={`h-3 w-3 transition-transform ${intelOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {intelOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-dark-border bg-dark-card/95 p-1.5 shadow-xl backdrop-blur-xl">
                {intelLinks.map((link, i) => (
                  <div key={link.href}>
                    {i === 4 && <div className="my-1 h-px bg-dark-border/50" />}
                    <Link
                      href={link.href}
                      className="block rounded-md px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/changes"
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Changes
          </Link>
          <button
            onClick={() => setSuggestOpen(true)}
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Suggest App
          </button>
          <div className="ml-3 h-5 w-px bg-dark-border" />

          {/* Auth UI */}
          {loading ? (
            <div className="ml-3 h-8 w-8 animate-pulse rounded-full bg-dark-border" />
          ) : user ? (
            <div className="ml-3 flex items-center gap-2">
              <Link
                href="/saved"
                className="rounded-lg px-3 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
              >
                Saved
              </Link>
              <button
                onClick={signOut}
                className="group flex items-center gap-2"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    width={32}
                    height={32}
                    className="rounded-full border border-dark-border transition-all group-hover:border-white/20"
                  />
                ) : user.email?.endsWith("@wallet.darkscreen.xyz") ? (
                  <div className="flex items-center gap-1.5 rounded-lg border border-dark-border bg-dark-card px-2.5 py-1.5 font-mono text-[11px] text-text-secondary transition-all group-hover:border-white/20">
                    {truncateAddress(user.email.replace("@wallet.darkscreen.xyz", ""))}
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dark-border bg-dark-card text-[12px] font-medium text-text-secondary transition-all group-hover:border-white/20">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={openSignIn}
              className="ml-3 rounded-lg border border-accent-blue/20 bg-accent-blue/5 px-5 py-2 text-body-sm font-medium text-accent-blue transition-all duration-300 hover:border-accent-blue/40 hover:bg-accent-blue/10 hover:shadow-glow"
            >
              Sign In
            </button>
          )}
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
            <div className="flex flex-wrap items-center gap-1 px-2 pb-2">
              {(["Web", "Extension", "Desktop", "iOS", "Android"] as const).map((platform) => (
                <Link
                  key={platform}
                  href={`/library?platform=${platform}`}
                  className="rounded-lg px-3 py-1.5 text-body-sm text-text-secondary transition-colors hover:text-text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {platform}
                </Link>
              ))}
            </div>
            <div className="mb-1 h-px bg-dark-border/50" />
            <Link
              href="/library"
              className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Library
            </Link>
            <div className="px-4 py-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
                Intelligence
              </span>
            </div>
            {intelLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-6 py-2.5 text-[13px] text-text-tertiary transition-colors hover:bg-dark-card hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/changes"
              className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Changes
            </Link>
            <button
              onClick={() => {
                setSuggestOpen(true);
                setMobileOpen(false);
              }}
              className="rounded-lg px-4 py-3 text-left text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
            >
              Suggest App
            </button>
            <div className="my-2 h-px bg-dark-border/50" />

            {/* Mobile auth */}
            {loading ? null : user ? (
              <>
                <Link
                  href="/saved"
                  className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Saved
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg px-4 py-3 text-left text-body-sm text-text-tertiary transition-colors hover:bg-dark-card hover:text-text-primary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  openSignIn();
                  setMobileOpen(false);
                }}
                className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 py-3 text-center text-body-sm font-medium text-accent-blue"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
      {suggestOpen && <SuggestAppModal onClose={() => setSuggestOpen(false)} />}
    </header>
  );
}
