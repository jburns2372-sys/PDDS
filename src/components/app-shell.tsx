
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState, ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { UserDataContext, UserDataContextType, UserProfile } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Menu, X, Loader2, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PddsLogo from "./icons/pdds-logo";
import { DesktopSidebarContent } from "./desktop-sidebar";

/**
 * @fileOverview Application Shell & Global Route Guard.
 * Strictly manages synchronization with the National Registry.
 * Enforces the Official PDDS Logo as the dominant visual on launch.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const { user, loading: userLoading } = useUser();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user || userLoading) {
      if (!userLoading) {
        setUserData(null);
        setUserDataLoading(false);
      }
      return;
    }

    setUserDataLoading(true);
    const docRef = doc(firestore, "users", user.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const isExecutive = data.role === 'President' || data.role === 'Admin' || data.role === 'System Admin';
        
        if (data.isApproved === false && !isExecutive) {
          await auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Revoked",
            description: "Your account has been disabled by an Administrator."
          });
          window.location.href = '/login';
          return;
        }

        setUserData({ id: docSnap.id, ...data });
        setUserDataLoading(false);
      } else {
        window.location.href = '/join?induction=pending';
      }
    }, (error) => {
      console.error("Critical error in profile sync:", error);
      setUserDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, userLoading, firestore, auth, toast, router]);
  
  const loading = !isClient || userLoading;

  useEffect(() => {
      if (!loading && !user && window.location.pathname !== '/join') {
          router.push('/login');
      }
  }, [loading, user, router]);

  if (loading || (user && userDataLoading)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <PddsLogo className="h-32 w-32 animate-pulse" />
              <div className="absolute inset-0 border-4 border-primary/10 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">
                    Establishing Secure Link
                  </p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  PDDS National Registry Synchronization
                </p>
            </div>
        </div>
      </div>
    );
  }

  if (!user) return null;
  
  const contextValue: UserDataContextType = {
      user,
      userData,
      loading: loading || userDataLoading
  };

  return (
    <UserDataContext.Provider value={contextValue}>
        <div className="flex min-h-screen w-full flex-col md:flex-row">
          <div className="flex h-16 w-full items-center justify-between border-b bg-primary px-4 md:hidden sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <PddsLogo variant="white" className="h-10 w-auto" />
              <span className="font-headline font-black uppercase text-xs tracking-[0.2em] text-white">PatriotLink</span>
            </div>
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-white">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="h-full py-4 overflow-y-auto" onClick={() => setIsDrawerOpen(false)}>
                  <DesktopSidebarContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {!isMobile && <DesktopSidebar />}
          
          <main className="flex-1 bg-background pb-24 md:pb-0 overflow-x-hidden">
              {children}
          </main>

          {isMobile && <MobileBottomNav />}
        </div>
    </UserDataContext.Provider>
  );
}
