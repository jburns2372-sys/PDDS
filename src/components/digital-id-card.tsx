"use client";

import { useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download, CheckCircle2, MapPin, UserCheck, ShieldCheck } from "lucide-react";

/**
 * @fileOverview High-fidelity Digital Member ID Card.
 * Optimized for horizontal identity alignment and maximum name readability.
 * Features absolute synchronization with user-submitted profile pictures.
 */
export function DigitalIdCard({ userData }: { userData: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!userData) return null;

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 3,
        backgroundColor: '#002366'
      });
      
      const link = document.createElement('a');
      link.download = `PDDS-ID-${userData.fullName.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting Digital ID card:', err);
    }
  };

  const isVerified = userData.isVerified === true;
  const vettingTier = userData.vettingLevel || "Bronze";

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <div className="p-2 bg-muted/30 rounded-[40px] w-full flex justify-center overflow-hidden border-2 border-dashed border-primary/10">
        <div 
            ref={cardRef} 
            id="pdds-id-card"
            className="w-full max-w-[320px] aspect-[1/1.58] overflow-hidden rounded-[32px] shadow-2xl bg-[#002366] text-white relative flex flex-col"
        >
          {/* Enhanced Security Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="id-hex-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M15 0l12.99 7.5v15L15 30 2.01 22.5v-15z" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#id-hex-grid)" />
            </svg>
          </div>

          <CardContent className="p-6 flex flex-col gap-6 relative z-10 h-full">
            {/* Header: Fixed Logo Visibility */}
            <div className="flex w-full items-center justify-between border-b border-white/20 pb-4">
              <div className="flex items-center gap-3">
                <PddsLogo variant="white" className="h-10 w-auto shadow-none" />
                <div className="flex flex-col">
                  <span className="font-black text-[8px] tracking-widest uppercase leading-none opacity-60">Pederalismo ng</span>
                  <span className="font-black text-[10px] tracking-tighter uppercase leading-tight text-accent">Dugong Dakila</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[7px] font-black tracking-widest uppercase border-white/30 text-white bg-white/5">REGISTRY ID</Badge>
            </div>

            {/* Identity Node: Profile Pic next to Highly Readable Name */}
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-sm">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-2xl border-2 border-white overflow-hidden bg-white shadow-xl">
                  {userData.photoURL ? (
                    <img 
                      key={userData.photoURL} // Forces refresh on URL change
                      src={userData.photoURL} 
                      alt={userData.fullName} 
                      className="h-full w-full object-cover" 
                      crossOrigin="anonymous" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-[#002366]/20">
                      <UserCheck className="h-10 w-10 text-[#002366]/40" />
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#002366] shadow-lg">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-[0.9] font-headline text-white break-words">
                  {userData.fullName}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase mt-2">
                  <MapPin className="h-3 w-3" />
                  {userData.city || 'National'}
                </div>
              </div>
            </div>

            {/* Verification Zone */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-2xl relative">
                <QRCodeSVG value={userData.uid || 'null'} size={110} level="H" fgColor="#002366" />
                <div className="absolute inset-0 border-4 border-[#002366]/5 rounded-2xl pointer-events-none" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Digital Verification Hash</p>
                <p className="text-[9px] font-mono font-bold text-accent uppercase tracking-tighter">
                  #{userData.uid?.substring(0, 16).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Rank Footer */}
            <div className="mt-auto pt-4 border-t border-white/20 flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">Official Rank</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-white">
                  {userData.role || 'Supporter'}
                </p>
              </div>
              <div className="text-right">
                <Badge className={isVerified ? "bg-emerald-600 border-none h-6 px-3 text-[8px] font-black" : "bg-orange-500 border-none h-6 px-3 text-[8px] font-black uppercase"}>
                  {isVerified ? `VETTED: ${vettingTier.toUpperCase()}` : "PENDING AUDIT"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      <Button 
        onClick={handleDownload} 
        variant="default" 
        className="w-full h-14 font-black uppercase text-xs tracking-widest bg-[#002366] hover:bg-[#001a4d] shadow-xl rounded-xl transition-all"
      >
        <Download className="mr-2 h-4 w-4" /> Export Digital ID
      </Button>
    </div>
  );
}
