interface PlaceholderScreenProps {
  color: string;
  label: string;
  appName?: string;
  className?: string;
  aspect?: "mobile" | "desktop";
}

export function PlaceholderScreen({
  color,
  label,
  appName,
  className = "",
  aspect = "mobile",
}: PlaceholderScreenProps) {
  const aspectClass =
    aspect === "mobile" ? "aspect-[9/16]" : "aspect-[16/10]";

  return (
    <div
      className={`relative ${aspectClass} overflow-hidden rounded-lg border ${className}`}
      style={{
        background: `linear-gradient(145deg, ${color}12, ${color}28)`,
        borderColor: `${color}25`,
      }}
    >
      {/* Fake UI elements */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: `${color}15` }}
      >
        <div className="h-2 w-12 rounded-full" style={{ background: `${color}30` }} />
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full" style={{ background: `${color}25` }} />
          <div className="h-2 w-2 rounded-full" style={{ background: `${color}25` }} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex h-full flex-col items-center justify-center p-4">
        {appName && (
          <span
            className="mb-1 font-mono text-[10px] font-medium uppercase tracking-widest"
            style={{ color: `${color}90` }}
          >
            {appName}
          </span>
        )}
        <span className="text-center text-xs text-zinc-500">{label}</span>
      </div>

      {/* Fake bottom nav */}
      {aspect === "mobile" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t px-4 py-2"
          style={{ borderColor: `${color}15` }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 w-6 rounded-full"
              style={{ background: `${color}${i === 1 ? "40" : "18"}` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
