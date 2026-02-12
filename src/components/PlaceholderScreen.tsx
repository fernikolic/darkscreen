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
      className={`relative ${aspectClass} overflow-hidden rounded-xl border ${className}`}
      style={{
        background: `linear-gradient(145deg, ${color}08, ${color}18)`,
        borderColor: `${color}15`,
      }}
    >
      {/* Fake UI elements */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: `${color}10` }}
      >
        <div className="h-1.5 w-10 rounded-full" style={{ background: `${color}20` }} />
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: `${color}18` }} />
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: `${color}18` }} />
        </div>
      </div>

      {/* Content area */}
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        {appName && (
          <span
            className="font-mono text-label uppercase"
            style={{ color: `${color}60` }}
          >
            {appName}
          </span>
        )}
        <span className="text-center text-[11px] text-text-ghost">{label}</span>
      </div>

      {/* Fake bottom nav */}
      {aspect === "mobile" && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t px-4 py-2"
          style={{ borderColor: `${color}10` }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-1.5 w-5 rounded-full"
              style={{ background: `${color}${i === 1 ? "30" : "12"}` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
