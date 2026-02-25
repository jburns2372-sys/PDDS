"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user) {
        // Here you would check if kartilyaAgreed is true in your DB
        // For now, we redirect to home
      router.push('/home');
    }
  }, [user, loading, router]);


  // Show a loading state while checking for user
  if (loading) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      );
  }

  // This will be shown briefly before redirect
  return null;
}
