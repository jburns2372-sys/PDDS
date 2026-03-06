"use client";

import { useState } from "react";
import Link from "next/link";
import PddsLogo from "./icons/pdds-logo";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DesktopSidebarContent } from "./desktop-sidebar";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Global Tactical Header for PatriotLink.
 * Features fixed logo geometry, z-index hardening, and fail-safe branding.
 */
export function MainHeader() {
  const [logoError, setLogoError] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-white/10 bg-primary px-4 shrink-0 shadow-xl safe-top relative z-[50]">
      {/* Clickable Brand Area */}
      <Link href="/home" className="flex items-center gap-3 active:scale-95 transition-all group">
        {!logoError ? (
          <PddsLogo 
            className="h-[45px] w-auto border border-white/20 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-shadow" 
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-accent font-black text-sm md:text-lg tracking-tighter uppercase italic drop-shadow-md animate-in fade-in duration-500">
            PDDS PatriotLink
          </span>
        )}
      </Link>

      {/* Mobile Drawer Trigger */}
      <div className="md:hidden">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-white active:bg-white/10 rounded-lg transition-colors outline-none">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-72 p-0 border-none bg-card shadow-2xl">
            <div className="h-full py-4 overflow-y-auto custom-scrollbar">
              <DesktopSidebarContent onClose={() => setIsDrawerOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Connection Indicator (Visual Polish) */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Secure Node Active</span>
      </div>
    </header>
  );
}
