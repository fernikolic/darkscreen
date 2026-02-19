"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { truncateAddress } from "@/lib/wallet-auth";
import { SearchOverlay } from "./SearchOverlay";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading, openSignIn, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();


  return (
    <>
      <header className="sticky top-0 z-50 border-b border-dark-border/50 bg-dark-bg/70 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/darkscreen-logo.png"
              alt="Darkscreens"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="hidden font-heading text-base font-bold tracking-tight text-text-primary sm:inline">
              dark<span className="text-accent-blue">screens</span>
            </span>
          </Link>

          {/* Nav tabs with sub-nav */}
          <div className="hidden items-center gap-0.5 md:flex">
            {/* Web dropdown */}
            <div className="group relative">
              <Link
                href="/library?platform=Web"
                className="flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Web
                <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="rounded-lg border border-dark-border/80 bg-dark-card p-1 shadow-xl">
                  <Link href="/library?platform=Web" className="block rounded-md px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary whitespace-nowrap">
                    Websites
                  </Link>
                  <Link href="/library?platform=Desktop" className="block rounded-md px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary whitespace-nowrap">
                    Desktop Apps
                  </Link>
                  <Link href="/library?platform=Extension" className="block rounded-md px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary whitespace-nowrap">
                    Extensions
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile dropdown */}
            <div className="group relative">
              <Link
                href="/library?platform=Mobile"
                className="flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Mobile
                <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="rounded-lg border border-dark-border/80 bg-dark-card p-1 shadow-xl">
                  <Link href="/library?platform=iOS" className="block rounded-md px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary whitespace-nowrap">
                    iOS
                  </Link>
                  <Link href="/library?platform=Android" className="block rounded-md px-4 py-2 text-[13px] text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary whitespace-nowrap">
                    Android
                  </Link>
                </div>
              </div>
            </div>

            {/* Changes link */}
            <Link
              href="/changes"
              className="px-3 py-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Changes
            </Link>

            {/* AI Skills link */}
            <Link
              href="/#ai-skills"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Skills
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
                soon
              </span>
            </Link>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="mx-auto hidden max-w-lg flex-1 md:block"
          >
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <div className="w-full rounded-xl border border-dark-border bg-dark-card/50 py-2 pl-10 pr-4 text-left text-[14px] text-text-tertiary transition-colors hover:border-text-tertiary">
                Apps, Screens, Sections, Styles or Keywords...
              </div>
            </div>
          </button>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-text-tertiary transition-colors hover:text-text-primary"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-dark-border" />
            ) : user ? (
              <>
                <Link
                  href="/saved"
                  className="rounded-lg p-2 text-text-tertiary transition-colors hover:text-text-primary"
                  title="Saved"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                </Link>
                <button onClick={signOut} className="group">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={32}
                      height={32}
                      className="rounded-full border border-dark-border transition-all group-hover:border-white/20"
                    />
                  ) : user.email?.endsWith("@wallet.darkscreen.xyz") ? (
                    <div className="rounded-lg border border-dark-border bg-dark-card px-2.5 py-1.5 font-mono text-[11px] text-text-secondary transition-all group-hover:border-white/20">
                      {truncateAddress(
                        user.email.replace("@wallet.darkscreen.xyz", "")
                      )}
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dark-border bg-dark-card text-[12px] font-medium text-text-secondary transition-all group-hover:border-white/20">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={openSignIn}
                className="rounded-lg border border-dark-border bg-dark-card/50 px-4 py-1.5 text-[13px] font-medium text-text-secondary transition-all hover:border-text-tertiary hover:text-text-primary"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile: search icon + toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              className="rounded-lg p-2 text-text-tertiary transition-colors hover:text-text-primary"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              className="rounded-lg p-2 text-text-tertiary transition-colors hover:text-text-primary"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 9h16.5m-16.5 6.75h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-dark-border/50 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              <span className="pt-1 pb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">Web</span>
              <Link href="/library?platform=Web" className="py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Websites</Link>
              <Link href="/library?platform=Desktop" className="py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Desktop Apps</Link>
              <Link href="/library?platform=Extension" className="py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Extensions</Link>
              <span className="pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">Mobile</span>
              <Link href="/library?platform=iOS" className="py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>iOS</Link>
              <Link href="/library?platform=Android" className="py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Android</Link>
              <Link href="/changes" className="py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>Changes</Link>
              <span className="pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">Skills</span>
              <Link href="/#ai-skills" className="flex items-center gap-2 py-1.5 pl-2 text-[14px] text-text-secondary hover:text-text-primary" onClick={() => setMobileOpen(false)}>
                Design Intelligence
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-tertiary">soon</span>
              </Link>
              {!loading && !user && (
                <button
                  onClick={() => {
                    openSignIn();
                    setMobileOpen(false);
                  }}
                  className="mt-2 rounded-lg border border-dark-border py-2.5 text-center text-[14px] font-medium text-text-secondary"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
