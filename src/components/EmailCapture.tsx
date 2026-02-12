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
      <p className="text-[13px] font-medium text-accent-gold">
        You&apos;re on the list.
      </p>
    );
  }

  const isPrimary = variant === "primary";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="min-w-0 flex-1 border-b border-dark-border bg-transparent px-0 py-2.5 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`shrink-0 py-2.5 text-[13px] font-medium transition-all disabled:opacity-60 ${
          isPrimary
            ? "border-b border-accent-gold text-accent-gold hover:border-accent-gold/60"
            : "border-b border-dark-border text-text-secondary hover:border-text-secondary hover:text-text-primary"
        }`}
      >
        {status === "loading" ? "..." : "Get Access"}
      </button>
      {status === "error" && (
        <p className="absolute mt-12 text-xs text-red-400">Something went wrong.</p>
      )}
    </form>
  );
}
