import Link from "next/link";
import Image from "next/image";
import { type PatternWithScreens, type PatternCategory } from "@/data/patterns";
import { screenshotUrl } from "@/lib/screenshot-url";

const CATEGORY_COLORS: Record<PatternCategory, string> = {
  "UX Pattern": "#3b82f6",
  "UI Element": "#22c55e",
  "Flow Pattern": "#f59e0b",
  "Crypto-Specific": "#a855f7",
};

interface PatternCardProps {
  pattern: PatternWithScreens;
}

export function PatternCard({ pattern }: PatternCardProps) {
  const previews = pattern.screens
    .filter((s) => s.image)
    .slice(0, 4);

  return (
    <Link
      href={`/patterns/${pattern.slug}`}
      className="group block border border-dark-border bg-dark-card transition-colors hover:border-text-tertiary"
    >
      {/* 2x2 preview grid */}
      <div className="grid grid-cols-2 gap-px bg-dark-border">
        {previews.map((s, i) => (
          <div key={i} className="relative aspect-[16/10] overflow-hidden bg-dark-bg">
            <Image
              src={screenshotUrl(s.image) || s.image!}
              alt=""
              fill
              className="object-cover object-top"
              sizes="200px"
            />
          </div>
        ))}
        {previews.length < 4 &&
          Array.from({ length: 4 - previews.length }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-[16/10] bg-dark-bg" />
          ))}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-medium text-text-primary group-hover:text-white">
            {pattern.name}
          </h3>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{
              color: CATEGORY_COLORS[pattern.category],
              backgroundColor: `${CATEGORY_COLORS[pattern.category]}15`,
            }}
          >
            {pattern.category}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-text-secondary">
          {pattern.description}
        </p>
        <p className="mt-2 font-mono text-[10px] text-text-tertiary">
          {pattern.screens.length} screen{pattern.screens.length !== 1 ? "s" : ""} &middot;{" "}
          {pattern.appCount} app{pattern.appCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
