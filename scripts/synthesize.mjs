#!/usr/bin/env node

/**
 * Synthesize cross-product intelligence patterns from extracted data.
 *
 * Reads all {slug}-extracted.json files, aggregates patterns across apps,
 * computes adoption rates, and outputs structured intelligence files.
 * No API calls — pure data aggregation.
 *
 * Usage:
 *   node scripts/synthesize.mjs                      # synthesize all
 *   node scripts/synthesize.mjs --category DeFi      # filter by category
 *   node scripts/synthesize.mjs --min-apps 5          # pattern threshold
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const SCREENSHOT_DIR = resolve(PROJECT_ROOT, "public/screenshots");
const INTEL_DIR = resolve(PROJECT_ROOT, "data/intelligence");

// ─── CLI Args ───────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    category: { type: "string" },
    "min-apps": { type: "string", default: "3" },
  },
  strict: false,
});

const MIN_APPS = parseInt(args["min-apps"], 10);

// ─── Load all extracted data ────────────────────────────────────────────

function loadExtractions() {
  const files = readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith("-extracted.json"));
  const extractions = [];

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(resolve(SCREENSHOT_DIR, file), "utf-8"));
      if (args.category && data.category !== args.category) continue;
      if (data.screens && data.screens.length > 0) {
        extractions.push(data);
      }
    } catch {
      console.warn(`  Skipping malformed: ${file}`);
    }
  }

  return extractions;
}

// ─── Helper: Normalize names for grouping ───────────────────────────────

function normalizeKey(str) {
  if (typeof str !== "string") return str;
  return str
    .toLowerCase()
    .replace(/[-_/]/g, " ")      // hyphens, underscores, slashes → spaces
    .replace(/\s+/g, " ")        // collapse whitespace
    .trim();
}

// ─── Helper: Count and rank patterns ────────────────────────────────────

// countPatterns: raw occurrence counting (used internally for per-app dominant detection)
function countPatterns(items) {
  const counts = {};
  for (const item of items) {
    if (!item) continue;
    const key = typeof item === "string" ? item : JSON.stringify(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => {
      try {
        return { value: JSON.parse(value), count };
      } catch {
        return { value, count };
      }
    });
}

// countByApp: count unique apps per pattern (for adoption rates)
// items: [{ value: string, app: string }]
function countByApp(items) {
  const groups = {};        // normalizedKey → { displayName, apps: Set, totalOccurrences }
  for (const { value, app } of items) {
    if (!value) continue;
    const normalized = normalizeKey(value);
    if (!groups[normalized]) {
      groups[normalized] = { displayName: value, apps: new Set(), totalOccurrences: 0 };
    }
    groups[normalized].apps.add(app);
    groups[normalized].totalOccurrences++;
  }
  return Object.values(groups)
    .sort((a, b) => b.apps.size - a.apps.size || b.totalOccurrences - a.totalOccurrences)
    .map((g) => ({
      value: g.displayName,
      appCount: g.apps.size,
      totalOccurrences: g.totalOccurrences,
      apps: [...g.apps],
    }));
}

function classifyPattern(appCount, totalApps) {
  const rate = appCount / totalApps;
  if (rate >= 0.7) return "dominant";
  if (rate >= 0.3) return "common";
  if (appCount <= 2) return "outlier";
  return "emerging";
}

// buildPatternList: adoption rate = unique apps / totalApps, with name normalization
// taggedItems: [{ value: string, app: string }]
function buildPatternList(taggedItems, totalApps) {
  const counted = countByApp(taggedItems);
  return counted.map((p) => ({
    name: p.value,
    value: p.value,
    count: p.appCount,
    totalOccurrences: p.totalOccurrences,
    adoptionRate: +(p.appCount / totalApps).toFixed(3),
    classification: classifyPattern(p.appCount, totalApps),
    apps: p.apps,
  }));
}

// Helper: extract app slug from image path
function appFromImage(image) {
  return image?.split("/").pop()?.split("-")[0] || "unknown";
}

// ─── Ensure output directories ──────────────────────────────────────────

function ensureDirs() {
  const dirs = [
    INTEL_DIR,
    resolve(INTEL_DIR, "design"),
    resolve(INTEL_DIR, "flows"),
    resolve(INTEL_DIR, "copy"),
    resolve(INTEL_DIR, "competitive"),
  ];
  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }
}

// ─── Synthesize design patterns ─────────────────────────────────────────

function synthesizeDesign(extractions) {
  const allScreens = extractions.flatMap((e) => e.screens.filter((s) => s.design));
  const totalApps = extractions.length;

  if (allScreens.length === 0) return;

  // Navigation patterns (from components)
  const navComponents = allScreens.flatMap((s) =>
    (s.design?.components || [])
      .filter((c) => c.type?.toLowerCase().includes("nav") || c.type?.toLowerCase().includes("menu") || c.type?.toLowerCase().includes("sidebar"))
      .map((c) => ({ value: c.type, app: appFromImage(s.image) }))
  );
  writeIntelFile("design/navigation-patterns.json", {
    title: "Navigation Patterns",
    totalScreens: allScreens.length,
    totalApps,
    patterns: buildPatternList(navComponents, totalApps),
  });

  // Component catalog (with normalization)
  const componentDetails = {};  // normalizedKey → { displayName, apps: Set, count, examples, notables }
  for (const screen of allScreens) {
    const app = appFromImage(screen.image);
    for (const comp of screen.design?.components || []) {
      if (!comp.type) continue;
      const key = normalizeKey(comp.type);
      if (!componentDetails[key]) {
        componentDetails[key] = { displayName: comp.type, apps: new Set(), count: 0, examples: [], notables: [] };
      }
      componentDetails[key].apps.add(app);
      componentDetails[key].count++;
      if (componentDetails[key].examples.length < 5) {
        componentDetails[key].examples.push({
          app,
          description: comp.description,
          position: comp.position,
        });
      }
      if (comp.notable && componentDetails[key].notables.length < 3) {
        componentDetails[key].notables.push(comp.notable);
      }
    }
  }
  writeIntelFile("design/component-catalog.json", {
    title: "Component Catalog",
    totalScreens: allScreens.length,
    totalApps,
    components: Object.values(componentDetails)
      .sort((a, b) => b.apps.size - a.apps.size || b.count - a.count)
      .map((data) => ({
        type: data.displayName,
        appCount: data.apps.size,
        totalOccurrences: data.count,
        adoptionRate: +(data.apps.size / totalApps).toFixed(3),
        classification: classifyPattern(data.apps.size, totalApps),
        apps: [...data.apps],
        examples: data.examples,
        notables: data.notables,
      })),
  });

  // Layout patterns
  const layouts = allScreens
    .map((s) => ({ value: s.design?.layout, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  writeIntelFile("design/layout-patterns.json", {
    title: "Layout Patterns",
    totalScreens: allScreens.length,
    totalApps,
    patterns: buildPatternList(layouts, totalApps),
  });

  // Color schemes
  const colorSchemes = allScreens
    .map((s) => ({ value: s.design?.colorScheme, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  const colorsByApp = {};
  for (const ext of extractions) {
    const colors = ext.screens
      .flatMap((s) => s.design?.primaryColors || [])
      .filter(Boolean);
    if (colors.length > 0) {
      colorsByApp[ext.slug] = [...new Set(colors)].slice(0, 5);
    }
  }
  writeIntelFile("design/color-schemes.json", {
    title: "Color Schemes",
    totalScreens: allScreens.length,
    totalApps,
    schemeDistribution: buildPatternList(colorSchemes, totalApps),
    appPalettes: colorsByApp,
  });

  // Typography patterns
  const headingStyles = allScreens
    .map((s) => ({ value: s.design?.typography?.headingStyle, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  const bodyStyles = allScreens
    .map((s) => ({ value: s.design?.typography?.bodyStyle, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  const dataStyles = allScreens
    .map((s) => ({ value: s.design?.typography?.dataStyle, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  writeIntelFile("design/typography-patterns.json", {
    title: "Typography Patterns",
    totalScreens: allScreens.length,
    totalApps,
    headingStyles: buildPatternList(headingStyles, totalApps),
    bodyStyles: buildPatternList(bodyStyles, totalApps),
    dataStyles: buildPatternList(dataStyles, totalApps),
  });

  // Spacing patterns
  const spacing = allScreens
    .map((s) => ({ value: s.design?.spacing, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  writeIntelFile("design/spacing-patterns.json", {
    title: "Spacing Patterns",
    totalScreens: allScreens.length,
    totalApps,
    patterns: buildPatternList(spacing, totalApps),
  });

  // Innovative elements
  const innovations = [];
  const innovationTagged = [];
  for (const screen of allScreens) {
    const app = appFromImage(screen.image);
    for (const el of screen.design?.innovativeElements || []) {
      if (el) {
        innovations.push({ element: el, app, screen: screen.label });
        innovationTagged.push({ value: el, app });
      }
    }
  }
  writeIntelFile("design/innovative-elements.json", {
    title: "Innovative Design Elements",
    totalScreens: allScreens.length,
    totalApps,
    elements: innovations,
    patterns: buildPatternList(innovationTagged, totalApps),
  });

  // Empty states & error states
  const emptyStateScreens = allScreens.filter(
    (s) => s.flow?.screenType === "empty-state" || (s.copy?.emptyStateText || []).length > 0
  );
  writeIntelFile("design/empty-states.json", {
    title: "Empty State Patterns",
    totalApps,
    screens: emptyStateScreens.map((s) => ({
      app: s.image?.split("/").pop()?.split("-")[0],
      label: s.label,
      text: s.copy?.emptyStateText || [],
      layout: s.design?.layout,
    })),
  });

  const errorScreens = allScreens.filter(
    (s) => s.flow?.screenType === "error" || (s.copy?.errorMessages || []).length > 0
  );
  writeIntelFile("design/error-states.json", {
    title: "Error State Patterns",
    totalApps,
    screens: errorScreens.map((s) => ({
      app: s.image?.split("/").pop()?.split("-")[0],
      label: s.label,
      messages: s.copy?.errorMessages || [],
      layout: s.design?.layout,
    })),
  });
}

// ─── Synthesize flow patterns ───────────────────────────────────────────

function synthesizeFlows(extractions) {
  const allScreens = extractions.flatMap((e) => e.screens.filter((s) => s.flow));
  const totalApps = extractions.length;

  if (allScreens.length === 0) return;

  const flowTypeNames = ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"];

  for (const flowType of flowTypeNames) {
    // flowType is from manifest ("Home", "Swap", etc.) — stored as screen.flowType
    // screen.flow is the extracted flow analysis object { screenType, userIntent, ... }
    const flowScreens = allScreens.filter((s) => s.flowType === flowType);
    if (flowScreens.length < MIN_APPS) continue;

    const appsWithFlow = new Set(flowScreens.map((s) => appFromImage(s.image)));
    const appsTotal = appsWithFlow.size;

    // Screen types within this flow
    const screenTypes = flowScreens
      .map((s) => ({ value: s.flow?.screenType, app: appFromImage(s.image) }))
      .filter((t) => t.value);

    // Friction points
    const frictionPoints = flowScreens.flatMap((s) =>
      (s.flow?.frictionPoints || []).filter(Boolean).map((fp) => ({ value: fp, app: appFromImage(s.image) }))
    );

    // Interactive elements
    const interactiveTypes = flowScreens.flatMap((s) =>
      (s.flow?.interactiveElements || [])
        .filter((e) => e.element)
        .map((e) => ({ value: e.element, app: appFromImage(s.image) }))
    );

    // User intents
    const userIntents = flowScreens
      .map((s) => ({ value: s.flow?.userIntent, app: appFromImage(s.image) }))
      .filter((t) => t.value);

    // Progress indicators
    const progressIndicators = flowScreens.flatMap((s) =>
      (s.flow?.progressIndicators || []).filter(Boolean).map((pi) => ({ value: pi, app: appFromImage(s.image) }))
    );

    writeIntelFile(`flows/${flowType.toLowerCase()}-patterns.json`, {
      title: `${flowType} Flow Patterns`,
      totalApps: appsTotal,
      totalScreens: flowScreens.length,
      apps: [...appsWithFlow],
      screenTypes: buildPatternList(screenTypes, appsTotal),
      userIntents: buildPatternList(userIntents, appsTotal),
      interactiveElements: buildPatternList(interactiveTypes, appsTotal),
      frictionPoints: buildPatternList(frictionPoints, appsTotal),
      progressIndicators: buildPatternList(progressIndicators, appsTotal),
    });
  }

  // Flow complexity comparison
  const flowComplexity = {};
  for (const ext of extractions) {
    const flows = {};
    for (const screen of ext.screens) {
      const ft = screen.flowType || "unknown";
      if (!flows[ft]) flows[ft] = 0;
      flows[ft]++;
    }
    flowComplexity[ext.slug] = {
      category: ext.category,
      totalScreens: ext.screens.length,
      flows,
    };
  }
  writeIntelFile("flows/flow-complexity.json", {
    title: "Flow Complexity Comparison",
    totalApps,
    apps: flowComplexity,
  });
}

// ─── Synthesize copy patterns ───────────────────────────────────────────

function synthesizeCopy(extractions) {
  const allScreens = extractions.flatMap((e) => e.screens.filter((s) => s.copy));
  const totalApps = extractions.length;

  if (allScreens.length === 0) return;

  // CTA patterns
  const ctaTexts = allScreens.flatMap((s) =>
    (s.copy?.ctas || []).filter((c) => c.text).map((c) => ({ value: c.text, app: appFromImage(s.image) }))
  );
  const ctaStyles = allScreens.flatMap((s) =>
    (s.copy?.ctas || []).filter((c) => c.style).map((c) => ({ value: c.style, app: appFromImage(s.image) }))
  );
  const ctaPlacements = allScreens.flatMap((s) =>
    (s.copy?.ctas || []).filter((c) => c.placement).map((c) => ({ value: c.placement, app: appFromImage(s.image) }))
  );
  const totalCtas = allScreens.reduce((sum, s) => sum + (s.copy?.ctas || []).length, 0);
  writeIntelFile("copy/cta-patterns.json", {
    title: "CTA Patterns",
    totalScreens: allScreens.length,
    totalApps,
    totalCtas,
    textPatterns: buildPatternList(ctaTexts, totalApps),
    stylePatterns: buildPatternList(ctaStyles, totalApps),
    placementPatterns: buildPatternList(ctaPlacements, totalApps),
  });

  // Tone analysis
  const tones = allScreens
    .map((s) => ({ value: s.copy?.tone, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  const toneByApp = {};
  for (const ext of extractions) {
    const appTones = ext.screens.map((s) => s.copy?.tone).filter(Boolean);
    if (appTones.length > 0) {
      const dominant = countPatterns(appTones)[0];
      toneByApp[ext.slug] = {
        category: ext.category,
        dominantTone: dominant?.value,
        allTones: [...new Set(appTones)],
      };
    }
  }
  writeIntelFile("copy/tone-analysis.json", {
    title: "Tone Analysis",
    totalScreens: allScreens.length,
    totalApps,
    overallDistribution: buildPatternList(tones, totalApps),
    byApp: toneByApp,
  });

  // Microcopy catalog
  const microcopyPurposes = allScreens.flatMap((s) =>
    (s.copy?.microcopy || []).filter((m) => m.purpose).map((m) => ({ value: m.purpose, app: appFromImage(s.image) }))
  );
  const microcopyContexts = allScreens.flatMap((s) =>
    (s.copy?.microcopy || []).filter((m) => m.context).map((m) => ({ value: m.context, app: appFromImage(s.image) }))
  );
  const allMicrocopy = allScreens.flatMap((s) => s.copy?.microcopy || []);
  writeIntelFile("copy/microcopy-catalog.json", {
    title: "Microcopy Catalog",
    totalScreens: allScreens.length,
    totalApps,
    totalMicrocopy: allMicrocopy.length,
    byPurpose: buildPatternList(microcopyPurposes, totalApps),
    byContext: buildPatternList(microcopyContexts, totalApps),
    examples: allMicrocopy.slice(0, 100),
  });

  // Trust signals
  const trustSignals = allScreens.flatMap((s) =>
    (s.copy?.trustSignals || []).filter(Boolean).map((t) => ({ value: t, app: appFromImage(s.image) }))
  );
  writeIntelFile("copy/trust-signals.json", {
    title: "Trust Signal Patterns",
    totalScreens: allScreens.length,
    totalApps,
    patterns: buildPatternList(trustSignals, totalApps),
  });

  // Data formatting
  const dataFormats = allScreens.flatMap((s) => s.copy?.dataFormatting || []).filter(Boolean);
  const dataFormatTagged = allScreens.flatMap((s) =>
    (s.copy?.dataFormatting || []).filter(Boolean).map((d) => {
      let category;
      if (/^\$[\d,.]+[BMKT]?$/.test(d)) category = "dollar-amount";
      else if (/[\d,.]+%$/.test(d)) category = "percentage";
      else if (/^[\d,.]+\s*(ETH|BTC|SOL|USDC|USDT)/.test(d)) category = "token-amount";
      else category = "other";
      return { value: category, app: appFromImage(s.image) };
    })
  );
  writeIntelFile("copy/data-formatting.json", {
    title: "Data Formatting Patterns",
    totalScreens: allScreens.length,
    totalApps,
    examples: dataFormats.slice(0, 200),
    patterns: buildPatternList(dataFormatTagged, totalApps),
  });

  // Jargon levels
  const jargonLevels = allScreens
    .map((s) => ({ value: s.copy?.jargonLevel, app: appFromImage(s.image) }))
    .filter((t) => t.value);
  const jargonByApp = {};
  for (const ext of extractions) {
    const levels = ext.screens.map((s) => s.copy?.jargonLevel).filter(Boolean);
    if (levels.length > 0) {
      const dominant = countPatterns(levels)[0];
      jargonByApp[ext.slug] = {
        category: ext.category,
        dominantLevel: dominant?.value,
        distribution: countPatterns(levels),
      };
    }
  }
  writeIntelFile("copy/jargon-levels.json", {
    title: "Jargon Level Analysis",
    totalScreens: allScreens.length,
    totalApps,
    overallDistribution: buildPatternList(jargonLevels, totalApps),
    byApp: jargonByApp,
  });

  // Error messages
  const errorMsgTagged = allScreens.flatMap((s) =>
    (s.copy?.errorMessages || []).filter(Boolean).map((m) => ({ value: m, app: appFromImage(s.image) }))
  );
  const errorMessages = allScreens.flatMap((s) => s.copy?.errorMessages || []).filter(Boolean);
  writeIntelFile("copy/error-messages.json", {
    title: "Error Message Patterns",
    totalScreens: allScreens.length,
    totalApps,
    messages: errorMessages,
    patterns: buildPatternList(errorMsgTagged, totalApps),
  });
}

// ─── Synthesize competitive intelligence ────────────────────────────────

function synthesizeCompetitive(extractions) {
  const categoryMap = {
    Exchange: "exchanges",
    Wallet: "wallets",
    DeFi: "defi-protocols",
    Analytics: "analytics",
    Bridge: "bridges",
    Infrastructure: "infrastructure",
    Payment: "payments",
    NFT: "nft-platforms",
  };

  for (const [category, filename] of Object.entries(categoryMap)) {
    const categoryApps = extractions.filter((e) => e.category === category);
    if (categoryApps.length < MIN_APPS) continue;

    const comparison = categoryApps.map((ext) => {
      const screens = ext.screens;

      // Aggregate design traits
      const layouts = [...new Set(screens.map((s) => s.design?.layout).filter(Boolean))];
      const colorSchemes = [...new Set(screens.map((s) => s.design?.colorScheme).filter(Boolean))];
      const componentTypes = [...new Set(screens.flatMap((s) => (s.design?.components || []).map((c) => c.type)).filter(Boolean))];

      // Aggregate flow traits
      const flowTypes = [...new Set(screens.map((s) => s.flow).filter((f) => typeof f === "string"))];
      const screenTypes = [...new Set(screens.map((s) => s.flow?.screenType).filter(Boolean))];

      // Aggregate copy traits
      const tones = [...new Set(screens.map((s) => s.copy?.tone).filter(Boolean))];
      const jargonLevels = [...new Set(screens.map((s) => s.copy?.jargonLevel).filter(Boolean))];
      const ctaCount = screens.reduce((sum, s) => sum + (s.copy?.ctas || []).length, 0);
      const trustSignals = [...new Set(screens.flatMap((s) => s.copy?.trustSignals || []).filter(Boolean))];

      return {
        slug: ext.slug,
        totalScreens: screens.length,
        design: { layouts, colorSchemes, componentTypes: componentTypes.slice(0, 15) },
        flows: { flowTypes, screenTypes: screenTypes.slice(0, 10) },
        copy: { tones, jargonLevels, ctaCount, trustSignals: trustSignals.slice(0, 10) },
      };
    });

    writeIntelFile(`competitive/${filename}.json`, {
      title: `${category} Competitive Analysis`,
      totalApps: categoryApps.length,
      apps: comparison,
      insights: generateCompetitiveInsights(comparison, category),
    });
  }
}

function generateCompetitiveInsights(apps, category) {
  const insights = [];

  // Most complex app
  const byScreenCount = [...apps].sort((a, b) => b.totalScreens - a.totalScreens);
  if (byScreenCount.length > 0) {
    insights.push({
      type: "complexity",
      text: `Most complex ${category.toLowerCase()}: ${byScreenCount[0].slug} (${byScreenCount[0].totalScreens} screens)`,
    });
  }

  // Dark vs light
  const darkCount = apps.filter((a) => a.design.colorSchemes.includes("dark")).length;
  const lightCount = apps.filter((a) => a.design.colorSchemes.includes("light")).length;
  insights.push({
    type: "design-trend",
    text: `Color scheme: ${darkCount} dark, ${lightCount} light out of ${apps.length} apps`,
  });

  // Jargon distribution
  const expertCount = apps.filter((a) => a.copy.jargonLevels.includes("expert")).length;
  const beginnerCount = apps.filter((a) => a.copy.jargonLevels.includes("beginner")).length;
  insights.push({
    type: "accessibility",
    text: `Jargon: ${beginnerCount} beginner-friendly, ${expertCount} expert-level out of ${apps.length} apps`,
  });

  return insights;
}

// ─── Write intelligence file ────────────────────────────────────────────

function writeIntelFile(relativePath, data) {
  const fullPath = resolve(INTEL_DIR, relativePath);
  const dir = dirname(fullPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`  Wrote ${relativePath} (${JSON.stringify(data).length} bytes)`);
}

// ─── Build index ────────────────────────────────────────────────────────

function buildIndex(extractions) {
  const categories = {};
  for (const ext of extractions) {
    if (!categories[ext.category]) categories[ext.category] = [];
    categories[ext.category].push(ext.slug);
  }

  const totalScreens = extractions.reduce((sum, e) => sum + e.screens.length, 0);

  writeIntelFile("index.json", {
    title: "Darkscreen Intelligence Index",
    generatedAt: new Date().toISOString(),
    totalApps: extractions.length,
    totalScreens,
    categories,
    files: {
      design: [
        "navigation-patterns.json",
        "component-catalog.json",
        "layout-patterns.json",
        "color-schemes.json",
        "typography-patterns.json",
        "spacing-patterns.json",
        "innovative-elements.json",
        "empty-states.json",
        "error-states.json",
      ],
      flows: [
        "home-patterns.json",
        "onboarding-patterns.json",
        "swap-patterns.json",
        "send-patterns.json",
        "staking-patterns.json",
        "settings-patterns.json",
        "flow-complexity.json",
      ],
      copy: [
        "cta-patterns.json",
        "tone-analysis.json",
        "microcopy-catalog.json",
        "trust-signals.json",
        "data-formatting.json",
        "jargon-levels.json",
        "error-messages.json",
      ],
      competitive: [
        "exchanges.json",
        "wallets.json",
        "defi-protocols.json",
        "analytics.json",
        "bridges.json",
        "infrastructure.json",
        "payments.json",
        "nft-platforms.json",
      ],
    },
  });
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  const startTime = Date.now();

  console.log("Loading extracted intelligence data...\n");
  const extractions = loadExtractions();

  if (extractions.length === 0) {
    console.error("No extracted data found. Run extract.mjs first:");
    console.error("  node scripts/extract.mjs --all");
    process.exit(1);
  }

  const totalScreens = extractions.reduce((sum, e) => sum + e.screens.length, 0);
  console.log(`Loaded ${extractions.length} apps, ${totalScreens} screens`);
  if (args.category) console.log(`Filtered to category: ${args.category}`);
  console.log(`Minimum apps threshold: ${MIN_APPS}\n`);

  ensureDirs();

  console.log("Synthesizing design patterns...");
  synthesizeDesign(extractions);

  console.log("\nSynthesizing flow patterns...");
  synthesizeFlows(extractions);

  console.log("\nSynthesizing copy patterns...");
  synthesizeCopy(extractions);

  console.log("\nSynthesizing competitive intelligence...");
  synthesizeCompetitive(extractions);

  console.log("\nBuilding index...");
  buildIndex(extractions);

  const elapsed = Date.now() - startTime;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Synthesis complete`);
  console.log(`  Apps: ${extractions.length}, Screens: ${totalScreens}`);
  console.log(`  Time: ${elapsed}ms`);
  console.log(`  Output: ${INTEL_DIR}`);
  console.log(`${"─".repeat(60)}`);
}

main();
