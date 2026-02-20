import Image from "next/image";
import Link from "next/link";
import { type AppFlow } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";

interface FlowComparisonColumnProps {
  flow: AppFlow;
}

export function FlowComparisonColumn({ flow }: FlowComparisonColumnProps) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="sticky top-0 z-10 border-b border-dark-border bg-dark-bg/95 px-3 py-3 backdrop-blur">
        <Link
          href={`/library/${flow.appSlug}`}
          className="text-[14px] font-medium text-text-primary transition-colors hover:text-white"
        >
          {flow.appName}
        </Link>
        <p className="font-mono text-[10px] text-text-tertiary">
          {flow.count} step{flow.count !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-2 p-3">
        {flow.screens.map((screen, i) => (
          <div
            key={`${flow.appSlug}-${screen.step}-${i}`}
            className="overflow-hidden border border-dark-border bg-dark-card"
          >
            <div className="relative aspect-[16/10] bg-dark-bg">
              {screen.image ? (
                <Image
                  src={screenshotUrl(screen.image) || screen.image}
                  alt={`${flow.appName} — ${screen.label}`}
                  fill
                  className="object-contain"
                  sizes="300px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-[10px] text-text-tertiary">{screen.label}</span>
                </div>
              )}
            </div>
            <div className="border-t border-dark-border px-2.5 py-2">
              <p className="text-[11px] text-text-secondary">{screen.label}</p>
              <p className="font-mono text-[9px] text-text-tertiary">Step {screen.step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
