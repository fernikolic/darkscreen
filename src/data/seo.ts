import {
  apps,
  type AppCategory,
  type FlowType,
  type ChainType,
  type StyleType,
  type ElementTag,
  type SectionType,
  type CryptoApp,
  CATEGORIES,
  FLOW_TYPES,
  CHAIN_TYPES,
  STYLE_TYPES,
  ELEMENT_TAGS,
  SECTION_TYPES,
  GRANULAR_ELEMENT_TAGS,
} from "./apps";
import { getAllScreens, type EnrichedScreen } from "./helpers";

// ── Slug helpers ──────────────────────────────────────────────

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function fromSlug(slug: string, candidates: string[]): string | undefined {
  return candidates.find((c) => toSlug(c) === slug);
}

// ── Element tag pages ─────────────────────────────────────────

export interface ElementTagPage {
  slug: string;
  tag: ElementTag;
  screens: EnrichedScreen[];
  appCount: number;
}

export function getElementTagPages(): ElementTagPage[] {
  const allScreens = getAllScreens();
  return ELEMENT_TAGS.map((tag) => {
    const screens = allScreens.filter((s) => s.tags?.includes(tag));
    const appSlugs = new Set(screens.map((s) => s.appSlug));
    return { slug: toSlug(tag), tag, screens, appCount: appSlugs.size };
  }).filter((p) => p.screens.length > 0);
}

const appCount = apps.length;

export const ELEMENT_TAG_META: Record<string, { title: string; description: string }> = {
  "modal-dialog": {
    title: "Modal & Dialog Patterns in Crypto Apps",
    description: `See how crypto wallets, exchanges, and DeFi protocols design modals, dialogs, and overlay patterns. Real screenshots from ${appCount}+ products.`,
  },
  "form-input": {
    title: "Form & Input Design in Crypto Products",
    description: `Browse form and input field designs from crypto wallets, exchanges, and DeFi apps. Real UI patterns from ${appCount}+ products.`,
  },
  "data-table": {
    title: "Data Table UI in Crypto Apps",
    description: `Explore data table layouts used by crypto exchanges, analytics platforms, and DeFi dashboards. Screenshots from ${appCount}+ products.`,
  },
  "navigation": {
    title: "Navigation Patterns in Crypto Products",
    description: `Study navigation design across crypto wallets, exchanges, and DeFi protocols. Real UI examples from ${appCount}+ products.`,
  },
  "empty-state": {
    title: "Empty State Design in Crypto Apps",
    description: "See how crypto products handle empty states — zero-data screens, first-time experiences, and placeholder content.",
  },
  "onboarding-walkthrough": {
    title: "Onboarding & Walkthrough Flows in Crypto",
    description: `Compare onboarding patterns across crypto wallets, exchanges, and DeFi apps. Step-by-step screenshots from ${appCount}+ products.`,
  },
  "dashboard-overview": {
    title: "Dashboard & Overview Screens in Crypto",
    description: `Browse dashboard layouts from crypto wallets, exchanges, and DeFi protocols. Real overview screen designs from ${appCount}+ products.`,
  },
  "settings-preferences": {
    title: "Settings & Preferences UI in Crypto Apps",
    description: `Explore settings page designs across crypto wallets, exchanges, and DeFi products. Real screenshots from ${appCount}+ apps.`,
  },
  "chart-graph": {
    title: "Chart & Graph Design in Crypto Products",
    description: "Study chart and graph implementations across crypto exchanges, analytics tools, and DeFi dashboards.",
  },
  "card-layout": {
    title: "Card Layout Patterns in Crypto Apps",
    description: "See how crypto products use card-based layouts for tokens, NFTs, portfolios, and more.",
  },
  "list-view": {
    title: "List View Patterns in Crypto Products",
    description: "Browse list view designs from crypto wallets, exchanges, and DeFi apps — token lists, transaction history, and more.",
  },
  "search": {
    title: "Search UI Patterns in Crypto Apps",
    description: "Explore search interface designs across crypto wallets, exchanges, and DeFi protocols.",
  },
  "notification-alert": {
    title: "Notification & Alert Design in Crypto",
    description: `See how crypto apps handle notifications, alerts, toasts, and status messages. Real UI patterns from ${appCount}+ products.`,
  },
  "profile-account": {
    title: "Profile & Account Screens in Crypto Apps",
    description: "Browse profile and account page designs across crypto wallets, exchanges, and DeFi products.",
  },
  "error-page": {
    title: "Error Page Design in Crypto Products",
    description: "Study error page patterns across crypto wallets, exchanges, and DeFi apps — 404s, failures, and error states.",
  },
  "loading-state": {
    title: "Loading State Patterns in Crypto Apps",
    description: "See how crypto products design loading states — skeletons, spinners, and progressive content loading.",
  },
};

