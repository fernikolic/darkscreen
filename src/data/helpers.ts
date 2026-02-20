import { apps, type AppScreen, type AppChange, type ChangeType, type FlowType, type AppCategory, type ChainType, type IntelLayer, type CryptoApp, type DiffChange, type CopySnapshot, type CopyChange, type TechStackEntry, type PerformanceMetrics, type GranularElementTag, type DetectedElement, INTEL_LAYERS } from "./apps";
import { insightsBySlug, type Insight } from "./insights";
import elementsData from "./elements.json";
import { autoChangesBySlug } from "./auto-changes";
import { copyDataBySlug } from "./copy-tracking";
import { techStackBySlug } from "./techstack";
import { performanceBySlug } from "./performance";

export interface EnrichedScreen extends AppScreen {
  appSlug: string;
  appName: string;
  appCategory: AppCategory;
  appChains: ChainType[];
  accentColor: string;
}

export interface AppFlow {
  appSlug: string;
  appName: string;
  appCategory: AppCategory;
  appChains: ChainType[];
  accentColor: string;
  flowType: FlowType;
  screens: EnrichedScreen[];
  count: number;
  thumbnail: string | undefined;
}

export interface EnrichedChange extends AppChange {
  appSlug: string;
  appName: string;
  appCategory: AppCategory;
  accentColor: string;
}

export function getScreenPath(screen: EnrichedScreen): string {
  return `/screens/${screen.appSlug}/${screen.flow.toLowerCase()}/${screen.step}`;
}

