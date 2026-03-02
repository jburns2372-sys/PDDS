
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
 * Refactored to use standardized PddsLogo component with defined size and alt text.
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
        backgroundColor: 'transparent'
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
            className="w-full max-w-[320px] aspect-[1/1.58] overflow-hidden rounded-[20px] shadow-2xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] text-white relative flex flex-col"
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
          
          <CardContent className="p-6 flex flex-col gap-5 relative z-10 h-full">
            {/* Header: Official Logo Top-Left */}
            <div className="flex w-full items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <PddsLogo className="h-10 w-auto" />
                <div className="flex flex-col">
                  <span className="font-black text-[10px] tracking-tighter uppercase leading-none">Pederalismo ng Dugong</span>
                  <span className="font-black text-[10px] tracking-tighter uppercase leading-none">Dakilang Samahan</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[6px] font-black tracking-widest uppercase border-white/20 text-white">ID-REG-2025</Badge>
            </div>

            {/* Profile Core */}
            <div className="flex gap-4 items-start">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-xl border-2 border-white/50 overflow-hidden bg-white shadow-xl">
                  {userData.photoURL ? (
                    <img src={userData.photoURL} alt={userData.fullName} className="h-full w-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-[#1e3a8a]/20">
                      <PddsLogo className="h-12 w-auto opacity-20" />
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#1e3a8a] shadow-lg">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight leading-none truncate font-headline">
                  {userData.fullName}
                </h2>
                <p className="text-[11px] font-bold opacity-80 uppercase flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#fbbf24]" />
                  {userData.city || 'National'}
                </p>
                
                <div className="pt-1">
                  {isVerified ? (
                    <div className="bg-[#10b981] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 w-fit">
                      <UserCheck className="h-2.5 w-2.5" />
                      VETTED: {vettingTier.toUpperCase()}
                    </div>
                  ) : (
                    <div className="bg-[#f59e0b] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 w-fit">
                      <AlertCircle className="h-2.5 w-2.5" />
                      PENDING AUDIT
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Key (QR Code) */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div className="bg-white p-3 rounded-xl shadow-inner border border-black/5 relative group">
                <QRCodeSVG value={userData.uid || 'null'} size={120} level="H" fgColor="#1e3a8a" />
                <div className="absolute inset-0 bg-[#1e3a8a]/5 rounded-xl pointer-events-none border border-white/20" />
              </div>
            </div>

            {/* Footer: ID Metadata */}
            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">Member Rank</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">
                  {userData.role || 'Supporter'}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">Registry Hash</p>
                <p className="text-[10px] font-mono font-bold opacity-80 uppercase tracking-tighter">
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
        className="w-full max-w-[320px] h-14 font-black uppercase text-xs tracking-widest bg-[#1e3a8a] hover:bg-[#162e6d] shadow-xl rounded-xl transition-all"
      >
        <Download className="mr-2 h-4 w-4" /> Save ID to Phone
      </Button>
    </div>
  );
}
