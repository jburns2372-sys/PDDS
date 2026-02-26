"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState, ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";
import { useUser, useFirestore } from "@/firebase";
import { UserDataContext, UserDataContextType, UserProfile } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export function AppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = useState(false);
  const { user, loading: userLoading } = useUser();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchOrCreateUser = async () => {
        if (!user) {
            if (!userLoading) {
                setUserData(null);
                setUserDataLoading(false);
            }
            return;
        }

        setUserDataLoading(true);
        try {
            const docRef = doc(firestore, "users", user.uid);
            const docSnap = await getDoc(docRef);

            // Recognized high-level emails
            const isPrivileged = user.email === 'iamgrecobelgica@gmail.com' || user.email === 'j.burns2372@gmail.com';

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({ id: docSnap.id, ...data });
                
                // Keep privileged status updated
                if (isPrivileged && (data.role !== 'President' || !data.kartilyaAgreed)) {
                    const update = { 
                        role: 'President', 
                        level: 'National',
                        kartilyaAgreed: true 
                    };
                    await setDoc(docRef, update, { merge: true });
                    setUserData(prev => prev ? { ...prev, ...update } : null);
                }
            } else {
                // Creation flow for first-time login
                const newUserProfile = {
                    uid: user.uid,
                    email: user.email || '',
                    fullName: user.displayName || user.email?.split('@')[0] || 'Member',
                    role: isPrivileged ? 'President' : 'Member',
                    level: 'National',
                    kartilyaAgreed: isPrivileged, 
                    passwordIsTemporary: false,
                    locationName: isPrivileged ? 'National Headquarters' : 'Pending Assignment',
                    createdAt: serverTimestamp(),
                };

                await setDoc(docRef, newUserProfile);
                setUserData({ id: user.uid, ...newUserProfile });
            }
        } catch (error) {
            console.error("Critical error in AppShell profile sync:", error);
            setUserData({
                uid: user.uid,
                email: user.email || '',
                fullName: 'Authenticated Member',
                role: 'Member',
                level: 'National',
                isFallback: true
            });
        } finally {
            setUserDataLoading(false);
        }
    };

    if (user && !userLoading) {
        fetchOrCreateUser();
    } else if (!userLoading && !user) {
        setUserDataLoading(false);
    }
  }, [user, userLoading, firestore]);
  
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