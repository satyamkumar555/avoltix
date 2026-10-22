"use client";
import { firebaseReady } from "@/lib/firebase/client";
export default function DemoBanner() {
  if (firebaseReady) return null;
  return <div className="demo" role="note">Demo mode: Firebase is not configured. Sample products and orders are stored in this browser only.</div>;
}