export function getAllChanges(): EnrichedChange[] {
  const result: EnrichedChange[] = [];
  for (const app of apps) {
    for (const change of app.changes) {
      result.push({
        ...change,
        appSlug: app.slug,
        appName: app.name,
        appCategory: app.category,
        accentColor: app.accentColor,
      });
    }
  }
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllScreens(): EnrichedScreen[] {
  const result: EnrichedScreen[] = [];
  for (const app of apps) {
    if (app.screens.length === 0) continue;
    for (const screen of app.screens) {
      result.push({
        ...screen,
        appSlug: app.slug,
        appName: app.name,
        appCategory: app.category,
        appChains: app.chains,
        accentColor: app.accentColor,
      });
    }
  }
  return result;
}

export function getScreenLayer(screen: AppScreen): IntelLayer {
  return screen.layer || "Product";
}

export function getScreensByLayer(layer: IntelLayer): EnrichedScreen[] {
  const result: EnrichedScreen[] = [];
  for (const app of apps) {
    for (const screen of app.screens) {
      if (getScreenLayer(screen) === layer) {
        result.push({
          ...screen,
          appSlug: app.slug,
          appName: app.name,
          appCategory: app.category,
          appChains: app.chains,
          accentColor: app.accentColor,
        });
      }
    }
  }
  return result;
}

export function getAppsByLayer(layer: IntelLayer): CryptoApp[] {
  return apps.filter((app) =>
    app.screens.some((s) => getScreenLayer(s) === layer)
  );
}

export function getAppLayerCounts(app: CryptoApp): Partial<Record<IntelLayer, number>> {
  const counts: Partial<Record<IntelLayer, number>> = {};
  for (const screen of app.screens) {
    const layer = getScreenLayer(screen);
    counts[layer] = (counts[layer] || 0) + 1;
  }
  return counts;
}

export function getAllFlows(): AppFlow[] {
  const result: AppFlow[] = [];
  for (const app of apps) {
    if (app.screens.length === 0) continue;
    const flowMap = new Map<FlowType, EnrichedScreen[]>();
    for (const screen of app.screens) {
      const enriched: EnrichedScreen = {
        ...screen,
        appSlug: app.slug,
        appName: app.name,
        appCategory: app.category,
        appChains: app.chains,
        accentColor: app.accentColor,
      };
      if (!flowMap.has(screen.flow)) {
        flowMap.set(screen.flow, []);
      }
      flowMap.get(screen.flow)!.push(enriched);
    }
    for (const [flowType, screens] of flowMap) {
      const sorted = screens.sort((a, b) => a.step - b.step);
      const firstWithImage = sorted.find((s) => s.image);
      result.push({
        appSlug: app.slug,
        appName: app.name,
        appCategory: app.category,
        appChains: app.chains,
        accentColor: app.accentColor,
        flowType,
        screens: sorted,
        count: sorted.length,
        thumbnail: firstWithImage?.image,
      });
    }
  }
  return result;
}

// ── Auto-detected changes ─────────────────────────────────────────────────

export function getAutoChanges(slug: string): DiffChange[] {
  return autoChangesBySlug[slug] || [];
}

export interface EnrichedAutoChange extends DiffChange {
  appSlug: string;
  appName: string;
  appCategory: AppCategory;
  accentColor: string;
}

export function getAllChangesWithAuto(): (EnrichedChange | EnrichedAutoChange)[] {
  const manual = getAllChanges();
  const auto: EnrichedAutoChange[] = [];

  for (const app of apps) {
    const appAutoChanges = autoChangesBySlug[app.slug];
    if (!appAutoChanges) continue;
    for (const change of appAutoChanges) {
      auto.push({
        ...change,
        appSlug: app.slug,
        appName: app.name,
        appCategory: app.category,
        accentColor: app.accentColor,
      });
    }
  }

  return [...manual, ...auto].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ── Copy tracking ─────────────────────────────────────────────────────────

export function getCopyData(slug: string): { snapshots: CopySnapshot[]; changes: CopyChange[] } {
  return copyDataBySlug[slug] || { snapshots: [], changes: [] };
}

// ── Tech stack ────────────────────────────────────────────────────────────

export function getTechStack(slug: string): TechStackEntry[] {
  return techStackBySlug[slug] || [];
}

export function getAllTechStacks(): Record<string, { app: CryptoApp; stack: TechStackEntry[] }> {
  const result: Record<string, { app: CryptoApp; stack: TechStackEntry[] }> = {};
  for (const app of apps) {
    const stack = techStackBySlug[app.slug];
    if (stack && stack.length > 0) {
      result[app.slug] = { app, stack };
    }
  }
  return result;
}

// ── Performance ───────────────────────────────────────────────────────────

export function getPerformanceData(slug: string): PerformanceMetrics[] {
  return performanceBySlug[slug] || [];
}

export function getAllPerformanceData(): Record<string, { app: CryptoApp; metrics: PerformanceMetrics[] }> {
  const result: Record<string, { app: CryptoApp; metrics: PerformanceMetrics[] }> = {};
  for (const app of apps) {
    const metrics = performanceBySlug[app.slug];
    if (metrics && metrics.length > 0) {
      result[app.slug] = { app, metrics };
    }
  }
  return result;
}

// ── Detected elements ────────────────────────────────────────────────────

const elementsMap = elementsData as Record<string, DetectedElement[]>;

export function getElementsForImage(imagePath: string): DetectedElement[] {
  return elementsMap[imagePath] || [];
}

export interface ElementTypeInfo {
  tag: GranularElementTag;
  count: number;
  appCount: number;
  screens: EnrichedScreen[];
  thumbnail?: string;
}

export function getAllElements(): ElementTypeInfo[] {
  const allScreens = getAllScreens();
  const screensByImage = new Map<string, EnrichedScreen>();
  for (const s of allScreens) {
    if (s.image) screensByImage.set(s.image, s);
  }

  const tagMap = new Map<string, { screens: Set<string>; apps: Set<string>; thumbnail?: string }>();

  for (const [imagePath, elements] of Object.entries(elementsMap)) {
    if (!Array.isArray(elements)) continue;
    const screen = screensByImage.get(imagePath);
    if (!screen) continue;

    for (const el of elements) {
      if (!el.tag) continue;
      let entry = tagMap.get(el.tag);
      if (!entry) {
        entry = { screens: new Set(), apps: new Set(), thumbnail: undefined };
        tagMap.set(el.tag, entry);
      }
      entry.screens.add(imagePath);
      entry.apps.add(screen.appSlug);
      if (!entry.thumbnail) entry.thumbnail = imagePath;
    }
  }

  const result: ElementTypeInfo[] = [];
  for (const [tag, data] of tagMap) {
    const screens = Array.from(data.screens)
      .map((p) => screensByImage.get(p))
      .filter((s): s is EnrichedScreen => !!s);
    result.push({
      tag: tag as GranularElementTag,
      count: data.screens.size,
      appCount: data.apps.size,
      screens,
      thumbnail: data.thumbnail,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

// ── Change helpers (weekly grouping, stats) ──────────────────────────

function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - jan4.getTime()) / 86400000) + 4;
  const week = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekLabel(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const jan4 = new Date(year, 0, 4);
  const dayOffset = (week - 1) * 7 - ((jan4.getDay() + 6) % 7);
  const start = new Date(year, 0, 4 + dayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${year}`;
}

export interface WeeklyChangeGroup {
  weekKey: string;
  weekLabel: string;
  changes: (EnrichedChange | EnrichedAutoChange)[];
}

export function getChangesByWeek(): WeeklyChangeGroup[] {
  const all = getAllChangesWithAuto();
  const weekMap = new Map<string, (EnrichedChange | EnrichedAutoChange)[]>();

  for (const change of all) {
    const key = getISOWeekKey(change.date);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(change);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekKey, changes]) => ({
      weekKey,
      weekLabel: getWeekLabel(weekKey),
      changes,
    }));
}

export function getRecentChanges(n: number): (EnrichedChange | EnrichedAutoChange)[] {
  return getAllChangesWithAuto().slice(0, n);
}

export function getChangeStats(): {
  totalChanges: number;
  thisWeekCount: number;
  appsWithChanges: number;
  byType: Record<string, number>;
} {
  const all = getAllChangesWithAuto();
  const currentWeek = getISOWeekKey(new Date().toISOString());
  const thisWeek = all.filter((c) => getISOWeekKey(c.date) === currentWeek);
  const apps = new Set(all.map((c) => c.appSlug));
  const byType: Record<string, number> = {};
  for (const c of all) {
    byType[c.type] = (byType[c.type] || 0) + 1;
  }
  return { totalChanges: all.length, thisWeekCount: thisWeek.length, appsWithChanges: apps.size, byType };
}

// ── Screen helpers for patterns ─────────────────────────────────────

export function getScreensByGranularTag(tag: GranularElementTag): EnrichedScreen[] {
  const allScreens = getAllScreens();
  const screensByImage = new Map<string, EnrichedScreen>();
  for (const s of allScreens) {
    if (s.image) screensByImage.set(s.image, s);
  }

  const result: EnrichedScreen[] = [];
  for (const [imagePath, elements] of Object.entries(elementsMap)) {
    if (!Array.isArray(elements)) continue;
    const hasTag = elements.some((el) => el.tag === tag);
    if (!hasTag) continue;
    const screen = screensByImage.get(imagePath);
    if (screen) result.push(screen);
  }
  return result;
}

export function getScreensMatchingAnyTag(tags: GranularElementTag[]): EnrichedScreen[] {
  const allScreens = getAllScreens();
  const screensByImage = new Map<string, EnrichedScreen>();
  for (const s of allScreens) {
    if (s.image) screensByImage.set(s.image, s);
  }

  const tagSet = new Set(tags);
  const result = new Map<string, EnrichedScreen>();

  for (const [imagePath, elements] of Object.entries(elementsMap)) {
    if (!Array.isArray(elements)) continue;
    const hasTag = elements.some((el) => tagSet.has(el.tag));
    if (!hasTag) continue;
    const screen = screensByImage.get(imagePath);
    if (screen && !result.has(imagePath)) result.set(imagePath, screen);
  }
  return Array.from(result.values());
}

// ── Flow helpers for comparison ─────────────────────────────────────

export function getFlowsForApps(slugs: string[], flowType: FlowType): AppFlow[] {
  return getAllFlows().filter(
    (f) => slugs.includes(f.appSlug) && f.flowType === flowType
  );
}

export function getMaxStepCount(flows: AppFlow[]): number {
  return Math.max(0, ...flows.map((f) => f.count));
}

// ── Insights helpers ────────────────────────────────────────────────

export function getAllInsights(): Insight[] {
  const all: Insight[] = [];
  for (const insights of Object.values(insightsBySlug)) {
    all.push(...insights);
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getRecentInsights(days: number): Insight[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return getAllInsights().filter((i) => new Date(i.date) >= cutoff);
}
