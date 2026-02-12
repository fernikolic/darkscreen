import { apps, type AppScreen, type FlowType, type AppCategory, type ChainType } from "./apps";

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
