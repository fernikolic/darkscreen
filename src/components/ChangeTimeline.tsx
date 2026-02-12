import { type AppChange, type ChangeType } from "@/data/apps";

const TYPE_STYLES: Record<ChangeType, { border: string; bg: string; text: string }> = {
  "New Feature": { border: "border-emerald-500/20", bg: "bg-emerald-500/8", text: "text-emerald-400" },
  Redesign: { border: "border-accent-blue/20", bg: "bg-accent-blue/8", text: "text-accent-blue" },
  "Copy Change": { border: "border-amber-500/20", bg: "bg-amber-500/8", text: "text-amber-400" },
  "Layout Shift": { border: "border-accent-purple/20", bg: "bg-accent-purple/8", text: "text-accent-purple" },
  Removed: { border: "border-red-500/20", bg: "bg-red-500/8", text: "text-red-400" },
};

interface ChangeTimelineProps {
  changes: AppChange[];
}

export function ChangeTimeline({ changes }: ChangeTimelineProps) {
  if (changes.length === 0) return null;

  return (
    <div>
      <h2 className="mb-8 font-display text-display-sm text-text-primary">Change History</h2>
      <div className="space-y-0">
        {changes.map((change, idx) => {
          const style = TYPE_STYLES[change.type];
          return (
            <div key={idx} className="group relative flex gap-5 pb-8 last:pb-0">
              {/* Timeline line */}
              {idx < changes.length - 1 && (
                <div className="absolute left-[7px] top-5 h-full w-px bg-dark-border/40" />
              )}

              {/* Dot */}
              <div className="relative mt-2 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-dark-border bg-dark-card transition-colors group-hover:border-accent-blue/40" />

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[11px] text-text-ghost">
                    {change.date}
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-medium ${style.border} ${style.bg} ${style.text}`}
                  >
                    {change.type}
                  </span>
                </div>
                <p className="mt-1.5 text-body-sm text-text-secondary">
                  {change.description}
                </p>
                <button className="mt-1.5 text-[11px] text-text-ghost transition-colors hover:text-accent-blue">
                  View diff &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
