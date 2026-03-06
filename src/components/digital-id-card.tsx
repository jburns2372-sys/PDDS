"use client";

import { useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Download, CheckCircle2, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Senior Frontend Architect Grade Digital ID Component.
 * Optimized for PatriotLink (PDDS) movement with dynamic data-binding and high-res export.
 */
export function DigitalIdCard({ userData }: { userData: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!userData) return null;

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
      link.download = `PDDS-ID-${userData.fullName?.replace(/\s+/g, '-') || 'PATRIOT'}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('Error saving ID to gallery:', err);
    }
  };

  const isVerified = userData.isVerified === true;
  const vettingTier = userData.vettingLevel || "Bronze";

  // Vetting Tier Border Logic
  const getBorderClasses = () => {
    switch (vettingTier) {
      case 'Gold':
        return "border-4 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-pulse";
      case 'Silver':
        return "border-4 border-[#C0C0C0]";
      case 'Bronze':
      default:
        return "border-4 border-[#8B4513]";
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
            <pattern id="id-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid)" />
          </svg>
        </div>

        {/* Top Left: Standardized PDDS Logo */}
        <div className="flex justify-between items-start relative z-10">
          <div className="h-14 w-14 bg-white p-1.5 rounded-xl shadow-lg border border-white/20 shrink-0">
            <PddsLogo className="h-full w-full" />
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-[7px] font-black tracking-[0.2em] uppercase border-accent text-accent bg-white/5 px-2">
              National Registry
            </Badge>
            {isVerified ? (
              <p className="text-[6px] font-black text-green-400 uppercase mt-1 tracking-widest">Verified Patriot</p>
            ) : (
              <p className="text-[6px] font-black text-amber-500 uppercase mt-1 tracking-widest">Awaiting Audit</p>
            )}
          </div>
        </div>

        {/* Center Section: Biometric Photo & Name Node */}
        <div className="flex flex-col items-center justify-center mt-10 relative z-10 space-y-6">
          <div className="relative group">
            <div className={cn(
              "h-36 w-36 rounded-full flex items-center justify-center overflow-hidden bg-[#001a4d] transition-all duration-500",
              getBorderClasses()
            )}>
              {userData.photoURL ? (
                <img 
                  key={userData.photoURL}
                  src={userData.photoURL} 
                  alt={userData.fullName} 
                  className="h-full w-full object-cover" 
                  crossOrigin="anonymous"
                  loading="eager"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <User className="h-16 w-16 text-[#D4AF37]" />
                  <span className="text-[8px] font-black uppercase text-[#D4AF37]">Induction Profile</span>
                </div>
              )}
            </div>
            
            {/* Verified Badge Overlay */}
            {isVerified && (
              <div className="absolute bottom-1 right-1 bg-green-600 rounded-full p-2 border-4 border-[#002366] shadow-xl animate-in zoom-in duration-500">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          <div className="text-center space-y-3 px-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight font-headline text-white drop-shadow-lg break-words">
              {userData.fullName || 'Anonymous Patriot'}
            </h2>
            <div className="flex flex-col items-center">
              <Badge className="bg-accent text-primary font-black text-[10px] uppercase tracking-widest border-none px-4 py-1">
                {userData.role || 'Member'}
              </Badge>
              <p className="text-[8px] font-bold text-white/40 uppercase mt-2 tracking-[0.2em]">{userData.city || 'National'} Chapter</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: QR Verification */}
        <div className="mt-auto pt-6 flex items-end justify-between border-t border-white/10 relative z-10">
          <div className="space-y-1">
            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-white/40">Credential ID</p>
            <p className="text-[10px] font-mono font-bold text-accent uppercase tracking-tighter">
              #{userData.uid?.substring(0, 16).toUpperCase() || 'UNINITIALIZED'}
            </p>
          </div>
          
          <div className="bg-white p-2 rounded-xl shadow-2xl border-4 border-accent/20">
            <QRCodeSVG 
              value={userData.uid || 'null'} 
              size={64} 
              level="H" 
              fgColor="#002366" 
              includeMargin={false}
            />
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
