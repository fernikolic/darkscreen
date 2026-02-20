"use client";

import { useState } from "react";
import { copyImageToClipboard, useClipboardSupport } from "@/lib/clipboard";
import { useToast } from "@/contexts/ToastContext";

interface ScreenActionsProps {
  imageUrl: string;
  filename: string;
}

export function ScreenActions({ imageUrl, filename }: ScreenActionsProps) {
  const canCopy = useClipboardSupport();
  const { showToast } = useToast();
  const [copying, setCopying] = useState(false);
  const [showMore, setShowMore] = useState(false);

  async function handleCopy() {
    if (copying) return;
    setCopying(true);
    try {
      await copyImageToClipboard(imageUrl);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy", "error");
    } finally {
      setCopying(false);
    }
  }

  async function handleMetadata() {
    try {
      const metadata = { imageUrl, filename, exportedAt: new Date().toISOString(), source: "Darkscreens" };
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(".png", "-metadata.json");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Metadata exported");
    } catch {
      showToast("Export failed", "error");
    }
    setShowMore(false);
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        {canCopy && (
          <button
            onClick={handleCopy}
            disabled={copying}
            className="flex-1 border border-dark-border py-2.5 text-center text-[12px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-50"
          >
            {copying ? "Copying..." : "Copy"}
          </button>
        )}
        <a
          href={imageUrl}
          download={filename}
          className="flex-1 border border-dark-border py-2.5 text-center text-[12px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
        >
          Download
        </a>
      </div>
      <button
        onClick={() => setShowMore(!showMore)}
        className="w-full text-center text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        {showMore ? "Less" : "More export options"}
      </button>
      {showMore && (
        <div className="space-y-1">
          <button
            onClick={handleMetadata}
            className="w-full border border-dark-border py-2 text-center text-[11px] text-text-tertiary transition-colors hover:border-text-tertiary hover:text-text-secondary"
          >
            Export metadata JSON
          </button>
        </div>
      )}
    </div>
  );
}
