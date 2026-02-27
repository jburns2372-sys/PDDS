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
import { pddsLeadershipRoles } from "@/lib/data";

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

            // Recognized high-level developer/admin emails
            const isPresidentEmail = user.email === 'iamgrecobelgica@gmail.com';
            const isAdminEmail = user.email === 'j.burns2372@gmail.com' || user.email === 'j.burns.2372@gmail.com';
            const isPrivileged = isPresidentEmail || isAdminEmail;

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({ id: docSnap.id, ...data });
                
                // Keep privileged status updated
                if (isPrivileged) {
                    const targetRole = isPresidentEmail ? 'President' : 'Admin';
                    if (data.role !== targetRole || !data.isApproved) {
                        const update = { 
                            role: targetRole, 
                            level: 'National',
                            locationName: 'National Headquarters',
                            kartilyaAgreed: true,
                            isApproved: true
                        };
                        await setDoc(docRef, update, { merge: true });
                        setUserData(prev => prev ? { ...prev, ...update } : null);
                    }
                }
            } else {
                // Creation flow for first-time login
                const targetRole = isPresidentEmail ? 'President' : (isAdminEmail ? 'Admin' : 'Member');
                const newUserProfile = {
                    uid: user.uid,
                    email: user.email || '',
                    fullName: user.displayName || user.email?.split('@')[0] || 'Member',
                    role: targetRole,
                    level: 'National',
                    locationName: isPrivileged ? 'National Headquarters' : 'Pending Assignment',
                    avatarUrl: null,
                    kartilyaAgreed: isPrivileged, 
                    isApproved: true,
                    passwordIsTemporary: false,
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
                isApproved: true,
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
