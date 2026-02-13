/* ── Wallet auth helpers — zero wagmi dependency ─────────── */

export type WalletChain = "evm" | "solana" | "nostr";

export interface WalletOption {
  id: string;
  name: string;
  chain: WalletChain;
  icon: string; // SVG path data for a 24x24 viewBox
}

/* ── Auth message templates ──────────────────────────────── */

export function evmAuthMessage(address: string) {
  return `Sign in to Darkscreen.\n\nAddress: ${address}`;
}

export function solanaAuthMessage(publicKey: string) {
  return `Sign in to Darkscreen.\n\nAddress: ${publicKey}`;
}

/** Fixed Nostr event for deterministic signing (kind 22242, NIP-42-ish) */
export function nostrAuthEvent() {
  return {
    kind: 22242,
    content: "Darkscreen Auth",
    tags: [] as string[][],
    created_at: 0,
  };
}

/* ── Wallet metadata for UI ──────────────────────────────── */

export const EVM_WALLETS: WalletOption[] = [
  {
    id: "metaMask",
    name: "MetaMask",
    chain: "evm",
    icon: "M20.5 3.5l-8 5.2 1.5-3.5 6.5-1.7zm-17 0l7.9 5.3-1.4-3.6-6.5-1.7zm14.6 12.8l-2.1 3.3 4.5 1.2 1.3-4.4-3.7-.1zm-14.9.1l1.3 4.4 4.5-1.2-2.1-3.3-3.7.1z",
  },
  {
    id: "coinbaseWallet",
    name: "Coinbase Wallet",
    chain: "evm",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7zm-2 4v6h4v-6h-4z",
  },
];

export const SOLANA_WALLETS: WalletOption[] = [
  {
    id: "phantom",
    name: "Phantom",
    chain: "solana",
    icon: "M4 12a8 8 0 018-8h0a8 8 0 018 8v1a1 1 0 01-1 1h-3.5a.5.5 0 00-.5.5v0a2.5 2.5 0 01-5 0v0a.5.5 0 00-.5-.5H6a1 1 0 01-1-1v-1z",
  },
  {
    id: "solflare",
    name: "Solflare",
    chain: "solana",
    icon: "M12 2L2 12l10 10 10-10L12 2zm0 4l6 6-6 6-6-6 6-6z",
  },
];

export const NOSTR_WALLETS: WalletOption[] = [
  {
    id: "alby",
    name: "Alby (Nostr)",
    chain: "nostr",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z",
  },
];

/* ── Helpers ─────────────────────────────────────────────── */

/** Truncate address for display: 0x1234...5678 */
export function truncateAddress(address: string): string {
  if (address.startsWith("npub") || address.startsWith("0x")) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/** SHA-256 hash a string, return hex */
export async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", encoded as ArrayBufferView<ArrayBuffer>);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
