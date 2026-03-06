"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { Download, ShieldCheck, Award, MapPin } from "lucide-react";
import PddsLogo from "./icons/pdds-logo";

interface CertificateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  completionDate: string;
}

/**
 * @fileOverview official Academy Graduate Certificate.
 * High-fidelity credential for movement leaders.
 */
export function CertificateDialog({ isOpen, onOpenChange, userName, completionDate }: CertificateDialogProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (certRef.current === null) return;
    try {
      const dataUrl = await toPng(certRef.current, { pixelRatio: 3, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `PDDS-Academy-Cert-${userName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Cert export error:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline uppercase text-emerald-700">Official Graduation Credential</DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-tight">
            Download your proof of platform mastery.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex justify-center bg-muted/20 rounded-2xl border-2 border-dashed">
          <div 
            ref={certRef}
            className="w-full max-w-[600px] aspect-[1.414/1] bg-white border-[12px] border-emerald-800 p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern id="cert-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="emerald" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#cert-grid)" />
              </svg>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="bg-emerald-800 p-2 rounded-full inline-block mx-auto mb-2">
                <PddsLogo className="h-12 w-12 brightness-0 invert" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-900">Certificate of Completion</h2>
              <div className="h-0.5 w-24 bg-emerald-800 mx-auto" />
            </div>

            <div className="space-y-6 relative z-10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">This official credential is awarded to</p>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tighter border-b-2 border-emerald-100 pb-2">{userName || 'Patriot Member'}</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed max-w-md mx-auto">
                For the successful completion of the **Pederalismo ng Dugong Dakilang Samahan (PDDS)** Leadership & Ideology Track.
              </p>
            </div>

            <div className="w-full flex justify-between items-end relative z-10">
              <div className="text-left space-y-1">
                <p className="text-[8px] font-black uppercase text-emerald-800">Date Issued</p>
                <p className="text-xs font-bold uppercase">{completionDate}</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full border-4 border-emerald-800/20 flex items-center justify-center relative">
                  <Award className="h-8 w-8 text-emerald-800" />
                  <div className="absolute inset-0 border border-emerald-800/10 rounded-full animate-pulse" />
                </div>
                <p className="text-[7px] font-black uppercase text-emerald-800 mt-2">Registry Official</p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-[8px] font-black uppercase text-emerald-800">Credential ID</p>
                <p className="text-[10px] font-mono font-bold uppercase">PDDS-ACAD-2025</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleDownload} className="flex-1 h-14 bg-emerald-800 hover:bg-emerald-900 font-black uppercase tracking-widest shadow-xl">
            <Download className="mr-2 h-5 w-5" /> Download Credential
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 font-black uppercase text-xs">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
