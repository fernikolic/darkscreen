import { type AppChange, type ChangeType } from "@/data/apps";

const TYPE_STYLES: Record<ChangeType, { bg: string; text: string }> = {
  "New Feature": { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  Redesign: { bg: "bg-accent-blue/10", text: "text-accent-blue" },
  "Copy Change": { bg: "bg-amber-500/10", text: "text-amber-400" },
  "Layout Shift": { bg: "bg-accent-purple/10", text: "text-accent-purple" },
  Removed: { bg: "bg-red-500/10", text: "text-red-400" },
};

interface ChangeTimelineProps {
  changes: AppChange[];
}

export function ChangeTimeline({ changes }: ChangeTimelineProps) {
  if (changes.length === 0) return null;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">Change History</h2>
      <div className="space-y-0">
        {changes.map((change, idx) => {
          const style = TYPE_STYLES[change.type];
          return (
            <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Timeline line */}
              {idx < changes.length - 1 && (
                <div className="absolute left-[7px] top-4 h-full w-px bg-dark-border" />
              )}

              {/* Dot */}
              <div className="relative mt-1.5 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-dark-border bg-dark-card" />

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500">
                    {change.date}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                  >
                    {change.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-300">
                  {change.description}
                </p>
                <button className="mt-1 text-xs text-zinc-600 transition-colors hover:text-accent-blue">
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
