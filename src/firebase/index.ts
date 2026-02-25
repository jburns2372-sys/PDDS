"use client";

import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
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
  let app;
  let firestore;

  if (!getApps().length) {
    // First time load: Initialize App and Firestore with custom Workstation rules
    app = initializeApp(firebaseConfig);
    firestore = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true
    });
  } else {
    // Hot reload: Use existing App and existing Firestore instance
    app = getApp();
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
