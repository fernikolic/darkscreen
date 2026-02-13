"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCollections } from "@/contexts/CollectionsContext";

interface SaveToCollectionModalProps {
  screenImage: string;
  onClose: () => void;
}

export function SaveToCollectionModal({
  screenImage,
  onClose,
}: SaveToCollectionModalProps) {
  const { user, openSignIn } = useAuth();
  const {
    collections,
    createCollection,
    addToCollection,
    removeFromCollection,
    getCollectionsForScreen,
  } = useCollections();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const savedIn = getCollectionsForScreen(screenImage);

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm border border-dark-border bg-dark-card p-8 text-center">
          <p className="mb-4 text-[14px] text-text-primary">Sign in to save screens</p>
          <button
            onClick={() => {
              onClose();
              openSignIn();
            }}
            className="border border-white/60 bg-white/10 px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
          >
            Sign In
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

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    const id = await createCollection(newName.trim());
    await addToCollection(id, screenImage);
    setNewName("");
    setCreating(false);
  };

  const handleToggle = async (collectionId: string) => {
    if (savedIn.includes(collectionId)) {
      await removeFromCollection(collectionId, screenImage);
    } else {
      await addToCollection(collectionId, screenImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm border border-dark-border bg-dark-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
          <p className="text-[14px] font-medium text-text-primary">Save to collection</p>
          <button
            onClick={onClose}
            className="text-text-tertiary transition-colors hover:text-text-primary"
          >
            &times;
          </button>
        </div>

        {/* Collections list */}
        <div className="max-h-64 overflow-y-auto p-2">
          {collections.length === 0 && (
            <p className="px-3 py-4 text-center text-[13px] text-text-tertiary">
              No collections yet. Create one below.
            </p>
          )}
          {collections.map((col) => {
            const isIn = savedIn.includes(col.id);
            return (
              <button
                key={col.id}
                onClick={() => handleToggle(col.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-dark-hover ${
                  isIn ? "text-white" : "text-text-secondary"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${
                    isIn
                      ? "border-white/60 bg-white/20"
                      : "border-dark-border"
                  }`}
                >
                  {isIn && "✓"}
                </span>
                <span className="flex-1 truncate text-[13px]">{col.name}</span>
                <span className="font-mono text-[10px] text-text-tertiary">
                  {col.screens.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Create new */}
        <div className="border-t border-dark-border p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New collection name..."
              className="min-w-0 flex-1 border-b border-dark-border bg-transparent px-0 py-2 text-[13px] text-text-primary placeholder-text-tertiary outline-none focus:border-text-secondary"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="shrink-0 border border-dark-border px-3 py-2 text-[12px] font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
