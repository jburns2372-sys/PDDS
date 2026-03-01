
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, MessageSquare, Megaphone, Map, Info, Library, Newspaper, LayoutGrid, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useUserData } from "@/context/user-data-context";
import { pddsLeadershipRoles } from "@/lib/data";

const baseNavItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/directory", icon: Users, label: "Directory" },
  { href: "/vault", icon: Library, label: "Vault" },
];

const profileNavItem = { href: "/profile", icon: UserCircle, label: "Profile" };
const auditNavItem = { href: "/admin/audit", icon: MessageSquare, label: "Audit" };
const bulletinNavItem = { href: "/admin/bulletin", icon: Newspaper, label: "Bulletin" };
const logisticsNavItem = { href: "/admin/logistics", icon: LayoutGrid, label: "Logistics" };
const analyticsNavItem = { href: "/admin/analytics", icon: Map, label: "Map" };

export function MobileBottomNav() {
  const pathname = usePathname();
  const { userData, loading: isLoadingRole } = useUserData();
  const userRole = userData?.role || '';

  const isOfficer = pddsLeadershipRoles.includes(userRole) || userRole === 'Officer';
  const isAdmin = userRole === 'Admin' || userRole === 'System Admin';

  const isPrivileged = !isLoadingRole && (isOfficer || isAdmin);
  
  const visibleNavItems = [...baseNavItems];
  if (isPrivileged) {
      if (['Treasurer', 'President', 'Admin', 'System Admin'].includes(userRole)) {
        visibleNavItems.push(logisticsNavItem);
      }
      visibleNavItems.push(auditNavItem);
      visibleNavItems.push(analyticsNavItem);
  }
  visibleNavItems.push(profileNavItem);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div style={{gridTemplateColumns: `repeat(${visibleNavItems.length}, 1fr)`}} className={`grid h-16 items-center justify-around`}>
        {visibleNavItems.map((item: any) => {
          if (item.isDialog) {
            return (
              <AboutPddsDialog key={item.href}>
                <button className={cn(
                  "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary"
                )}>
                  <item.icon className="h-5 w-5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
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
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