// ── Comparison pages ──────────────────────────────────────────

export interface ComparisonPair {
  slug: string;
  appA: CryptoApp;
  appB: CryptoApp;
}

export function getComparisonPairs(): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];
  const byCategory = new Map<AppCategory, CryptoApp[]>();

  for (const app of apps) {
    const list = byCategory.get(app.category) || [];
    list.push(app);
    byCategory.set(app.category, list);
  }

  for (const [, categoryApps] of byCategory) {
    // Sort: detailed first, then alphabetical
    const sorted = [...categoryApps].sort((a, b) => {
      if (a.detailed !== b.detailed) return a.detailed ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        // Alphabetical order in the slug for consistency
        const [first, second] = [sorted[i], sorted[j]].sort((a, b) =>
          a.slug.localeCompare(b.slug)
        );
        pairs.push({
          slug: `${first.slug}-vs-${second.slug}`,
          appA: first,
          appB: second,
        });
      }
    }
  }

  return pairs;
}

// ── Flow pages ────────────────────────────────────────────────

export const FLOW_META: Record<string, { title: string; description: string; intro: string }> = {
  home: {
    title: "Home Screen Design Across Crypto Products",
    description: `Compare home screen and landing page designs from ${appCount}+ crypto wallets, exchanges, and DeFi protocols.`,
    intro: "The home screen is the first thing users see. Compare how crypto products structure their primary landing experience — hero sections, feature highlights, and entry points.",
  },
  onboarding: {
    title: "Crypto App Onboarding Flows Compared",
    description: "Step-by-step onboarding flow screenshots from crypto wallets, exchanges, and DeFi apps. See how products handle first-time user setup.",
    intro: "Onboarding is where products win or lose users. Compare how crypto apps handle account creation, wallet setup, KYC, and first-time experiences.",
  },
  swap: {
    title: "Token Swap UI Design Patterns",
    description: "Compare swap interface designs across DEXs, wallets, and exchanges. Token selectors, price impact, routing, and confirmation screens.",
    intro: "The swap flow is core to DeFi. Compare how products design token selectors, amount inputs, price impact warnings, route displays, and confirmation screens.",
  },
  send: {
    title: "Send & Transfer Flow Design in Crypto",
    description: "Compare send and transfer flow designs across crypto wallets and exchanges. Address input, amount entry, fee estimation, and confirmation patterns.",
    intro: "Sending crypto requires precision and trust. Compare how products handle address input, amount entry, network selection, fee estimation, and transaction confirmation.",
  },
  staking: {
    title: "Staking UI Design Across Crypto Products",
    description: "Compare staking interface designs across DeFi protocols and wallets. Validator selection, APY display, delegation flows, and reward tracking.",
    intro: "Staking is how users earn yield on their crypto. Compare validator selection, APY displays, delegation flows, reward tracking, and unstaking experiences.",
  },
  settings: {
    title: "Settings Page Design in Crypto Apps",
    description: "Compare settings and preferences page designs across crypto wallets, exchanges, and DeFi products.",
    intro: "Settings pages reveal how products handle security preferences, notification controls, connected apps, network management, and account configuration.",
  },
};

// ── Category pages ────────────────────────────────────────────

