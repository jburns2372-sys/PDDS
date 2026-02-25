"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";

const navItems: {
    href: string;
    icon: React.ElementType;
    label: string;
    adminOnly?: boolean;
    isDialog?: boolean;
}[] = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/directory", icon: Users, label: "Directory" },
  { href: "/agendas", icon: BookText, label: "Agendas" },
  { href: "/about", icon: Info, label: "About", isDialog: true },
  { href: "/admin", icon: Shield, label: "Admin Panel", adminOnly: true },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const firestore = useFirestore();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Current Auth User UID:", user?.uid);
      if (user) {
        const docRef = doc(firestore, "users", user.uid);
        try {
          const docSnap = await getDoc(docRef);
          console.log("Firestore Doc Exists?", docSnap.exists());
          if (docSnap.exists()) {
            const role = docSnap.data().role;
            console.log("Fetched Role Data:", role);
            setUserRole(role);
          } else {
            console.log("Fetched Role Data:", undefined);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Any Errors:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setIsLoadingRole(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const isAdmin = !isLoadingRole && (userRole === 'President' || userRole === 'Admin');
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div style={{gridTemplateColumns: `repeat(${visibleNavItems.length}, 1fr)`}} className={`grid h-16 items-center justify-around`}>
        {visibleNavItems.map((item) => {
          if (item.isDialog) {
            return (
              <AboutPddsDialog key={item.href}>
                <button className={cn(
                  "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary"
                )}>
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </AboutPddsDialog>
            );
          }
          
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary",
                isActive && "text-primary"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
