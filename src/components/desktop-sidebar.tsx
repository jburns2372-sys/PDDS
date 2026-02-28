
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, Shield, Info, MessageSquare, Megaphone, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import PddsLogo from "./icons/pdds-logo";
import { Separator } from "./ui/separator";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useUserData } from "@/context/user-data-context";
import { pddsLeadershipRoles } from "@/lib/data";

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/agendas', label: 'Agendas', icon: BookText },
];

const adminNavItems = [
    { href: '/admin/dashboard', label: 'Officer Panel', icon: Shield },
    { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { href: '/admin/audit', label: 'Audit Queue', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Heat Map', icon: Map }
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, userData, loading: isLoadingRole } = useUserData();
  const userRole = userData?.role || '';
  const userEmail = (user?.email || '').toLowerCase();

  const isOfficer = pddsLeadershipRoles.includes(userRole) || userRole === 'Officer';
  const isAdmin = userRole === 'Admin' || userRole === 'System Admin';
  const isPrivilegedEmail = 
    userEmail === 'iamgrecobelgica@gmail.com' ||
    userEmail === 'j.burns372@gmail.com' ||
    userEmail === 'j.burns2372@gmail.com';

  const isPrivileged = !isLoadingRole && (isOfficer || isAdmin || isPrivilegedEmail);
  
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="bg-white p-1 rounded-full shadow-sm">
            <PddsLogo className="h-8 w-8" />
        </div>
        <span className="text-xl font-black tracking-tight text-primary font-headline uppercase">
          PDDS PORTAL
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
                    "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground uppercase text-xs font-bold tracking-widest",
                    isActive && "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-l-none"
                )}
                >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                </Link>
            );
            })}
             <AboutPddsDialog>
                <button
                    className={cn(
                        "flex w-full items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground uppercase text-xs font-bold tracking-widest"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Info className="h-4 w-4" />
                        <span>About PDDS</span>
                    </div>
                </button>
            </AboutPddsDialog>
            
            {isPrivileged && (
              <>
                <div className="px-4 py-2 mt-6 mb-1 text-[10px] font-black uppercase text-primary/40 tracking-[0.2em]">Leadership Tools</div>
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                      <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                          "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground uppercase text-xs font-bold tracking-widest",
                          isActive && "bg-primary/10 text-primary font-bold border-l-4 border-primary rounded-l-none"
                      )}
                      >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      </Link>
                  );
                })}
              </>
            )}
        </div>
        <div>
            <div className="px-4 py-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">
                Member ID: {isLoadingRole ? '...' : (userData?.uid?.substring(0, 8) || 'Unknown')}
            </div>
             <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-accent/50 hover:text-accent-foreground uppercase text-xs font-bold tracking-widest",
                pathname.startsWith('/profile') && "bg-primary/10 text-primary font-bold"
              )}
            >
              <UserCircle className="h-4 w-4" />
              <span>My Profile</span>
            </Link>
        </div>
      </nav>
    </aside>
  );
}
