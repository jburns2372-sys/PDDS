"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useEffect, useState, ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";
import { useUser, useFirestore } from "@/firebase";
import { UserDataContext, UserDataContextType, UserProfile } from "@/context/user-data-context";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

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
        if (user) {
            setUserDataLoading(true);
            try {
                // "God Mode" script to auto-grant rights before fetching
                if (user.email === 'iamgrecobelgica@gmail.com') {
                    const userDocRefGod = doc(firestore, "users", user.uid);
                    await setDoc(userDocRefGod, { role: "President", level: "National" }, { merge: true });
                }

                // 1. Try to fetch by UID
                const docRef = doc(firestore, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUserData({ id: docSnap.id, ...docSnap.data() });
                } else {
                    // 2. Not found by UID, try by email
                    const q = query(collection(firestore, 'users'), where('email', '==', user.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        // Found by email - this is an edge case. For now, use its data.
                        const userDoc = querySnapshot.docs[0];
                        setUserData({ id: userDoc.id, ...userDoc.data() });
                    } else {
                        // 3. CRITICAL FALLBACK: Create profile
                        const newUserProfile = {
                            uid: user.uid,
                            email: user.email,
                            fullName: user.displayName || user.email || '',
                            role: 'Member',
                            level: 'National',
                            kartilyaAgreed: false,
                            passwordIsTemporary: false,
                            locationName: '',
                            createdAt: serverTimestamp(),
                        };
                        await setDoc(doc(firestore, "users", user.uid), newUserProfile);
                        setUserData({ id: user.uid, ...newUserProfile });
                    }
                }
            } catch (error) {
                console.error("Error fetching or creating user document:", error);
                // Graceful fallback in case of permissions errors etc.
                const fallbackProfile = {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || user.email,
                    role: 'Member'
                };
                setUserData(fallbackProfile);
            } finally {
                setUserDataLoading(false);
            }
        } else if (!userLoading) {
            // No user is logged in
            setUserData(null);
            setUserDataLoading(false);
        }
    };

    fetchOrCreateUser();
  }, [user, userLoading, firestore]);
  
  const loading = !isClient || userLoading || userDataLoading;

  useEffect(() => {
      // This acts as a guard for all pages under the (main) layout
      if (!loading && !user) {
          router.push('/login');
      }
  }, [loading, user, router]);

  // While loading or if no user is authenticated, show a full-page skeleton.
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
        {isMobile ? <MobileBottomNav /> : <DesktopSidebar />}
        <main className="flex-1 bg-background pb-16 md:pb-0">
            {children}
        </main>
        </div>
    </UserDataContext.Provider>
  );
}
