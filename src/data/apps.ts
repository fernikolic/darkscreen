export type AppCategory =
  | "Wallet"
  | "Exchange"
  | "DeFi"
  | "Bridge"
  | "NFT"
  | "Analytics";

export type FlowType =
  | "Home"
  | "Onboarding"
  | "Swap"
  | "Send"
  | "Staking"
  | "Settings";

export type ChainType =
  | "Bitcoin"
  | "Ethereum"
  | "Solana"
  | "Multi-chain";

export type PlatformType = "Web";

export type SectionType =
  | "Dashboard"
  | "Portfolio"
  | "Trade View"
  | "Charts"
  | "Token List"
  | "Onboarding"
  | "Settings"
  | "Notifications"
  | "Staking"
  | "Governance"
  | "NFT Gallery"
  | "Learn"
  | "Markets"
  | "Bridge"
  | "Earn";

export type StyleType =
  | "Dark Mode"
  | "Glassmorphism"
  | "Minimal"
  | "Card-Heavy"
  | "Data Dense"
  | "Gradient-Rich"
  | "Neon Accents"
  | "Clean / Corporate";

export type ChangeType =
  | "New Feature"
  | "Redesign"
  | "Copy Change"
  | "Layout Shift"
  | "Removed";

export type ElementTag =
  | "Modal / Dialog"
  | "Form / Input"
  | "Data Table"
  | "Navigation"
  | "Empty State"
  | "Onboarding / Walkthrough"
  | "Dashboard / Overview"
  | "Settings / Preferences"
  | "Chart / Graph"
  | "Card Layout"
  | "List View"
  | "Search"
  | "Notification / Alert"
  | "Profile / Account"
  | "Error Page"
  | "Loading State";

export const ELEMENT_TAGS: ElementTag[] = [
  "Modal / Dialog",
  "Form / Input",
  "Data Table",
  "Navigation",
  "Empty State",
  "Onboarding / Walkthrough",
  "Dashboard / Overview",
  "Settings / Preferences",
  "Chart / Graph",
  "Card Layout",
  "List View",
  "Search",
  "Notification / Alert",
  "Profile / Account",
  "Error Page",
  "Loading State",
];

export interface AppScreen {
  step: number;
  label: string;
  flow: FlowType;
  image?: string;
  tags?: ElementTag[];
}

export interface AppChange {
  date: string;
  description: string;
  type: ChangeType;
}

export interface CryptoApp {
  slug: string;
  name: string;
  category: AppCategory;
  chains: ChainType[];
  platforms: PlatformType[];
  sections: SectionType[];
  styles: StyleType[];
  description: string;
  website: string;
  screenCount: number;
  lastUpdated: string;
  detailed: boolean;
  flows: FlowType[];
  screens: AppScreen[];
  changes: AppChange[];
  accentColor: string;
  thumbnail?: string;
}

export const CATEGORIES: AppCategory[] = [
  "Wallet",
  "Exchange",
  "DeFi",
  "Bridge",
  "NFT",
  "Analytics",
];

export const FLOW_TYPES: FlowType[] = [
  "Home",
  "Onboarding",
  "Swap",
  "Send",
  "Staking",
  "Settings",
];

export const CHAIN_TYPES: ChainType[] = [
  "Bitcoin",
  "Ethereum",
  "Solana",
  "Multi-chain",
];

export const PLATFORM_TYPES: PlatformType[] = [
  "Web",
];

export const SECTION_TYPES: SectionType[] = [
  "Dashboard",
  "Portfolio",
  "Trade View",
  "Charts",
  "Token List",
  "Onboarding",
  "Settings",
  "Notifications",
  "Staking",
  "Governance",
  "NFT Gallery",
  "Learn",
  "Markets",
  "Bridge",
  "Earn",
];

export const STYLE_TYPES: StyleType[] = [
  "Dark Mode",
  "Glassmorphism",
  "Minimal",
  "Card-Heavy",
  "Data Dense",
  "Gradient-Rich",
  "Neon Accents",
  "Clean / Corporate",
];

export const CATEGORY_COLORS: Record<AppCategory, string> = {
  Wallet: "#3b82f6",
  Exchange: "#22c55e",
  DeFi: "#a855f7",
  Bridge: "#f97316",
  NFT: "#ef4444",
  Analytics: "#06b6d4",
};