export const CATEGORY_META: Record<string, { title: string; description: string; intro: string; plural: string }> = {
  wallet: {
    title: "Crypto Wallet Design — UI Screenshots & Patterns",
    description: `Browse UI screenshots from ${apps.filter(a => a.category === "Wallet").length}+ crypto wallets including MetaMask, Phantom, Trust Wallet, and more. Compare onboarding, send, swap, and settings flows.`,
    intro: "Crypto wallets are the gateway to Web3. Browse screenshots and UI patterns from the most popular wallets — from seed phrase onboarding to multi-chain portfolio views.",
    plural: "Wallets",
  },
  exchange: {
    title: "Crypto Exchange UI Design — Screenshots & Patterns",
    description: "Explore UI screenshots from top crypto exchanges — Coinbase, Binance, Kraken, OKX, and more. Compare trading views, order books, and dashboard designs.",
    intro: "Crypto exchanges handle the most complex UIs in the industry — trading terminals, order books, KYC flows, and portfolio management. Compare how the top exchanges approach design.",
    plural: "Exchanges",
  },
  defi: {
    title: "DeFi App Design — UI Screenshots & Patterns",
    description: "Browse UI screenshots from DeFi protocols — Uniswap, Aave, Lido, Curve, and more. Swap interfaces, lending dashboards, and liquidity pool management.",
    intro: "DeFi protocols push the boundary of web app design — complex financial data rendered for users who expect both power and simplicity. Compare how leading protocols approach their UI.",
    plural: "DeFi Apps",
  },
  bridge: {
    title: "Crypto Bridge UI Design — Screenshots & Patterns",
    description: "Explore UI screenshots from cross-chain bridge protocols — LayerSwap, Wormhole, Stargate. Compare bridging flows and network selection patterns.",
    intro: "Bridge protocols connect blockchain ecosystems. Compare how they handle network selection, token mapping, fee display, and cross-chain transfer confirmation.",
    plural: "Bridges",
  },
  nft: {
    title: "NFT Marketplace Design — UI Screenshots & Patterns",
    description: "Browse UI screenshots from NFT marketplaces — OpenSea, Blur, Magic Eden. Compare gallery layouts, listing flows, and collection pages.",
    intro: "NFT marketplaces blend e-commerce with crypto — gallery views, collection pages, bidding flows, and creator tools. Compare how the top platforms approach design.",
    plural: "NFT Marketplaces",
  },
  analytics: {
    title: "Crypto Analytics Dashboard Design — Screenshots & Patterns",
    description: "Explore UI screenshots from crypto analytics tools — DeBank, Etherscan, Mempool, Dune, DeFi Llama, and more. Compare data visualization, explorer interfaces, and portfolio trackers.",
    intro: "Analytics platforms surface blockchain data for humans — explorers, portfolio trackers, and data dashboards. Compare how they handle complex data visualization.",
    plural: "Analytics Tools",
  },
  payment: {
    title: "Crypto Payment & On-Ramp Design — Screenshots & Patterns",
    description: "Browse UI screenshots from crypto payment processors and fiat on-ramps — BTCPay Server, BitPay, MoonPay, Transak. Checkout flows, invoicing, and purchase experiences.",
    intro: "Payment and on-ramp products bridge traditional finance and crypto. Compare how they design checkout flows, invoice pages, fiat-to-crypto purchase experiences, and merchant dashboards.",
    plural: "Payment Processors",
  },
  infrastructure: {
    title: "Bitcoin & Lightning Infrastructure UI — Screenshots & Patterns",
    description: "Explore UI screenshots from Bitcoin node management and Lightning infrastructure — Umbrel, Start9, Voltage, LNbits. Node dashboards, channel management, and server administration.",
    intro: "Infrastructure products empower sovereign computing and Lightning Network operation. Compare how they design node dashboards, channel management, app stores, and server administration.",
    plural: "Infrastructure Tools",
  },
};

// ── Chain pages ───────────────────────────────────────────────

export const CHAIN_META: Record<string, { title: string; description: string; intro: string }> = {
  bitcoin: {
    title: "Bitcoin App Design — UI Screenshots & Patterns",
    description: "Browse UI screenshots from Bitcoin wallets and apps — Xverse, Leather, Mempool, River. UTXO management, ordinals, and lightning interfaces.",
    intro: "Bitcoin apps have unique design challenges — UTXO models, ordinals/inscriptions, Lightning Network integration, and fee estimation in a fee-market environment.",
  },
  ethereum: {
    title: "Ethereum App Design — UI Screenshots & Patterns",
    description: "Explore UI screenshots from Ethereum wallets and DeFi apps — MetaMask, Uniswap, Aave, Lido. ERC-20 management, gas estimation, and DApp browsers.",
    intro: "Ethereum is the largest smart contract platform and home to the most diverse app ecosystem. Compare how Ethereum-native products handle gas, tokens, and DApp interactions.",
  },
  solana: {
    title: "Solana App Design — UI Screenshots & Patterns",
    description: "Browse UI screenshots from Solana wallets and DeFi — Phantom, Jupiter, Magic Eden. Fast transactions, compressed NFTs, and priority fees.",
    intro: "Solana apps benefit from sub-second finality and low fees, enabling different UX patterns than EVM chains. Compare how Solana-native products leverage the speed advantage.",
  },
  "multi-chain": {
    title: "Multi-Chain App Design — UI Screenshots & Patterns",
    description: "Explore UI screenshots from multi-chain crypto products. Compare network switching, cross-chain balances, and unified portfolio experiences.",
    intro: "Multi-chain products must unify diverse blockchain ecosystems into a single coherent experience. Compare how apps handle network switching, cross-chain balances, and chain-specific features.",
  },
};

// ── Style pages ───────────────────────────────────────────────

