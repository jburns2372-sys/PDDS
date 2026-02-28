
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
import { Menu, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PddsLogo from "./icons/pdds-logo";
import { DesktopSidebarContent } from "./desktop-sidebar";

/**
 * @fileOverview Application Shell & Global Route Guard.
 * Strictly manages synchronization with the National Registry.
 * Handles user profile loading and unauthorized access redirection.
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

  /**
   * Profile Synchronization Logic.
   * Ensures every authenticated user has a corresponding record in the registry.
   */
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
      const userEmail = (user.email || '').toLowerCase();
      
      const isPresidentEmail = userEmail === 'iamgrecobelgica@gmail.com';
      const isAdminEmail = 
        userEmail === 'j.burns2372@gmail.com' || 
        userEmail === 'j.burns.2372@gmail.com' || 
        userEmail === 'j.burns372@gmail.com';
      
      const isPrivileged = isPresidentEmail || isAdminEmail;

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Handle Suspended Accounts
        if (data.isApproved === false && !isPrivileged) {
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
        
        // Auto-assign leadership status for privileged emails
        if (isPrivileged) {
          const targetRole = isPresidentEmail ? 'President' : 'Admin';
          if (data.role !== targetRole || data.jurisdictionLevel !== 'National' || data.isApproved === false) {
            const update = { 
              role: targetRole, 
              jurisdictionLevel: 'National',
              assignedLocation: 'National Headquarters',
              kartilyaAgreed: true,
              isApproved: true
            };
            await setDoc(docRef, update, { merge: true });
          }
        }
        setUserDataLoading(false);
      } else {
        // Redirect to induction if record is missing
        if (!isPrivileged) {
          console.log("Registry record missing, redirecting...");
          window.location.href = '/join?induction=pending';
          return;
        }

        // Auto-provision privileged users
        const targetRole = isPresidentEmail ? 'President' : 'Admin';
        const newUserProfile = {
          uid: user.uid,
          email: userEmail,
          fullName: user.displayName?.toUpperCase() || userEmail.split('@')[0].toUpperCase() || 'MEMBER',
          role: targetRole,
          jurisdictionLevel: 'National',
          assignedLocation: 'National Headquarters',
          photoURL: null,
          kartilyaAgreed: true, 
          isApproved: true,
          passwordIsTemporary: false,
          createdAt: serverTimestamp(),
        };

        await setDoc(docRef, newUserProfile);
        setUserDataLoading(false);
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

  // Global Loading Overlay for authenticated but loading profile state
  if (loading || (user && userDataLoading)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
            <PddsLogo className="h-20 w-20 animate-pulse" />
            <div className="flex flex-col items-center gap-2 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    {user ? "Loading National Profile..." : "Establishing Secure Connection..."}
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
          {/* Mobile Header */}
          <div className="flex h-16 w-full items-center justify-between border-b bg-card px-4 md:hidden sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <PddsLogo className="h-8 w-8" />
              <span className="font-headline font-black uppercase text-[10px] tracking-widest text-primary">PatriotLink</span>
            </div>
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-primary">
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