export const apps: CryptoApp[] = [
  // ─── DETAILED APPS ─────────────────────────────────────────────
  {
    slug: "metamask",
    name: "MetaMask",
    category: "Wallet",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Card-Heavy"],
    description:
      "The most popular Ethereum wallet and gateway to blockchain apps",
    website: "https://metamask.io",
    screenCount: 47,
    lastUpdated: "Feb 9, 2026",
    detailed: false,
    thumbnail: "/screenshots/metamask-home.png",
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [
      { step: 1, label: "Portfolio overview", flow: "Home", image: "/screenshots/metamask-portfolio.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Token balances list", flow: "Home", image: "/screenshots/metamask-home.png", tags: ["List View"] },
      { step: 3, label: "Recent activity feed", flow: "Home", tags: ["List View"] },
      { step: 4, label: "Network selector", flow: "Home", tags: ["Modal / Dialog", "Search"] },
      { step: 1, label: "Welcome screen", flow: "Onboarding", tags: ["Onboarding / Walkthrough"] },
      { step: 2, label: "Create or import wallet", flow: "Onboarding", tags: ["Onboarding / Walkthrough"] },
      { step: 3, label: "Seed phrase backup", flow: "Onboarding", tags: ["Onboarding / Walkthrough"] },
      { step: 4, label: "Confirm seed phrase", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 5, label: "Set password", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 1, label: "Select tokens to swap", flow: "Swap", image: "/screenshots/metamask-features.png", tags: ["Search"] },
      { step: 2, label: "Enter swap amount", flow: "Swap", tags: ["Form / Input"] },
      { step: 3, label: "Review swap details", flow: "Swap", tags: ["Form / Input"] },
      { step: 4, label: "Gas fee estimator", flow: "Swap", tags: ["Settings / Preferences"] },
      { step: 5, label: "Transaction pending", flow: "Swap", tags: ["Loading State"] },
      { step: 1, label: "Enter recipient address", flow: "Send", tags: ["Form / Input"] },
      { step: 2, label: "Select token to send", flow: "Send", tags: ["Search"] },
      { step: 3, label: "Enter amount", flow: "Send", tags: ["Form / Input"] },
      { step: 4, label: "Review transaction", flow: "Send", tags: ["Form / Input"] },
      { step: 1, label: "General settings", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 2, label: "Security & privacy", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 3, label: "Networks management", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 4, label: "Advanced settings", flow: "Settings", tags: ["Settings / Preferences"] },
    ],
    changes: [
      {
        date: "Feb 10, 2026",
        description:
          "Added gas fee estimator to swap confirmation screen",
        type: "New Feature",
      },
      {
        date: "Jan 28, 2026",
        description:
          "Redesigned token selector with search and favorites",
        type: "Redesign",
      },
      {
        date: "Jan 15, 2026",
        description:
          "Updated onboarding copy and added progress indicator",
        type: "Copy Change",
      },
    ],
    accentColor: "#f6851b",
  },
  {
    slug: "phantom",
    name: "Phantom",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "NFT Gallery", "Staking", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Glassmorphism", "Gradient-Rich"],
    description:
      "Multi-chain wallet for Solana, Ethereum, Bitcoin, and more",
    website: "https://phantom.app",
    screenCount: 52,
    lastUpdated: "Feb 8, 2026",
    detailed: false,
    thumbnail: "/screenshots/phantom-home.png",
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [
      { step: 1, label: "Token list view", flow: "Home", image: "/screenshots/phantom-home.png", tags: ["List View"] },
      { step: 2, label: "NFT gallery", flow: "Home", tags: ["Card Layout"] },
      { step: 3, label: "Activity history", flow: "Home", tags: ["List View"] },
      { step: 1, label: "Welcome screen", flow: "Onboarding", tags: ["Onboarding / Walkthrough"] },
      { step: 2, label: "Create new wallet", flow: "Onboarding", tags: ["Onboarding / Walkthrough"] },
      { step: 3, label: "Backup seed phrase", flow: "Onboarding", tags: ["Onboarding / Walkthrough"] },
      { step: 4, label: "Confirm backup", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 5, label: "Set password & biometrics", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 1, label: "Token pair selector", flow: "Swap", tags: ["Search"] },
      { step: 2, label: "Enter swap amount", flow: "Swap", tags: ["Form / Input"] },
      { step: 3, label: "Route preview & fees", flow: "Swap", tags: ["Settings / Preferences"] },
      { step: 4, label: "Confirm swap", flow: "Swap", tags: ["Form / Input"] },
      { step: 1, label: "Select token to send", flow: "Send", tags: ["Search"] },
      { step: 2, label: "Enter recipient address", flow: "Send", tags: ["Form / Input"] },
      { step: 3, label: "Enter amount", flow: "Send", tags: ["Form / Input"] },
      { step: 4, label: "Review & confirm", flow: "Send", tags: ["Form / Input"] },
      { step: 1, label: "Validator list", flow: "Staking", tags: ["List View", "Dashboard / Overview"] },
      { step: 2, label: "Enter stake amount", flow: "Staking", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 3, label: "Confirm stake", flow: "Staking", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 4, label: "Staking overview", flow: "Staking", tags: ["Dashboard / Overview"] },
      { step: 1, label: "General settings", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 2, label: "Security settings", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 3, label: "Connected apps", flow: "Settings", tags: ["Settings / Preferences"] },
    ],
    changes: [
      {
        date: "Feb 8, 2026",
        description: "Added Bitcoin ordinals support to NFT gallery",
        type: "New Feature",
      },
      {
        date: "Jan 22, 2026",
        description:
          "Redesigned staking flow with validator comparison",
        type: "Redesign",
      },
      {
        date: "Jan 10, 2026",
        description:
          "Updated swap routing with Jupiter v7 integration",
        type: "New Feature",
      },
    ],
    accentColor: "#ab9ff2",
  },
  {
    slug: "uniswap",
    name: "Uniswap",
    category: "DeFi",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Token List", "Markets", "Portfolio", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Minimal", "Gradient-Rich", "Clean / Corporate"],
    description: "The largest decentralized exchange protocol — browse Uniswap's full swap interface, limit orders, fiat on/off ramps, pool management, explore pages, and wallet onboarding across Ethereum, Polygon, Arbitrum, Optimism, and Base.",
    website: "https://app.uniswap.org",
    screenCount: 36,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/uniswap-swap-1-main-landing-page-swap-interface-with-swap-anytime.png",
    flows: ["Home", "Swap", "Onboarding", "Staking", "Settings"],
                screens: [
      { step: 1, label: "Main landing page - Swap interface with \"Swap anytime, anywhere\" hero", flow: "Swap", image: "/screenshots/uniswap-swap-1-main-landing-page-swap-interface-with-swap-anytime.png", tags: ["Dashboard / Overview", "Form / Input"] },
      { step: 1, label: "Explore page - Tokens tab with auction modal overlay", flow: "Home", image: "/screenshots/uniswap-home-1-explore-page-tokens-tab-with-auction-modal-overlay.png", tags: ["Modal / Dialog", "List View"] },
      { step: 2, label: "Explore page - Tokens tab with modal dismissed, showing token list", flow: "Home", image: "/screenshots/uniswap-home-2-explore-page-tokens-tab-with-modal-dismissed-showi.png", tags: ["List View"] },
      { step: 3, label: "Explore Auctions page - Verified auctions tab", flow: "Home", image: "/screenshots/uniswap-home-3-explore-auctions-page-verified-auctions-tab.png", tags: ["Data Table"] },
      { step: 4, label: "Explore Auctions - Unverified tab (no data)", flow: "Home", image: "/screenshots/uniswap-home-4-explore-auctions-unverified-tab-no-data.png", tags: ["Empty State"] },
      { step: 5, label: "Explore Auctions - Completed tab (loading skeletons)", flow: "Home", image: "/screenshots/uniswap-home-5-explore-auctions-completed-tab-loading-skeletons.png", tags: ["Loading State"] },
      { step: 6, label: "Global search modal - showing tokens, pools, and wallets results", flow: "Home", image: "/screenshots/uniswap-home-6-global-search-modal-showing-tokens-pools-and-walle.png", tags: ["Modal / Dialog", "Search"] },
      { step: 7, label: "Explore Pools page - loading skeleton state", flow: "Home", image: "/screenshots/uniswap-home-7-explore-pools-page-loading-skeleton-state.png", tags: ["Loading State"] },
      { step: 8, label: "Explore Pools page - loaded pools list with data", flow: "Home", image: "/screenshots/uniswap-home-8-explore-pools-page-loaded-pools-list-with-data.png", tags: ["Data Table"] },
      { step: 9, label: "Explore Transactions page - recent transactions list", flow: "Home", image: "/screenshots/uniswap-home-9-explore-transactions-page-recent-transactions-list.png", tags: ["Data Table"] },
      { step: 1, label: "Pool positions page - empty state with connect wallet prompt", flow: "Staking", image: "/screenshots/uniswap-staking-1-pool-positions-page-empty-state-with-connect-walle.png", tags: ["Empty State", "Dashboard / Overview"] },
      { step: 10, label: "Portfolio page - Demo wallet overview with connect prompt", flow: "Home", image: "/screenshots/uniswap-home-10-portfolio-page-demo-wallet-overview-with-connect-p.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Token selector modal - showing popular tokens and swap across networks", flow: "Swap", image: "/screenshots/uniswap-swap-2-token-selector-modal-showing-popular-tokens-and-sw.png", tags: ["Modal / Dialog", "Search"] },
      { step: 3, label: "Swap page - showing Swap/Limit/Buy/Sell tabs with swap form", flow: "Swap", image: "/screenshots/uniswap-swap-3-swap-page-showing-swap-limit-buy-sell-tabs-with-sw.png", tags: ["Form / Input"] },
      { step: 4, label: "Limit order page - with limit price and market/percentage buttons", flow: "Swap", image: "/screenshots/uniswap-swap-4-limit-order-page-with-limit-price-and-market-perce.png", tags: ["Form / Input"] },
      { step: 5, label: "Buy crypto page - fiat onramp with amount presets", flow: "Swap", image: "/screenshots/uniswap-swap-5-buy-crypto-page-fiat-onramp-with-amount-presets.png", tags: ["Form / Input"] },
      { step: 6, label: "Sell crypto page - fiat offramp with percentage presets", flow: "Swap", image: "/screenshots/uniswap-swap-6-sell-crypto-page-fiat-offramp-with-percentage-pres.png", tags: ["Form / Input"] },
      { step: 1, label: "Connect wallet modal - showing Uniswap Wallet, WalletConnect, Coinbase, Binance options", flow: "Onboarding", image: "/screenshots/uniswap-onboarding-1-connect-wallet-modal-showing-uniswap-wallet-wallet.png", tags: ["Modal / Dialog", "Onboarding / Walkthrough"] },
      { step: 11, label: "404 Page not found - with unicorn illustration", flow: "Home", image: "/screenshots/uniswap-home-11-404-page-not-found-with-unicorn-illustration.png", tags: ["Error Page"] },
      { step: 7, label: "Swap page with Trade menu expanded - showing Swap/Limit/Buy/Sell options", flow: "Swap", image: "/screenshots/uniswap-swap-7-swap-page-with-trade-menu-expanded-showing-swap-li.png", tags: ["Navigation", "Form / Input"] },
      { step: 1, label: "Menu dropdown - showing Products, Protocol, Company sections with links", flow: "Settings", image: "/screenshots/uniswap-settings-1-menu-dropdown-showing-products-protocol-company-se.png", tags: ["Navigation", "Settings / Preferences"] },
    ],
    changes: [
      {
        date: "Feb 12, 2026",
        description: "Launched auction discovery page with verified/unverified/completed tabs",
        type: "New Feature",
      },
      {
        date: "Feb 8, 2026",
        description: "Added fiat sell/off-ramp flow with percentage presets alongside existing buy flow",
        type: "New Feature",
      },
      {
        date: "Feb 5, 2026",
        description: "Added limit orders to swap interface with market price and percentage shortcuts",
        type: "New Feature",
      },
      {
        date: "Jan 30, 2026",
        description: "Redesigned token search with trending tokens section and cross-network swap support",
        type: "Redesign",
      },
      {
        date: "Jan 22, 2026",
        description: "Redesigned Explore page with unified tokens, pools, and transactions tabs",
        type: "Redesign",
      },
      {
        date: "Jan 18, 2026",
        description: "Updated fee tier selector with liquidity depth indicators",
        type: "Layout Shift",
      },
      {
        date: "Jan 10, 2026",
        description: "Revamped portfolio page with demo wallet preview for unconnected users",
        type: "Redesign",
      },
      {
        date: "Jan 3, 2026",
        description: "Changed 'Connect Wallet' copy to 'Get Started' on landing hero",
        type: "Copy Change",
      },
    ],
    accentColor: "#ff007a",
  },
  {
    slug: "coinbase",
    name: "Coinbase",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Trade View", "Markets", "Staking", "Onboarding", "Settings", "Notifications", "Learn", "Earn"],
    styles: ["Clean / Corporate", "Card-Heavy"],
    description: "The most trusted cryptocurrency exchange",
    website: "https://www.coinbase.com",
    screenCount: 64,
    lastUpdated: "Feb 9, 2026",
    detailed: false,
    thumbnail: "/screenshots/coinbase-home.png",
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [
      { step: 1, label: "Portfolio overview", flow: "Home", image: "/screenshots/coinbase-home.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Watchlist", flow: "Home", tags: ["List View"] },
      { step: 3, label: "Market prices", flow: "Home", tags: ["Data Table"] },
      { step: 4, label: "News feed", flow: "Home", tags: ["Card Layout"] },
      { step: 1, label: "Sign up form", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 2, label: "Email verification", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 3, label: "Phone verification", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 4, label: "Identity verification", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 5, label: "Add payment method", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 1, label: "Buy/Sell selector", flow: "Swap", tags: ["Search"] },
      { step: 2, label: "Enter amount", flow: "Swap", tags: ["Form / Input"] },
      { step: 3, label: "Select payment method", flow: "Swap", tags: ["Form / Input"] },
      { step: 4, label: "Review purchase", flow: "Swap", tags: ["Form / Input"] },
      { step: 5, label: "Order confirmation", flow: "Swap", tags: ["Form / Input"] },
      { step: 1, label: "Select asset to send", flow: "Send", tags: ["Search"] },
      { step: 2, label: "Enter recipient", flow: "Send", tags: ["Form / Input"] },
      { step: 3, label: "Enter amount", flow: "Send", tags: ["Form / Input"] },
      { step: 4, label: "Review send", flow: "Send", tags: ["Form / Input"] },
      { step: 5, label: "2FA confirmation", flow: "Send", tags: ["Form / Input"] },
      { step: 1, label: "Earn overview", flow: "Staking", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Available assets", flow: "Staking", tags: ["List View", "Dashboard / Overview"] },
      { step: 3, label: "Stake amount", flow: "Staking", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 4, label: "Confirm stake", flow: "Staking", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 1, label: "Profile settings", flow: "Settings", tags: ["Settings / Preferences", "Profile / Account"] },
      { step: 2, label: "Security settings", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 3, label: "Payment methods", flow: "Settings", tags: ["Settings / Preferences"] },
      { step: 4, label: "Notifications", flow: "Settings", tags: ["Settings / Preferences", "Notification / Alert"] },
    ],
    changes: [
      {
        date: "Feb 9, 2026",
        description:
          "Added recurring buy scheduling to purchase flow",
        type: "New Feature",
      },
      {
        date: "Jan 25, 2026",
        description: "Redesigned portfolio view with P&L charts",
        type: "Redesign",
      },
      {
        date: "Jan 12, 2026",
        description:
          "Updated onboarding with faster identity verification",
        type: "Copy Change",
      },
    ],
    accentColor: "#0052ff",
  },
  {
    slug: "aave",
    name: "Aave",
    category: "DeFi",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Markets", "Staking", "Governance", "Earn", "Settings"],
    styles: ["Dark Mode", "Data Dense", "Card-Heavy"],
    description: "Decentralized lending and borrowing protocol",
    website: "https://app.aave.com",
    screenCount: 21,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/aave-home-1-landing-page-with-mobile-app-announcement-banner-a.png",
    flows: ["Home", "Swap", "Settings"],
                screens: [
      { step: 1, label: "Landing page with mobile app announcement banner and analytics consent modal", flow: "Home", image: "/screenshots/aave-home-1-landing-page-with-mobile-app-announcement-banner-a.png", tags: ["Dashboard / Overview", "Modal / Dialog", "Notification / Alert"] },
      { step: 2, label: "Dashboard page with Core Market overview and assets list", flow: "Home", image: "/screenshots/aave-home-2-dashboard-page-with-core-market-overview-and-asset.png", tags: ["Dashboard / Overview", "List View"] },
      { step: 3, label: "Dashboard scrolled showing ETH and Tether USD asset details", flow: "Home", image: "/screenshots/aave-home-3-dashboard-scrolled-showing-eth-and-tether-usd-asse.png", tags: ["Dashboard / Overview", "List View"] },
      { step: 4, label: "Dashboard scrolled showing Wrapped eETH and USD Coin assets", flow: "Home", image: "/screenshots/aave-home-4-dashboard-scrolled-showing-wrapped-eeth-and-usd-co.png", tags: ["Dashboard / Overview", "List View"] },
      { step: 5, label: "Markets page with Core Market selected showing assets", flow: "Home", image: "/screenshots/aave-home-5-markets-page-with-core-market-selected-showing-ass.png", tags: ["Data Table", "List View"] },
      { step: 6, label: "Markets category filter dropdown showing Stablecoins ETH Correlated and Principle Tokens", flow: "Home", image: "/screenshots/aave-home-6-markets-category-filter-dropdown-showing-stablecoi.png", tags: ["Modal / Dialog", "Data Table"] },
      { step: 7, label: "Governance page with Proposals tab and filter options", flow: "Home", image: "/screenshots/aave-home-7-governance-page-with-proposals-tab-and-filter-opti.png", tags: ["Data Table"] },
      { step: 8, label: "Governance page showing proposal list with Open for voting status", flow: "Home", image: "/screenshots/aave-home-8-governance-page-showing-proposal-list-with-open-fo.png", tags: ["Data Table"] },
      { step: 9, label: "Governance proposals showing voting results with YAE and NAY percentages", flow: "Home", image: "/screenshots/aave-home-9-governance-proposals-showing-voting-results-with-y.png", tags: ["Data Table"] },
      { step: 1, label: "Savings GHO page showing 5.37% APY and total deposited amount", flow: "Staking", image: "/screenshots/aave-staking-1-savings-gho-page-showing-5-37-apy-and-total-deposi.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Staking dropdown menu showing Umbrella and Safety Module options", flow: "Staking", image: "/screenshots/aave-staking-2-staking-dropdown-menu-showing-umbrella-and-safety-.png", tags: ["Modal / Dialog", "Dashboard / Overview"] },
      { step: 3, label: "Staking Umbrella page showing Core market and USDC staking option", flow: "Staking", image: "/screenshots/aave-staking-3-staking-umbrella-page-showing-core-market-and-usdc.png", tags: ["Dashboard / Overview"] },
      { step: 1, label: "More menu dropdown showing Migrate to Aave V3 FAQ Developers and Legacy Markets", flow: "Settings", image: "/screenshots/aave-settings-1-more-menu-dropdown-showing-migrate-to-aave-v3-faq-.png", tags: ["Navigation", "Settings / Preferences"] },
      { step: 1, label: "Connect Wallet modal showing Family MetaMask Coinbase and Other Wallets options", flow: "Onboarding", image: "/screenshots/aave-onboarding-1-connect-wallet-modal-showing-family-metamask-coinb.png", tags: ["Modal / Dialog", "Onboarding / Walkthrough"] },
      { step: 4, label: "Safety Module page with funds and emission information and connect wallet prompt", flow: "Staking", image: "/screenshots/aave-staking-4-safety-module-page-with-funds-and-emission-informa.png", tags: ["Dashboard / Overview", "Empty State"] },
      { step: 10, label: "Dashboard empty state with ghost mascot requesting wallet connection", flow: "Home", image: "/screenshots/aave-home-10-dashboard-empty-state-with-ghost-mascot-requesting.png", tags: ["Empty State", "Dashboard / Overview"] },
      { step: 11, label: "404 Page not found error page with ghost mascot and Back home button", flow: "Home", image: "/screenshots/aave-home-11-404-page-not-found-error-page-with-ghost-mascot-an.png", tags: ["Error Page"] },
      { step: 2, label: "Global settings panel showing Dark mode Testnet mode Language and Watch wallet options", flow: "Settings", image: "/screenshots/aave-settings-2-global-settings-panel-showing-dark-mode-testnet-mo.png", tags: ["Settings / Preferences"] },
      { step: 3, label: "Language selection menu showing English Spanish French and Greek options", flow: "Settings", image: "/screenshots/aave-settings-3-language-selection-menu-showing-english-spanish-fr.png", tags: ["Settings / Preferences", "Modal / Dialog"] },
      { step: 12, label: "Market selector modal showing Version 3 and Version 2 tabs with Core Prime Plasma Base Arbitrum Avalanche and Linea markets", flow: "Home", image: "/screenshots/aave-home-12-market-selector-modal-showing-version-3-and-versio.png", tags: ["Modal / Dialog", "Search", "Data Table"] },
      { step: 13, label: "Market selector showing Version 2 tab selected with multiple chain markets available", flow: "Home", image: "/screenshots/aave-home-13-market-selector-showing-version-2-tab-selected-wit.png", tags: ["Modal / Dialog", "Search", "Data Table"] },
    ],
    changes: [
      {
        date: "Feb 7, 2026",
        description:
          "Added risk monitoring dashboard for active positions",
        type: "New Feature",
      },
      {
        date: "Jan 20, 2026",
        description:
          "Redesigned market overview with APY comparison charts",
        type: "Redesign",
      },
      {
        date: "Jan 8, 2026",
        description:
          "Updated E-mode selection with clearer risk parameters",
        type: "Layout Shift",
      },
    ],
    accentColor: "#b6509e",
  },

  // ─── BASIC LISTINGS — WALLETS ──────────────────────────────────
  {
    slug: "trust-wallet",
    name: "Trust Wallet",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "Staking", "NFT Gallery", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Card-Heavy"],
    description: "Multi-chain self-custody wallet by Binance",
    website: "https://trustwallet.com",
    screenCount: 39,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#0500ff",
  },
  {
    slug: "rainbow",
    name: "Rainbow",
    category: "Wallet",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "NFT Gallery", "Onboarding", "Settings"],
    styles: ["Gradient-Rich", "Glassmorphism", "Minimal"],
    description: "Fun, simple, and secure Ethereum wallet",
    website: "https://rainbow.me",
    screenCount: 33,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#001e59",
  },
  {
    slug: "rabby",
    name: "Rabby",
    category: "Wallet",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "Settings"],
    styles: ["Dark Mode", "Minimal"],
    description: "Open-source browser wallet for DeFi users",
    website: "https://rabby.io",
    screenCount: 28,
    lastUpdated: "Feb 4, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#7084ff",
  },
  {
    slug: "zerion",
    name: "Zerion",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "NFT Gallery", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Glassmorphism", "Gradient-Rich"],
    description: "Smart wallet for DeFi and NFT management",
    website: "https://zerion.io",
    screenCount: 35,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#2962ef",
  },
  {
    slug: "coinbase-wallet",
    name: "Coinbase Wallet",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "NFT Gallery", "Onboarding", "Settings"],
    styles: ["Clean / Corporate", "Card-Heavy"],
    description: "Self-custody wallet by Coinbase",
    website: "https://www.coinbase.com/wallet",
    screenCount: 41,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#0052ff",
  },
  {
    slug: "safe",
    name: "Safe",
    category: "Wallet",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Settings", "Onboarding"],
    styles: ["Dark Mode", "Minimal", "Clean / Corporate"],
    description: "Multi-sig smart account wallet",
    website: "https://safe.global",
    screenCount: 26,
    lastUpdated: "Feb 3, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#12ff80",
  },
  {
    slug: "ledger-live",
    name: "Ledger Live",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "Staking", "Onboarding", "Settings", "Markets"],
    styles: ["Dark Mode", "Card-Heavy", "Clean / Corporate"],
    description: "Hardware wallet companion app",
    website: "https://www.ledger.com",
    screenCount: 44,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#000000",
  },
  {
    slug: "exodus",
    name: "Exodus",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "Staking", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Gradient-Rich", "Card-Heavy"],
    description: "Multi-chain desktop and mobile wallet",
    website: "https://www.exodus.com",
    screenCount: 37,
    lastUpdated: "Feb 4, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#8b45e6",
  },
  {
    slug: "okx-wallet",
    name: "OKX Wallet",
    category: "Wallet",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "NFT Gallery", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Card-Heavy"],
    description: "Multi-chain Web3 wallet by OKX",
    website: "https://www.okx.com/web3",
    screenCount: 42,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#ffffff",
  },
  {
    slug: "xverse",
    name: "Xverse",
    category: "Wallet",
    chains: ["Bitcoin"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Token List", "NFT Gallery", "Staking", "Onboarding", "Learn"],
    styles: ["Dark Mode", "Gradient-Rich", "Card-Heavy"],
    description: "Bitcoin wallet for Ordinals, NFTs, and DeFi",
    website: "https://www.xverse.app",
    screenCount: 20,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/xverse-home-1-xverse-bitcoin-wallet-landing-page-with-hero-section.png",
    flows: ["Home", "Onboarding", "Staking"],
            screens: [
      { step: 1, label: "Bitcoin wallet landing page with hero section and download CTA", flow: "Home", image: "/screenshots/xverse-home-1-xverse-bitcoin-wallet-landing-page-with-hero-section.png", tags: ["Dashboard / Overview", "Onboarding / Walkthrough"] },
      { step: 2, label: "Security features page highlighting self-custody and audit details", flow: "Home", image: "/screenshots/xverse-home-2-security-features-page-with-audit-details-and-key-management.png", tags: ["Card Layout"] },
      { step: 3, label: "About page displaying company mission and team information", flow: "Home", image: "/screenshots/xverse-home-3-team-and-careers-page-showing-company-information.png", tags: ["Card Layout"] },
      { step: 4, label: "Blog page with categorized articles and featured Satsdaq content", flow: "Home", image: "/screenshots/xverse-home-4-blog-page-with-latest-articles-and-news.png", tags: ["Card Layout"] },
      { step: 5, label: "API documentation page with Bitcoin application development tools", flow: "Home", image: "/screenshots/xverse-home-5-developer-api-documentation-and-integration-page.png", tags: ["Card Layout"] },
      { step: 1, label: "Download page with browser extension and mobile app links", flow: "Onboarding", image: "/screenshots/xverse-onboarding-1-download-page-with-browser-extension-and-mobile-app-links.png", tags: ["Onboarding / Walkthrough"] },
      { step: 6, label: "Ledger hardware wallet integration and support page", flow: "Home", image: "/screenshots/xverse-home-6-ledger-hardware-wallet-integration-and-support-page.png", tags: ["Card Layout"] },
      { step: 7, label: "Keystone cold wallet support and signing guide", flow: "Home", image: "/screenshots/xverse-home-7-keystone-cold-wallet-support-and-signing-guide.png", tags: ["Card Layout"] },
      { step: 8, label: "Bitcoin wallet features page with send and receive capabilities", flow: "Home", image: "/screenshots/xverse-home-8-bitcoin-wallet-features-page-with-send-and-receive-capabilities.png", tags: ["Card Layout"] },
      { step: 9, label: "Stacks wallet page for STX tokens and smart contracts", flow: "Home", image: "/screenshots/xverse-home-9-stacks-wallet-page-for-stx-tokens-and-smart-contracts.png", tags: ["Card Layout"] },
      { step: 10, label: "Starknet wallet integration page for Layer 2 support", flow: "Home", image: "/screenshots/xverse-home-10-starknet-wallet-integration-page-for-layer-2-support.png", tags: ["Card Layout"] },
      { step: 11, label: "Bitcoin NFT wallet page for Ordinals and digital collectibles", flow: "Home", image: "/screenshots/xverse-home-11-bitcoin-nft-wallet-page-for-ordinals-and-digital-collectibles.png", tags: ["Card Layout"] },
      { step: 12, label: "Ordinals wallet page for Bitcoin inscriptions management", flow: "Home", image: "/screenshots/xverse-home-12-ordinals-wallet-page-for-bitcoin-inscriptions-management.png", tags: ["Card Layout"] },
      { step: 13, label: "BRC-20 token wallet page for Bitcoin fungible tokens", flow: "Home", image: "/screenshots/xverse-home-13-brc-20-token-wallet-page-for-bitcoin-fungible-tokens.png", tags: ["Card Layout"] },
      { step: 14, label: "Bitcoin DeFi wallet page for decentralized finance access", flow: "Home", image: "/screenshots/xverse-home-14-bitcoin-defi-wallet-page-for-decentralized-finance-access.png", tags: ["Card Layout"] },
      { step: 15, label: "Runes wallet page for Bitcoin protocol token standard", flow: "Home", image: "/screenshots/xverse-home-15-runes-wallet-page-for-bitcoin-protocol-token-standard.png", tags: ["Card Layout"] },
      { step: 16, label: "Lightning Network wallet page for instant Bitcoin payments", flow: "Home", image: "/screenshots/xverse-home-16-lightning-wallet-page-for-instant-bitcoin-payments.png", tags: ["Card Layout"] },
      { step: 17, label: "Summ crypto tax calculator integration for multiple Bitcoin assets", flow: "Home", image: "/screenshots/xverse-home-17-crypto-tax-calculator-tool-integration-page.png", tags: ["Card Layout"] },
      { step: 1, label: "Xverse Earn page for Bitcoin yield and stacking rewards", flow: "Staking", image: "/screenshots/xverse-staking-1-xverse-earn-page-for-bitcoin-yield-and-stacking-rewards.png", tags: ["Dashboard / Overview"] },
      { step: 18, label: "404 error page with not found message", flow: "Home", image: "/screenshots/xverse-home-18-404-error-page-with-not-found-message.png", tags: ["Error Page"] },
    ],
    changes: [],
    accentColor: "#ee7a30",
  },
  {
    slug: "mempool",
    name: "Mempool",
    category: "Analytics",
    chains: ["Bitcoin"],
    platforms: ["Web"],
    sections: ["Dashboard", "Charts", "Markets", "Onboarding"],
    styles: ["Dark Mode", "Data Dense", "Neon Accents"],
    description: "Open-source Bitcoin blockchain explorer and mempool visualizer",
    website: "https://mempool.space",
    screenCount: 15,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/mempool-home-1-bitcoin-mempool-dashboard-with-fee-estimates-and-recent-blocks.png",
    flows: ["Home", "Onboarding"],
            screens: [
      { step: 1, label: "Bitcoin mempool dashboard with fee estimates and recent blocks", flow: "Home", image: "/screenshots/mempool-home-1-bitcoin-mempool-dashboard-with-fee-estimates-and-recent-blocks.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Mempool dashboard scrolled showing transaction list and stats", flow: "Home", image: "/screenshots/mempool-home-2-mempool-dashboard-scrolled-showing-transaction-list-and-stats.png", tags: ["Dashboard / Overview", "Data Table"] },
      { step: 3, label: "Signet testnet explorer dashboard view with test network warning", flow: "Home", image: "/screenshots/mempool-home-3-signet-testnet-explorer-dashboard-view.png", tags: ["Dashboard / Overview"] },
      { step: 4, label: "Transaction acceleration marketplace for stuck Bitcoin transactions", flow: "Home", image: "/screenshots/mempool-home-4-transaction-acceleration-marketplace-for-stuck-bitcoin-transactions.png", tags: ["Data Table"] },
      { step: 5, label: "Transaction acceleration page scrolled with pending accelerations list", flow: "Home", image: "/screenshots/mempool-home-5-transaction-acceleration-page-scrolled-with-pending-accelerations.png", tags: ["List View"] },
      { step: 6, label: "Bitcoin mining dashboard with hashrate and pool distribution", flow: "Home", image: "/screenshots/mempool-home-6-bitcoin-mining-dashboard-with-hashrate-and-pool-distribution.png", tags: ["Dashboard / Overview", "Chart / Graph"] },
      { step: 7, label: "Mining dashboard scrolled showing block rewards and difficulty", flow: "Home", image: "/screenshots/mempool-home-7-mining-dashboard-scrolled-showing-block-rewards-and-difficulty.png", tags: ["Dashboard / Overview", "Chart / Graph"] },
      { step: 8, label: "Lightning Network explorer with node and channel statistics", flow: "Home", image: "/screenshots/mempool-home-8-lightning-network-explorer-with-node-and-channel-statistics.png", tags: ["Dashboard / Overview", "Data Table"] },
      { step: 9, label: "Mempool graphs showing fee rates and transaction volume", flow: "Home", image: "/screenshots/mempool-home-9-mempool-graphs-showing-fee-rates-and-transaction-volume.png", tags: ["Chart / Graph"] },
      { step: 10, label: "Enterprise API services page for institutional Bitcoin data", flow: "Home", image: "/screenshots/mempool-home-10-enterprise-api-services-page-for-institutional-bitcoin-data.png", tags: ["Card Layout"] },
      { step: 1, label: "Sign in page for mempool.space user accounts", flow: "Onboarding", image: "/screenshots/mempool-onboarding-1-sign-in-page-for-mempool-space-user-accounts.png", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 11, label: "Mempool block visualization showing pending transactions", flow: "Home", image: "/screenshots/mempool-home-11-mempool-block-visualization-showing-pending-transactions.png", tags: ["Chart / Graph", "Dashboard / Overview"] },
      { step: 12, label: "Individual block detail page with transaction list", flow: "Home", image: "/screenshots/mempool-home-12-individual-block-detail-page-with-transaction-list.png", tags: ["Data Table"] },
      { step: 13, label: "Block detail scrolled showing transaction inputs and outputs", flow: "Home", image: "/screenshots/mempool-home-13-block-detail-scrolled-showing-transaction-inputs-and-outputs.png", tags: ["Data Table"] },
      { step: 14, label: "Mining pool detail page showing hashrate and mined blocks", flow: "Home", image: "/screenshots/mempool-home-14-mining-pool-detail-page-showing-hashrate-and-mined-blocks.png", tags: ["Dashboard / Overview", "Chart / Graph"] },
    ],
    changes: [],
    accentColor: "#4a4de7",
  },
  {
    slug: "leather",
    name: "Leather",
    category: "Wallet",
    chains: ["Bitcoin"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Staking", "Onboarding", "Settings", "Learn"],
    styles: ["Dark Mode", "Minimal", "Card-Heavy"],
    description: "Bitcoin and Stacks wallet for Web3 with sBTC and stacking support",
    website: "https://leather.io",
    screenCount: 16,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/leather-home-1-leather-bitcoin-wallet-landing-page-with-hero-and-features.png",
    flows: ["Home", "Onboarding", "Settings", "Staking"],
            screens: [
      { step: 1, label: "Leather Bitcoin wallet landing page with hero and features", flow: "Home", image: "/screenshots/leather-home-1-leather-bitcoin-wallet-landing-page-with-hero-and-features.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Landing page scrolled showing wallet capabilities and ecosystem", flow: "Home", image: "/screenshots/leather-home-2-landing-page-scrolled-showing-wallet-capabilities-and-ecosystem.png", tags: ["Dashboard / Overview", "Card Layout"] },
      { step: 3, label: "Portfolio dashboard showing Bitcoin and Stacks balances", flow: "Home", image: "/screenshots/leather-home-3-portfolio-dashboard-showing-bitcoin-and-stacks-balances.png", tags: ["Dashboard / Overview"] },
      { step: 1, label: "Stacking page explaining yield opportunities with pooled staking", flow: "Onboarding", image: "/screenshots/leather-onboarding-1-connect-wallet-overlay-for-stacking-feature-access.png", tags: ["Onboarding / Walkthrough", "Dashboard / Overview"] },
      { step: 2, label: "sBTC rewards page explaining Bitcoin yield on Stacks protocol", flow: "Onboarding", image: "/screenshots/leather-onboarding-2-connect-wallet-overlay-for-sbtc-bridge-feature.png", tags: ["Onboarding / Walkthrough", "Dashboard / Overview"] },
      { step: 1, label: "Advanced settings page with Stacks network and developer options", flow: "Settings", image: "/screenshots/leather-home-4-apps-directory-page-showing-bitcoin-ecosystem-integrations.png", tags: ["Settings / Preferences"] },
      { step: 4, label: "Apps directory page showing Bitcoin ecosystem integrations", flow: "Home", image: "/screenshots/leather-settings-1-advanced-settings-page-with-network-and-developer-options.png", tags: ["Card Layout"] },
      { step: 5, label: "Changelog page with recent wallet updates and releases", flow: "Home", image: "/screenshots/leather-home-5-changelog-page-with-recent-wallet-updates-and-releases.png", tags: ["Card Layout"] },
      { step: 6, label: "Help center page with support guides and documentation", flow: "Home", image: "/screenshots/leather-home-6-help-center-page-with-support-guides-and-documentation.png", tags: ["Card Layout"] },
      { step: 7, label: "Changelog entry for USDCx default asset support feature", flow: "Home", image: "/screenshots/leather-home-7-changelog-entry-for-usdcx-default-asset-support.png", tags: ["Card Layout"] },
      { step: 8, label: "Changelog entry for USDCx availability on Stacks", flow: "Home", image: "/screenshots/leather-home-8-changelog-entry-for-usdcx-availability-on-stacks.png", tags: ["Card Layout"] },
      { step: 9, label: "Changelog entry for improved onramp integration with Onramper", flow: "Home", image: "/screenshots/leather-home-9-changelog-entry-for-improved-onramp-integration.png", tags: ["Card Layout"] },
      { step: 10, label: "Privacy policy page with data handling information", flow: "Home", image: "/screenshots/leather-home-10-privacy-policy-page-with-data-handling-information.png", tags: ["Card Layout"] },
      { step: 11, label: "Security page with wallet safety practices and audits", flow: "Home", image: "/screenshots/leather-home-11-security-page-with-wallet-safety-practices-and-audits.png", tags: ["Card Layout"] },
      { step: 1, label: "Earn sign-in page for Bitcoin stacking rewards", flow: "Staking", image: "/screenshots/leather-staking-1-earn-sign-in-page-for-bitcoin-stacking-rewards.png", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 12, label: "404 error page with navigation options to Help, Guides, and Developers", flow: "Home", image: "/screenshots/leather-home-12-404-error-page-not-found.png", tags: ["Error Page"] },
    ],
    changes: [],
    accentColor: "#f5a623",
  },

  // ─── BASIC LISTINGS — EXCHANGES ────────────────────────────────
  {
    slug: "binance",
    name: "Binance",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Staking", "Onboarding", "Settings", "Earn"],
    styles: ["Dark Mode", "Data Dense", "Card-Heavy"],
    description: "World's largest crypto exchange by volume",
    website: "https://www.binance.com",
    screenCount: 12,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/binance-home-1-binance-homepage-initial-load.png",
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
                screens: [
      { step: 1, label: "Binance homepage initial load", flow: "Home", image: "/screenshots/binance-home-1-binance-homepage-initial-load.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Cookie consent modal overlay", flow: "Home", image: "/screenshots/binance-home-2-cookie-consent-modal-overlay.png", tags: ["Modal / Dialog", "Notification / Alert"] },
      { step: 3, label: "Homepage after dismissing cookie consent", flow: "Home", image: "/screenshots/binance-home-3-homepage-after-dismissing-cookie-consent.png", tags: ["Dashboard / Overview"] },
      { step: 4, label: "Homepage scrolled down - middle section", flow: "Home", image: "/screenshots/binance-home-4-homepage-scrolled-down-middle-section.png", tags: ["Dashboard / Overview"] },
      { step: 5, label: "Homepage scrolled down - lower section", flow: "Home", image: "/screenshots/binance-home-5-homepage-scrolled-down-lower-section.png", tags: ["Dashboard / Overview"] },
      { step: 6, label: "Homepage footer section", flow: "Home", image: "/screenshots/binance-home-6-homepage-footer-section.png", tags: ["Navigation"] },
      { step: 1, label: "Buy Crypto page", flow: "Swap", image: "/screenshots/binance-swap-1-buy-crypto-page.png", tags: ["Form / Input"] },
      { step: 7, label: "Markets overview page", flow: "Home", image: "/screenshots/binance-home-7-markets-overview-page.png", tags: ["Data Table", "Dashboard / Overview"] },
      { step: 2, label: "Trade dropdown menu open", flow: "Swap", image: "/screenshots/binance-swap-2-trade-dropdown-menu-open.png", tags: ["Modal / Dialog", "Navigation"] },
      { step: 3, label: "Spot trading page", flow: "Swap", image: "/screenshots/binance-swap-3-spot-trading-page.png", tags: ["Chart / Graph"] },
      { step: 1, label: "Earn page - staking and rewards", flow: "Staking", image: "/screenshots/binance-staking-1-earn-page-staking-and-rewards.png", tags: ["Dashboard / Overview"] },
      { step: 8, label: "Square social/community page", flow: "Home", image: "/screenshots/binance-home-8-square-social-community-page.png", tags: ["Card Layout"] },
    ],
    changes: [
      { date: "Feb 7, 2026", description: "Added copy trading to spot interface", type: "New Feature" },
      { date: "Jan 25, 2026", description: "Redesigned markets overview with heat map", type: "Redesign" },
      { date: "Jan 10, 2026", description: "Updated convert flow with price alerts", type: "New Feature" },
    ],
    accentColor: "#f0b90b",
  },
  {
    slug: "kraken",
    name: "Kraken",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Staking", "Onboarding", "Settings", "Earn"],
    styles: ["Dark Mode", "Data Dense", "Neon Accents"],
    description: "Established crypto exchange with advanced trading",
    website: "https://www.kraken.com",
    screenCount: 53,
    lastUpdated: "Feb 7, 2026",
    detailed: false,
    thumbnail: "/screenshots/kraken-home.png",
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [
      { step: 1, label: "Prices overview", flow: "Home", image: "/screenshots/kraken-prices.png", tags: ["Dashboard / Overview", "Data Table"] },
      { step: 2, label: "Pro trading view", flow: "Home", image: "/screenshots/kraken-trade.png", tags: ["Chart / Graph"] },
      { step: 3, label: "Portfolio tracker", flow: "Home", image: "/screenshots/kraken-home.png", tags: ["Dashboard / Overview"] },
      { step: 1, label: "Sign up flow", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 2, label: "Verification tiers", flow: "Onboarding", tags: ["Onboarding / Walkthrough", "Form / Input"] },
      { step: 1, label: "Instant buy", flow: "Swap", tags: ["Form / Input"] },
      { step: 2, label: "Order form", flow: "Swap", tags: ["Form / Input"] },
      { step: 3, label: "Review order", flow: "Swap", tags: ["Form / Input"] },
      { step: 1, label: "Withdraw asset", flow: "Send", tags: ["Form / Input"] },
      { step: 2, label: "Enter address", flow: "Send", tags: ["Form / Input"] },
      { step: 1, label: "Staking rewards", flow: "Staking", image: "/screenshots/kraken-staking.png", tags: ["Dashboard / Overview"] },
      { step: 2, label: "Stake ETH", flow: "Staking", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 1, label: "Account settings", flow: "Settings", tags: ["Settings / Preferences", "Profile / Account"] },
      { step: 2, label: "API management", flow: "Settings", tags: ["Settings / Preferences"] },
    ],
    changes: [
      { date: "Feb 6, 2026", description: "Added NFT marketplace to main navigation", type: "New Feature" },
      { date: "Jan 22, 2026", description: "Redesigned Pro trading with customizable layouts", type: "Redesign" },
      { date: "Jan 8, 2026", description: "Updated staking page with validator selection", type: "Layout Shift" },
    ],
    accentColor: "#7132f5",
  },
  {
    slug: "okx",
    name: "OKX",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Data Dense"],
    description: "Global crypto exchange and Web3 platform",
    website: "https://www.okx.com",
    screenCount: 58,
    lastUpdated: "Feb 7, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#ffffff",
  },
  {
    slug: "bybit",
    name: "Bybit",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Data Dense", "Neon Accents"],
    description: "Crypto exchange focused on derivatives",
    website: "https://www.bybit.com",
    screenCount: 49,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#f7a600",
  },
  {
    slug: "crypto-com",
    name: "Crypto.com",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Markets", "Staking", "Onboarding", "Settings", "Earn"],
    styles: ["Dark Mode", "Card-Heavy", "Gradient-Rich"],
    description: "Crypto exchange, DeFi wallet, and Visa card",
    website: "https://crypto.com",
    screenCount: 56,
    lastUpdated: "Feb 7, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#002d74",
  },
  {
    slug: "gemini",
    name: "Gemini",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Markets", "Staking", "Onboarding", "Settings", "Earn"],
    styles: ["Clean / Corporate", "Minimal"],
    description: "Regulated crypto exchange and custodian",
    website: "https://www.gemini.com",
    screenCount: 42,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Staking", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#00dcfa",
  },
  {
    slug: "robinhood-crypto",
    name: "Robinhood Crypto",
    category: "Exchange",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Onboarding", "Settings"],
    styles: ["Clean / Corporate", "Minimal"],
    description: "Commission-free crypto trading",
    website: "https://robinhood.com/crypto",
    screenCount: 38,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#00c805",
  },
  {
    slug: "river",
    name: "River",
    category: "Exchange",
    chains: ["Bitcoin"],
    platforms: ["Web"],
    sections: ["Dashboard", "Markets", "Onboarding", "Settings", "Learn"],
    styles: ["Clean / Corporate", "Minimal"],
    description: "Bitcoin-only exchange and financial services",
    website: "https://river.com",
    screenCount: 29,
    lastUpdated: "Feb 4, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#00264b",
  },

  // ─── BASIC LISTINGS — DEFI ─────────────────────────────────────
  {
    slug: "jupiter",
    name: "Jupiter",
    category: "DeFi",
    chains: ["Solana"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Token List", "Markets", "Earn", "Portfolio"],
    styles: ["Dark Mode", "Data Dense", "Neon Accents"],
    description: "Leading Solana DEX aggregator",
    website: "https://jup.ag",
    screenCount: 28,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/jupiter-home-1-homepage-with-swap-interface-market-tab-selected-u.png",
    flows: ["Home", "Swap", "Settings"],
                screens: [
      { step: 1, label: "Homepage with swap interface - Market tab selected, USDC/SOL trading pair", flow: "Home", image: "/screenshots/jupiter-home-1-homepage-with-swap-interface-market-tab-selected-u.png", tags: ["Dashboard / Overview", "Chart / Graph", "Form / Input"] },
      { step: 2, label: "Terminal page - Discover tab with Cooking filter showing trending tokens with 24h data", flow: "Home", image: "/screenshots/jupiter-home-2-terminal-page-discover-tab-with-cooking-filter-sho.png", tags: ["Data Table"] },
      { step: 3, label: "Terminal AlphaScan tab - New token launches with filter and search options", flow: "Home", image: "/screenshots/jupiter-home-3-terminal-alphascan-tab-new-token-launches-with-fil.png", tags: ["Data Table", "Search"] },
      { step: 4, label: "Terminal Tracker tab - Manage Wallets empty state with Add Wallet option", flow: "Home", image: "/screenshots/jupiter-home-4-terminal-tracker-tab-manage-wallets-empty-state-wi.png", tags: ["Empty State"] },
      { step: 5, label: "Terminal Positions tab - Connect wallet prompt to view live positions and PnL", flow: "Home", image: "/screenshots/jupiter-home-5-terminal-positions-tab-connect-wallet-prompt-to-vi.png", tags: ["Empty State"] },
      { step: 6, label: "Terminal Watchlist tab - Shows SOL and JUP tokens with 24h price data and metrics", flow: "Home", image: "/screenshots/jupiter-home-6-terminal-watchlist-tab-shows-sol-and-jup-tokens-wi.png", tags: ["List View"] },
      { step: 1, label: "Perps page loading - SOL perpetual trading with price $81.72 and 24h stats", flow: "Swap", image: "/screenshots/jupiter-swap-1-perps-page-loading-sol-perpetual-trading-with-pric.png", tags: ["Chart / Graph"] },
      { step: 1, label: "Lend page - Terms and Conditions modal for Jupiter Lend service", flow: "Staking", image: "/screenshots/jupiter-staking-1-lend-page-terms-and-conditions-modal-for-jupiter-l.png", tags: ["Modal / Dialog", "Dashboard / Overview"] },
      { step: 2, label: "Lend Earn tab - Jupiter Lend money market with $1.73B supply and JupUSD vault showing 5.23% APY", flow: "Staking", image: "/screenshots/jupiter-staking-2-lend-earn-tab-jupiter-lend-money-market-with-1-73b.png", tags: ["Dashboard / Overview"] },
      { step: 3, label: "Lend Borrow tab - Get a loan with crypto collateral, showing Top Vaults (loading state)", flow: "Staking", image: "/screenshots/jupiter-staking-3-lend-borrow-tab-get-a-loan-with-crypto-collateral-.png", tags: ["Dashboard / Overview", "Loading State"] },
      { step: 4, label: "Lend Multiply tab - Amplify exposure with leveraged loops, showing JLP/USDC, INF/SOL, JupSOL/SOL options", flow: "Staking", image: "/screenshots/jupiter-staking-4-lend-multiply-tab-amplify-exposure-with-leveraged-.png", tags: ["Dashboard / Overview"] },
      { step: 5, label: "Lend Transparency tab - Security audits section with GitHub link and audit tabs", flow: "Staking", image: "/screenshots/jupiter-staking-5-lend-transparency-tab-security-audits-section-with.png", tags: ["Card Layout", "Dashboard / Overview"] },
      { step: 6, label: "Lend Statistics tab - Liquidity view showing USDC, JLP, and SOL pool stats with TVL and APY data", flow: "Staking", image: "/screenshots/jupiter-staking-6-lend-statistics-tab-liquidity-view-showing-usdc-jl.png", tags: ["Data Table", "Dashboard / Overview"] },
      { step: 7, label: "Predict page - Browse tab with category filters (Sports, Crypto, Politics, etc.) and loading event cards", flow: "Home", image: "/screenshots/jupiter-home-7-predict-page-browse-tab-with-category-filters-spor.png", tags: ["Card Layout", "Loading State"] },
      { step: 8, label: "Portfolio page - Landing page with Solana DeFi tracking description and demo preview", flow: "Home", image: "/screenshots/jupiter-home-8-portfolio-page-landing-page-with-solana-defi-track.png", tags: ["Dashboard / Overview"] },
      { step: 7, label: "Rewards page - Two live campaigns: Active Staking Rewards (ASR) and TCG Rewards Season 2", flow: "Staking", image: "/screenshots/jupiter-staking-7-rewards-page-two-live-campaigns-active-staking-rew.png", tags: ["Dashboard / Overview"] },
      { step: 9, label: "Referral Dashboard - Shows referral link section, total referrals, and referral campaigns", flow: "Home", image: "/screenshots/jupiter-home-9-referral-dashboard-shows-referral-link-section-tot.png", tags: ["Dashboard / Overview", "Card Layout"] },
      { step: 1, label: "More menu dropdown - Shows Positions/PnL, Onboard, Mobile, Extension Wallet, VRFD, and social links", flow: "Settings", image: "/screenshots/jupiter-settings-1-more-menu-dropdown-shows-positions-pnl-onboard-mob.png", tags: ["Navigation", "Settings / Preferences"] },
      { step: 10, label: "Referral modal - How Referrals Work with tiered earning structure diagram (30%, 3%, 2%)", flow: "Home", image: "/screenshots/jupiter-home-10-referral-modal-how-referrals-work-with-tiered-earn.png", tags: ["Modal / Dialog", "Card Layout"] },
      { step: 2, label: "Swap page - Limit order tab with USDC to SOL, showing price and slippage settings", flow: "Swap", image: "/screenshots/jupiter-swap-2-swap-page-limit-order-tab-with-usdc-to-sol-showing.png", tags: ["Form / Input", "Settings / Preferences"] },
      { step: 3, label: "Swap page - Recurring order tab with DCA settings (120 USDC to SOL every 1 minute over 2 orders)", flow: "Swap", image: "/screenshots/jupiter-swap-3-swap-page-recurring-order-tab-with-dca-settings-12.png", tags: ["Form / Input", "Settings / Preferences"] },
      { step: 4, label: "Token selector modal - Shows SOL, USDC, USDT, USD1, jlUSDC, cbBTC with search and filter tabs", flow: "Swap", image: "/screenshots/jupiter-swap-4-token-selector-modal-shows-sol-usdc-usdt-usd1-jlus.png", tags: ["Modal / Dialog", "Search"] },
      { step: 11, label: "404 error page - Page Not Found with Back to Home button", flow: "Home", image: "/screenshots/jupiter-home-11-404-error-page-page-not-found-with-back-to-home-bu.png", tags: ["Error Page"] },
      { step: 1, label: "Connect wallet modal - Shows Jupiter Extension (recommended) and Jupiter Mobile options", flow: "Onboarding", image: "/screenshots/jupiter-onboarding-1-connect-wallet-modal-shows-jupiter-extension-recom.png", tags: ["Modal / Dialog", "Onboarding / Walkthrough"] },
      { step: 2, label: "Connect wallet modal expanded - Shows additional wallet options including Social Login, Phantom, Solflare, Backpack, Coinbase, Magic Eden, Trust, Ledger", flow: "Onboarding", image: "/screenshots/jupiter-onboarding-2-connect-wallet-modal-expanded-shows-additional-wal.png", tags: ["Modal / Dialog", "Onboarding / Walkthrough"] },
      { step: 12, label: "Homepage scrolled - Trending tokens (TRUMP, HYPE, PUMP) and Jupiter Prediction Markets promo section", flow: "Home", image: "/screenshots/jupiter-home-12-homepage-scrolled-trending-tokens-trump-hype-pump-.png", tags: ["Dashboard / Overview", "List View"] },
      { step: 13, label: "Homepage scrolled - Jupiter Perps (250x leverage) and Jupiter Lend Vaults (JupUSD 5.23%, USDC 4.38%, SOL 3.58% APY)", flow: "Home", image: "/screenshots/jupiter-home-13-homepage-scrolled-jupiter-perps-250x-leverage-and-.png", tags: ["Dashboard / Overview", "Chart / Graph"] },
      { step: 14, label: "Homepage scrolled - Jupiter Multiply Loops (JupSOL-SOL, JLP-USDC) and Jupiter Terminal stocks section (NVDAx, TSLAx, CRCLx)", flow: "Home", image: "/screenshots/jupiter-home-14-homepage-scrolled-jupiter-multiply-loops-jupsol-so.png", tags: ["Dashboard / Overview", "Card Layout"] },
    ],
    changes: [
      { date: "Feb 5, 2026", description: "Added perpetuals trading interface", type: "New Feature" },
      { date: "Jan 20, 2026", description: "Redesigned token search with trending pairs", type: "Redesign" },
      { date: "Jan 8, 2026", description: "Updated route visualization with fee breakdown", type: "Layout Shift" },
    ],
    accentColor: "#c7f284",
  },
  {
    slug: "lido",
    name: "Lido",
    category: "DeFi",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Staking", "Earn", "Settings"],
    styles: ["Dark Mode", "Minimal", "Glassmorphism"],
    description: "Liquid staking for Ethereum and beyond",
    website: "https://lido.fi",
    screenCount: 10,
    lastUpdated: "Feb 12, 2026",
    detailed: true,
    thumbnail: "/screenshots/lido-staking-1-stake-ether-landing-page-with-staking-form-and-protocol-stat.png",
    flows: ["Home", "Staking", "Settings"],
                screens: [
      { step: 1, label: "Stake Ether landing page with staking form and protocol statistics", flow: "Staking", image: "/screenshots/lido-staking-1-stake-ether-landing-page-with-staking-form-and-protocol-stat.png", tags: ["Form / Input", "Dashboard / Overview"] },
      { step: 2, label: "Reward History page tracking Ethereum staking rewards and APR", flow: "Staking", image: "/screenshots/lido-staking-2-reward-history-page-tracking-ethereum-staking-rewards-and-ap.png", tags: ["Dashboard / Overview", "Chart / Graph"] },
      { step: 3, label: "Earn page showing DeFi vault strategies for yield farming", flow: "Staking", image: "/screenshots/lido-staking-3-earn-page-showing-defi-vault-strategies-for-yield-farming.png", tags: ["Dashboard / Overview", "Card Layout"] },
      { step: 1, label: "Wrap and Unwrap stETH token conversion interface page", flow: "Swap", image: "/screenshots/lido-swap-1-wrap-and-unwrap-steth-token-conversion-interface-page.png", tags: ["Form / Input"] },
      { step: 1, label: "Withdrawals request page for stETH and wsETH redemption", flow: "Send", image: "/screenshots/lido-send-1-withdrawals-request-page-for-steth-and-wseth-redemption.png", tags: ["Form / Input"] },
      { step: 2, label: "Withdrawals page with Request and Claim tabs, FAQ section", flow: "Send", image: "/screenshots/lido-send-2-withdrawals-page-with-request-and-claim-tabs-faq-section.png", tags: ["Card Layout"] },
      { step: 3, label: "Withdrawals FAQ section scrolled, expanded risk disclosure", flow: "Send", image: "/screenshots/lido-send-3-withdrawals-faq-section-scrolled-expanded-risk-disclosure.png", tags: ["Card Layout"] },
      { step: 1, label: "Connect wallet modal with multiple wallet options displayed", flow: "Onboarding", image: "/screenshots/lido-onboarding-1-connect-wallet-modal-with-multiple-wallet-options-displayed.png", tags: ["Modal / Dialog", "Onboarding / Walkthrough"] },
      { step: 1, label: "404 error page - Page Not Found message displayed", flow: "Home", image: "/screenshots/lido-home-1-404-error-page-page-not-found-message-displayed.png", tags: ["Error Page"] },
      { step: 2, label: "Referral program page with whitelist mode information", flow: "Home", image: "/screenshots/lido-home-2-referral-program-page-with-whitelist-mode-information.png", tags: ["Card Layout"] },
    ],
    changes: [
      { date: "Feb 3, 2026", description: "Added stETH/ETH rate chart to dashboard", type: "New Feature" },
      { date: "Jan 18, 2026", description: "Redesigned staking flow with estimated rewards preview", type: "Redesign" },
      { date: "Jan 5, 2026", description: "Updated withdrawal queue with time estimates", type: "Copy Change" },
    ],
    accentColor: "#00a3ff",
  },
  {
    slug: "curve",
    name: "Curve",
    category: "DeFi",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Earn", "Settings"],
    styles: ["Dark Mode", "Data Dense"],
    description: "Stablecoin and low-slippage DEX",
    website: "https://curve.fi",
    screenCount: 27,
    lastUpdated: "Feb 4, 2026",
    detailed: false,
    thumbnail: "/screenshots/curve-home.png",
    flows: ["Home", "Swap", "Settings"],
    screens: [
      { step: 1, label: "Pools overview", flow: "Home", image: "/screenshots/curve-pools.png", tags: ["Data Table", "Dashboard / Overview"] },
      { step: 2, label: "TVL dashboard", flow: "Home", image: "/screenshots/curve-home.png", tags: ["Dashboard / Overview"] },
      { step: 3, label: "Pool details", flow: "Home", tags: ["Data Table"] },
      { step: 1, label: "Select pool to swap", flow: "Swap", image: "/screenshots/curve-swap.png", tags: ["Search", "Data Table"] },
      { step: 2, label: "Enter swap amount", flow: "Swap", tags: ["Form / Input"] },
      { step: 3, label: "Review swap route", flow: "Swap", tags: ["Form / Input"] },
      { step: 4, label: "Confirm transaction", flow: "Swap", tags: ["Form / Input"] },
      { step: 1, label: "Slippage tolerance", flow: "Settings", image: "/screenshots/curve-lending.png", tags: ["Settings / Preferences"] },
      { step: 2, label: "Gas settings", flow: "Settings", tags: ["Settings / Preferences"] },
    ],
    changes: [
      { date: "Feb 3, 2026", description: "Added crvUSD lending markets overview", type: "New Feature" },
      { date: "Jan 18, 2026", description: "Redesigned pool selector with yield comparison", type: "Redesign" },
      { date: "Jan 5, 2026", description: "Updated swap router with multi-hop visualization", type: "Layout Shift" },
    ],
    accentColor: "#ff0000",
  },
  {
    slug: "1inch",
    name: "1inch",
    category: "DeFi",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Token List", "Settings"],
    styles: ["Dark Mode", "Neon Accents", "Gradient-Rich"],
    description: "Multi-chain DEX aggregator",
    website: "https://1inch.io",
    screenCount: 31,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Send", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#1b314f",
  },
  {
    slug: "dydx",
    name: "dYdX",
    category: "DeFi",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Portfolio", "Settings"],
    styles: ["Dark Mode", "Data Dense", "Neon Accents"],
    description: "Decentralized perpetuals exchange",
    website: "https://dydx.exchange",
    screenCount: 36,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#6966ff",
  },
  {
    slug: "hyperliquid",
    name: "Hyperliquid",
    category: "DeFi",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Trade View", "Charts", "Markets", "Portfolio", "Settings"],
    styles: ["Dark Mode", "Data Dense", "Minimal"],
    description: "High-performance perpetuals DEX on L1",
    website: "https://hyperliquid.xyz",
    screenCount: 29,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#6beca1",
  },

  // ─── BASIC LISTINGS — BRIDGES ──────────────────────────────────
  {
    slug: "layerswap",
    name: "LayerSwap",
    category: "Bridge",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Bridge", "Settings"],
    styles: ["Dark Mode", "Minimal", "Glassmorphism"],
    description: "Cross-chain bridge and CEX-to-L2 transfers",
    website: "https://www.layerswap.io",
    screenCount: 19,
    lastUpdated: "Feb 3, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#ff0093",
  },
  {
    slug: "wormhole",
    name: "Wormhole",
    category: "Bridge",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Bridge", "Settings"],
    styles: ["Dark Mode", "Gradient-Rich", "Neon Accents"],
    description: "Cross-chain messaging and token bridge",
    website: "https://wormhole.com",
    screenCount: 17,
    lastUpdated: "Feb 2, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#0063f5",
  },
  {
    slug: "stargate",
    name: "Stargate",
    category: "Bridge",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Bridge", "Settings"],
    styles: ["Dark Mode", "Minimal", "Glassmorphism"],
    description: "Omnichain liquidity transport protocol",
    website: "https://stargate.finance",
    screenCount: 18,
    lastUpdated: "Feb 2, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#ffffff",
  },

  // ─── BASIC LISTINGS — NFT ──────────────────────────────────────
  {
    slug: "opensea",
    name: "OpenSea",
    category: "NFT",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "NFT Gallery", "Markets", "Onboarding", "Settings"],
    styles: ["Clean / Corporate", "Card-Heavy"],
    description: "Largest NFT marketplace",
    website: "https://opensea.io",
    screenCount: 45,
    lastUpdated: "Feb 6, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#2081e2",
  },
  {
    slug: "blur",
    name: "Blur",
    category: "NFT",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "NFT Gallery", "Markets", "Charts", "Settings"],
    styles: ["Dark Mode", "Data Dense", "Neon Accents"],
    description: "Pro NFT marketplace for traders",
    website: "https://blur.io",
    screenCount: 32,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#ff6b00",
  },
  {
    slug: "magic-eden",
    name: "Magic Eden",
    category: "NFT",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "NFT Gallery", "Markets", "Onboarding", "Settings"],
    styles: ["Dark Mode", "Card-Heavy", "Gradient-Rich"],
    description: "Multi-chain NFT marketplace",
    website: "https://magiceden.io",
    screenCount: 37,
    lastUpdated: "Feb 5, 2026",
    detailed: false,
    flows: ["Home", "Onboarding", "Swap", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#e42575",
  },

  // ─── BASIC LISTINGS — ANALYTICS ────────────────────────────────
  {
    slug: "debank",
    name: "DeBank",
    category: "Analytics",
    chains: ["Multi-chain"],
    platforms: ["Web"],
    sections: ["Dashboard", "Portfolio", "Charts", "Settings"],
    styles: ["Dark Mode", "Data Dense", "Card-Heavy"],
    description: "DeFi portfolio tracker and social platform",
    website: "https://debank.com",
    screenCount: 40,
    lastUpdated: "Feb 7, 2026",
    detailed: false,
    flows: ["Home", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#fe815f",
  },
  {
    slug: "etherscan",
    name: "Etherscan",
    category: "Analytics",
    chains: ["Ethereum"],
    platforms: ["Web"],
    sections: ["Dashboard", "Charts", "Token List", "Settings"],
    styles: ["Clean / Corporate", "Data Dense"],
    description: "Ethereum blockchain explorer and analytics",
    website: "https://etherscan.io",
    screenCount: 35,
    lastUpdated: "Feb 7, 2026",
    detailed: false,
    flows: ["Home", "Settings"],
    screens: [],
    changes: [],
    accentColor: "#21325b",
  },
];

// Computed stats
export const TOTAL_APPS = apps.length;
export const TOTAL_SCREENS = apps.reduce((sum, app) => sum + app.screenCount, 0);
export const TOTAL_FLOWS = apps.reduce((sum, app) => sum + app.flows.length, 0);

// Helpers for dynamic counts
export function getAllSections(): { section: SectionType; count: number }[] {
  return SECTION_TYPES.map((section) => ({
    section,
    count: apps.filter((a) => a.sections.includes(section)).length,
  })).filter((s) => s.count > 0);
}

export function getAllStyles(): { style: StyleType; count: number }[] {
  return STYLE_TYPES.map((style) => ({
    style,
    count: apps.filter((a) => a.styles.includes(style)).length,
  })).filter((s) => s.count > 0);
}

export function getAllPlatforms(): { platform: PlatformType; count: number }[] {
  return PLATFORM_TYPES.map((platform) => ({
    platform,
    count: apps.filter((a) => a.platforms.includes(platform)).length,
  })).filter((p) => p.count > 0);
}

export function getAllCategories(): { category: AppCategory; count: number }[] {
  return CATEGORIES.map((category) => ({
    category,
    count: apps.filter((a) => a.category === category).length,
  })).filter((c) => c.count > 0);
}
