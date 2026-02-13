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

  return (
    <div className="mt-4 flex gap-2">
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
  );
}
