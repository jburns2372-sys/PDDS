
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
            // Directly attempt to fetch by UID - this is the most efficient path
            const docRef = doc(firestore, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserData({ id: docSnap.id, ...docSnap.data() });
            } else {
                // Not found: Create new profile immediately without searching by email
                // to save a database round-trip.
                const newUserProfile = {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || user.email || '',
                    role: user.email === 'iamgrecobelgica@gmail.com' ? 'President' : 'Member',
                    level: 'National',
                    kartilyaAgreed: false,
                    passwordIsTemporary: false,
                    locationName: '',
                    createdAt: serverTimestamp(),
                };

                await setDoc(docRef, newUserProfile);
                setUserData({ id: user.uid, ...newUserProfile });
            }
        } catch (error) {
            console.warn("Firestore fetch error, using fallback state.", error);
            setUserData({
                uid: user.uid,
                email: user.email,
                fullName: user.displayName || user.email || '',
                role: 'Member',
                level: 'National',
                isFallback: true
            });
        } finally {
            setUserDataLoading(false);
        }
    };

    fetchOrCreateUser();
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
                 <div className="pt-8">
                    <Skeleton className="h-64 w-full" />
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
