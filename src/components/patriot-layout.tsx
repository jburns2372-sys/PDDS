"use client";

import React, { useState } from 'react';
import { PDDS_LOGO_URL } from '@/lib/data';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * Features a fixed brand header with a North Star logo placement and full party name.
 * Strictly follows the Senior Architect's branding force-fix protocol.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100">
      
      {/* --- THE MASTER HEADER (BRAND LOCKDOWN) --- */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#001f3f] border-b-[3px] border-[#D4AF37] z-[9999] flex items-center px-6 shadow-2xl safe-top">
        
        {/* FORCE-FIX: PDDS OFFICIAL LOGO BRANDING BOX */}
        <div 
          className="flex items-center gap-4" 
          style={{ position: 'absolute', top: '10px', left: '15px', zIndex: 1000 }}
        >
          <div className="relative" style={{ minWidth: '50px' }}>
            {!logoError ? (
              <img 
                src={PDDS_LOGO_URL} 
                alt="PDDS Official"
                style={{
                  height: '50px',
                  width: 'auto',
                  display: 'block',
                  filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))',
                  pointerEvents: 'auto'
                }}
                className="object-contain cursor-pointer transition-transform hover:scale-105"
                onClick={() => window.location.href = '/'}
                onLoad={() => console.log("✅ PDDS Logo successfully anchored.")}
                onError={(e) => {
                  console.error("Logo still blocked. Check if 'Publish' was clicked in Firebase Rules.");
                  setLogoError(true);
                }}
                crossOrigin="anonymous"
              />
            ) : (
              /* EMERGENCY FALLBACK */
              <span className="text-[#D4AF37] font-black text-2xl tracking-tighter uppercase italic">PDDS</span>
            )}
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
