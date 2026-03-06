"use client";

import React from 'react';
import { PDDS_LOGO_URL } from '@/lib/data';

/**
 * @fileOverview Master PDDS Branding Component.
 * Established as the single source of authority for the top header branding.
 */
export function PDDSBrandingMaster() {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#001f3f] border-b-[3px] border-[#D4AF37] z-[9999] flex items-center px-6 shadow-2xl safe-top">
      <div className="flex items-center gap-4 h-full">
        
        {/* THE NORTH STAR ANCHOR */}
        <div className="flex items-center justify-center shrink-0">
          <img 
            src={PDDS_LOGO_URL} 
            alt="Official PDDS Party Logo"
            crossOrigin="anonymous"
            className="h-[55px] w-auto object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95"
            style={{ 
              filter: 'drop-shadow(0px 0px 12px rgba(212, 175, 55, 0.6))' 
            }}
            onClick={() => window.location.href = '/'}
          />
        </div>

        {/* TYPOGRAPHIC NODE */}
        <div className="flex flex-col justify-center border-l border-white/20 pl-4 h-12">
          <span className="text-white font-black text-[10px] sm:text-xs leading-none uppercase tracking-tight">
            Pederalismo ng Dugong
          </span>
          <span className="text-[#D4AF37] font-black text-[10px] sm:text-xs leading-none uppercase tracking-tight mt-0.5">
            Dakilang Samahan
          </span>
        </div>

        {/* STRATEGIC CONTEXT */}
        <div className="ml-auto hidden md:block">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">
            National Command Center
          </span>
        </div>
      </div>
    </header>
  );
}
