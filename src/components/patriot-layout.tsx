"use client";

import React from 'react';
import { PDDSBrandingMaster } from './pdds-branding-master';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * REFACTORED: Fluid full-width architecture with responsive desktop padding and safe-area security.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100 overflow-x-hidden">
      
      {/* THE MASTER BRANDING HUB (FIXED HEADER) */}
      <PDDSBrandingMaster />

      {/* --- CONTENT AREA --- */}
      {/* pt-20 offset ensures content doesn't collide with the fixed master header */}
      {/* Edge-to-edge removal of max-w-7xl. Adaptive padding px-4/px-10 */}
      <main className="flex-grow pt-20 pb-10 safe-left safe-right">
        <div className="w-full">
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