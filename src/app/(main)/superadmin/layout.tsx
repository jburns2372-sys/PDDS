"use client";

import { useUserData } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useUserData();
  const router = useRouter();

  // TEMPORARY: Grant admin privileges to the specified user for demonstration.
  const isDemoAdmin = user?.email === 'j.burns2372@gmail.com';

  const isSuperAdmin = isDemoAdmin || (userData?.level === 'National' && (userData.role === 'President' || userData.role === 'System Admin'));

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/home'); // Or a dedicated 'unauthorized' page
    }
  }, [userData, loading, router, isSuperAdmin]);

  if (loading || !isSuperAdmin) {
    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-8 w-2/3" />
                <div className="pt-8">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    )
  }

  return <>{children}</>;
}
