"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import PddsLogo from "./icons/pdds-logo";
import { Separator } from "./ui/separator";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "./ui/button";

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/agendas', label: 'Agendas', icon: BookText },
];

const adminNavItems = [
    { href: '/admin', label: 'Admin Panel', icon: Shield }
];

export function DesktopSidebar() {
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


  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        <PddsLogo className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold tracking-tight text-primary font-headline">
          Federalismo Portal
        </span>
      </div>
      <Separator />
      <nav className="flex flex-col flex-1 justify-between p-4">
        <div className="space-y-2">
            {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground",
                    isActive && "bg-primary/10 text-primary font-semibold"
                )}
                >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                </Link>
            );
            })}
             <AboutPddsDialog>
                <button
                    className={cn(
                        "flex w-full items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                >
                    <Info className="h-5 w-5" />
                    <span>About PDDS</span>
                </button>
            </AboutPddsDialog>
            {adminNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground",
                    isActive && "bg-primary/10 text-primary font-semibold"
                )}
                >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                </Link>
            );
            })}
        </div>
        <div>
            <div className="px-4 py-2 text-xs text-muted-foreground">
                [Current Role: {userRole || 'None'}]
            </div>
             <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground",
                pathname.startsWith('/profile') && "bg-primary/10 text-primary font-semibold"
              )}
            >
              <UserCircle className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <div className="p-2">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => setUserRole('President')}>
                    Force Admin Mode
                </Button>
            </div>
        </div>
      </nav>
    </aside>
  );
}
