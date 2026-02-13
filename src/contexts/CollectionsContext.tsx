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
      await deleteDoc(doc(db, "users", user.uid, "collections", id));
    },
    [user]
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
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  return useContext(CollectionsContext);
}
