"use client";

import React from 'react';
import PddsLogo from './icons/pdds-logo';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * Features a fixed brand header with absolute-positioned branding anchor.
 * Strictly follows the Senior Architect's branding force-fix protocol.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100">
      
      {/* --- THE MASTER HEADER (BRAND LOCKDOWN) --- */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#001f3f] border-b-[3px] border-[#D4AF37] z-[9999] flex items-center px-6 shadow-2xl safe-top">
        
        {/* FORCE-FIX: PDDS OFFICIAL BRANDING BOX */}
        <div 
          className="flex items-center gap-4" 
          style={{ position: 'absolute', top: '10px', left: '15px', zIndex: 1000 }}
        >
          <div className="relative">
            <PddsLogo 
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => window.location.href = '/'}
            />
          </div>

          {/* FULL PARTY NAME TYPOGRAPHY */}
          <div className="flex flex-col justify-center border-l border-white/20 pl-4 h-12">
            <span className="text-white font-black text-[10px] sm:text-xs leading-none uppercase tracking-tight">
              Pederalismo ng Dugong
            </span>
            <span className="text-[#D4AF37] font-black text-[10px] sm:text-xs leading-none uppercase tracking-tight mt-0.5">
              Dakilang Samahan
            </span>
          </div>
        </div>

        {/* RIGHT SIDE CONTEXT (Minimalist) */}
        <div className="ml-auto hidden md:block">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">
            National Command Center
          </span>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="flex-grow pt-24 px-4 md:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* --- MINIMAL FOOTER --- */}
      <footer className="bg-slate-200 py-3 text-center border-t border-slate-300 safe-bottom">
        <p className="text-[9px] text-slate-500 font-bold tracking-widest opacity-60 uppercase">
          PDDS PATRIOTLINK • 2026
        </p>
      </footer>
    </div>
  );
}
