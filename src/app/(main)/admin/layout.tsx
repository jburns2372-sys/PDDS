
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
  const { user, userData, loading } = useUserData();
  const router = useRouter();

  const userEmail = (user?.email || '').toLowerCase();
  
  // System Admin shares identical administrative privileges with President and Admin roles
  const isAuthorized = 
    userData?.role === 'Admin' || 
    userData?.role === 'President' || 
    userData?.role === 'System Admin' || 
    userEmail === 'iamgrecobelgica@gmail.com' ||
    userEmail === 'j.burns2372@gmail.com' ||
    userEmail === 'j.burns.2372@gmail.com' ||
    userEmail === 'j.burns372@gmail.com' ||
    userEmail === 'mariashellajoygomez@gmail.com';

  useEffect(() => {
    if (!loading && !isAuthorized) {
      router.push('/home');
    }
  }, [isAuthorized, loading, router]);

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