export const STYLE_META: Record<string, { title: string; description: string; intro: string }> = {
  "dark-mode": {
    title: "Dark Mode Design in Crypto Apps",
    description: "Browse dark mode UI designs from crypto wallets, exchanges, and DeFi protocols. Color palettes, contrast ratios, and dark theme patterns.",
    intro: "Dark mode is the default in crypto. Compare how products handle background tones, text contrast, accent colors, and visual hierarchy in dark environments.",
  },
  glassmorphism: {
    title: "Glassmorphism in Crypto App Design",
    description: "Explore glassmorphism design patterns in crypto products — frosted glass effects, backdrop blur, and translucent UI elements.",
    intro: "Glassmorphism adds depth and premium feel to crypto interfaces. See how wallets and DeFi apps use frosted glass effects, backdrop blur, and translucent layers.",
  },
  minimal: {
    title: "Minimal UI Design in Crypto Products",
    description: "Browse minimalist crypto app designs — clean layouts, whitespace-driven hierarchy, and reduced visual noise.",
    intro: "Minimalism cuts through crypto's complexity. Compare how products achieve clarity through whitespace, type hierarchy, and selective information display.",
  },
  "card-heavy": {
    title: "Card-Heavy Layouts in Crypto Apps",
    description: "Explore card-based UI designs in crypto wallets, exchanges, and DeFi apps. Token cards, portfolio tiles, and modular layouts.",
    intro: "Card-based layouts organize complex crypto data into digestible chunks. Compare how products use cards for tokens, portfolios, positions, and feature discovery.",
  },
  "data-dense": {
    title: "Data-Dense UI Design in Crypto Products",
    description: "Browse data-dense interface designs from crypto exchanges and analytics tools. Trading terminals, order books, and information-rich dashboards.",
    intro: "Data-dense interfaces serve power users who need maximum information at a glance. Compare how exchanges and analytics tools pack data without sacrificing usability.",
  },
  "gradient-rich": {
    title: "Gradient Design Patterns in Crypto Apps",
    description: "Explore gradient-rich UI designs in crypto products — vibrant color transitions, brand gradients, and atmospheric effects.",
    intro: "Gradients add energy and brand identity to crypto interfaces. See how products use color transitions for buttons, backgrounds, cards, and brand expression.",
  },
  "neon-accents": {
    title: "Neon Accent Design in Crypto Products",
    description: "Browse neon accent UI patterns in crypto apps — glowing borders, luminous highlights, and cyberpunk-inspired design elements.",
    intro: "Neon accents give crypto apps a futuristic, high-tech feel. Compare how products use glowing elements, luminous highlights, and vibrant accent colors.",
  },
  "clean-corporate": {
    title: "Clean Corporate Design in Crypto Apps",
    description: "Explore clean, corporate UI designs in crypto products — professional layouts, institutional aesthetics, and enterprise-ready interfaces.",
    intro: "Clean corporate design signals trust and professionalism. Compare how crypto products targeting institutional users approach visual design.",
  },
};

// ── Shared helpers for all pages ──────────────────────────────

export function getAppsByCategory(category: AppCategory): CryptoApp[] {
  return apps.filter((app) => app.category === category);
}

export function getAppsByChain(chain: ChainType): CryptoApp[] {
  return apps.filter((app) => app.chains.includes(chain));
}

export function getAppsByStyle(style: StyleType): CryptoApp[] {
  return apps.filter((app) => app.styles.includes(style));
}

export function getScreensByFlow(flow: FlowType): EnrichedScreen[] {
  return getAllScreens().filter((s) => s.flow === flow);
}

export function getScreensByTag(tag: ElementTag): EnrichedScreen[] {
  return getAllScreens().filter((s) => s.tags?.includes(tag));
}

export function getSharedFlows(appA: CryptoApp, appB: CryptoApp): FlowType[] {
  return appA.flows.filter((f) => appB.flows.includes(f));
}

export function getAppsBySection(section: SectionType): CryptoApp[] {
  return apps.filter((app) => app.sections.includes(section));
}

export function getAlternatives(app: CryptoApp): CryptoApp[] {
  return apps.filter((a) => a.slug !== app.slug && a.category === app.category);
}

// ── Cross-dimensional pattern pages ──────────────────────────

export interface PatternPage {
  slug: string;
  category: AppCategory;
  flow: FlowType;
  apps: CryptoApp[];
}

export function getPatternPages(): PatternPage[] {
  const pages: PatternPage[] = [];
  for (const category of CATEGORIES) {
    for (const flow of FLOW_TYPES) {
      const matching = apps.filter(
        (app) => app.category === category && app.flows.includes(flow)
      );
      if (matching.length > 0) {
        pages.push({
          slug: `${toSlug(category)}-${toSlug(flow)}`,
          category,
          flow,
          apps: matching,
        });
      }
    }
  }
  return pages;
}

