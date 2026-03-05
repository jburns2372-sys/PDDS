"use client";

import { useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download, CheckCircle2, MapPin, UserCheck, AlertCircle } from "lucide-react";

/**
 * @fileOverview High-fidelity Digital Member ID Card.
 * Re-engineered for horizontal identity alignment (photo next to name).
 * Features hardened logo visibility and official PDDS branding.
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
      <div className="p-4 bg-muted/20 rounded-2xl w-full flex justify-center overflow-hidden">
        <div 
            ref={cardRef} 
            id="pdds-id-card"
            className="w-full max-w-[320px] aspect-[1/1.58] overflow-hidden rounded-[32px] shadow-2xl bg-[#002366] text-white relative flex flex-col"
        >
          {/* Internal Security Pattern Overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="id-hex" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M12 0l10.392 6v12L12 24 1.608 18V6z" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#id-hex)" />
            </svg>
          </div>

          <CardContent className="p-6 flex flex-col gap-6 relative z-10 h-full">
            {/* Header: Official Logo Left of Party Name */}
            <div className="flex w-full items-center justify-start border-b border-white/10 pb-4 gap-3">
              <div className="bg-white p-1 rounded-lg shrink-0 shadow-lg">
                <PddsLogo className="h-8 w-auto shadow-none" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-black text-[9px] tracking-tighter uppercase leading-tight">Federalismo ng Dugong</span>
                <span className="font-black text-[9px] tracking-tighter uppercase leading-tight text-accent">Dakilang Samahan</span>
              </div>
              <Badge variant="outline" className="ml-auto text-[6px] font-black tracking-widest uppercase border-white/20 text-white shrink-0">OFFICIAL ID</Badge>
            </div>

            {/* Profile Core: Horizontal Layout (Photo next to Name) */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-2xl border-2 border-white overflow-hidden bg-white shadow-xl">
                  {userData.photoURL ? (
                    <img 
                      key={userData.photoURL} // Ensures instant refresh on photo update
                      src={userData.photoURL} 
                      alt={userData.fullName} 
                      className="h-full w-full object-cover" 
                      crossOrigin="anonymous" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-[#002366]/10">
                      <PddsLogo className="h-12 w-auto opacity-20 shadow-none grayscale" />
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-[#10b981] rounded-full p-1 border-2 border-[#002366] shadow-lg">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight leading-tight font-headline truncate">
                  {userData.fullName}
                </h2>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent uppercase">
                  <MapPin className="h-2.5 w-2.5" />
                  {userData.city || 'National'}
                </div>
                
                <div className="pt-2">
                  <Badge className={isVerified ? "bg-emerald-600 border-none h-5 px-2 text-[7px] font-black" : "bg-orange-500 border-none h-5 px-2 text-[7px] font-black uppercase"}>
                    {isVerified ? `VETTED: ${vettingTier.toUpperCase()}` : "PENDING AUDIT"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Verification Key */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="bg-white p-3 rounded-2xl shadow-2xl border border-black/5 relative group">
                <QRCodeSVG value={userData.uid || 'null'} size={100} level="H" fgColor="#002366" />
                <div className="absolute inset-0 bg-[#002366]/5 rounded-2xl pointer-events-none border border-white/20" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Scan to Verify Registry Status</p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">Member Rank</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  {userData.role || 'Supporter'}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">Registry Hash</p>
                <p className="text-[9px] font-mono font-bold opacity-80 uppercase tracking-tighter">
                  #{userData.uid?.substring(0, 12).toUpperCase()}
                </p>
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
        <Download className="mr-2 h-4 w-4" /> Save Official ID
      </Button>
    </div>
  );
}
