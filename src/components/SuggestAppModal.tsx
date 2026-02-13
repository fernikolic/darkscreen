"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

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
        userId: user!.uid,
        userEmail: user!.email,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md border border-dark-border bg-dark-card shadow-2xl shadow-black/50 animate-fade-in-up">
        {!user ? (
          /* Sign-in prompt */
          <div className="p-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-dark-border bg-dark-bg">
              <svg className="h-5 w-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="mb-1.5 text-[15px] font-medium text-text-primary">Suggest an app</p>
            <p className="mb-6 text-[13px] text-text-tertiary">
              Sign in to submit your suggestion
            </p>
            <button
              onClick={signInWithGoogle}
              className="w-full border border-white/20 bg-white/5 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Sign In with Google
            </button>
            <button
              onClick={onClose}
              className="mt-4 block w-full text-[12px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Cancel
            </button>
          </div>
        ) : status === "success" ? (
          /* Success state */
          <div className="p-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="mb-1.5 text-[15px] font-medium text-text-primary">
              Thanks for the suggestion
            </p>
            <p className="mb-6 text-[13px] text-text-tertiary">
              We&apos;ll review it and add it to the queue.
            </p>
            <button
              onClick={onClose}
              className="text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <>
            <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
              <p className="text-[14px] font-medium text-text-primary">Suggest an App</p>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-dark-hover hover:text-text-primary"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    App name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Phantom"
                    className="w-full border-b border-dark-border bg-transparent px-0 py-2.5 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://phantom.app"
                    className="w-full border-b border-dark-border bg-transparent px-0 py-2.5 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border-b border-dark-border bg-transparent px-0 py-2.5 text-[13px] text-text-primary outline-none transition-colors focus:border-text-secondary [&>option]:bg-dark-card [&>option]:text-text-primary"
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

                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                    Why should we add it?
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="1-2 sentences (optional)"
                    rows={2}
                    className="w-full resize-none border-b border-dark-border bg-transparent px-0 py-2.5 text-[13px] text-text-primary placeholder-text-tertiary outline-none transition-colors focus:border-text-secondary"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-dark-border pt-5">
                {status === "error" && (
                  <p className="mr-auto text-[12px] text-red-400">Something went wrong.</p>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[12px] text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === "loading" || !appName.trim() || !category}
                  className="border border-white/20 bg-white/5 px-5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  {status === "loading" ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
