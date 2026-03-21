
"use client";

import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";
import { firebaseConfig } from "./config";

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
  const storage = getStorage(app);
  
  // Messaging might not be supported in all environments (e.g. SSR or specific browsers)
  let messaging: Messaging | null = null;
  if (typeof window !== "undefined") {
    isSupported().then(supported => {
      if (supported) {
        messaging = getMessaging(app);
      }
    });
  }
  
  return { app, auth, firestore, storage, messaging };
}

export const createTemporaryApp = () => {
    const tempAppName = `temp-auth-app-${new Date().getTime()}-${Math.random()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    return tempApp;
};

export const deleteTemporaryApp = (app: FirebaseApp) => {
    return deleteApp(app);
};
