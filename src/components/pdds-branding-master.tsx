"use client";

import React from 'react';
import { PDDS_LOGO_URL } from '@/lib/data';

/**
 * @fileOverview Master PDDS Branding Component.
 * Established as the single source of authority for the top header branding.
 * REFACTORED: Full-width fluid header with edge-to-edge coverage and maximized text.
 */
export function PDDSBrandingMaster() {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#002366] border-b border-white/10 z-[9999] flex items-center px-4 lg:px-10 shadow-2xl safe-top">
      <div className="flex items-center gap-4 h-full w-full">
        
        {/* THE NORTH STAR ANCHOR - Background-free container */}
        <div className="flex items-center justify-center shrink-0 bg-transparent">
          <img 
            src={PDDS_LOGO_URL} 
            alt="Official PDDS Party Logo"
            crossOrigin="anonymous"
            className="h-[55px] w-auto object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95"
            style={{ 
              filter: 'drop-shadow(0px 0px 8px rgba(212, 175, 55, 0.4))' 
            }}
            onClick={() => window.location.href = '/'}
          />
        </div>

        {/* TYPOGRAPHIC NODE - Maximized Readability */}
        <div className="flex flex-col justify-center border-l border-white/10 pl-4 h-12">
          <span className="text-white font-black text-xs sm:text-sm leading-none uppercase tracking-tight">
            Pederalismo ng Dugong
          </span>
          <span className="text-accent font-black text-xs sm:text-sm leading-none uppercase tracking-tight mt-1">
            Dakilang Samahan
          </span>
        </div>

        {/* STRATEGIC CONTEXT */}
        <div className="ml-auto hidden md:block">
          <span className="text-xs font-black text-white/60 uppercase tracking-[0.3em]">
            National Command Center
          </span>
        </div>
      </div>
    </header>
  );
}