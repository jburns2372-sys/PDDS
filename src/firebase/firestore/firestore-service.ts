"use client";
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function createUserDocument(
  db: Firestore, 
  userId: string, 
  data: { 
    uid: string;
    fullName: string;
    email: string;
    role: string;
    level: string;
    locationName: string;
    kartilyaAgreed: boolean;
  }
) {
    const userRef = doc(db, 'users', userId);
    setDoc(userRef, data)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
}
