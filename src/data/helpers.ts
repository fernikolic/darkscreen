import { apps, type AppScreen, type AppChange, type ChangeType, type FlowType, type AppCategory, type ChainType, type IntelLayer, type CryptoApp, type DiffChange, type CopySnapshot, type CopyChange, type TechStackEntry, type PerformanceMetrics, INTEL_LAYERS } from "./apps";
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
