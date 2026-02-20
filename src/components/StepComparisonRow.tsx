import Image from "next/image";
import { type AppFlow, type EnrichedScreen } from "@/data/helpers";
import { screenshotUrl } from "@/lib/screenshot-url";

interface StepComparisonRowProps {
  stepNumber: number;
  flows: AppFlow[];
}

export function StepComparisonRow({ stepNumber, flows }: StepComparisonRowProps) {
  return (
    <div className="border-b border-dark-border py-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
        Step {stepNumber}
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${flows.length}, 1fr)` }}>
        {flows.map((flow) => {
          const screen: EnrichedScreen | undefined = flow.screens.find(
            (s) => s.step === stepNumber
          );
          return (
            <div key={flow.appSlug} className="min-w-0">
              {screen ? (
                <div className="overflow-hidden border border-dark-border bg-dark-card">
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
                  <div className="border-t border-dark-border px-2.5 py-1.5">
                    <p className="truncate text-[10px] text-text-secondary">{screen.label}</p>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center border border-dashed border-dark-border bg-dark-bg/50">
                  <span className="text-[10px] text-text-tertiary">No step {stepNumber}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
