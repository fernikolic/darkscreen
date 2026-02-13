import Fuse from "fuse.js";
import { type EnrichedScreen } from "@/data/helpers";
import ocrData from "@/data/ocr.json";

const ocrMap = ocrData as Record<string, string>;

export interface SearchableScreen extends EnrichedScreen {
  ocrText: string;
}

export function buildSearchIndex(screens: EnrichedScreen[]) {
  const searchable: SearchableScreen[] = screens.map((s) => ({
    ...s,
    ocrText: s.image ? (ocrMap[s.image] || "") : "",
  }));

  const fuse = new Fuse(searchable, {
    keys: [
      { name: "label", weight: 0.4 },
      { name: "appName", weight: 0.3 },
      { name: "ocrText", weight: 0.2 },
      { name: "flow", weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
  });

  return { fuse, searchable };
}

export function searchScreens(
  fuse: Fuse<SearchableScreen>,
  query: string,
  limit = 200
): SearchableScreen[] {
  if (!query.trim()) return [];
  return fuse.search(query, { limit }).map((r) => r.item);
}
