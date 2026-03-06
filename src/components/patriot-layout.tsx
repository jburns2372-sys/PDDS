"use client";

import React, { useState } from 'react';
import { PDDS_LOGO_URL } from '@/lib/data';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * Features a fixed brand header with a North Star logo placement and typographic fallback.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      
      {/* --- THE MASTER HEADER (BRAND LOCKDOWN) --- */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#001f3f] border-b-[3px] border-[#D4AF37] z-[9999] flex items-center px-6 shadow-2xl safe-top">
        
        {/* LOGO CONTAINER */}
        <div className="flex items-center space-x-4">
          {!logoError ? (
            <img 
              src={PDDS_LOGO_URL} 
              alt="Official PDDS Logo"
              style={{ height: '50px' }}
              className="w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all hover:scale-105"
              onError={() => setLogoError(true)}
              crossOrigin="anonymous"
            />
          ) : (
            /* FALLBACK: Displays if the link is broken */
            <div className="flex flex-col">
              <span className="text-xl font-black text-[#D4AF37] tracking-tighter leading-none italic uppercase">
                PDDS OFFICIAL
              </span>
              <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase opacity-60">
                PatriotLink Command
              </span>
            </div>
          )}
        </div>

        {/* DASHBOARD TITLE (Contextual) */}
        <div className="ml-auto hidden md:block">
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">
            National Command Center
          </span>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      {/* pt-20 ensures the header doesn't cover page content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* --- MASTER FOOTER --- */}
      <footer className="bg-slate-200 py-6 text-center border-t border-slate-300 safe-bottom">
        <p className="text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase">
          FEDERALISMO NG DUGONG DAKILANG SAMAHAN © 2026
        </p>
      </footer>
    </div>
  );
};
