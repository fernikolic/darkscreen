"use client";

import { useState } from "react";
import { apps, type FlowType, FLOW_TYPES } from "@/data/apps";
import { getAllFlows, type EnrichedScreen } from "@/data/helpers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { canBatchExport } from "@/lib/access";
import { useToast } from "@/contexts/ToastContext";

type ExportFormat = "zip" | "strip-h" | "strip-v" | "figma" | "metadata";

export function BatchExportPanel() {
  const [scope, setScope] = useState<"app" | "flow">("app");
  const [selectedApp, setSelectedApp] = useState(apps[0]?.slug || "");
  const [selectedFlow, setSelectedFlow] = useState<FlowType>("Home");
  const [format, setFormat] = useState<ExportFormat>("zip");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { plan } = useSubscription();
  const canExport = canBatchExport(plan);
  const { showToast } = useToast();

  const detailedApps = apps.filter((a) => a.detailed && a.screens.length > 0);

  async function handleExport() {
    if (!canExport) {
      showToast("Upgrade to Pro for batch export", "error");
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      let screens: EnrichedScreen[] = [];

      if (scope === "app") {
        const allFlows = getAllFlows();
        screens = allFlows
          .filter((f) => f.appSlug === selectedApp)
          .flatMap((f) => f.screens);
      } else {
        const allFlows = getAllFlows();
        screens = allFlows
          .filter((f) => f.flowType === selectedFlow)
          .flatMap((f) => f.screens);
      }

      if (screens.length === 0) {
        showToast("No screens to export", "error");
        return;
      }

      setProgress(30);
      const app = apps.find((a) => a.slug === selectedApp);
      const prefix = scope === "app" ? (app?.slug || "export") : selectedFlow.toLowerCase();

      if (format === "zip") {
        const { downloadScreensAsZip } = await import("@/lib/batch-export");
        await downloadScreensAsZip(screens, `${prefix}-screenshots.zip`);
      } else if (format === "strip-h" || format === "strip-v") {
        const { downloadFlowAsStrip } = await import("@/lib/flow-strip");
        const orientation = format === "strip-h" ? "horizontal" : "vertical";
        await downloadFlowAsStrip(screens, orientation, `${prefix}-strip.png`);
      } else if (format === "figma") {
        const { downloadFigmaJSON } = await import("@/lib/figma-export");
        downloadFigmaJSON(screens, `${prefix}-figma.json`);
      } else if (format === "metadata") {
        const { downloadMetadataJSON } = await import("@/lib/figma-export");
        downloadMetadataJSON(screens, `${prefix}-metadata.json`);
      }

      setProgress(100);
      showToast("Export complete");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }

  return (
    <div className="border border-dark-border bg-dark-card p-5">
      <h3 className="mb-4 text-[14px] font-medium text-text-primary">Batch Export</h3>

      {!canExport && (
        <p className="mb-4 text-[12px] text-text-tertiary">
          Batch export requires a Pro plan.
        </p>
      )}

      <div className="space-y-4">
        {/* Scope */}
        <div>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Scope
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setScope("app")}
              className={`border px-3 py-1.5 text-[11px] transition-all ${
                scope === "app"
                  ? "border-white/20 text-white"
                  : "border-dark-border text-text-tertiary hover:text-text-secondary"
              }`}
            >
              By App
            </button>
            <button
              onClick={() => setScope("flow")}
              className={`border px-3 py-1.5 text-[11px] transition-all ${
                scope === "flow"
                  ? "border-white/20 text-white"
                  : "border-dark-border text-text-tertiary hover:text-text-secondary"
              }`}
            >
              By Flow
            </button>
          </div>
        </div>

        {/* Selection */}
        {scope === "app" ? (
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="w-full border border-dark-border bg-dark-bg px-3 py-2 text-[12px] text-text-primary outline-none"
          >
            {detailedApps.map((app) => (
              <option key={app.slug} value={app.slug}>
                {app.name} ({app.screenCount} screens)
              </option>
            ))}
          </select>
        ) : (
          <select
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(e.target.value as FlowType)}
            className="w-full border border-dark-border bg-dark-bg px-3 py-2 text-[12px] text-text-primary outline-none"
          >
            {FLOW_TYPES.map((flow) => (
              <option key={flow} value={flow}>
                {flow}
              </option>
            ))}
          </select>
        )}

        {/* Format */}
        <div>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
            Format
          </span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className="w-full border border-dark-border bg-dark-bg px-3 py-2 text-[12px] text-text-primary outline-none"
          >
            <option value="zip">ZIP (all PNGs)</option>
            <option value="strip-h">Flow strip (horizontal)</option>
            <option value="strip-v">Flow strip (vertical)</option>
            <option value="figma">Figma JSON</option>
            <option value="metadata">Metadata JSON</option>
          </select>
        </div>

        {/* Progress bar */}
        {exporting && (
          <div className="h-1 w-full bg-dark-border">
            <div
              className="h-full bg-white/60 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={exporting || !canExport}
          className="w-full border border-white/60 bg-white/10 py-2.5 text-[12px] font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : canExport ? "Export" : "Pro Only"}
        </button>
      </div>
    </div>
  );
}
