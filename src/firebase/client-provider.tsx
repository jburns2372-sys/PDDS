
"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { FirebaseStorage } from "firebase/storage";
import { Messaging } from "firebase/messaging";
import { initializeFirebase, FirebaseProvider } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
    messaging: Messaging | null;
  } | null>(null);

  useEffect(() => {
    try {
      const result = initializeFirebase();
      setFirebase({
        app: result.app,
        auth: result.auth,
        firestore: result.firestore,
        storage: result.storage,
        messaging: result.messaging
      });
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }, []);

  if (!firebase) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16" />
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="w-full space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
      storage={firebase.storage}
      messaging={firebase.messaging}
    >
      {children}
    </FirebaseProvider>
  );
}