export const PATTERN_META: Record<string, { title: string; description: string }> = {
  "wallet-home": {
    title: "Crypto Wallet Home Screen Design",
    description: "Compare home screen designs from crypto wallets — MetaMask, Phantom, Trust Wallet, and more. Portfolio views, token lists, and entry points.",
  },
  "wallet-onboarding": {
    title: "Crypto Wallet Onboarding Flow Design",
    description: "Compare onboarding flows from crypto wallets. Seed phrase setup, biometrics, import flows, and first-time user experiences.",
  },
  "wallet-swap": {
    title: "Crypto Wallet Swap Interface Design",
    description: "Compare in-wallet swap interfaces — token selectors, rate comparison, slippage settings, and confirmation screens.",
  },
  "wallet-send": {
    title: "Crypto Wallet Send Flow Design",
    description: "Compare send/transfer flows from crypto wallets. Address input, QR scanning, contact books, and confirmation UX.",
  },
  "wallet-staking": {
    title: "Wallet Staking UI Design Patterns",
    description: "Compare staking interfaces built into crypto wallets — validator selection, reward tracking, and delegation flows.",
  },
  "wallet-settings": {
    title: "Crypto Wallet Settings Page Design",
    description: "Compare settings pages from crypto wallets — security, network management, connected apps, and account preferences.",
  },
  "exchange-home": {
    title: "Crypto Exchange Home Page Design",
    description: "Compare landing page designs from crypto exchanges — Coinbase, Binance, Kraken, and more. Hero sections, market tickers, and trust signals.",
  },
  "exchange-onboarding": {
    title: "Crypto Exchange Onboarding & KYC Design",
    description: "Compare sign-up and KYC flows from crypto exchanges. Identity verification, document upload, and progressive onboarding.",
  },
  "exchange-swap": {
    title: "Crypto Exchange Trading Interface Design",
    description: "Compare trading and swap interfaces from crypto exchanges — order books, chart layouts, market/limit orders, and execution confirmation.",
  },
  "exchange-send": {
    title: "Exchange Withdrawal & Transfer Design",
    description: "Compare withdrawal and transfer flows from crypto exchanges — network selection, address whitelisting, and security confirmations.",
  },
  "exchange-staking": {
    title: "Exchange Staking Product Design",
    description: "Compare staking products offered by crypto exchanges — flexible/locked staking, APY displays, and reward tracking.",
  },
  "exchange-settings": {
    title: "Exchange Settings & Security Design",
    description: "Compare settings and security pages from crypto exchanges — 2FA setup, API keys, notification preferences, and account management.",
  },
  "defi-home": {
    title: "DeFi Protocol Landing Page Design",
    description: "Compare landing page designs from DeFi protocols — Uniswap, Aave, Lido, Curve. TVL displays, protocol stats, and entry points.",
  },
  "defi-onboarding": {
    title: "DeFi Protocol Onboarding Design",
    description: "Compare wallet connection and onboarding flows from DeFi protocols. Connect wallet modals, network switching, and first-time prompts.",
  },
  "defi-swap": {
    title: "DEX Swap Interface Design",
    description: "Compare swap interfaces from decentralized exchanges — Uniswap, Jupiter, Curve, 1inch. Token selectors, routing, price impact, and slippage.",
  },
  "defi-send": {
    title: "DeFi Send & Transfer Design",
    description: "Compare send and transfer flows in DeFi applications — token transfers, cross-protocol movements, and gas estimation.",
  },
  "defi-staking": {
    title: "DeFi Staking & Yield Interface Design",
    description: "Compare staking and yield interfaces from DeFi protocols — Lido, Aave, Curve. APY displays, position management, and reward claiming.",
  },
  "defi-settings": {
    title: "DeFi Protocol Settings Design",
    description: "Compare settings and preferences from DeFi protocols — slippage tolerance, gas settings, RPC endpoints, and theme preferences.",
  },
  "bridge-home": {
    title: "Crypto Bridge Landing Page Design",
    description: "Compare landing pages from cross-chain bridge protocols. Chain selection, supported routes, and bridge comparisons.",
  },
  "bridge-onboarding": {
    title: "Bridge Protocol Onboarding Design",
    description: "Compare wallet connection and onboarding flows from bridge protocols.",
  },
  "bridge-swap": {
    title: "Cross-Chain Bridge Swap Interface Design",
    description: "Compare bridge swap interfaces — source/destination chain selection, token mapping, fee estimation, and route display.",
  },
  "nft-home": {
    title: "NFT Marketplace Home Page Design",
    description: "Compare landing pages from NFT marketplaces — OpenSea, Blur, Magic Eden. Featured collections, trending items, and discovery flows.",
  },
  "nft-onboarding": {
    title: "NFT Marketplace Onboarding Design",
    description: "Compare onboarding flows from NFT marketplaces — wallet connection, profile setup, and collection creation.",
  },
  "analytics-home": {
    title: "Crypto Analytics Dashboard Design",
    description: "Compare dashboard designs from crypto analytics tools — DeBank, Etherscan, Mempool. Data visualization, explorer interfaces, and portfolio views.",
  },
};

