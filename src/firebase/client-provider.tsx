"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { initializeFirebase, FirebaseProvider } from "@/firebase";

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
  } | null>(null);

  useEffect(() => {
    const app = initializeFirebase();
    setFirebase(app);
  }, []);

  if (!firebase) {
    // You can render a loading state here
    return <div>Loading...</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
