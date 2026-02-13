"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarksContext";

interface BookmarkButtonProps {
  slug: string;
  size?: "sm" | "md";
}

function SignInModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm border border-dark-border bg-dark-card shadow-2xl shadow-black/50 animate-fade-in-up">
        <div className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-dark-border bg-dark-bg">
            <svg className="h-5 w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </div>
          <p className="mb-1.5 text-[15px] font-medium text-text-primary">Save to bookmarks</p>
          <p className="mb-6 text-[13px] text-text-tertiary">
            Sign in to bookmark apps and build your collection
          </p>
          <button
            onClick={onSignIn}
            className="w-full border border-white/20 bg-white/5 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Sign In with Google
          </button>
          <button
            onClick={onClose}
            className="mt-4 block w-full text-[12px] text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function BookmarkButton({ slug, size = "sm" }: BookmarkButtonProps) {
  const { user, signInWithGoogle } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [showSignIn, setShowSignIn] = useState(false);

  const bookmarked = isBookmarked(slug);
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const padding = size === "sm" ? "p-1.5" : "p-2";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowSignIn(true);
      return;
    }

    toggleBookmark(slug);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${padding} rounded-lg bg-dark-bg/80 backdrop-blur-sm border border-dark-border transition-all hover:border-white/20 hover:bg-dark-card`}
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      >
        <svg
          className={`${iconSize} transition-colors ${
            bookmarked ? "fill-white text-white" : "fill-none text-text-tertiary hover:text-text-secondary"
          }`}
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
      </button>
      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSignIn={() => {
            setShowSignIn(false);
            signInWithGoogle();
          }}
        />
      )}
    </>
  );
}