// ── Section pages ─────────────────────────────────────────────

export const SECTION_META: Record<string, { title: string; description: string; intro: string }> = {
  dashboard: {
    title: "Crypto Dashboard Design — UI Screenshots & Patterns",
    description: "Browse dashboard designs from crypto wallets, exchanges, and DeFi apps. Overview screens, portfolio summaries, and key metrics display.",
    intro: "The dashboard is the command center of any crypto product. Compare how apps display portfolio value, asset allocation, market data, and quick actions.",
  },
  portfolio: {
    title: "Crypto Portfolio UI Design — Screenshots & Patterns",
    description: "Explore portfolio page designs from crypto apps. Asset breakdowns, P&L tracking, allocation charts, and holdings views.",
    intro: "Portfolio views help users understand their crypto holdings. Compare how products display asset breakdowns, profit/loss, historical performance, and allocation charts.",
  },
  "trade-view": {
    title: "Crypto Trading View Design — UI Screenshots",
    description: "Browse trading view interfaces from crypto exchanges. Chart layouts, order books, depth charts, and order entry panels.",
    intro: "Trading views are the most complex screens in crypto. Compare how exchanges lay out candlestick charts, order books, trade history, and order entry forms.",
  },
  charts: {
    title: "Crypto Chart & Graph Design — Screenshots",
    description: "Explore chart and data visualization designs from crypto products. Price charts, TVL graphs, volume indicators, and technical analysis tools.",
    intro: "Charts are central to crypto product design. Compare how apps render price data, volume indicators, technical analysis overlays, and interactive chart controls.",
  },
  "token-list": {
    title: "Token List UI Design in Crypto Apps",
    description: "Browse token list designs from crypto wallets and exchanges. Token rows, price display, sparklines, and sort/filter patterns.",
    intro: "Token lists are one of the most common patterns in crypto UI. Compare how products display token information — prices, balances, 24h changes, and sparkline charts.",
  },
  onboarding: {
    title: "Crypto App Onboarding Section Design",
    description: "Explore onboarding section designs from crypto products. Welcome screens, setup wizards, and first-time user guides.",
    intro: "Good onboarding turns curious visitors into active users. Compare how crypto products structure their welcome experience, tutorials, and setup workflows.",
  },
  settings: {
    title: "Crypto App Settings Page Design",
    description: "Browse settings page designs from crypto wallets, exchanges, and DeFi apps. Security preferences, network config, and account management.",
    intro: "Settings pages reveal how products handle security, privacy, notification preferences, network management, and account configuration.",
  },
  notifications: {
    title: "Notification Design in Crypto Apps",
    description: "Explore notification center designs from crypto products. Price alerts, transaction confirmations, and activity feeds.",
    intro: "Notifications keep users informed about price movements, transaction confirmations, governance votes, and security events. Compare how products design their notification systems.",
  },
  staking: {
    title: "Staking Section Design in Crypto Apps",
    description: "Browse staking section designs from DeFi protocols and exchanges. Validator selection, reward tracking, and position management.",
    intro: "Staking sections help users earn yield on their crypto. Compare how products present staking opportunities, display APY, track rewards, and manage positions.",
  },
  governance: {
    title: "Crypto Governance UI Design — Screenshots",
    description: "Explore governance interfaces from DeFi protocols. Proposal lists, voting flows, delegation, and governance dashboards.",
    intro: "Governance interfaces give token holders a voice in protocol decisions. Compare how DeFi apps display proposals, voting power, delegation, and vote results.",
  },
  "nft-gallery": {
    title: "NFT Gallery Design in Crypto Apps",
    description: "Browse NFT gallery designs from wallets and marketplaces. Grid layouts, collection views, and NFT detail pages.",
    intro: "NFT galleries showcase digital collectibles. Compare how products handle grid layouts, collection organization, rarity displays, and NFT detail views.",
  },
  learn: {
    title: "Crypto Education & Learn Section Design",
    description: "Explore learn section designs from crypto products. Educational content, tutorials, and earn-while-you-learn programs.",
    intro: "Learn sections educate users about crypto concepts. Compare how exchanges and wallets present educational content, quizzes, and learn-to-earn programs.",
  },
  markets: {
    title: "Crypto Markets Page Design — Screenshots",
    description: "Browse markets page designs from crypto exchanges and analytics tools. Market overviews, category sorting, and trend indicators.",
    intro: "Markets pages give users a broad view of the crypto landscape. Compare how products display market data, trending assets, sector performance, and market categories.",
  },
  bridge: {
    title: "Bridge Section Design in Crypto Apps",
    description: "Explore bridge interfaces built into crypto wallets and DeFi apps. Cross-chain transfers, network selection, and fee comparison.",
    intro: "Bridge sections enable cross-chain transfers within larger apps. Compare how wallets and DeFi apps integrate bridging functionality.",
  },
  earn: {
    title: "Crypto Earn Section Design — Screenshots",
    description: "Browse earn section designs from crypto products. Yield products, liquidity provision, and passive income opportunities.",
    intro: "Earn sections help users grow their crypto through staking, lending, liquidity provision, and other yield strategies. Compare how products present earning opportunities.",
  },
};

