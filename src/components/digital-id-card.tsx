"use client";

import { useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Download, CheckCircle2, ShieldCheck, User, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserData } from "@/context/user-data-context";

/**
 * @fileOverview Architect-Grade Digital ID Component.
 * Optimized for PatriotLink (PDDS) with forced-fit biometric logic and tier-based prestige styling.
 */
export function DigitalIdCard({ userData }: { userData: any }) {
  const { user } = useUserData();
  const cardRef = useRef<HTMLDivElement>(null);

  // Fallback identity data if registry is syncing
  const displayName = userData?.fullName || user?.displayName || "ANONYMOUS PATRIOT";
  const photoSource = userData?.photoURL || user?.photoURL;
  const vettingTier = userData?.vettingLevel || "Bronze";
  const patriotRank = userData?.role || "Regional Member";
  const isVerified = userData?.isVerified === true;

  const handleSaveToGallery = async () => {
    if (cardRef.current === null) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#002366",
        logging: false,
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `PDDS-ID-${displayName.replace(/\s+/g, '-')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Error saving ID to gallery:', err);
    }
  };

  // Vetting Tier Border Logic (3px Solid)
  const getBorderStyles = () => {
    switch (vettingTier) {
      case 'Gold':
        return "border-[3px] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)]";
      case 'Silver':
        return "border-[3px] border-[#C0C0C0]";
      case 'Bronze':
      default:
        return "border-[3px] border-[#8B4513]"; // Brown for Bronze
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.58] overflow-hidden rounded-[32px] shadow-2xl bg-[#002366] text-white relative flex flex-col p-6"
      >
        {/* Security Watermark Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="elite-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#elite-grid)" />
          </svg>
        </div>

        {/* Top Header: Standardized Logo & Status */}
        <div className="flex justify-between items-start relative z-10">
          <div className="h-14 w-14 bg-white p-1.5 rounded-xl shadow-lg border border-white/20 shrink-0 flex items-center justify-center">
            <PddsLogo className="h-full w-full object-contain" />
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-[7px] font-black tracking-[0.2em] uppercase border-accent text-accent bg-white/5 px-2">
              National Registry
            </Badge>
            <p className="text-[6px] font-black text-white/40 uppercase mt-1 tracking-widest">
              {isVerified ? "Verified Patriot" : "Pending Registry Audit"}
            </p>
          </div>
        </div>

        {/* Center Section: Biometric Node (Center Top) */}
        <div className="flex flex-col items-center justify-center mt-8 relative z-10">
          <div className="relative group">
            <div className={cn(
              "h-36 w-36 rounded-full flex items-center justify-center overflow-hidden bg-[#001a4d] transition-all duration-500",
              getBorderStyles()
            )}>
              {photoSource ? (
                <img 
                  key={photoSource}
                  src={photoSource} 
                  alt={displayName} 
                  className="h-full w-full object-cover" 
                  crossOrigin="anonymous"
                  loading="eager"
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full bg-[#001a4d] text-[#D4AF37]/20">
                  <User className="h-20 w-20" />
                  <span className="text-[8px] font-black uppercase mt-1">Patriot Silhouette</span>
                </div>
              )}
            </div>
            
            {/* Verified Badge Overlay */}
            {isVerified && (
              <div className="absolute bottom-1 right-1 bg-green-600 rounded-full p-2 border-4 border-[#002366] shadow-xl">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Identity & QR (Right Side) */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t border-white/10 pt-6">
          <div className="space-y-2 flex-1 pr-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none font-headline text-white drop-shadow-lg">
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-1">
              <Badge className="bg-accent text-primary font-black text-[10px] uppercase tracking-widest border-none px-3 py-0.5">
                {patriotRank}
              </Badge>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">{userData?.city || 'National'} Chapter</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-2 rounded-xl shadow-2xl border-4 border-accent/20">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={64} 
                level="H" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[7px] font-black uppercase tracking-widest text-white/40">Verify ID</p>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="mt-4 flex justify-between items-center opacity-30 relative z-10">
          <p className="text-[6px] font-mono uppercase">ID://{user?.uid?.substring(0, 16).toUpperCase()}</p>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-2 w-2" />
            <span className="text-[6px] font-black uppercase">Archipelago Secure</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-14 font-black uppercase text-xs tracking-widest bg-[#D4AF37] hover:bg-[#B8860B] text-[#002366] shadow-2xl rounded-2xl transition-all active:scale-95"
      >
        <Download className="mr-2 h-5 w-5" /> Save to Gallery
      </Button>
    </div>
  );
}
