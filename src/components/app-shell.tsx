"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState, ReactNode } from "react";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { UserDataContext, UserDataContextType, UserProfile } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Menu, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PddsLogo from "./icons/pdds-logo";
import { DesktopSidebarContent } from "./desktop-sidebar";

/**
 * @fileOverview Application Shell & Global Route Guard.
 * Hardened for Android, Apple, Tablets, and Desktops to ensure a perfect fit in any orientation.
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
      <div className="flex h-dynamic w-full flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <PddsLogo className="h-48 w-auto animate-pulse shadow-none" />
              <div className="absolute inset-0 border-4 border-primary/10 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col items-center gap-3 text-center px-6">
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
        <div className="flex h-dynamic w-full flex-col md:flex-row overflow-hidden bg-background">
          {/* Mobile Header - Hardened for Notch/Safe Area */}
          <div className="flex h-20 w-full items-center justify-between border-b bg-primary px-4 md:hidden shrink-0 shadow-md safe-top relative z-50">
            <div className="flex items-center gap-2">
              <PddsLogo variant="white" className="h-14 w-auto" />
              <h1 className="text-white font-black uppercase text-[10px] tracking-widest ml-1 font-headline">PatriotLink</h1>
            </div>
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-white active:bg-white/10 rounded-lg transition-colors outline-none">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-72 p-0 border-r-none">
                <div className="h-full py-4 overflow-y-auto custom-scrollbar">
                  <DesktopSidebarContent onClose={() => setIsDrawerOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop/Tablet Sidebar */}
          {!isMobile && <DesktopSidebar />}
          
          {/* Main Content Area - Scrollable Fit */}
          <main className="flex-1 relative flex flex-col min-w-0 h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="w-full max-w-full pb-24 md:pb-8">
                  {children}
                </div>
              </div>
          </main>

          {/* Mobile Bottom Navigation */}
          {isMobile && <MobileBottomNav />}
        </div>
    </UserDataContext.Provider>
  );
}