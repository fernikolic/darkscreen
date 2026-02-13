"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConnect, useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import {
  evmAuthMessage,
  solanaAuthMessage,
  nostrAuthEvent,
  EVM_WALLETS,
  SOLANA_WALLETS,
  NOSTR_WALLETS,
  type WalletOption,
} from "@/lib/wallet-auth";

type ModalStatus = "idle" | "connecting" | "signing" | "authenticating" | "success" | "error";

interface NostrProvider {
  getPublicKey: () => Promise<string>;
  signEvent: (event: {
    kind: number;
    content: string;
    tags: string[][];
    created_at: number;
  }) => Promise<{ sig: string }>;
}

declare global {
  interface Window {
    nostr?: NostrProvider;
  }
}

/**
 * Outer shell — conditionally mounts the inner component so that
 * wagmi / Solana hooks only execute when the modal is open and the
 * provider tree is guaranteed to be live.
 */
export function SignInModal() {
  const { signInOpen } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !signInOpen) return null;

  return <SignInModalInner />;
}

/* ────────────────────────────────────────────────────────── */

function SignInModalInner() {
  const { closeSignIn, signInWithGoogle, signInWithWallet } = useAuth();
  const [status, setStatus] = useState<ModalStatus>("idle");
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // EVM hooks
  const { connectAsync, connectors } = useConnect();
  const { isConnected: evmConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();

  // Solana hooks
  const solana = useSolanaWallet();

  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSignIn();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [closeSignIn]);

  /* ── EVM wallet flow ──────────────────────────────────── */
  const handleEvmWallet = async (wallet: WalletOption) => {
    setActiveWallet(wallet.id);
    setError(null);

    try {
      if (evmConnected) {
        await disconnectAsync();
      }

      setStatus("connecting");

      // Try dedicated connector first, fall back to generic injected
      const connector = wallet.id === "metaMask"
        ? connectors.find((c) => c.id === "metaMaskSDK") ||
          connectors.find((c) => c.id === "metaMask") ||
          connectors.find((c) => c.id === "injected")
        : connectors.find((c) => c.id === "coinbaseWalletSDK" || c.id === "coinbaseWallet");

      if (!connector) {
        throw new Error(`${wallet.name} not detected. Please install the extension.`);
      }

      const result = await connectAsync({ connector });
      const address = result.accounts[0];

      setStatus("signing");
      const message = evmAuthMessage(address);
      const signature = await signMessageAsync({ message });

      setStatus("authenticating");
      await signInWithWallet("evm", address, signature);

      setStatus("success");
    } catch (err: unknown) {
      console.error("EVM wallet sign-in failed:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
  };

  /* ── Solana wallet flow ───────────────────────────────── */
  const handleSolanaWallet = async (wallet: WalletOption) => {
    setActiveWallet(wallet.id);
    setError(null);

    try {
      setStatus("connecting");

      const adapter = solana.wallets.find((w) =>
        w.adapter.name.toLowerCase().includes(wallet.id.toLowerCase())
      );

      if (!adapter) {
        throw new Error(`${wallet.name} not detected. Please install the extension.`);
      }

      await solana.select(adapter.adapter.name);
      await new Promise((r) => setTimeout(r, 500));

      if (!solana.connected) {
        await solana.connect();
      }

      const publicKey = solana.publicKey;
      if (!publicKey) {
        throw new Error("Could not get public key from wallet");
      }

      setStatus("signing");
      const message = solanaAuthMessage(publicKey.toBase58());
      const encoded = new TextEncoder().encode(message);

      if (!solana.signMessage) {
        throw new Error("Wallet does not support message signing");
      }

      const signatureBytes = await solana.signMessage(encoded);
      const signature = Array.from(signatureBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      setStatus("authenticating");
      await signInWithWallet("solana", publicKey.toBase58(), signature);

      setStatus("success");
    } catch (err: unknown) {
      console.error("Solana wallet sign-in failed:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
  };

  /* ── Nostr (Alby) flow ────────────────────────────────── */
  const waitForNostr = async (retries = 5, delay = 300): Promise<NonNullable<typeof window.nostr>> => {
    for (let i = 0; i < retries; i++) {
      if (window.nostr) return window.nostr;
      await new Promise((r) => setTimeout(r, delay));
    }
    throw new Error(
      "No Nostr extension detected. Install Alby (getalby.com) or another NIP-07 extension, then reload this page."
    );
  };

  const handleNostrWallet = async () => {
    setActiveWallet("alby");
    setError(null);

    try {
      setStatus("connecting");
      const nostr = await waitForNostr();
      const pubkey = await nostr.getPublicKey();

      setStatus("signing");
      const event = nostrAuthEvent();
      const signed = await nostr.signEvent(event);

      setStatus("authenticating");
      await signInWithWallet("nostr", pubkey, signed.sig);

      setStatus("success");
    } catch (err: unknown) {
      console.error("Nostr sign-in failed:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Nostr sign-in failed");
    }
  };

  /* ── Render ───────────────────────────────────────────── */
  const isWorking = status === "connecting" || status === "signing" || status === "authenticating";

  const statusLabel = (walletId: string) => {
    if (activeWallet !== walletId) return null;
    switch (status) {
      case "connecting": return "Connecting...";
      case "signing": return "Sign the message...";
      case "authenticating": return "Authenticating...";
      case "success": return "Connected!";
      default: return null;
    }
  };

  const walletButton = (
    wallet: WalletOption,
    onClick: () => void,
  ) => {
    const isActive = activeWallet === wallet.id;
    const label = statusLabel(wallet.id);

    return (
      <button
        key={wallet.id}
        onClick={onClick}
        disabled={isWorking}
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-[13px] font-medium transition-all disabled:opacity-40 ${
          isActive && status === "success"
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
            : isActive && status === "error"
              ? "border-red-500/30 bg-red-500/5 text-red-400"
              : "border-dark-border bg-dark-bg text-text-primary hover:border-white/20 hover:bg-dark-card"
        }`}
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d={wallet.icon} />
        </svg>
        <span className="flex-1">{label || wallet.name}</span>
        {isActive && isWorking && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
        )}
      </button>
    );
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={isWorking ? undefined : closeSignIn}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm border border-dark-border bg-dark-card shadow-2xl shadow-black/50 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <p className="text-[14px] font-medium text-text-primary">Sign in to Darkscreen</p>
          <button
            onClick={closeSignIn}
            disabled={isWorking}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-dark-hover hover:text-text-primary disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Google */}
          <button
            onClick={signInWithGoogle}
            disabled={isWorking}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-dark-border" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              or connect a wallet
            </span>
            <div className="h-px flex-1 bg-dark-border" />
          </div>

          {/* Ethereum */}
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Ethereum
            </p>
            <div className="flex flex-col gap-2">
              {EVM_WALLETS.map((w) =>
                walletButton(w, () => handleEvmWallet(w))
              )}
            </div>
          </div>

          {/* Solana */}
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Solana
            </p>
            <div className="flex flex-col gap-2">
              {SOLANA_WALLETS.map((w) =>
                walletButton(w, () => handleSolanaWallet(w))
              )}
            </div>
          </div>

          {/* Bitcoin & Lightning */}
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Bitcoin & Lightning
            </p>
            <div className="flex flex-col gap-2">
              {NOSTR_WALLETS.map((w) =>
                walletButton(w, () => handleNostrWallet())
              )}
            </div>
          </div>

          {/* Error message */}
          {status === "error" && error && (
            <p className="mt-2 text-center text-[12px] text-red-400">{error}</p>
          )}

          {/* Cancel */}
          <button
            onClick={closeSignIn}
            disabled={isWorking}
            className="mt-3 block w-full text-center text-[12px] text-text-tertiary transition-colors hover:text-text-secondary disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
