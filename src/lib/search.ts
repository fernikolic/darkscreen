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
      { name: "label", weight: 0.35 },
      { name: "appName", weight: 0.25 },
      { name: "ocrText", weight: 0.15 },
      { name: "tagsText", weight: 0.15 },
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
