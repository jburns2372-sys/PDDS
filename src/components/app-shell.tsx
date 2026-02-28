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
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PddsLogo from "./icons/pdds-logo";
import { DesktopSidebarContent } from "./desktop-sidebar";

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
          router.push('/login');
          return;
        }

        setUserData({ id: docSnap.id, ...data });
        
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
      } else {
        // FIX: If authenticated but no Firestore doc, redirect to induction rather than signing out
        if (!isPrivileged) {
          console.log("Account record missing, redirecting to induction...");
          router.push('/join?induction=pending');
          setUserDataLoading(false);
          return;
        }

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
      }
      setUserDataLoading(false);
    }, (error) => {
      console.error("Critical error in Bouncer profile sync:", error);
      setUserDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, userLoading, firestore, auth, toast, router]);
  
  const loading = !isClient || userLoading || userDataLoading;

  useEffect(() => {
      if (!loading && !user) {
          router.push('/login');
      }
  }, [loading, user, router]);

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
            </div>
        </main>
      </div>
    );
  }
  
  const contextValue: UserDataContextType = {
      user,
      userData,
      loading
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
