"use client";

import React, { useState } from 'react';
import { PDDS_LOGO_URL } from '@/lib/data';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * Features a fixed brand header with a North Star logo placement and full party name.
 * Strictly follows the Senior Architect's minimalist design protocol.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100">
      
      {/* --- THE MASTER HEADER (BRAND LOCKDOWN) --- */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#001f3f] border-b-[3px] border-[#D4AF37] z-[9999] flex items-center px-6 shadow-2xl safe-top">
        
        {/* LOGO & BRAND CONTAINER */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            {!logoError ? (
              <img 
                src={PDDS_LOGO_URL} 
                alt="Official PDDS Logo"
                className="h-14 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.4)] cursor-pointer"
                onClick={() => window.location.href = '/'}
                onError={() => setLogoError(true)}
                crossOrigin="anonymous"
              />
            ) : (
              /* SIMPLE EMERGENCY FALLBACK - Only shows if the image itself fails */
              <span className="text-[#D4AF37] font-black text-2xl tracking-tighter uppercase italic">PDDS</span>
            )}
          </div>

          {/* FULL PARTY NAME TYPOGRAPHY (PEDERALISMO CORRECTED) */}
          <div className="flex flex-col justify-center border-l border-white/20 pl-4 h-10">
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
      {/* pt-24 ensures the header doesn't cover page content */}
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
