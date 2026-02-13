"use client";

import { type ReactNode, useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { wagmiConfig } from "@/lib/wallet-config";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { CollectionsProvider } from "@/contexts/CollectionsContext";
import { SignInModal } from "@/components/SignInModal";

const queryClient = new QueryClient();

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export function Providers({ children }: { children: ReactNode }) {
  const solanaWallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SolanaConnectionProvider endpoint={SOLANA_RPC}>
          <SolanaWalletProvider wallets={solanaWallets} autoConnect={false}>
            <AuthProvider>
              <CollectionsProvider>
                <BookmarksProvider>
                  {children}
                  <SignInModal />
                </BookmarksProvider>
              </CollectionsProvider>
            </AuthProvider>
          </SolanaWalletProvider>
        </SolanaConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
