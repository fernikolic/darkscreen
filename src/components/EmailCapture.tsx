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
      <p className="text-sm font-medium text-accent-blue">
        You&apos;re on the list. We&apos;ll be in touch.
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
        className="min-w-0 flex-1 rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-accent-blue/50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
          isPrimary
            ? "bg-accent-blue text-dark-bg hover:bg-accent-blue/90 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            : "border border-dark-border bg-dark-card text-zinc-300 hover:border-zinc-600 hover:text-white"
        }`}
      >
        {status === "loading" ? "..." : "Get Access"}
      </button>
      {status === "error" && (
        <p className="absolute mt-12 text-xs text-red-400">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
