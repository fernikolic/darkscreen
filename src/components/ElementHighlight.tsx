"use client";

import { useState } from "react";
import type { DetectedElement } from "@/data/apps";

interface ElementHighlightProps {
  elements: DetectedElement[];
  className?: string;
}

const TAG_COLORS: Record<string, string> = {
  "Token Selector": "#3b82f6",
  "Swap Form": "#22c55e",
  "Price Chart": "#f59e0b",
  "Navigation": "#8b5cf6",
  "Modal / Dialog": "#ec4899",
  "Form / Input": "#06b6d4",
  "Data Table": "#14b8a6",
  "Wallet Connect Button": "#f97316",
  "Transaction Confirmation": "#84cc16",
  "Network Selector": "#a855f7",
};

function getColor(tag: string): string {
  return TAG_COLORS[tag] || "#71717A";
}

/** SVG overlay rendering bounding boxes on screenshots */
export function ElementHighlight({ elements, className = "" }: ElementHighlightProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!elements || elements.length === 0) return null;

  return (
    <svg
      className={`absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ pointerEvents: "none" }}
    >
      {elements.map((el, i) => {
        const color = getColor(el.tag);
        const isHovered = hoveredIdx === i;
        return (
          <g key={i}>
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={isHovered ? `${color}30` : `${color}15`}
              stroke={color}
              strokeWidth={isHovered ? 0.5 : 0.3}
              style={{ pointerEvents: "all", cursor: "pointer" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {isHovered && (
              <foreignObject
                x={Math.min(el.x, 70)}
                y={Math.max(0, el.y - 4)}
                width={30}
                height={4}
              >
                <div
                  style={{
                    background: color,
                    color: "#fff",
                    fontSize: "2px",
                    padding: "0.5px 1px",
                    borderRadius: "0.5px",
                    whiteSpace: "nowrap",
                    lineHeight: 1.4,
                  }}
                >
                  {el.tag}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
