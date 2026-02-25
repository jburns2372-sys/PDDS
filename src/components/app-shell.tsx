"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState, ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";
import { useUser, useDoc } from "@/firebase";
import { UserDataContext, UserDataContextType } from "@/context/user-data-context";
import { useRouter } from "next/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const { user, loading: userLoading } = useUser();
  const { data: userData, loading: userDataLoading } = useDoc('users', user?.uid || '---');
  const router = useRouter();

  // TEMPORARY: Grant admin privileges to the specified user for demonstration.
  const isDemoAdmin = userData?.email === 'j.burns2372@gmail.com';
  const isAdmin = isDemoAdmin || userData?.role === 'Admin' || userData?.role === 'President';

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const loading = !isClient || userLoading || userDataLoading;

  useEffect(() => {
      // This acts as a guard for all pages under the (main) layout
      if (!loading && !user) {
          router.push('/login');
      }
  }, [loading, user, router]);

  // While loading or if no user is authenticated, show a full-page skeleton.
  // This prevents rendering child components that might depend on user data before it's ready.
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full">
        { !isMobile && <div className="hidden md:block w-64 flex-shrink-0 border-r bg-card">
          <div className="p-4 space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
          </div>
        </div>}
        <main className="flex-1 bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-8 w-2/3" />
                <div className="pt-8 grid md:grid-cols-3 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                 <div className="pt-8">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </main>
      </div>
    );
  }
  
  // Once loaded, provide the data to all child components.
  const contextValue: UserDataContextType = {
      user,
      userData,
      loading
  };

  return (
    <UserDataContext.Provider value={contextValue}>
        <div className="flex min-h-screen w-full">
        {isMobile ? <MobileBottomNav isAdmin={isAdmin} /> : <DesktopSidebar isAdmin={isAdmin} />}
        <main className="flex-1 bg-background pb-16 md:pb-0">
            {children}
        </main>
        </div>
    </UserDataContext.Provider>
  );
}
