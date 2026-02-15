"use client";

interface OcrSnippetProps {
  text: string;
  query: string;
  className?: string;
}

/** Renders truncated OCR text with highlighted matching terms */
export function OcrSnippet({ text, query, className = "" }: OcrSnippetProps) {
  if (!text) return null;

  // Strip quotes for exact-match queries
  const searchTerm = query.replace(/^["']|["']$/g, "").trim();
  if (!searchTerm) {
    return (
      <p className={`line-clamp-2 text-[11px] leading-relaxed text-text-tertiary ${className}`}>
        {text}
      </p>
    );
  }

  // Split text into parts around the match (case-insensitive)
  const parts = highlightParts(text, searchTerm);

  return (
    <p className={`line-clamp-2 text-[11px] leading-relaxed text-text-tertiary ${className}`}>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark
            key={i}
            className="rounded-sm bg-[#00d4ff]/15 px-0.5 text-[#00d4ff]"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  );
}

function highlightParts(
  text: string,
  term: string
): { text: string; highlight: boolean }[] {
  const parts: { text: string; highlight: boolean }[] = [];
  const lower = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  let lastIndex = 0;

  let idx = lower.indexOf(lowerTerm, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), highlight: false });
    }
    parts.push({
      text: text.slice(idx, idx + term.length),
      highlight: true,
    });
    lastIndex = idx + term.length;
    idx = lower.indexOf(lowerTerm, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  return parts;
}
