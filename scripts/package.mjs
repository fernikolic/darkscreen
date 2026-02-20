#!/usr/bin/env node

/**
 * Package intelligence data into a skill directory of markdown files.
 *
 * Reads data/intelligence/**\/*.json and produces a structured skill bundle
 * at crypto-product-design/ with SKILL.md + topic files.
 * No API calls — pure template generation.
 *
 * Usage:
 *   node scripts/package.mjs                  # generate all
 *   node scripts/package.mjs --validate       # check all files < 500 lines
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const INTEL_DIR = resolve(PROJECT_ROOT, "data/intelligence");
const OUTPUT_DIR = resolve(PROJECT_ROOT, "crypto-product-design");

// ─── CLI Args ───────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    validate: { type: "boolean", default: false },
  },
  strict: false,
});

const MAX_LINES = 500;

// ─── Helpers ────────────────────────────────────────────────────────────

function readIntel(relativePath) {
  const fullPath = resolve(INTEL_DIR, relativePath);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, "utf-8"));
  } catch {
    return null;
  }
}

function writeSkillFile(relativePath, content) {
  const fullPath = resolve(OUTPUT_DIR, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);

  const lineCount = content.split("\n").length;
  const status = lineCount > MAX_LINES ? " (OVER LIMIT)" : "";
  console.log(`  ${relativePath} — ${lineCount} lines${status}`);

  return { path: relativePath, lines: lineCount };
}

function formatPercent(rate) {
  return `${(rate * 100).toFixed(0)}%`;
}

function classificationEmoji(classification) {
  if (classification === "dominant") return "**[70%+]**";
  if (classification === "common") return "[30-70%]";
  if (classification === "emerging") return "[emerging]";
  return "[outlier]";
}

function renderPatternList(patterns, limit = 20) {
  if (!patterns || patterns.length === 0) return "_No data available._\n";

  const dominant = patterns.filter((p) => p.classification === "dominant");
  const common = patterns.filter((p) => p.classification === "common");
  const emerging = patterns.filter((p) => p.classification === "emerging");
  const outliers = patterns.filter((p) => p.classification === "outlier");

  let md = "";

  if (dominant.length > 0) {
    md += "### Dominant (70%+ adoption)\n\n";
    for (const p of dominant.slice(0, limit)) {
      md += `- **${p.name || p.value}** — ${formatPercent(p.adoptionRate)} (${p.count} apps)\n`;
    }
    md += "\n";
  }

  if (common.length > 0) {
    md += "### Common (30-70% adoption)\n\n";
    for (const p of common.slice(0, limit)) {
      md += `- **${p.name || p.value}** — ${formatPercent(p.adoptionRate)} (${p.count} apps)\n`;
    }
    md += "\n";
  }

  if (emerging.length > 0) {
    md += "### Emerging\n\n";
    for (const p of emerging.slice(0, limit)) {
      md += `- ${p.name || p.value} — ${formatPercent(p.adoptionRate)} (${p.count} apps)\n`;
    }
    md += "\n";
  }

  if (outliers.length > 0) {
    md += "### Outliers\n\n";
    for (const p of outliers.slice(0, Math.min(limit, 10))) {
      md += `- ${p.name || p.value} (${p.count} apps)\n`;
    }
    md += "\n";
  }

  return md;
}

function renderQuickRef(patterns, limit = 15) {
  if (!patterns || patterns.length === 0) return "";

  let md = "### Quick Reference\n\n";
  md += "| Pattern | Adoption | Classification |\n";
  md += "|---------|----------|----------------|\n";
  for (const p of patterns.slice(0, limit)) {
    md += `| ${p.name || p.value} | ${formatPercent(p.adoptionRate)} | ${p.classification} |\n`;
  }
  md += "\n";
  return md;
}

// ─── Ensure output directories ──────────────────────────────────────────

function ensureDirs() {
  const dirs = [
    OUTPUT_DIR,
    resolve(OUTPUT_DIR, "design"),
    resolve(OUTPUT_DIR, "flows"),
    resolve(OUTPUT_DIR, "copy"),
    resolve(OUTPUT_DIR, "competitive"),
  ];
  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }
}

// ─── Generate SKILL.md ─────────────────────────────────────────────────

function generateSkillMd(index) {
  const categories = index?.categories || {};
  const totalApps = index?.totalApps || 0;
  const totalScreens = index?.totalScreens || 0;
  const categoryCount = Object.keys(categories).length;

  const categoryList = Object.entries(categories)
    .map(([cat, apps]) => `${cat} (${apps.length})`)
    .join(", ");

  let md = `---
name: Crypto Product Design
version: 1.0.0
description: >-
  Design patterns, user flows, and copywriting analysis derived from
  ${totalScreens} screenshots across ${totalApps} crypto applications.
---

You are Darkscreen, a crypto product design assistant. You help designers and product teams make decisions backed by real data from across the crypto industry. You have deep knowledge of design patterns, user flows, and copywriting across ${totalApps} crypto applications (${totalScreens} screenshots analyzed) spanning ${categoryCount} categories: ${categoryList}.

When the user first invokes this skill, greet them with this exact message (preserve the formatting):

\`\`\`
    ____             __
   / __ \\____ ______/ /_____________  ___  ____
  / / / / __ \`/ ___/ //_/ ___/ ___/ / _ \\/ _ \\/ __ \\
 / /_/ / /_/ / /  / ,< (__  ) /__/ /  __/  __/ / / /
/_____/\\__,_/_/  /_/|_/____/\\___/_/\\___/\\___/_/ /_/
                                    darkscreen.xyz
\`\`\`

**Crypto Product Design** — ${totalApps} apps \u00b7 ${totalScreens} screenshots \u00b7 ${categoryCount} categories

I can help you with:

- **Design patterns** \u2014 component adoption rates, layouts, navigation, color schemes, typography, empty/error states
- **User flows** \u2014 onboarding, trading/swap, send/receive, staking/DeFi, settings
- **Copywriting** \u2014 CTA language, tone analysis, trust signals, error messages, jargon levels, data formatting
- **Competitive analysis** \u2014 side-by-side comparisons within ${Object.keys(categories).map((c) => {
    const low = c.toLowerCase();
    if (low.endsWith("s")) return low;
    if (low === "defi") return "DeFi protocols";
    if (low === "nft") return "NFT platforms";
    return low + "s";
  }).join(", ")}

Try asking:
- "What\u2019s the most common swap flow pattern?"
- "How do top exchanges handle error states?"
- "What CTA text do wallets use for onboarding?"
- "Compare navigation patterns across DeFi apps"
- "What trust signals do bridges display?"

What would you like to know?

## Routing

When the user asks a question, consult the relevant files below to answer with specific data, adoption rates, and examples. Always cite the adoption classification (dominant/common/emerging/outlier) and the number of apps.

### Design
- [Navigation Patterns](design/navigation.md) — nav structures, menus, sidebars
- [Components](design/components.md) — full UI component catalog with adoption rates
- [Layouts](design/layouts.md) — page layout patterns (sidebar-main, full-width, card-grid, etc.)
- [Forms & Typography](design/forms.md) — heading styles, body text, data display, spacing
- [Empty States](design/empty-states.md) — how apps handle no-data scenarios
- [Error States](design/error-states.md) — error page design and messaging

### User Flows
- [Onboarding](flows/onboarding.md) — first-run experiences, wallet connect, signup
- [Trading](flows/trading.md) — swap, exchange, and market flows
- [Transactions](flows/transactions.md) — send, receive, bridge, transfer patterns
- [DeFi](flows/defi.md) — staking, lending, yield, governance flows
- [Settings](flows/settings.md) — preferences, security, account management
- [Home & Landing](flows/authentication.md) — landing pages and home screens
- [Flow Complexity](flows/recovery.md) — screen counts by flow across all apps

### Copywriting
- [CTA Language](copy/cta-language.md) — button text, styles, placement patterns
- [Error Messages](copy/error-messages.md) — error copy patterns
- [Security Language](copy/security-language.md) — trust signals, audit mentions, security copy
- [Tone & Marketing](copy/marketing.md) — tone distribution, jargon levels by app
- [Microcopy](copy/onboarding-copy.md) — microcopy catalog by purpose and context
- [Data Formatting](copy/fee-language.md) — how apps display numbers, fees, amounts

### Competitive Analysis
`;

  for (const [category, apps] of Object.entries(categories)) {
    const slug = category.toLowerCase().replace(/\s+/g, "-");
    md += `- [${category}](competitive/${slug}.md) — ${apps.length}-app comparison (${apps.slice(0, 8).join(", ")}${apps.length > 8 ? "..." : ""})\n`;
  }

  md += `
## Response Guidelines

- Always reference specific adoption rates and app counts
- Classify patterns: **Dominant (70%+)**, Common (30-70%), Emerging, or Outlier
- When comparing, use tables
- When the user asks about a specific app, check competitive/ files and mention what category it falls in
- If asked about something not covered, say so honestly — don't fabricate patterns
- Keep responses concise and actionable — product teams want decisions, not essays
`;

  return md;
}

// ─── Generate design files ──────────────────────────────────────────────

function generateDesignFiles() {
  // Navigation
  const navData = readIntel("design/navigation-patterns.json");
  if (navData) {
    let md = `# Navigation Patterns\n\n`;
    md += `Analysis of navigation across ${navData.totalApps} crypto apps (${navData.totalScreens} screens).\n\n`;
    md += renderPatternList(navData.patterns);
    md += renderQuickRef(navData.patterns);
    writeSkillFile("design/navigation.md", md);
  }

  // Components
  const compData = readIntel("design/component-catalog.json");
  if (compData) {
    let md = `# Component Catalog\n\n`;
    md += `UI components identified across ${compData.totalApps} crypto apps.\n\n`;

    const dominant = (compData.components || []).filter((c) => c.classification === "dominant");
    const common = (compData.components || []).filter((c) => c.classification === "common");
    const emerging = (compData.components || []).filter((c) => c.classification !== "dominant" && c.classification !== "common");

    if (dominant.length > 0) {
      md += "## Dominant Components (70%+ of screens)\n\n";
      for (const c of dominant) {
        md += `### ${c.type}\n`;
        md += `- **Adoption**: ${formatPercent(c.adoptionRate)} (${c.appCount || c.count} apps)\n`;
        if (c.notables.length > 0) md += `- **Notable**: ${c.notables.join("; ")}\n`;
        if (c.examples.length > 0) {
          md += `- **Examples**: ${c.examples.map((e) => `${e.app} (${e.position})`).join(", ")}\n`;
        }
        md += "\n";
      }
    }

    if (common.length > 0) {
      md += "## Common Components (30-70%)\n\n";
      for (const c of common.slice(0, 20)) {
        md += `- **${c.type}** — ${formatPercent(c.adoptionRate)} (${c.appCount || c.count} apps)\n`;
      }
      md += "\n";
    }

    if (emerging.length > 0) {
      md += "## Emerging & Specialized\n\n";
      for (const c of emerging.slice(0, 20)) {
        md += `- ${c.type} — ${formatPercent(c.adoptionRate)} (${c.appCount || c.count} apps)\n`;
      }
      md += "\n";
    }

    // Quick reference table
    md += "## Quick Reference\n\n";
    md += "| Component | Adoption | Classification |\n";
    md += "|-----------|----------|----------------|\n";
    for (const c of (compData.components || []).slice(0, 25)) {
      md += `| ${c.type} | ${formatPercent(c.adoptionRate)} | ${c.classification} |\n`;
    }
    md += "\n";

    writeSkillFile("design/components.md", md);
  }

  // Layouts
  const layoutData = readIntel("design/layout-patterns.json");
  if (layoutData) {
    let md = `# Layout Patterns\n\n`;
    md += `Page layout patterns across ${layoutData.totalApps} crypto apps.\n\n`;
    md += renderPatternList(layoutData.patterns);
    md += renderQuickRef(layoutData.patterns);
    writeSkillFile("design/layouts.md", md);
  }

  // Forms (from spacing + typography)
  const spacingData = readIntel("design/spacing-patterns.json");
  const typoData = readIntel("design/typography-patterns.json");
  if (spacingData || typoData) {
    let md = `# Form & Typography Patterns\n\n`;

    if (typoData) {
      md += `## Heading Styles\n\n`;
      md += renderPatternList(typoData.headingStyles);
      md += `## Body Text Styles\n\n`;
      md += renderPatternList(typoData.bodyStyles);
      md += `## Data Display Styles\n\n`;
      md += renderPatternList(typoData.dataStyles);
    }

    if (spacingData) {
      md += `## Spacing Patterns\n\n`;
      md += renderPatternList(spacingData.patterns);
    }

    writeSkillFile("design/forms.md", md);
  }

  // Empty states
  const emptyData = readIntel("design/empty-states.json");
  if (emptyData) {
    let md = `# Empty State Patterns\n\n`;
    md += `Empty state designs found across ${emptyData.totalApps} crypto apps.\n\n`;
    if ((emptyData.screens || []).length === 0) {
      md += "_No empty state screens detected in current extraction._\n";
    } else {
      for (const s of emptyData.screens.slice(0, 30)) {
        md += `### ${s.app} — ${s.label}\n`;
        md += `- **Layout**: ${s.layout || "unknown"}\n`;
        if (s.text.length > 0) md += `- **Text**: ${s.text.join("; ")}\n`;
        md += "\n";
      }
    }
    writeSkillFile("design/empty-states.md", md);
  }

  // Error states
  const errorData = readIntel("design/error-states.json");
  if (errorData) {
    let md = `# Error State Patterns\n\n`;
    md += `Error state designs found across ${errorData.totalApps} crypto apps.\n\n`;
    if ((errorData.screens || []).length === 0) {
      md += "_No error state screens detected in current extraction._\n";
    } else {
      for (const s of errorData.screens.slice(0, 30)) {
        md += `### ${s.app} — ${s.label}\n`;
        md += `- **Layout**: ${s.layout || "unknown"}\n`;
        if (s.messages.length > 0) md += `- **Messages**: ${s.messages.join("; ")}\n`;
        md += "\n";
      }
    }
    writeSkillFile("design/error-states.md", md);
  }
}

// ─── Generate flow files ────────────────────────────────────────────────

function generateFlowFiles() {
  const flowMapping = {
    onboarding: { file: "onboarding-patterns.json", title: "Onboarding Flows" },
    trading: { file: "swap-patterns.json", title: "Trading & Swap Flows" },
    transactions: { file: "send-patterns.json", title: "Transaction Flows" },
    defi: { file: "staking-patterns.json", title: "DeFi & Staking Flows" },
    settings: { file: "settings-patterns.json", title: "Settings Flows" },
  };

  for (const [outputName, config] of Object.entries(flowMapping)) {
    const data = readIntel(`flows/${config.file}`);
    if (!data) continue;

    let md = `# ${config.title}\n\n`;
    md += `Analysis of ${data.totalApps} apps with this flow (${data.totalScreens} screens).\n\n`;
    md += `**Apps**: ${(data.apps || []).join(", ")}\n\n`;

    md += `## Screen Types\n\n`;
    md += renderPatternList(data.screenTypes);

    md += `## User Intents\n\n`;
    md += renderPatternList(data.userIntents);

    md += `## Interactive Elements\n\n`;
    md += renderPatternList(data.interactiveElements);

    if ((data.frictionPoints || []).length > 0) {
      md += `## Friction Points\n\n`;
      md += renderPatternList(data.frictionPoints);
    }

    if ((data.progressIndicators || []).length > 0) {
      md += `## Progress Indicators\n\n`;
      md += renderPatternList(data.progressIndicators);
    }

    writeSkillFile(`flows/${outputName}.md`, md);
  }

  // Home flow
  const homeData = readIntel("flows/home-patterns.json");
  if (homeData) {
    let md = `# Home & Landing Flows\n\n`;
    md += `Analysis of ${homeData.totalApps} apps (${homeData.totalScreens} screens).\n\n`;
    md += `## Screen Types\n\n`;
    md += renderPatternList(homeData.screenTypes);
    md += `## User Intents\n\n`;
    md += renderPatternList(homeData.userIntents);
    writeSkillFile("flows/authentication.md", md);
  }

  // Flow complexity
  const complexityData = readIntel("flows/flow-complexity.json");
  if (complexityData) {
    let md = `# Flow Complexity Comparison\n\n`;
    md += `Screen counts by flow across ${complexityData.totalApps} apps.\n\n`;
    md += "| App | Category | Total Screens | Flows |\n";
    md += "|-----|----------|---------------|-------|\n";

    const apps = Object.entries(complexityData.apps || {})
      .sort((a, b) => b[1].totalScreens - a[1].totalScreens)
      .slice(0, 50);

    for (const [slug, data] of apps) {
      const flowSummary = Object.entries(data.flows || {})
        .map(([f, c]) => `${f}:${c}`)
        .join(", ");
      md += `| ${slug} | ${data.category} | ${data.totalScreens} | ${flowSummary} |\n`;
    }
    md += "\n";

    writeSkillFile("flows/recovery.md", md);
  }
}

// ─── Generate copy files ────────────────────────────────────────────────

function generateCopyFiles() {
  // CTA language
  const ctaData = readIntel("copy/cta-patterns.json");
  if (ctaData) {
    let md = `# CTA Language Patterns\n\n`;
    md += `Analysis of ${ctaData.totalCtas} CTAs across ${ctaData.totalApps} apps.\n\n`;

    md += `## CTA Text\n\n`;
    md += renderPatternList(ctaData.textPatterns);

    md += `## CTA Styles\n\n`;
    md += renderPatternList(ctaData.stylePatterns);

    md += `## CTA Placement\n\n`;
    md += renderPatternList(ctaData.placementPatterns);

    writeSkillFile("copy/cta-language.md", md);
  }

  // Error messages
  const errorData = readIntel("copy/error-messages.json");
  if (errorData) {
    let md = `# Error Message Patterns\n\n`;
    md += `Error messages collected from ${errorData.totalApps} apps.\n\n`;
    md += renderPatternList(errorData.patterns);

    if ((errorData.messages || []).length > 0) {
      md += `## Example Messages\n\n`;
      for (const msg of [...new Set(errorData.messages)].slice(0, 30)) {
        md += `- "${msg}"\n`;
      }
      md += "\n";
    }

    writeSkillFile("copy/error-messages.md", md);
  }

  // Trust signals / security language
  const trustData = readIntel("copy/trust-signals.json");
  if (trustData) {
    let md = `# Security & Trust Language\n\n`;
    md += `Trust signals and security copy across ${trustData.totalApps} apps.\n\n`;
    md += renderPatternList(trustData.patterns);
    writeSkillFile("copy/security-language.md", md);
  }

  // Tone + jargon = marketing
  const toneData = readIntel("copy/tone-analysis.json");
  const jargonData = readIntel("copy/jargon-levels.json");
  if (toneData || jargonData) {
    let md = `# Tone & Marketing Analysis\n\n`;

    if (toneData) {
      md += `## Tone Distribution\n\n`;
      md += `Analysis across ${toneData.totalApps} apps.\n\n`;
      md += renderPatternList(toneData.overallDistribution);

      if (toneData.byApp) {
        md += `## Tone by App\n\n`;
        md += "| App | Category | Dominant Tone |\n";
        md += "|-----|----------|---------------|\n";
        for (const [slug, data] of Object.entries(toneData.byApp).slice(0, 40)) {
          md += `| ${slug} | ${data.category} | ${data.dominantTone} |\n`;
        }
        md += "\n";
      }
    }

    if (jargonData) {
      md += `## Jargon Level Distribution\n\n`;
      md += renderPatternList(jargonData.overallDistribution);

      if (jargonData.byApp) {
        md += `## Jargon by App\n\n`;
        md += "| App | Category | Dominant Level |\n";
        md += "|-----|----------|----------------|\n";
        for (const [slug, data] of Object.entries(jargonData.byApp).slice(0, 40)) {
          md += `| ${slug} | ${data.category} | ${data.dominantLevel} |\n`;
        }
        md += "\n";
      }
    }

    writeSkillFile("copy/marketing.md", md);
  }

  // Onboarding copy (from microcopy with onboarding context)
  const microData = readIntel("copy/microcopy-catalog.json");
  if (microData) {
    let md = `# Microcopy & Onboarding Language\n\n`;
    md += `Analysis of ${microData.totalMicrocopy} microcopy instances across ${microData.totalApps} apps.\n\n`;

    md += `## By Purpose\n\n`;
    md += renderPatternList(microData.byPurpose);

    md += `## By Context\n\n`;
    md += renderPatternList(microData.byContext);

    if ((microData.examples || []).length > 0) {
      md += `## Example Microcopy\n\n`;
      md += "| Text | Context | Purpose |\n";
      md += "|------|---------|--------|\n";
      for (const ex of microData.examples.slice(0, 30)) {
        md += `| ${ex.text || ""} | ${ex.context || ""} | ${ex.purpose || ""} |\n`;
      }
      md += "\n";
    }

    writeSkillFile("copy/onboarding-copy.md", md);
  }

  // Fee / data formatting
  const fmtData = readIntel("copy/data-formatting.json");
  if (fmtData) {
    let md = `# Data & Fee Formatting\n\n`;
    md += `Data formatting patterns across ${fmtData.totalApps} apps.\n\n`;
    md += renderPatternList(fmtData.patterns);

    if ((fmtData.examples || []).length > 0) {
      md += `## Examples\n\n`;
      for (const ex of [...new Set(fmtData.examples)].slice(0, 40)) {
        md += `- \`${ex}\`\n`;
      }
      md += "\n";
    }

    writeSkillFile("copy/fee-language.md", md);
  }
}

// ─── Generate competitive files ─────────────────────────────────────────

function generateCompetitiveFiles() {
  const categoryFiles = {
    exchanges: "Exchange",
    wallets: "Wallet",
    "defi-protocols": "DeFi",
    infrastructure: "Infrastructure",
    analytics: "Analytics",
    bridges: "Bridge",
    payments: "Payment",
    "nft-platforms": "NFT",
  };

  for (const [filename, category] of Object.entries(categoryFiles)) {
    const data = readIntel(`competitive/${filename}.json`);
    if (!data) continue;

    let md = `# ${category} Competitive Analysis\n\n`;
    md += `Comparison of ${data.totalApps} ${category.toLowerCase()} apps.\n\n`;

    // Insights
    if ((data.insights || []).length > 0) {
      md += `## Key Insights\n\n`;
      for (const insight of data.insights) {
        md += `- **${insight.type}**: ${insight.text}\n`;
      }
      md += "\n";
    }

    // Comparison table
    md += `## App Comparison\n\n`;
    md += "| App | Screens | Color | Layouts | Tone |\n";
    md += "|-----|---------|-------|---------|------|\n";
    for (const app of data.apps || []) {
      md += `| ${app.slug} | ${app.totalScreens} | ${(app.design?.colorSchemes || []).join(", ")} | ${(app.design?.layouts || []).slice(0, 3).join(", ")} | ${(app.copy?.tones || []).slice(0, 2).join(", ")} |\n`;
    }
    md += "\n";

    // Detail per app
    md += `## Detailed Breakdown\n\n`;
    for (const app of (data.apps || []).slice(0, 20)) {
      md += `### ${app.slug}\n`;
      md += `- **Screens**: ${app.totalScreens}\n`;
      md += `- **Layouts**: ${(app.design?.layouts || []).join(", ")}\n`;
      md += `- **Components**: ${(app.design?.componentTypes || []).slice(0, 8).join(", ")}\n`;
      md += `- **Tone**: ${(app.copy?.tones || []).join(", ")}\n`;
      md += `- **Jargon**: ${(app.copy?.jargonLevels || []).join(", ")}\n`;
      md += `- **CTAs**: ${app.copy?.ctaCount || 0}\n`;
      md += `- **Trust signals**: ${(app.copy?.trustSignals || []).slice(0, 5).join(", ") || "none"}\n`;
      md += "\n";
    }

    writeSkillFile(`competitive/${filename}.md`, md);
  }
}

// ─── Generate changelog ─────────────────────────────────────────────────

function generateChangelog(index) {
  const md = `# Changelog

## v1.0.0 — ${new Date().toISOString().split("T")[0]}

Initial release.

- ${index?.totalApps || 0} apps analyzed
- ${index?.totalScreens || 0} screenshots processed
- Design, flow, and copy intelligence extracted
- Competitive analysis for ${Object.keys(index?.categories || {}).length} categories
`;
  writeSkillFile("changelog.md", md);
}

// ─── Validation ─────────────────────────────────────────────────────────

function validate() {
  console.log("Validating skill files...\n");

  if (!existsSync(OUTPUT_DIR)) {
    console.error("Output directory not found. Run package.mjs first (without --validate).");
    process.exit(1);
  }

  let totalFiles = 0;
  let overLimit = 0;
  let emptyFiles = 0;

  function walkDir(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith(".md")) {
        totalFiles++;
        const content = readFileSync(fullPath, "utf-8");
        const lineCount = content.split("\n").length;
        const relativePath = fullPath.replace(OUTPUT_DIR + "/", "");

        if (lineCount > MAX_LINES) {
          console.log(`  OVER: ${relativePath} — ${lineCount} lines`);
          overLimit++;
        }
        if (content.trim().length < 50) {
          console.log(`  EMPTY: ${relativePath}`);
          emptyFiles++;
        }
      }
    }
  }

  walkDir(OUTPUT_DIR);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Validation complete`);
  console.log(`  Files checked: ${totalFiles}`);
  console.log(`  Over ${MAX_LINES} lines: ${overLimit}`);
  console.log(`  Nearly empty: ${emptyFiles}`);
  console.log(`${"─".repeat(60)}`);

  if (overLimit > 0 || emptyFiles > 0) {
    process.exit(1);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  if (args.validate) {
    validate();
    return;
  }

  const startTime = Date.now();

  if (!existsSync(INTEL_DIR)) {
    console.error("Intelligence directory not found. Run synthesize.mjs first:");
    console.error("  node scripts/synthesize.mjs");
    process.exit(1);
  }

  const index = readIntel("index.json");
  if (!index) {
    console.error("index.json not found in intelligence directory. Run synthesize.mjs first.");
    process.exit(1);
  }

  console.log(`Packaging intelligence: ${index.totalApps} apps, ${index.totalScreens} screens\n`);

  ensureDirs();

  // Generate SKILL.md
  console.log("Generating SKILL.md...");
  writeSkillFile("SKILL.md", generateSkillMd(index));

  // Generate topic files
  console.log("\nGenerating design files...");
  generateDesignFiles();

  console.log("\nGenerating flow files...");
  generateFlowFiles();

  console.log("\nGenerating copy files...");
  generateCopyFiles();

  console.log("\nGenerating competitive files...");
  generateCompetitiveFiles();

  console.log("\nGenerating changelog...");
  generateChangelog(index);

  const elapsed = Date.now() - startTime;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Packaging complete`);
  console.log(`  Time: ${elapsed}ms`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`${"─".repeat(60)}`);
}

main();
