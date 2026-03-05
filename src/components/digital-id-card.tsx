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
 * Updated: Logo on the left of the party name as per command directive.
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

          {/* Logo Watermark */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <PddsLogo variant="white" className="w-[150%] h-auto rotate-12 scale-150 shadow-none" />
          </div>
          
          <CardContent className="p-6 flex flex-col gap-6 relative z-10 h-full">
            {/* Header: Logo on Left of Party Name */}
            <div className="flex w-full items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <PddsLogo variant="white" className="h-12 w-auto shadow-none" />
                <div className="flex flex-col justify-center">
                  <span className="font-black text-[10px] tracking-tighter uppercase leading-none">Federalismo ng Dugong</span>
                  <span className="font-black text-[10px] tracking-tighter uppercase leading-none">Dakilang Samahan</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[6px] font-black tracking-widest uppercase border-white/20 text-white shrink-0">OFFICIAL ID</Badge>
            </div>

            {/* Profile Core */}
            <div className="flex flex-col items-center gap-4 py-1">
              <div className="relative">
                <div className="h-32 w-32 rounded-[24px] border-4 border-white overflow-hidden bg-white shadow-[0_0_25px_rgba(0,0,0,0.3)]">
                  {userData.photoURL ? (
                    <img 
                      src={userData.photoURL} 
                      alt={userData.fullName} 
                      className="h-full w-full object-cover" 
                      crossOrigin="anonymous" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-[#002366]/10">
                      <PddsLogo className="h-16 w-auto opacity-20 shadow-none" />
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-[#10b981] rounded-full p-1.5 border-4 border-[#002366] shadow-lg">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-1 w-full">
                <h2 className="text-2xl font-black uppercase tracking-tight leading-none font-headline">
                  {userData.fullName}
                </h2>
                <p className="text-xs font-bold text-accent uppercase flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {userData.city || 'National'}
                </p>
                
                <div className="flex justify-center pt-3">
                  {isVerified ? (
                    <div className="bg-[#10b981] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <UserCheck className="h-3 w-3" />
                      VETTED: {vettingTier.toUpperCase()}
                    </div>
                  ) : (
                    <div className="bg-[#f59e0b] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertCircle className="h-3 w-3" />
                      Pending Registry Audit
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Key */}
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white p-3 rounded-2xl shadow-2xl border border-black/5 relative group">
                <QRCodeSVG value={userData.uid || 'null'} size={110} level="H" fgColor="#002366" />
                <div className="absolute inset-0 bg-[#002366]/5 rounded-2xl pointer-events-none border border-white/20" />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">Member Rank</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                  {userData.role || 'Supporter'}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">Registry Hash</p>
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
        className="w-full max-w-[320px] h-14 font-black uppercase text-xs tracking-widest bg-[#002366] hover:bg-[#001a4d] shadow-xl rounded-xl transition-all"
      >
        <Download className="mr-2 h-4 w-4" /> Save Official ID
      </Button>
    </div>
  );
}