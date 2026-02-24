"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {isMobile ? <MobileBottomNav /> : <DesktopSidebar />}
      <main className="flex-1 bg-background pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
