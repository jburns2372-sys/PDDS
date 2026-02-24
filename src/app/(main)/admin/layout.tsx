"use client";

import { useUser, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useUser();
  const { data: userData, loading: userDataLoading } = useDoc('users', user?.uid || '---');
  const router = useRouter();

  useEffect(() => {
    if (userLoading || userDataLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    if (userData?.role !== 'Administrator') {
      router.push('/home'); // Or a dedicated 'unauthorized' page
    }
  }, [user, userData, userLoading, userDataLoading, router]);

  if (userLoading || userDataLoading || !userData || userData.role !== 'Administrator') {
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
