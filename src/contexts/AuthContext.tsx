"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { sha256, truncateAddress, type WalletChain } from "@/lib/wallet-auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithWallet: (chain: WalletChain, address: string, signature: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Whether the unified sign-in modal is open */
  signInOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: () => {},
  signInWithWallet: async () => {},
  signOut: async () => {},
  signInOpen: false,
  openSignIn: () => {},
  closeSignIn: () => {},
});

async function ensureUserDoc(user: User, walletMeta?: { walletAddress: string; walletChain: WalletChain }) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const baseDoc: Record<string, unknown> = {
      email: user.email,
      displayName: walletMeta
        ? truncateAddress(walletMeta.walletAddress)
        : user.displayName,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      plan: "free",
    };

    if (walletMeta) {
      baseDoc.walletAddress = walletMeta.walletAddress;
      baseDoc.walletChain = walletMeta.walletChain;
      baseDoc.authMethod = "wallet";
    } else {
      baseDoc.authMethod = "google";
    }

    await setDoc(userRef, baseDoc);

    // Check for pending subscriptions by email (from Stripe webhook before sign-in)
    if (user.email) {
      const pendingRef = collection(db, "pendingSubscriptions");
      const q = query(pendingRef, where("email", "==", user.email));
      const pending = await getDocs(q);
      if (!pending.empty) {
        const sub = pending.docs[0].data();
        await updateDoc(userRef, {
          plan: sub.plan || "pro",
          stripeCustomerId: sub.stripeCustomerId || null,
          subscriptionId: sub.subscriptionId || null,
        });
      }
    }
  } else {
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        try {
          await ensureUserDoc(u);
        } catch {
          // Silently handled — user doc creation is non-blocking
        }
      }
    });
    return unsubscribe;
  }, []);

  const openSignIn = useCallback(() => setSignInOpen(true), []);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);

  const signInWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then(() => setSignInOpen(false))
      .catch((err: unknown) => {
        const code = (err as { code?: string }).code;
        if (code === "auth/popup-blocked") {
          window.alert("Popup was blocked by your browser. Please allow popups for this site.");
        } else if (code === "auth/unauthorized-domain") {
          window.alert("This domain is not authorized for sign-in. Please contact support.");
        }
        // auth/popup-closed-by-user is expected — user cancelled
      });
  };

  const signInWithWallet = async (chain: WalletChain, address: string, signature: string) => {
    const normalizedAddress = chain === "evm" ? address.toLowerCase() : address;
    const email = `${normalizedAddress}@wallet.darkscreen.xyz`;
    const password = (await sha256(signature)).substring(0, 64);

    try {
      // Try signing in first (returning user)
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        // First time — create account
        await createUserWithEmailAndPassword(auth, email, password);
        // ensureUserDoc will be called by onAuthStateChanged, but we also call it
        // here with wallet metadata so the first doc has wallet info
        if (auth.currentUser) {
          await ensureUserDoc(auth.currentUser, { walletAddress: address, walletChain: chain });
        }
      } else {
        throw err;
      }
    }

    setSignInOpen(false);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithWallet,
        signOut,
        signInOpen,
        openSignIn,
        closeSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
