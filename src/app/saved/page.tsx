"use client";

import { useState } from "react";
import Image from "next/image";
import { apps } from "@/data/apps";
import { getAllScreens } from "@/data/helpers";
import { AppCard } from "@/components/AppCard";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { useCollections, type Collection } from "@/contexts/CollectionsContext";
import Link from "next/link";

type Tab = "bookmarks" | "collections";

export default function SavedPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks();
  const { collections, loading: collectionsLoading, deleteCollection, renameCollection } = useCollections();
  const [activeTab, setActiveTab] = useState<Tab>("collections");
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (authLoading || bookmarksLoading || collectionsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-16 rounded bg-dark-border" />
          <div className="mb-3 h-10 w-48 rounded bg-dark-border" />
          <div className="h-5 w-64 rounded bg-dark-border" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <div className="py-20 text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
            Saved
          </p>
          <h1 className="font-heading text-3xl font-bold text-text-primary">
            Sign in to save screens
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-text-secondary">
            Create collections of screens, bookmark apps, and build your design reference library.
          </p>
          <button
            onClick={signInWithGoogle}
            className="mt-8 border border-white/60 bg-white/10 px-8 py-3 text-[14px] font-medium text-white transition-all hover:bg-white/20"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  const savedApps = apps.filter((app) => bookmarks.has(app.slug));
  const allScreens = getAllScreens();

  const handleRename = async (id: string) => {
    if (editName.trim()) {
      await renameCollection(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-12">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
          Saved
        </p>
        <h1 className="font-heading text-3xl font-bold text-text-primary md:text-4xl">
          Your library
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-10 flex gap-1 border-b border-dark-border">
        <button
          onClick={() => setActiveTab("collections")}
          className={`border-b-2 px-4 py-3 text-[13px] font-medium transition-all ${
            activeTab === "collections"
              ? "border-white/60 text-white"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          Collections
          <span className="ml-2 font-mono text-[10px] text-text-tertiary">
            {collections.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`border-b-2 px-4 py-3 text-[13px] font-medium transition-all ${
            activeTab === "bookmarks"
              ? "border-white/60 text-white"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          }`}
        >
          Bookmarked Apps
          <span className="ml-2 font-mono text-[10px] text-text-tertiary">
            {savedApps.length}
          </span>
        </button>
      </div>

      {/* Collections tab */}
      {activeTab === "collections" && (
        <div>
          {collections.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[14px] text-text-tertiary">
                No collections yet. Open any screen and click{" "}
                <span className="text-white">Save</span> to create one.
              </p>
              <Link
                href="/screens"
                className="mt-4 inline-block text-[13px] text-white transition-colors hover:text-white/80"
              >
                Browse screens &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  allScreens={allScreens}
                  expanded={expandedCollection === col.id}
                  onToggle={() =>
                    setExpandedCollection(
                      expandedCollection === col.id ? null : col.id
                    )
                  }
                  editing={editingId === col.id}
                  editName={editName}
                  onStartEdit={() => {
                    setEditingId(col.id);
                    setEditName(col.name);
                  }}
                  onEditNameChange={setEditName}
                  onSaveEdit={() => handleRename(col.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => deleteCollection(col.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookmarks tab */}
      {activeTab === "bookmarks" && (
        <div>
          {savedApps.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedApps.map((app) => (
                <AppCard
                  key={app.slug}
                  app={app}
                  bookmarkButton={<BookmarkButton slug={app.slug} />}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-[14px] text-text-tertiary">
                No saved apps yet. Browse the{" "}
                <Link href="/library" className="text-white transition-colors hover:text-white/80">
                  library
                </Link>{" "}
                and bookmark apps you want to track.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Collection Card ──────────────────────────────────────────────────

interface CollectionCardProps {
  collection: Collection;
  allScreens: ReturnType<typeof getAllScreens>;
  expanded: boolean;
  onToggle: () => void;
  editing: boolean;
  editName: string;
  onStartEdit: () => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function CollectionCard({
  collection: col,
  allScreens,
  expanded,
  onToggle,
  editing,
  editName,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CollectionCardProps) {
  const previewImages = col.screens.slice(0, 4);

  return (
    <div className="border border-dark-border bg-dark-card">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-dark-hover"
      >
        {/* Preview grid */}
        <div className="grid h-12 w-12 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded bg-dark-bg">
          {previewImages.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden">
              <Image
                src={img}
                alt=""
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
          ))}
          {previewImages.length < 4 &&
            Array.from({ length: 4 - previewImages.length }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-dark-border" />
            ))}
        </div>

        <div className="flex-1">
          {editing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full border-b border-white/60 bg-transparent text-[14px] font-medium text-text-primary outline-none"
              autoFocus
            />
          ) : (
            <p className="text-[14px] font-medium text-text-primary">{col.name}</p>
          )}
          <p className="font-mono text-[11px] text-text-tertiary">
            {col.screens.length} screen{col.screens.length !== 1 ? "s" : ""}
          </p>
        </div>

        <svg
          className={`h-4 w-4 shrink-0 text-text-tertiary transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-dark-border">
          {/* Actions */}
          <div className="flex gap-3 px-5 py-3">
            <button
              onClick={onStartEdit}
              className="text-[11px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Rename
            </button>
            <button
              onClick={onDelete}
              className="text-[11px] text-text-tertiary transition-colors hover:text-red-400"
            >
              Delete
            </button>
          </div>

          {/* Screens grid */}
          {col.screens.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 px-5 pb-5 sm:grid-cols-4 md:grid-cols-6">
              {col.screens.map((img) => {
                const screen = allScreens.find((s) => s.image === img);
                return (
                  <div key={img} className="group">
                    <div className="relative aspect-[16/10] overflow-hidden border border-dark-border bg-dark-bg">
                      <Image
                        src={img}
                        alt={screen?.label || "Saved screen"}
                        fill
                        className="object-cover object-top"
                        sizes="150px"
                      />
                    </div>
                    {screen && (
                      <p className="mt-1 truncate text-[10px] text-text-tertiary">
                        {screen.appName} — {screen.label}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-5 pb-5 text-[12px] text-text-tertiary">
              No screens in this collection yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
