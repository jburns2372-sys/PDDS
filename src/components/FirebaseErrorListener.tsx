"use client";

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from "@/hooks/use-toast";

export function FirebaseErrorListener() {
    const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Caught Firestore Permission Error:", error);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: `You do not have permission to perform this action.`,
      })
      // Here you could show a toast, a modal, or redirect the user
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
