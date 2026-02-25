import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  initializeFirestore,
  memoryLocalCache,
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
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  // CRITICAL FIX: Bypass IndexedDB and force long-polling for Cloud IDEs
  const firestore = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true
  });

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
