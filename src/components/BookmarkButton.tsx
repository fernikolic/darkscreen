"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarksContext";

interface BookmarkButtonProps {
  slug: string;
  size?: "sm" | "md";
}

export function BookmarkButton({ slug, size = "sm" }: BookmarkButtonProps) {
  const { user, openSignIn } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const bookmarked = isBookmarked(slug);
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const padding = size === "sm" ? "p-1.5" : "p-2";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openSignIn();
      return;
    }

    toggleBookmark(slug);
  };

  return (
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
  );
}
