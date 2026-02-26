"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import PddsLogo from "./icons/pdds-logo";
import { Separator } from "./ui/separator";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useUserData } from "@/context/user-data-context";

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
  const { user, userData, loading: isLoadingRole } = useUserData();
  const userRole = userData?.role;
  const userEmail = user?.email;

  const isPrivileged = !isLoadingRole && (
    userRole === 'President' || 
    userRole === 'Admin' || 
    userRole === 'System Admin' ||
    userEmail === 'iamgrecobelgica@gmail.com' ||
    userEmail === 'j.burns2372@gmail.com'
  );
  
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
            {isPrivileged && adminNavItems.map((item) => {
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
                [Role: {isLoadingRole ? 'Loading...' : userRole || 'Member'}]
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
        </div>
      </nav>
    </aside>
  );
}