// ── Sitemap helpers ───────────────────────────────────────────

export function getAllSeoRoutes(): string[] {
  const routes: string[] = [
    "/",
    "/library",
    "/flows",
    "/screens",
    "/changes",
    "/text-search",
    "/elements",
    "/performance",
    "/techstack",
  ];

  // App pages
  for (const app of apps) {
    routes.push(`/library/${app.slug}`);
    routes.push(`/screenshots/${app.slug}`);
    routes.push(`/alternatives/${app.slug}`);
    routes.push(`/changelog/${app.slug}`);
  }

  // Screen detail pages
  for (const app of apps) {
    for (const screen of app.screens) {
      routes.push(`/screens/${app.slug}/${screen.flow.toLowerCase()}/${screen.step}`);
    }
  }

  // Element tag pages (design)
  for (const page of getElementTagPages()) {
    routes.push(`/design/${page.slug}`);
  }

  // Granular element pages
  for (const tag of GRANULAR_ELEMENT_TAGS) {
    routes.push(`/elements/${toSlug(tag)}`);
  }

  // Comparison pages
  for (const pair of getComparisonPairs()) {
    routes.push(`/compare/${pair.slug}`);
  }

  // Flow pages
  for (const flow of FLOW_TYPES) {
    routes.push(`/flows/${toSlug(flow)}`);
  }

  // Category pages
  for (const cat of CATEGORIES) {
    routes.push(`/category/${toSlug(cat)}`);
  }

  // Chain pages
  for (const chain of CHAIN_TYPES) {
    routes.push(`/chain/${toSlug(chain)}`);
  }

  // Style pages
  for (const style of STYLE_TYPES) {
    routes.push(`/style/${toSlug(style)}`);
  }

  // Pattern pages
  for (const page of getPatternPages()) {
    routes.push(`/patterns/${page.slug}`);
  }

  // Section pages
  for (const section of SECTION_TYPES) {
    const sectionApps = getAppsBySection(section);
    if (sectionApps.length > 0) {
      routes.push(`/section/${toSlug(section)}`);
    }
  }

  return routes;
}

// ── FAQ data generators ──────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  wallet: "A crypto wallet is a software application or hardware device that allows users to store, send, and receive cryptocurrencies. Wallets manage private keys and interact with blockchain networks to facilitate transactions.",
  exchange: "A crypto exchange is a platform where users can buy, sell, and trade cryptocurrencies. Exchanges provide order books, trading pairs, and market data to facilitate price discovery and asset conversion.",
  defi: "A DeFi (Decentralized Finance) app is a blockchain-based financial application that operates without traditional intermediaries. DeFi apps offer services like lending, borrowing, trading, and yield farming through smart contracts.",
  bridge: "A crypto bridge is a protocol that enables transferring assets between different blockchain networks. Bridges lock tokens on one chain and mint equivalent tokens on another, enabling cross-chain interoperability.",
  nft: "An NFT marketplace is a platform for buying, selling, and discovering non-fungible tokens — unique digital assets representing art, collectibles, gaming items, and more on the blockchain.",
  analytics: "A crypto analytics tool provides data visualization, portfolio tracking, and blockchain exploration capabilities. These tools help users monitor on-chain activity, track wallet balances, and analyze market trends.",
  payment: "A crypto payment processor enables merchants and individuals to accept, send, and manage cryptocurrency payments. These tools bridge traditional payment systems with blockchain networks.",
  infrastructure: "Crypto infrastructure tools provide the foundational services for running blockchain nodes, managing Lightning Network channels, and operating sovereign computing environments.",
};

