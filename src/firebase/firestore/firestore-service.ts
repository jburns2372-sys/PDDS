
"use client";
import { doc, setDoc, updateDoc, Firestore, FieldValue, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * Isolated creation using setDoc
 */
export function createUserDocument(
  db: Firestore, 
  userId: string, 
  data: any
) {
    const userRef = doc(db, 'users', userId);
    return setDoc(userRef, data)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
}

/**
 * Isolated update using updateDoc
 * Allows users to update their own profile while enforcing role gates for others.
 */
export function updateUserDocument(
  db: Firestore,
  userId: string,
  data: Record<string, any>,
  currentUserProfile: any
) {
  const isOwner = currentUserProfile?.uid === userId;
  const isExecutive = currentUserProfile?.role === 'President' || currentUserProfile?.role === 'Admin' || currentUserProfile?.isSuperAdmin;

  // STRICT SECURITY GUARD: Only Owners or Executives can update
  if (!isOwner && !isExecutive) {
    throw new Error('Unauthorized: Only the account owner or Administrators can modify this record.');
  }

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

/**
 * Isolated deletion
 * Updated with strict executive check
 */
export function deleteUserDocument(
    db: Firestore,
    userId: string,
    currentUserProfile: any
  ) {
    // STRICT SECURITY GUARD
    if (currentUserProfile?.role !== 'President' && currentUserProfile?.role !== 'Admin' && !currentUserProfile?.isSuperAdmin) {
        throw new Error('Unauthorized: Only the President or Administrators can modify the registry.');
    }

    const userRef = doc(db, 'users', userId);
    return deleteDoc(userRef)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });
  }
