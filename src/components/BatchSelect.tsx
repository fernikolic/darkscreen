"use client";

import { useState, useCallback } from "react";
import { type EnrichedScreen } from "@/data/helpers";
import { downloadScreensAsZip } from "@/lib/batch-export";
import { useToast } from "@/contexts/ToastContext";

interface BatchSelectProps {
  screens: EnrichedScreen[];
  children: (props: {
    isSelectMode: boolean;
    selectedCount: number;
    isSelected: (screen: EnrichedScreen) => boolean;
    toggleSelect: (screen: EnrichedScreen) => void;
    toggleSelectMode: () => void;
  }) => React.ReactNode;
}

function screenKey(s: EnrichedScreen): string {
  return `${s.appSlug}-${s.flow}-${s.step}`;
}

export function BatchSelect({ screens, children }: BatchSelectProps) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) setSelected(new Set()); // Clear on exit
      return !prev;
    });
  }, []);

  const toggleSelect = useCallback((screen: EnrichedScreen) => {
    const key = screenKey(screen);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isSelected = useCallback(
    (screen: EnrichedScreen) => selected.has(screenKey(screen)),
    [selected]
  );

  const handleDownloadZip = useCallback(async () => {
    if (selected.size === 0) return;
    setIsExporting(true);
    try {
      const selectedScreens = screens.filter((s) => selected.has(screenKey(s)));
      await downloadScreensAsZip(selectedScreens);
      showToast(`Downloaded ${selectedScreens.length} screenshots`);
    } catch {
      showToast("Export failed", "error");
    } finally {
      setIsExporting(false);
    }
  }, [selected, screens, showToast]);

  const selectAll = useCallback(() => {
    setSelected(new Set(screens.map(screenKey)));
  }, [screens]);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  return (
    <div>
      {/* Toggle button */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={toggleSelectMode}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
            isSelectMode
              ? "border-white/40 bg-white/10 text-white"
              : "border-dark-border text-text-tertiary hover:border-text-tertiary hover:text-text-secondary"
          }`}
        >
          {isSelectMode ? "Cancel Select" : "Select"}
        </button>

        {isSelectMode && (
          <>
            <button
              onClick={selectAll}
              className="text-[11px] text-text-tertiary hover:text-text-secondary"
            >
              Select All
            </button>
            {selected.size > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] text-text-tertiary hover:text-text-secondary"
              >
                Clear ({selected.size})
              </button>
            )}
          </>
        )}
      </div>

      {/* Render children with selection state */}
      {children({ isSelectMode, selectedCount: selected.size, isSelected, toggleSelect, toggleSelectMode })}

      {/* Bottom action bar */}
      {isSelectMode && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-dark-border bg-dark-bg/95 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="font-mono text-[12px] text-text-secondary">
              {selected.size} screen{selected.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadZip}
                disabled={isExporting}
                className="flex items-center gap-2 border border-white/60 bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                {isExporting ? "Exporting..." : `Download ZIP (${selected.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
