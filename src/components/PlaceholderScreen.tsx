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
      className={`relative ${aspectClass} overflow-hidden border border-dark-border bg-dark-bg ${className}`}
    >
      {/* Minimal top bar */}
      <div className="absolute inset-x-0 top-0 border-b border-dark-border px-3 py-2">
        <div className="h-px w-10 bg-text-tertiary/30" />
      </div>

      {/* Content area */}
      <div className="flex h-full flex-col items-center justify-center p-4">
        {appName && (
          <span className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
            {appName}
          </span>
        )}
        <span className="text-center text-[11px] text-text-tertiary">
          {label}
        </span>
      </div>

      {/* Minimal bottom bar */}
      {aspect === "mobile" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center border-t border-dark-border py-2">
          <div className="h-px w-8 bg-text-tertiary/20" />
        </div>
      )}
    </div>
  );
}
