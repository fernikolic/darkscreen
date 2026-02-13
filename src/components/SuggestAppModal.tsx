"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORIES = [
  "Wallet",
  "Exchange",
  "DeFi",
  "Bridge",
  "NFT",
  "Analytics",
] as const;

interface SuggestAppModalProps {
  onClose: () => void;
}

export function SuggestAppModal({ onClose }: SuggestAppModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const [appName, setAppName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm border border-dark-border bg-dark-card p-8 text-center">
          <p className="mb-4 text-[14px] text-text-primary">Sign in to suggest an app</p>
          <button
            onClick={signInWithGoogle}
            className="border border-white/60 bg-white/10 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
          >
            Sign In with Google
          </button>
          <button
            onClick={onClose}
            className="mt-4 block w-full text-[12px] text-text-tertiary hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !category || status === "loading") return;

    setStatus("loading");
    try {
      await addDoc(collection(db, "appSuggestions"), {
        appName: appName.trim(),
        website: website.trim(),
        category,
        reason: reason.trim(),
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md border border-dark-border bg-dark-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
          <p className="text-[14px] font-medium text-text-primary">Suggest an App</p>
          <button
            onClick={onClose}
            className="text-text-tertiary transition-colors hover:text-text-primary"
          >
            &times;
          </button>
        </div>

        {status === "success" ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[14px] font-medium text-text-primary">
              Thanks! We&apos;ll review your suggestion.
            </p>
            <button
              onClick={onClose}
              className="mt-4 text-[12px] text-text-tertiary hover:text-text-secondary"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4">
            <div className="flex flex-col gap-4">
              {/* App name */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  App name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Phantom"
                  className="w-full border-b border-dark-border bg-transparent px-0 py-2 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://phantom.app"
                  className="w-full border-b border-dark-border bg-transparent px-0 py-2 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border-b border-dark-border bg-transparent px-0 py-2 text-[13px] text-text-primary outline-none transition-colors focus:border-text-secondary [&>option]:bg-dark-card [&>option]:text-text-primary"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                  Why should we add it?
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="1-2 sentences (optional)"
                  rows={2}
                  className="w-full resize-none border-b border-dark-border bg-transparent px-0 py-2 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              {status === "error" && (
                <p className="mr-auto text-[12px] text-red-400">Something went wrong.</p>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] text-text-tertiary hover:text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "loading" || !appName.trim() || !category}
                className="border border-white/60 bg-white/10 px-5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40"
              >
                {status === "loading" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
