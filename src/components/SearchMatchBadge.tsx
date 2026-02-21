"use client";

interface SearchMatchBadgeProps {
  query: string;
}

/** Floating overlay badge on screenshot thumbnails showing the matched search term */
export function SearchMatchBadge({ query }: SearchMatchBadgeProps) {
  const term = query.replace(/^["']|["']$/g, "").trim();
  if (!term) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pb-2 pt-8 pointer-events-none">
      <span className="inline-flex items-center gap-1 rounded border border-[#00d4ff]/30 bg-[#00d4ff]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#00d4ff]">
        <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6.5" cy="6.5" r="5" />
          <line x1="10" y1="10" x2="14.5" y2="14.5" />
        </svg>
        &ldquo;{term}&rdquo;
      </span>
    </div>
  );
}
