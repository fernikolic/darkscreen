"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border/50 bg-dark-bg/70 backdrop-blur-2xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-dark-border bg-dark-card">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-purple/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative font-heading text-sm font-bold text-accent-blue">D</span>
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-text-primary">
            DARK<span className="text-accent-blue">SCREEN</span>
          </span>
        </Link>

        {/* Platform nav */}
        <div className="hidden items-center gap-0.5 md:flex ml-6">
          <Link
            href="/library"
            className="rounded-lg px-3 py-1.5 text-body-sm text-text-primary transition-all duration-200 hover:bg-dark-card"
          >
            Web Apps
          </Link>
          <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm text-text-tertiary/50 cursor-default">
            iOS
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-zinc-400">
              Soon
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm text-text-tertiary/50 cursor-default">
            Android
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-zinc-400">
              Soon
            </span>
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/library"
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Library
          </Link>
          <Link
            href="/changes"
            className="rounded-lg px-4 py-2 text-body-sm text-text-secondary transition-all duration-200 hover:bg-dark-card hover:text-text-primary"
          >
            Changes
          </Link>
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
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dark-border bg-dark-card text-[12px] font-medium text-text-secondary transition-all group-hover:border-white/20">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
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
            <div className="flex items-center gap-1 px-2 pb-2">
              <Link
                href="/library"
                className="rounded-lg px-3 py-1.5 text-body-sm text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Web Apps
              </Link>
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-body-sm text-text-tertiary/50">
                iOS
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                  Soon
                </span>
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-body-sm text-text-tertiary/50">
                Android
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                  Soon
                </span>
              </span>
            </div>
            <div className="mb-1 h-px bg-dark-border/50" />
            <Link
              href="/library"
              className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Library
            </Link>
            <Link
              href="/changes"
              className="rounded-lg px-4 py-3 text-body-sm text-text-secondary transition-colors hover:bg-dark-card hover:text-text-primary"
              onClick={() => setMobileOpen(false)}
            >
              Changes
            </Link>
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
                  signInWithGoogle();
                  setMobileOpen(false);
                }}
                className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 py-3 text-center text-body-sm font-medium text-accent-blue"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
