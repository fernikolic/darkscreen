"use client";

import { useState } from "react";
import { useCollections } from "@/contexts/CollectionsContext";

interface CollectionNotesProps {
  collectionId: string;
  screenImage: string;
  initialNote?: string;
}

export function CollectionNotes({
  collectionId,
  screenImage,
  initialNote = "",
}: CollectionNotesProps) {
  const { updateCollectionNote } = useCollections();
  const [note, setNote] = useState(initialNote);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCollectionNote(collectionId, screenImage, note);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (!editing && !note) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        Add note
      </button>
    );
  }

  if (editing) {
    return (
      <div className="mt-1">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full resize-none border border-dark-border bg-dark-bg px-2 py-1.5 text-[10px] text-text-primary placeholder-text-tertiary outline-none focus:border-text-tertiary"
          rows={2}
          autoFocus
        />
        <div className="mt-1 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-[10px] text-text-secondary transition-colors hover:text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setNote(initialNote);
            }}
            className="text-[10px] text-text-tertiary transition-colors hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <p className="text-[10px] italic text-text-tertiary">{note}</p>
      <button
        onClick={() => setEditing(true)}
        className="text-[9px] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        Edit
      </button>
    </div>
  );
}
