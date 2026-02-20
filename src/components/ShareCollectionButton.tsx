"use client";

import { useState } from "react";
import { useCollections } from "@/contexts/CollectionsContext";
import { useToast } from "@/contexts/ToastContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getShareLimit } from "@/lib/access";

interface ShareCollectionButtonProps {
  collectionId: string;
}

export function ShareCollectionButton({ collectionId }: ShareCollectionButtonProps) {
  const { collections, shareCollection, unshareCollection } = useCollections();
  const { showToast } = useToast();
  const { plan } = useSubscription();
  const [sharing, setSharing] = useState(false);

  const col = collections.find((c) => c.id === collectionId);
  if (!col) return null;

  const isShared = !!col.shareId;
  const shareLimit = getShareLimit(plan);
  const sharedCount = collections.filter((c) => c.shareId).length;
  const canShare = shareLimit === null || sharedCount < shareLimit;

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      if (isShared) {
        await unshareCollection(collectionId);
        showToast("Collection is now private");
      } else {
        if (!canShare) {
          showToast("Upgrade to Pro for unlimited shared collections", "error");
          return;
        }
        const shareId = await shareCollection(collectionId);
        if (shareId) {
          const url = `${window.location.origin}/shared?id=${shareId}`;
          await navigator.clipboard.writeText(url);
          showToast("Share link copied to clipboard");
        }
      }
    } catch {
      showToast("Failed to share", "error");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyLink() {
    if (!col?.shareId) return;
    const url = `${window.location.origin}/shared?id=${col.shareId}`;
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`text-[11px] transition-colors ${
          isShared
            ? "text-cyan-400 hover:text-cyan-300"
            : "text-text-tertiary hover:text-text-secondary"
        } disabled:opacity-50`}
      >
        {sharing ? "..." : isShared ? "Shared" : "Share"}
      </button>
      {isShared && (
        <button
          onClick={handleCopyLink}
          className="text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
        >
          Copy link
        </button>
      )}
    </div>
  );
}
