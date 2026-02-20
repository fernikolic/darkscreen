"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

export interface Collection {
  id: string;
  name: string;
  screens: string[]; // image paths
  createdAt: unknown;
  shareId?: string;
  isPublic?: boolean;
  notes?: Record<string, string>; // image path -> note text
}

interface CollectionsContextValue {
  collections: Collection[];
  loading: boolean;
  createCollection: (name: string) => Promise<string>;
  deleteCollection: (id: string) => Promise<void>;
  renameCollection: (id: string, name: string) => Promise<void>;
  addToCollection: (collectionId: string, screenImage: string) => Promise<void>;
  removeFromCollection: (collectionId: string, screenImage: string) => Promise<void>;
  getCollectionsForScreen: (screenImage: string) => string[];
  shareCollection: (collectionId: string) => Promise<string>;
  unshareCollection: (collectionId: string) => Promise<void>;
  updateCollectionNote: (collectionId: string, screenImage: string, note: string) => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextValue>({
  collections: [],
  loading: true,
  createCollection: async () => "",
  deleteCollection: async () => {},
  renameCollection: async () => {},
  addToCollection: async () => {},
  removeFromCollection: async () => {},
  getCollectionsForScreen: () => [],
  shareCollection: async () => "",
  unshareCollection: async () => {},
  updateCollectionNote: async () => {},
});

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCollections([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, "users", user.uid, "collections");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const cols: Collection[] = [];
      snapshot.forEach((d) => {
        cols.push({ id: d.id, ...d.data() } as Collection);
      });
      setCollections(cols);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createCollection = useCallback(
    async (name: string): Promise<string> => {
      if (!user) return "";
      const ref = doc(collection(db, "users", user.uid, "collections"));
      await setDoc(ref, {
        name,
        screens: [],
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    [user]
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      if (!user) return;
      // Also clean up the shared collection if it exists
      const col = collections.find((c) => c.id === id);
      if (col?.shareId) {
        try {
          await deleteDoc(doc(db, "sharedCollections", col.shareId));
        } catch {
          // Ignore if shared doc doesn't exist
        }
      }
      await deleteDoc(doc(db, "users", user.uid, "collections", id));
    },
    [user, collections]
  );

  const renameCollection = useCallback(
    async (id: string, name: string) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid, "collections", id), { name });
    },
    [user]
  );

  const addToCollection = useCallback(
    async (collectionId: string, screenImage: string) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid, "collections", collectionId), {
        screens: arrayUnion(screenImage),
      });
    },
    [user]
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, screenImage: string) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid, "collections", collectionId), {
        screens: arrayRemove(screenImage),
      });
    },
    [user]
  );

  const getCollectionsForScreen = useCallback(
    (screenImage: string): string[] => {
      return collections
        .filter((c) => c.screens.includes(screenImage))
        .map((c) => c.id);
    },
    [collections]
  );

  const shareCollection = useCallback(
    async (collectionId: string): Promise<string> => {
      if (!user) return "";

      const col = collections.find((c) => c.id === collectionId);
      if (!col) return "";

      // If already shared, return existing share ID
      if (col.shareId) return col.shareId;

      // Generate share ID
      const { nanoid } = await import("nanoid");
      const shareId = nanoid(12);

      // Write to public sharedCollections
      await setDoc(doc(db, "sharedCollections", shareId), {
        name: col.name,
        screens: col.screens,
        notes: col.notes || {},
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Update user's collection with share ID
      await updateDoc(doc(db, "users", user.uid, "collections", collectionId), {
        shareId,
        isPublic: true,
      });

      return shareId;
    },
    [user, collections]
  );

  const unshareCollection = useCallback(
    async (collectionId: string) => {
      if (!user) return;

      const col = collections.find((c) => c.id === collectionId);
      if (!col?.shareId) return;

      // Delete from public collection
      try {
        await deleteDoc(doc(db, "sharedCollections", col.shareId));
      } catch {
        // Ignore
      }

      // Remove share info from user's collection
      await updateDoc(doc(db, "users", user.uid, "collections", collectionId), {
        shareId: null,
        isPublic: false,
      });
    },
    [user, collections]
  );

  const updateCollectionNote = useCallback(
    async (collectionId: string, screenImage: string, note: string) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid, "collections", collectionId), {
        [`notes.${screenImage.replace(/\//g, "__")}`]: note,
      });
    },
    [user]
  );

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        loading,
        createCollection,
        deleteCollection,
        renameCollection,
        addToCollection,
        removeFromCollection,
        getCollectionsForScreen,
        shareCollection,
        unshareCollection,
        updateCollectionNote,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  return useContext(CollectionsContext);
}
