"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import type { PlanId } from "@/lib/stripe";

interface SubscriptionContextValue {
  plan: PlanId;
  loading: boolean;
  isPro: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: "free",
  loading: true,
  isPro: false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        const data = snap.data();
        setPlan((data?.plan as PlanId) || "free");
        setLoading(false);
      },
      () => {
        setPlan("free");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const isPro = plan === "pro" || plan === "team";

  return (
    <SubscriptionContext.Provider value={{ plan, loading, isPro }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
