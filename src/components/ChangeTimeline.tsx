import { type AppChange, type ChangeType } from "@/data/apps";

const TYPE_STYLES: Record<ChangeType, string> = {
  "New Feature": "text-emerald-400",
  Redesign: "text-white",
  "Copy Change": "text-amber-400",
  "Layout Shift": "text-text-secondary",
  Removed: "text-red-400",
};

interface ChangeTimelineProps {
  changes: AppChange[];
}

export function ChangeTimeline({ changes }: ChangeTimelineProps) {
  if (changes.length === 0) return null;

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
        History
      </p>
      <h2 className="mb-8 font-heading font-semibold text-xl text-text-primary">
        Change Timeline
      </h2>
      <div className="space-y-0">
        {changes.map((change, idx) => {
          const textColor = TYPE_STYLES[change.type];
          return (
            <div key={idx} className="relative flex gap-5 pb-8 last:pb-0">
              {/* Timeline line */}
              {idx < changes.length - 1 && (
                <div className="absolute left-[5px] top-4 h-full w-px bg-dark-border" />
              )}

              {/* Dot */}
              <div className="relative mt-2 h-[11px] w-[11px] flex-shrink-0 rounded-full border border-dark-border bg-dark-card" />

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {change.date}
                  </span>
                  <span className={`text-[11px] font-medium ${textColor}`}>
                    {change.type}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
                  {change.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
