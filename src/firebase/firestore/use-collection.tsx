
"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query,
  where,
  collectionGroup,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// A custom hook to memoize the query and avoid re-creating it on every render.
const useMemoFirebase = <T>(
    factory: () => T | null,
    deps: React.DependencyList
  ): T | null => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
  };
  
export function useCollection<T extends DocumentData>(
  path: string,
  options?: {
    isCollectionGroup?: boolean;
    queries?: {
      attribute: string;
      operator: '==' | '!=';
      value: string | number | boolean | null;
    }[];
  }
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const memoizedQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q: Query;
    if (options?.isCollectionGroup) {
      q = collectionGroup(firestore, path);
    } else {
      q = collection(firestore, path);
    }

    if (options?.queries) {
      const whereClauses = options.queries.map((q) =>
        where(q.attribute, q.operator, q.value)
      );
      q = query(q, ...whereClauses);
    }
    return q;
  }, [firestore, path, options]);

  useEffect(() => {
    if (!memoizedQuery) return;

    const unsubscribe = onSnapshot(
      memoizedQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setData(docs);
        setLoading(false);
        setError(null);
      },
      async (err) => {
        const permissionError = new FirestorePermissionError({
          path: path,
          operation: 'list',
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [memoizedQuery, path]);

  return { data, loading, error };
}
