import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  Firestore
} from "firebase/firestore";
import { firebaseConfig } from "./config";

import { useUser } from "./auth/use-user";
import { useCollection } from "./firestore/use-collection";
import { useDoc } from "./firestore/use-doc";
import {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from "./provider";
import { FirebaseClientProvider } from "./client-provider";

function initializeFirebase() {
  // Aggressive Env Var Check
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.error("FIREBASE FATAL ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is undefined. The .env.local file is not being read by Next.js.");
  }
  
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export const createTemporaryApp = () => {
    const tempAppName = `temp-auth-app-${new Date().getTime()}-${Math.random()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    return tempApp;
};

export const deleteTemporaryApp = (app: FirebaseApp) => {
    return deleteApp(app);
};

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useCollection,
  useDoc,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
