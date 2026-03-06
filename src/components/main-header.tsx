"use client";

import { useState } from "react";
import Link from "next/link";
import { PDDS_LOGO_URL } from "@/lib/data";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DesktopSidebarContent } from "./desktop-sidebar";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Global MainHeader Protocol.
 * features fixed height logo (45px), z-index hardening (50), and a Gold text safety fallback.
 * Optimized for horizontal and vertical visibility on all platforms.
 */
export function MainHeader() {
  const [logoError, setLogoError] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[50] flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#002366] px-4 shrink-0 shadow-2xl safe-top">
      {/* Clickable Brand Anchor */}
      <Link href="/home" className="flex items-center gap-3 active:scale-95 transition-all group">
        {!logoError ? (
          <div className="relative flex items-center justify-center">
            {/* Tactical Pop Effect: White border and subtle glow */}
            <img 
              src={PDDS_LOGO_URL} 
              alt="Official PDDS Party Logo"
              style={{ height: '45px', width: 'auto' }}
              className="aspect-square object-contain rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all group-hover:scale-105"
              onError={() => setLogoError(true)}
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          /* Safety Fallback: Bold Gold Typography (#D4AF37) */
          <span className="text-[#D4AF37] font-black text-lg tracking-tighter uppercase italic drop-shadow-md animate-in fade-in duration-500">
            PDDS PATRIOTLINK
          </span>
        )}
      </Link>

      {/* Mobile Command Toggle */}
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

      {/* Connectivity Status (Strategic Visual Only) */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">National Command Active</span>
      </div>
    </header>
  );
}
