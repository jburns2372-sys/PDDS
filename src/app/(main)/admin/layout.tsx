"use client";

import { useUserData } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, loading } = useUserData();
  const router = useRouter();

  const isAuthorized = userData?.role === 'Admin' || userData?.role === 'President';

  useEffect(() => {
    // The auth check for a valid user is already handled by the root AppShell.
    // This layout just needs to check for the admin role.
    if (!loading && !isAuthorized) {
      router.push('/home'); // Or a dedicated 'unauthorized' page
    }
  }, [userData, loading, router, isAuthorized]);

  // Show a skeleton while loading or if the user is not an administrator
  if (loading || !isAuthorized) {
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