export function getCategoryFAQs(
  slug: string,
  name: string,
  plural: string,
  appCount: number,
  screenCount: number,
  appNames: string[]
): FAQItem[] {
  const description = CATEGORY_DESCRIPTIONS[slug] || `A crypto ${name.toLowerCase()} is a product in the ${name.toLowerCase()} category of the crypto ecosystem.`;
  const topNames = appNames.slice(0, 6).join(", ");

  return [
    {
      question: `What is a crypto ${name.toLowerCase()}?`,
      answer: description,
    },
    {
      question: `How many ${plural.toLowerCase()} does Darkscreens track?`,
      answer: `Darkscreens currently tracks ${appCount} ${plural.toLowerCase()} with a total of ${screenCount.toLocaleString()} screenshots across all user flows.`,
    },
    {
      question: `Which ${plural.toLowerCase()} are included?`,
      answer: `Darkscreens tracks ${plural.toLowerCase()} including ${topNames}, and more. Each product is screenshotted across multiple user flows like onboarding, home, swap, send, and settings.`,
    },
    {
      question: "How often are screenshots updated?",
      answer: "Darkscreens re-crawls tracked products weekly and captures new screenshots whenever UI changes are detected. Historical screenshots are preserved to show design evolution over time.",
    },
  ];
}

const FLOW_DESCRIPTIONS: Record<string, string> = {
  home: "A home flow in crypto apps refers to the primary landing experience — the first screen users see after logging in or opening the app. It typically includes portfolio overviews, quick actions, and navigation to core features.",
  onboarding: "An onboarding flow in crypto apps is the initial setup experience for new users. It covers account creation, wallet setup, seed phrase backup, KYC verification, and introductory tutorials.",
  swap: "A swap flow in crypto apps is the token exchange experience. It includes token selection, amount input, price impact display, slippage settings, routing information, and transaction confirmation.",
  send: "A send flow in crypto apps is the process of transferring cryptocurrency to another address. It involves address input, amount entry, network selection, fee estimation, and transaction confirmation.",
  staking: "A staking flow in crypto apps is the process of locking tokens to earn rewards. It covers validator selection, amount delegation, APY display, reward tracking, and unstaking.",
  settings: "A settings flow in crypto apps includes security preferences, notification controls, connected apps management, network configuration, and account profile settings.",
};

export function getFlowFAQs(
  flowSlug: string,
  flowName: string,
  appCount: number,
  totalScreens: number
): FAQItem[] {
  const description = FLOW_DESCRIPTIONS[flowSlug] || `A ${flowName.toLowerCase()} flow in crypto apps is a common user journey that involves ${flowName.toLowerCase()}-related interactions and screens.`;

  return [
    {
      question: `What is a ${flowName.toLowerCase()} flow in crypto apps?`,
      answer: description,
    },
    {
      question: `How many crypto apps have a ${flowName.toLowerCase()} flow?`,
      answer: `Darkscreens tracks ${appCount} crypto products with a ${flowName.toLowerCase()} flow, totaling ${totalScreens.toLocaleString()} screenshots across all implementations.`,
    },
    {
      question: `How can I compare ${flowName.toLowerCase()} flow designs?`,
      answer: `Darkscreens shows each app's ${flowName.toLowerCase()} flow side by side with step-by-step screenshots. You can compare how different products approach the same user journey and identify patterns and best practices.`,
    },
  ];
}

export const HOMEPAGE_FAQS: FAQItem[] = [
  {
    question: "What is Darkscreens?",
    answer: "Darkscreens is a product intelligence platform for crypto. We systematically screenshot every major crypto product — wallets, exchanges, DeFi protocols, bridges, and more — and track how their UIs change over time. Product teams use Darkscreens for competitive analysis, design inspiration, and tracking industry trends.",
  },
  {
    question: `How many crypto products does Darkscreens track?`,
    answer: `Darkscreens currently tracks ${apps.length}+ crypto products across wallets, exchanges, DeFi protocols, bridges, NFT marketplaces, and analytics tools. Each product is screenshotted across multiple user flows.`,
  },
  {
    question: "How often are screenshots updated?",
    answer: "We re-crawl tracked products weekly and capture new screenshots whenever UI changes are detected. Our automated pipeline ensures consistent, high-quality captures across all platforms.",
  },
  {
    question: "Is Darkscreens free?",
    answer: "Darkscreens offers a free tier that lets you browse the full library of screenshots and compare products. Premium plans include full-resolution downloads, change alerts, and advanced filtering.",
  },
];
