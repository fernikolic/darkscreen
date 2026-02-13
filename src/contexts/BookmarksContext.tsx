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
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

interface BookmarksContextValue {
  bookmarks: Set<string>;
  loading: boolean;
  toggleBookmark: (slug: string) => Promise<void>;
  isBookmarked: (slug: string) => boolean;
}

const BookmarksContext = createContext<BookmarksContextValue>({
  bookmarks: new Set(),
  loading: true,
  toggleBookmark: async () => {},
  isBookmarked: () => false,
});

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBookmarks(new Set());
      setLoading(false);
      return;
    }

    const ref = collection(db, "users", user.uid, "bookmarks");
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const slugs = new Set<string>();
      snapshot.forEach((doc) => slugs.add(doc.id));
      setBookmarks(slugs);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const toggleBookmark = useCallback(
    async (slug: string) => {
      if (!user) return;
      const ref = doc(db, "users", user.uid, "bookmarks", slug);
      if (bookmarks.has(slug)) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { slug, createdAt: serverTimestamp() });
      }
    },
    [user, bookmarks]
  );

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.has(slug),
    [bookmarks]
  );

  return (
    <BookmarksContext.Provider value={{ bookmarks, loading, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarksContext);
}
