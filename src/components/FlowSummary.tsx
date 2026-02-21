"use client";

import { screenAnalysis, type ScreenAnalysis } from "@/data/screen-analysis";

interface FlowSummaryProps {
  appSlug: string;
  flowType: string;
  screens: { image?: string; step: number; label: string }[];
}

export function FlowSummary({ appSlug, flowType, screens }: FlowSummaryProps) {
  // Look up analysis for each screen in the flow
  const analysisEntries: ScreenAnalysis[] = [];
  for (const screen of screens) {
    if (screen.image && screenAnalysis[screen.image]) {
      analysisEntries.push(screenAnalysis[screen.image]);
    }
  }

  // If no analysis data exists, render nothing
  if (analysisEntries.length === 0) return null;

  // Step count
  const stepCount = screens.length;

  // Most common screenType across screens
  const typeCounts: Record<string, number> = {};
  for (const a of analysisEntries) {
    if (a.screenType) {
      typeCounts[a.screenType] = (typeCounts[a.screenType] || 0) + 1;
    }
  }
  const dominantType = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  const flowTypeLabel = dominantType
    ? `${dominantType.charAt(0).toUpperCase()}${dominantType.slice(1)}-heavy flow`
    : null;

  // Aggregate unique friction points (top 3)
  const frictionSet = new Set<string>();
  for (const a of analysisEntries) {
    for (const fp of a.frictionPoints) {
      frictionSet.add(fp);
    }
  }
  const topFriction = Array.from(frictionSet).slice(0, 3);

  // Total interactive elements
  let interactiveCount = 0;
  for (const a of analysisEntries) {
    interactiveCount += a.interactiveElements.length;
  }

  // Unique CTA texts
  const ctaSet = new Set<string>();
  for (const a of analysisEntries) {
    for (const cta of a.ctas) {
      if (cta.text) ctaSet.add(cta.text);
    }
  }
  const uniqueCTAs = Array.from(ctaSet).slice(0, 5);

  return (
    <div className="flex flex-wrap items-start gap-4 rounded border border-dark-border bg-[#151518]/50 px-4 py-3 text-[12px]">
      {/* Step count */}
      <div className="flex items-center gap-1.5">
        <span className="rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-[11px] text-text-secondary">
          {stepCount} steps
        </span>
      </div>

      {/* Flow type */}
      {flowTypeLabel && (
        <>
          <div className="hidden h-4 w-px bg-dark-border sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">Type</span>
            <span className="text-text-primary">{flowTypeLabel}</span>
          </div>
        </>
      )}

      {/* Interactive elements */}
      {interactiveCount > 0 && (
        <>
          <div className="hidden h-4 w-px bg-dark-border sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">Interactive</span>
            <span className="font-mono text-text-primary">
              {interactiveCount}
            </span>
          </div>
        </>
      )}

      {/* CTAs */}
      {uniqueCTAs.length > 0 && (
        <>
          <div className="hidden h-4 w-px bg-dark-border sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">CTAs</span>
            <div className="flex flex-wrap gap-1">
              {uniqueCTAs.map((cta) => (
                <span
                  key={cta}
                  className="rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[11px] text-text-secondary"
                >
                  {cta}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Friction points */}
      {topFriction.length > 0 && (
        <>
          <div className="hidden h-4 w-px bg-dark-border sm:block" />
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 text-text-tertiary">Friction</span>
            <div className="flex flex-col gap-0.5">
              {topFriction.map((fp) => (
                <span key={fp} className="text-text-secondary">
                  {fp}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
