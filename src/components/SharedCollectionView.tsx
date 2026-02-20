"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllScreens, type EnrichedScreen } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";

interface SharedCollection {
  name: string;
  screens: string[];
  notes?: Record<string, string>;
  ownerId: string;
}

export function SharedCollectionView() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedCollection | null>(null);

  useEffect(() => {
    if (!shareId) {
      setError("No collection ID provided");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const docRef = doc(db, "sharedCollections", shareId!);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError("Collection not found or has been unshared");
        } else {
          setSharedData(snap.data() as SharedCollection);
        }
      } catch {
        setError("Failed to load collection");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shareId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-text-tertiary">Loading collection...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px] text-text-tertiary">{error || "Collection not found"}</p>
        <Link
          href="/library"
          className="mt-4 inline-block text-[13px] text-white transition-colors hover:text-white/80"
        >
          Browse the library &rarr;
        </Link>
      </div>
    );
  }

  const allScreens = getAllScreens();
  const screenMap = new Map<string, EnrichedScreen>();
  for (const s of allScreens) {
    if (s.image) screenMap.set(s.image, s);
  }

  return (
    <div>
      <div className="mb-10">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
          Shared Collection
        </p>
        <h2 className="font-heading text-2xl font-bold text-text-primary">
          {sharedData.name}
        </h2>
        <p className="mt-2 font-mono text-[11px] text-text-tertiary">
          {sharedData.screens.length} screen{sharedData.screens.length !== 1 ? "s" : ""}
        </p>
      </div>

      {sharedData.screens.length === 0 ? (
        <p className="py-10 text-[14px] text-text-tertiary">
          This collection is empty.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sharedData.screens.map((img) => {
            const screen = screenMap.get(img);
            const noteKey = img.replace(/\//g, "__");
            const note = sharedData.notes?.[noteKey];

            return (
              <div key={img} className="border border-dark-border bg-dark-card">
                <div className="relative aspect-[16/10] overflow-hidden bg-dark-bg">
                  <Image
                    src={screenshotUrl(img) || img}
                    alt={screen?.label || "Shared screen"}
                    fill
                    className="object-cover object-top"
                    sizes="300px"
                  />
                </div>
                <div className="p-3">
                  {screen ? (
                    <>
                      <Link
                        href={`/library/${screen.appSlug}`}
                        className="text-[12px] font-medium text-text-primary transition-colors hover:text-white"
                      >
                        {screen.appName}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-text-tertiary">
                        {screen.flow} &middot; {screen.label}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-text-tertiary">Unknown screen</p>
                  )}
                  {note && (
                    <p className="mt-2 text-[10px] italic text-text-tertiary">
                      {note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
