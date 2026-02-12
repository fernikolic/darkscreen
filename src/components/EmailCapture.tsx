"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EmailCaptureProps {
  variant?: "primary" | "secondary" | "inline";
  source?: string;
}

export function EmailCapture({ variant = "primary", source = "unknown" }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      await addDoc(collection(db, "waitlist"), {
        email,
        source,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-accent-emerald" />
        <p className="text-body-sm font-medium text-accent-emerald">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      </div>
    );
  }

  const isPrimary = variant === "primary";

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="min-w-0 flex-1 rounded-xl border border-dark-border bg-dark-card/80 px-4 py-3 text-body-sm text-text-primary placeholder-text-ghost outline-none transition-all duration-300 focus:border-accent-blue/30 focus:bg-dark-card focus:shadow-glow"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`shrink-0 rounded-xl px-6 py-3 text-body-sm font-semibold transition-all duration-300 disabled:opacity-50 ${
          isPrimary
            ? "bg-accent-blue text-dark-bg hover:shadow-glow-lg"
            : "border border-dark-border bg-dark-card text-text-secondary hover:border-accent-blue/20 hover:text-text-primary"
        }`}
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:0.2s]" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:0.4s]" />
          </span>
        ) : (
          "Get Access"
        )}
      </button>
      {status === "error" && (
        <p className="absolute -bottom-6 left-0 text-[11px] text-red-400">
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}
