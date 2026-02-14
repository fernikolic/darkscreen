import { type TechStackEntry } from "@/data/apps";

interface TechStackBadgesProps {
  techStack: TechStackEntry[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Framework:        { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  CSS:              { bg: "bg-cyan-500/10",     text: "text-cyan-400",    border: "border-cyan-500/20" },
  Analytics:        { bg: "bg-green-500/10",    text: "text-green-400",   border: "border-green-500/20" },
  "Error Tracking": { bg: "bg-red-500/10",      text: "text-red-400",     border: "border-red-500/20" },
  Support:          { bg: "bg-yellow-500/10",   text: "text-yellow-400",  border: "border-yellow-500/20" },
  Wallet:           { bg: "bg-purple-500/10",   text: "text-purple-400",  border: "border-purple-500/20" },
  CDN:              { bg: "bg-orange-500/10",   text: "text-orange-400",  border: "border-orange-500/20" },
  Privacy:          { bg: "bg-zinc-500/10",     text: "text-zinc-400",    border: "border-zinc-500/20" },
};

const DEFAULT_COLOR = { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };

export function TechStackBadges({ techStack }: TechStackBadgesProps) {
  if (techStack.length === 0) {
    return (
      <div className="rounded-lg border border-dark-border bg-dark-card px-8 py-16 text-center">
        <p className="text-[14px] text-text-tertiary">
          No tech stack data detected yet. Run the crawler to fingerprint technologies.
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = new Map<string, TechStackEntry[]>();
  for (const entry of techStack) {
    if (!grouped.has(entry.category)) grouped.set(entry.category, []);
    grouped.get(entry.category)!.push(entry);
  }

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([category, entries]) => {
        const colors = CATEGORY_COLORS[category] || DEFAULT_COLOR;
        return (
          <div key={category}>
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              {category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {entries.map((entry) => (
                <span
                  key={entry.name}
                  className={`rounded-full border px-3 py-1 text-[12px] font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                  title={entry.evidence}
                >
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
