"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut as fbSignOut, updateProfile, type User } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase/client";

type A = {
  user: User | null; isAdmin: boolean; loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  reset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const Ctx = createContext<A | null>(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error("AuthProvider missing"); return c; };
const need = () => { if (!firebaseReady) throw new Error("Firebase is not configured. See README."); };

export function friendly(e: unknown): string {
  const code = (e as { code?: string }).code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Wrong email or password.";
  if (code.includes("email-already-in-use")) return "This email is already registered. Sign in instead.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again later.";
  if (e instanceof Error && e.message.startsWith("Firebase is not configured")) return e.message;
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(firebaseReady);
  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      setAdmin(u ? (await u.getIdTokenResult()).claims.admin === true : false);
      setLoading(false);
    });
  }, []);
  const v: A = {
    user, isAdmin, loading,
    signIn: async (e, p) => { need(); await signInWithEmailAndPassword(auth(), e, p); },
    register: async (n, e, p) => { need(); const c = await createUserWithEmailAndPassword(auth(), e, p); await updateProfile(c.user, { displayName: n }); await sendEmailVerification(c.user); },
    reset: async (e) => { need(); await sendPasswordResetEmail(auth(), e); },
    signOut: async () => { if (firebaseReady) await fbSignOut(auth()); },
  };
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
