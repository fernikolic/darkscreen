"use client";

import { useState, useRef, useEffect } from "react";
import { type EnrichedScreen } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";
import { copyImageToClipboard, useClipboardSupport } from "@/lib/clipboard";
import { useToast } from "@/contexts/ToastContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { canExportFigma } from "@/lib/access";

interface ExportMenuProps {
  screen?: EnrichedScreen;
  flowScreens?: EnrichedScreen[];
  imageUrl?: string;
  filename?: string;
  onCopyStart?: () => void;
  onCopyEnd?: () => void;
  className?: string;
}

export function ExportMenu({
  screen,
  flowScreens,
  imageUrl,
  filename,
  className = "",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canCopy = useClipboardSupport();
  const { showToast } = useToast();
  const { plan } = useSubscription();
  const hasFigmaAccess = canExportFigma(plan);

  const resolvedImageUrl = imageUrl || (screen?.image ? screenshotUrl(screen.image) : undefined);
  const resolvedFilename =
    filename ||
    (screen ? `${screen.appSlug}-${screen.flow}-step${screen.step}.png` : "screenshot.png");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function handleCopy() {
    if (!resolvedImageUrl) return;
    setExporting(true);
    try {
      await copyImageToClipboard(resolvedImageUrl);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy", "error");
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }

  async function handleFlowStrip(orientation: "horizontal" | "vertical") {
    if (!flowScreens || flowScreens.length === 0) return;
    setExporting(true);
    try {
      const { downloadFlowAsStrip } = await import("@/lib/flow-strip");
      const name = `${flowScreens[0].appSlug}-${flowScreens[0].flow}-strip.png`;
      await downloadFlowAsStrip(flowScreens, orientation, name);
      showToast("Flow strip downloaded");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }

  async function handleFigmaExport() {
    if (!flowScreens || flowScreens.length === 0) return;
    if (!hasFigmaAccess) {
      showToast("Upgrade to Pro for Figma export", "error");
      return;
    }
    setExporting(true);
    try {
      const { downloadFigmaJSON } = await import("@/lib/figma-export");
      const name = `${flowScreens[0].appSlug}-${flowScreens[0].flow}-figma.json`;
      downloadFigmaJSON(flowScreens, name);
      showToast("Figma JSON downloaded");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }

  async function handleMetadataExport() {
    if (!flowScreens || flowScreens.length === 0) return;
    setExporting(true);
    try {
      const { downloadMetadataJSON } = await import("@/lib/figma-export");
      const name = `${flowScreens[0].appSlug}-${flowScreens[0].flow}-metadata.json`;
      downloadMetadataJSON(flowScreens, name);
      showToast("Metadata exported");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }

  async function handleZipExport() {
    if (!flowScreens || flowScreens.length === 0) return;
    setExporting(true);
    try {
      const { downloadScreensAsZip } = await import("@/lib/batch-export");
      const name = `${flowScreens[0].appSlug}-${flowScreens[0].flow}.zip`;
      await downloadScreensAsZip(flowScreens, name);
      showToast("ZIP downloaded");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="flex items-center gap-1 text-[13px] text-text-tertiary transition-colors hover:text-white disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "Export"}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] border border-dark-border bg-dark-card shadow-lg">
          {/* Single image actions */}
          {resolvedImageUrl && (
            <>
              <a
                href={resolvedImageUrl}
                download={resolvedFilename}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                Download PNG
              </a>
              {canCopy && (
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
                >
                  Copy to clipboard
                </button>
              )}
            </>
          )}

          {/* Flow-level actions */}
          {flowScreens && flowScreens.length > 1 && (
            <>
              <div className="mx-3 my-1 border-t border-dark-border" />
              <button
                onClick={() => handleFlowStrip("horizontal")}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                Flow strip (horizontal)
              </button>
              <button
                onClick={() => handleFlowStrip("vertical")}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                Flow strip (vertical)
              </button>
              <button
                onClick={handleFigmaExport}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors hover:bg-dark-hover ${
                  hasFigmaAccess
                    ? "text-text-secondary hover:text-text-primary"
                    : "text-text-tertiary"
                }`}
              >
                Figma JSON {!hasFigmaAccess && <span className="text-[9px]">(Pro)</span>}
              </button>
              <button
                onClick={handleMetadataExport}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                Metadata JSON
              </button>
              <button
                onClick={handleZipExport}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-text-secondary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                Download as ZIP
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
