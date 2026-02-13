"use client";

import { type AppChange } from "@/data/apps";
import { ChangeTimeline } from "./ChangeTimeline";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { canViewChangeHistory } from "@/lib/access";
import { PaywallOverlay } from "./PaywallOverlay";

interface GatedChangeTimelineProps {
  changes: AppChange[];
  appName: string;
}

export function GatedChangeTimeline({ changes, appName }: GatedChangeTimelineProps) {
  const { plan } = useSubscription();

  if (!canViewChangeHistory(plan)) {
    return (
      <div className="relative">
        {/* Show first entry as a teaser */}
        {changes.length > 0 && (
          <div className="opacity-50">
            <ChangeTimeline changes={changes.slice(0, 1)} />
          </div>
        )}
        <PaywallOverlay
          message={`Upgrade to Pro to see the full change history for ${appName}.`}
        />
      </div>
    );
  }

  return <ChangeTimeline changes={changes} />;
}
