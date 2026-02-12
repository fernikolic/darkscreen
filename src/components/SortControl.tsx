"use client";

export type SortOption = "newest" | "most-screens" | "a-z" | "z-a";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "most-screens", label: "Most Screens" },
  { value: "a-z", label: "A\u2013Z" },
  { value: "z-a", label: "Z\u2013A" },
];

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
        Sort
      </span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-none border-b-2 px-3 py-2 text-[12px] font-medium transition-all ${
            value === opt.value
              ? "border-text-secondary text-text-primary"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
