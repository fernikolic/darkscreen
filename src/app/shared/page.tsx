import type { Metadata } from "next";
import { Suspense } from "react";
import { SharedCollectionView } from "@/components/SharedCollectionView";

export const metadata: Metadata = {
  title: "Shared Collection — Darkscreens",
  description: "View a shared collection of crypto product screenshots.",
  alternates: { canonical: "/shared" },
};

export default function SharedPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <p className="text-[14px] text-text-tertiary">Loading...</p>
          </div>
        }
      >
        <SharedCollectionView />
      </Suspense>
    </div>
  );
}
