"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  ShieldAlert, 
  FileText, 
  Database,
  Banknote, 
  UserPlus,
  QrCode,
  History // Added for the Logs
} from "lucide-react";

const navItems = [
  { title: "Home", href: "/home", icon: Home },
  { title: "PatriotPondo", href: "/contribute", icon: Banknote },
  { title: "PatriotHub", href: "/hub", icon: LayoutDashboard },
  { title: "PDDS Academy", href: "/academy", icon: BookOpen },
  { title: "Bantay Bayan", href: "/report", icon: ShieldAlert },
];

const adminItems = [
  { title: "Directory", href: "/admin/directory", icon: Users },
  { title: "Activities", href: "/admin/activities", icon: Calendar },
  { title: "Agendas", href: "/admin/agendas", icon: FileText },
  { title: "Document Vault", href: "/admin/vault", icon: Database },
  { title: "Collection Ledger", href: "/admin/collections", icon: Banknote },
  { title: "Member Approvals", href: "/admin/approvals", icon: UserPlus },
  { title: "QR Scanner", href: "/admin/scanner", icon: QrCode },
  { title: "Command Logs", href: "/admin/logs", icon: History }, // NEW LINK ADDED
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r bg-white h-screen flex flex-col p-4 shadow-sm">
      {/* --- LOGO / BRANDING --- */}
      <div className="mb-8 px-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Navigation</h2>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {/* --- GENERAL NAVIGATION --- */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
              pathname === item.href 
                ? "bg-slate-50 text-[#002366] shadow-sm" 
                : "text-slate-400 hover:text-[#002366] hover:bg-slate-50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}

        {/* --- SEC-GEN COMMAND SECTION --- */}
        <div className="mt-10 mb-4 px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600">SEC-GEN COMMAND</h2>
        </div>

        {adminItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
              pathname === item.href 
                ? "bg-red-50 text-red-700 shadow-sm" 
                : "text-slate-400 hover:text-red-600 hover:bg-red-50/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>
      
      {/* --- FOOTER --- */}
      <div className="mt-auto border-t pt-4 px-2">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Logged in as Sec-Gen</p>
      </div>
    </div>
  );
}