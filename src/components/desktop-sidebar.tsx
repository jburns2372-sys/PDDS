
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, Shield, Info, MessageSquare, Megaphone, Map, Library, QrCode, Calendar, ListChecks, Gavel, Newspaper, LayoutGrid, MessageCircle, GraduationCap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import PddsLogo from "./icons/pdds-logo";
import { Separator } from "./ui/separator";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useUserData } from "@/context/user-data-context";
import { pddsLeadershipRoles } from "@/lib/data";

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/chat', label: 'Town Square', icon: MessageCircle },
  { href: '/academy', label: 'Academy', icon: GraduationCap },
  { href: '/bantay-bayan', label: 'Bantay Bayan', icon: Eye },
  { href: '/policies', label: 'Manifestos', icon: GraduationCap },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/calendar', label: 'Activities', icon: Calendar },
  { href: '/agendas', label: 'Agendas', icon: BookText },
  { href: '/vault', label: 'Document Vault', icon: Library },
  { href: '/governance', label: 'Command Manual', icon: Gavel },
];

const adminNavItems = [
    { href: '/admin/dashboard', label: 'Officer Panel', icon: Shield },
    { href: '/admin/supporters', label: 'Supporter List', icon: ListChecks },
    { href: '/admin/bulletin', label: 'Bulletin', icon: Newspaper },
    { href: '/admin/logistics', label: 'Logistics', icon: LayoutGrid },
    { href: '/admin/scanner', label: 'Event Scanner', icon: QrCode },
    { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { href: '/admin/audit', label: 'Audit Queue', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Heat Map', icon: Map }
];

export function DesktopSidebarContent() {
  const pathname = usePathname();
  const { userData, loading: isLoadingRole } = useUserData();
  const userRole = userData?.role || '';

  const isOfficer = pddsLeadershipRoles.includes(userRole) || userRole === 'Officer';
  const isAdmin = userRole === 'Admin' || userRole === 'System Admin';

  const isPrivileged = !isLoadingRole && (isOfficer || isAdmin);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-24 flex-col items-center justify-center px-6 py-4">
        <div className="bg-white p-1 rounded-full shadow-md border border-[#D4AF37]">
            <PddsLogo className="h-12 w-12" />
        </div>
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
                  if (item.href === '/admin/logistics' && !['Treasurer', 'President', 'Admin', 'System Admin'].includes(userRole)) return null;

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
        <div className="pt-4 mt-auto border-t">
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
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card md:flex">
      <DesktopSidebarContent />
    </aside>
  );
}
