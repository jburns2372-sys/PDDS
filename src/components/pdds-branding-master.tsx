"use client";

import React from 'react';
import { PDDS_LOGO_URL } from '@/lib/data';

/**
 * @fileOverview Master PDDS Branding Component.
 * REFACTORED: Fluid full-width header with maximized typographic nodes.
 */
export function PDDSBrandingMaster() {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#002366] border-b border-white/10 z-[9999] flex items-center px-4 lg:px-12 shadow-2xl safe-top">
      <div className="flex items-center gap-6 h-full w-full">
        
        {/* THE NORTH STAR ANCHOR */}
        <div className="flex items-center justify-center shrink-0 bg-transparent">
          <img 
            src={PDDS_LOGO_URL} 
            alt="Official PDDS Party Logo"
            crossOrigin="anonymous"
            className="h-[60px] w-auto object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95"
            style={{ 
              filter: 'drop-shadow(0px 0px 12px rgba(212, 175, 55, 0.6))' 
            }}
            onClick={() => window.location.href = '/'}
          />
        </div>

        {/* TYPOGRAPHIC NODE - Maximized for Readability */}
        <div className="flex flex-col justify-center border-l-2 border-white/20 pl-6 h-14">
          <span className="text-white font-black text-sm md:text-lg leading-none uppercase tracking-tighter">
            Pederalismo ng Dugong
          </span>
          <span className="text-accent font-black text-sm md:text-lg leading-none uppercase tracking-tighter mt-1.5">
            Dakilang Samahan
          </span>
        </div>

        {/* STRATEGIC CONTEXT */}
        <div className="ml-auto hidden md:block">
          <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">
            National Registry Hub
          </span>
        </div>
      </div>
    </header>
  );
}
