"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { truncateAddress } from "@/lib/wallet-auth";
import { SearchOverlay } from "./SearchOverlay";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loading, openSignIn, signOut } = useAuth();


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

          {/* Nav tabs */}
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/library?platform=Web"
              className="px-3 py-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Web
            </Link>
            <Link
              href="/library?platform=Mobile"
              className="px-3 py-1.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Mobile
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
              <Link
                href="/library"
                className="py-2.5 text-[14px] text-text-secondary hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Library
              </Link>
              <Link
                href="/changes"
                className="py-2.5 text-[14px] text-text-secondary hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                Changes
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
