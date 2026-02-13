"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { CollectionsProvider } from "@/contexts/CollectionsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <CollectionsProvider>
          <BookmarksProvider>{children}</BookmarksProvider>
        </CollectionsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
