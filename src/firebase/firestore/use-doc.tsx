"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const useMemoFirebase = <T>(
    factory: () => T | null,
    deps: React.DependencyList
  ): T | null => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
  };
  
export function useDoc<T extends DocumentData>(
  path: string,
  docId: string
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const docRef = useMemoFirebase(() => {
    if (!firestore || !path || !docId) return null;
    return doc(firestore, path, docId);
  }, [firestore, path, docId]);

  useEffect(() => {
    if (!docRef) {
        setData(null);
        setLoading(false);
        return;
    };

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef]);

  return { data, loading, error };
}
