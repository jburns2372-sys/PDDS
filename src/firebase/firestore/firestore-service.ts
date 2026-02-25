"use client";
import { doc, setDoc, updateDoc, Firestore, FieldValue } from 'firebase/firestore';
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
    passwordIsTemporary: boolean;
    createdAt: FieldValue;
  }
) {
    const userRef = doc(db, 'users', userId);
    // Return the promise chain
    return setDoc(userRef, data)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw the error to be caught by the calling function
        throw permissionError;
      });
}


export function updateUserDocument(
  db: Firestore,
  userId: string,
  data: Record<string, any>
) {
  const userRef = doc(db, 'users', userId);
  return updateDoc(userRef, data)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: data,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    });
}
