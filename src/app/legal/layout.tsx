
"use client";

import React from "react";
import Link from "next/link";
import PddsLogo from "@/components/icons/pdds-logo";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PddsLogo className="h-8 w-8" />
            <span className="font-headline font-black uppercase text-xs tracking-widest text-primary">PatriotLink Legal</span>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase tracking-widest">
            <Link href="/join">
              <ChevronLeft className="mr-1 h-3 w-3" /> Back to Induction
            </Link>
          </Button>
        </div>
      </header>
      <main className="py-12 px-4">
        <div className="max-w-3xl mx-auto bg-card rounded-2xl shadow-xl border p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShieldCheck className="h-32 w-32 text-primary" />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-8 flex justify-center gap-6">
          <Link href="/legal/privacy" className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary tracking-widest transition-colors">Privacy Policy</Link>
          <Link href="/legal/terms" className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary tracking-widest transition-colors">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
