import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
/** True when Firebase keys are present. Otherwise the app runs in local demo mode. */
export const firebaseReady = Boolean(cfg.apiKey && cfg.projectId);

const app = (): FirebaseApp => getApps()[0] ?? initializeApp(cfg);
export const db = () => getFirestore(app());
export const auth = () => getAuth(app());
export const fns = () => getFunctions(app(), "asia-south1");
export const storage = () => getStorage(app());
