"use client";

import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
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

/**
 * Standardizing initialization for Cloud Workstations.
 * Uses Long Polling to bypass WebSocket blocks which cause ChunkLoadErrors and Offline errors.
 */
export function initializeFirebase() {
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  let firestore;
  try {
    firestore = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true, // Crucial for stability in Cloud Workstations
    });
  } catch (e) {
    firestore = getFirestore(app);
  }

  const auth = getAuth(app);
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
