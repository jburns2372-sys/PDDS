
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

    // Use onSnapshot for real-time synchronization and "Bouncer" security logic
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      const userEmail = (user.email || '').toLowerCase();
      const isPresidentEmail = userEmail === 'iamgrecobelgica@gmail.com';
      const isAdminEmail = userEmail === 'j.burns2372@gmail.com' || userEmail === 'j.burns.2372@gmail.com' || userEmail === 'j.burns372@gmail.com';
      const isPrivileged = isPresidentEmail || isAdminEmail;

      if (docSnap.exists()) {
        const data = docSnap.data();

        // BOUNCER CHECK: Suspend account if isApproved is explicitly set to false
        if (data.isApproved === false && !isPrivileged) {
          await auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Your account has been disabled by an Administrator."
          });
          router.push('/login');
          return;
        }

        setUserData({ id: docSnap.id, ...data });
        
        // Ensure privileged users have correct schema and roles if they exist but are misconfigured
        if (isPrivileged) {
          const targetRole = isPresidentEmail ? 'President' : 'Admin';
          if (data.role !== targetRole || data.jurisdictionLevel !== 'National' || !data.isApproved) {
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
        // BOUNCER CHECK: Sign out if the document doesn't exist (unless it's a privileged user)
        if (!isPrivileged) {
          await auth.signOut();
          toast({
            variant: "destructive",
            title: "Account Removed",
            description: "Your account has been removed or disabled by an Administrator."
          });
          router.push('/login');
          return;
        }

        // Initialize new user document for privileged emails if it somehow got deleted
        const targetRole = isPresidentEmail ? 'President' : 'Admin';
        const newUserProfile = {
          uid: user.uid,
          email: userEmail,
          fullName: user.displayName || userEmail.split('@')[0] || 'Member',
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
      console.error("Critical error in AppShell profile sync:", error);
      setUserData({
        uid: user.uid,
        email: user.email || '',
        fullName: 'Authenticated Member',
        role: 'Member',
        jurisdictionLevel: 'National',
        isApproved: true,
        isFallback: true
      });
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
        <div className="flex min-h-screen w-full">
        {isMobile ? <MobileBottomNav /> : <DesktopSidebar />}
        <main className="flex-1 bg-background pb-16 md:pb-0">
            {children}
        </main>
        </div>
    </UserDataContext.Provider>
  );
}
