"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { CollectionsProvider } from "@/contexts/CollectionsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CollectionsProvider>
        <BookmarksProvider>{children}</BookmarksProvider>
      </CollectionsProvider>
    </AuthProvider>
  );
}
