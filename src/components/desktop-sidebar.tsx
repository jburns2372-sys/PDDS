"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookText, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import PddsLogo from "./icons/pdds-logo";
import { Separator } from "./ui/separator";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/directory", icon: Users, label: "Directory" },
  { href: "/agendas", icon: BookText, label: "Agendas" },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        <PddsLogo className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold tracking-tight text-primary font-headline">
          Federalismo Portal
        </span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-2 p-4">
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
      </nav>
    </aside>
  );
}
