"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { useUser, useDoc } from "@/firebase";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const { user, loading: userLoading } = useUser();
  const { data: userData, loading: userDataLoading } = useDoc('users', user?.uid || '---');

  const isAdmin = userData?.role === 'Administrator';

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || userLoading || userDataLoading) {
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

  return (
    <div className="flex min-h-screen w-full">
      {isMobile ? <MobileBottomNav isAdmin={isAdmin} /> : <DesktopSidebar isAdmin={isAdmin} />}
      <main className="flex-1 bg-background pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
