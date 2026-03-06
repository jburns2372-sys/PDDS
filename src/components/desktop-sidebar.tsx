"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle, Shield, Info, MessageSquare, Megaphone, Map, Library, QrCode, Calendar, ListChecks, Gavel, Newspaper, LayoutGrid, Hexagon, GraduationCap, Eye, Landmark, Wallet, ShieldCheck, Lock, FileText, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import PddsLogo from "./icons/pdds-logo";
import { Separator } from "./ui/separator";
import { AboutPddsDialog } from "./about-pdds-dialog";
import { useUserData } from "@/context/user-data-context";
import { pddsLeadershipRoles } from "@/lib/data";

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/patriot-pondo', label: 'PatriotPondo', icon: Landmark },
  { href: '/chat', label: 'PatriotHub', icon: Hexagon },
  { href: '/academy', label: 'PDDS Academy', icon: GraduationCap },
  { href: '/bantay-bayan', label: 'Bantay Bayan', icon: Eye },
  { href: '/policies', label: 'Manifestos', icon: GraduationCap },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/calendar', label: 'Activities', icon: Calendar },
  { href: '/agendas', label: 'Agendas', icon: BookText },
  { href: '/vault', label: 'Document Vault', icon: Library },
];

const adminNavItems = [
    { href: '/admin/dashboard', label: 'Officer Panel', icon: Shield },
    { href: '/admin/pondo', label: 'Vault Command', icon: Wallet },
    { href: '/admin/supporters', label: 'Supporter List', icon: ListChecks },
    { href: '/admin/bulletin', label: 'Bulletin', icon: Newspaper },
    { href: '/admin/logistics', label: 'Logistics', icon: LayoutGrid },
    { href: '/admin/scanner', label: 'Event Scanner', icon: QrCode },
    { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
    { href: '/admin/audit', label: 'Audit Queue', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Heat Map', icon: Map }
];

const secGenNavItems = [
  { href: '/admin/vetting', label: 'National Vetting', icon: ShieldCheck },
  { href: '/admin/security', label: 'Security Center', icon: Lock }
];

interface DesktopSidebarContentProps {
  onClose?: () => void;
}

export function DesktopSidebarContent({ onClose }: DesktopSidebarContentProps) {
  const pathname = usePathname();
  const { userData, loading: isLoadingRole } = useUserData();
  const userRole = userData?.role || '';

  const isOfficer = pddsLeadershipRoles.includes(userRole) || userRole === 'Officer';
  const isAdmin = userRole === 'Admin' || userRole === 'System Admin';
  const isSecGen = userRole === 'Secretary General' || userRole === 'Sec Gen' || userRole === 'President' || userData?.isSuperAdmin;

  const isPrivileged = !isLoadingRole && (isOfficer || isAdmin);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-32 flex-col items-center justify-center px-6 py-4">
        <PddsLogo className="h-20 w-auto shadow-none opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>
      <Separator className="bg-primary/5" />
      <nav className="flex flex-col flex-1 justify-between p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
            {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
                <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary uppercase text-[10px] font-bold tracking-widest",
                    isActive && "bg-primary/10 text-primary font-black border-l-4 border-primary rounded-l-none"
                )}
                >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                </Link>
            );
            })}
             <AboutPddsDialog>
                <button
                    type="button"
                    className={cn(
                        "flex w-full items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary uppercase text-[10px] font-bold tracking-widest"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Info className="h-4 w-4" />
                        <span>About PDDS</span>
                    </div>
                </button>
            </AboutPddsDialog>
            
            {isSecGen && (
              <>
                <div className="px-4 py-2 mt-6 mb-1 text-[9px] font-black uppercase text-red-600 tracking-[0.2em] opacity-60">Sec-Gen Command</div>
                {secGenNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                      <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                          "flex items-center gap-3 rounded-md px-4 py-3 text-red-400 transition-all hover:bg-red-600/5 hover:text-red-500 uppercase text-[10px] font-bold tracking-widest",
                          isActive && "bg-red-600/10 text-red-500 font-black border-l-4 border-red-600 rounded-l-none"
                      )}
                      >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      </Link>
                  );
                })}
              </>
            )}

            {isPrivileged && (
              <>
                <div className="px-4 py-2 mt-6 mb-1 text-[9px] font-black uppercase text-primary/40 tracking-[0.2em]">Leadership Tools</div>
                {adminNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  if (item.href === '/admin/logistics' && !['Treasurer', 'President', 'Admin', 'System Admin'].includes(userRole)) return null;
                  if (item.href === '/admin/pondo' && !['Treasurer', 'President', 'Admin', 'System Admin'].includes(userRole)) return null;

                  return (
                      <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                          "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary uppercase text-[10px] font-bold tracking-widest",
                          isActive && "bg-primary/10 text-primary font-black border-l-4 border-primary rounded-l-none"
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
        <div className="pt-4 mt-auto border-t space-y-4">
            <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary uppercase text-[10px] font-bold tracking-widest",
                    pathname.startsWith('/profile') && "bg-primary/10 text-primary font-black"
                  )}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
            </div>

            {/* Legal Footer Section */}
            <div className="px-4 py-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/40 mb-3">RA 10173 Compliance</p>
                <div className="space-y-3">
                    <Link href="/legal/privacy" className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase">
                        <Scale className="h-3 w-3" /> Privacy Policy
                    </Link>
                    <Link href="/legal/terms" className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase">
                        <FileText className="h-3 w-3" /> Terms of Service
                    </Link>
                </div>
            </div>
        </div>
      </nav>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card md:flex shadow-inner">
      <DesktopSidebarContent />
    </aside>
  );
}
