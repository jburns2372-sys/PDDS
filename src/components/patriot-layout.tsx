"use client";

import React from 'react';
import { PDDSBrandingMaster } from './pdds-branding-master';

/**
 * @fileOverview Global Patriot Layout Wrapper.
 * REFACTORED: Maximum space utilization with fluid edge-to-edge coverage.
 */
export default function PatriotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white overflow-x-hidden">
      
      {/* THE MASTER BRANDING HUB */}
      <PDDSBrandingMaster />

      {/* --- CONTENT AREA --- */}
      {/* Adaptive padding: px-4 mobile, px-12 desktop */}
      <main className="flex-grow pt-24 pb-10 safe-left safe-right px-4 lg:px-12">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* --- MINIMAL FOOTER --- */}
      <footer className="bg-slate-50 py-6 text-center border-t border-slate-200 safe-bottom">
        <p className="text-xs text-primary/40 font-black tracking-[0.3em] uppercase">
          PDDS PATRIOTLINK • NATIONAL COMMAND CENTER • 2026
        </p>
      </footer>
    </div>
  );
}
