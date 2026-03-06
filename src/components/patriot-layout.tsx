"use client";

import React from 'react';
import { PDDSBrandingMaster } from './pdds-branding-master';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * Optimized for brand lockdown and strategic content framing.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100">
      
      {/* THE MASTER BRANDING HUB (FIXED HEADER) */}
      <PDDSBrandingMaster />

      {/* --- CONTENT AREA --- */}
      {/* pt-24 offset ensures content doesn't collide with the fixed master header */}
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
