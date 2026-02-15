import Fuse from "fuse.js";
import { type EnrichedScreen } from "@/data/helpers";
import ocrData from "@/data/ocr.json";

const ocrMap = ocrData as Record<string, string>;

export interface SearchableScreen extends EnrichedScreen {
  ocrText: string;
  tagsText: string;
}

export function buildSearchIndex(screens: EnrichedScreen[]) {
  const searchable: SearchableScreen[] = screens.map((s) => ({
    ...s,
    ocrText: s.image ? (ocrMap[s.image] || "") : "",
    tagsText: (s.tags || []).join(" "),
  }));

  const fuse = new Fuse(searchable, {
    keys: [
      { name: "label", weight: 0.30 },
      { name: "appName", weight: 0.20 },
      { name: "ocrText", weight: 0.25 },
      { name: "tagsText", weight: 0.15 },
      { name: "flow", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
  });

  return { fuse, searchable };
}

/**
 * Check if a query is an exact-match query (wrapped in quotes).
 * Returns the inner text if quoted, or null if not.
 */
function parseExactQuery(query: string): string | null {
  const trimmed = query.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return null;
}

export function searchScreens(
  fuse: Fuse<SearchableScreen>,
  query: string,
  limit = 200
): SearchableScreen[] {
  if (!query.trim()) return [];

  // Exact-match mode: bypass fuzzy when user wraps query in quotes
  const exactTerm = parseExactQuery(query);
  if (exactTerm) {
    const lower = exactTerm.toLowerCase();
    const items = fuse.getIndex()
      // @ts-expect-error - accessing internal Fuse docs
      .docs as SearchableScreen[];
    return items
      .filter(
        (s) =>
          s.ocrText.toLowerCase().includes(lower) ||
          s.label.toLowerCase().includes(lower) ||
          s.appName.toLowerCase().includes(lower) ||
          s.tagsText.toLowerCase().includes(lower)
      )
      .slice(0, limit);
  }

  return fuse.search(query, { limit }).map((r) => r.item);
}

/** Get OCR text for a given image path */
export function getOcrText(imagePath: string): string {
  return ocrMap[imagePath] || "";
}

/** Get a snippet of OCR text around a matching term */
export function getOcrSnippet(imagePath: string, query: string, maxLength = 120): string | null {
  const text = ocrMap[imagePath];
  if (!text) return null;

  const exactTerm = parseExactQuery(query);
  const searchTerm = (exactTerm || query).toLowerCase();
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(searchTerm);

  if (idx === -1) {
    // Return first maxLength chars if no match found
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }

  // Center the snippet around the match
  const start = Math.max(0, idx - Math.floor(maxLength / 3));
  const end = Math.min(text.length, start + maxLength);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}
