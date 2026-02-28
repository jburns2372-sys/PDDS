"use client";

import { useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download, ShieldCheck, CheckCircle2, MapPin } from "lucide-react";

/**
 * @fileOverview Digital ID Card component for PDDS members.
 * Features a high-fidelity badge design, unique QR code for check-ins,
 * and a high-resolution image export function.
 */
export function DigitalIdCard({ userData }: { userData: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!userData) return null;

  // Formatting the join date for the ID card
  let joinedDate = "Member Since 2024";
  if (userData.createdAt) {
    try {
      const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
      joinedDate = format(date, 'MMMM yyyy');
    } catch (e) {
      console.warn("ID Card date formatting error", e);
    }
  }

  // Full Jurisdiction String for the badge
  const jurisdiction = [
    userData.barangay,
    userData.city,
    userData.province
  ].filter(Boolean).join(', ') || 'National Jurisdiction';

  // Profile completion check for the "Verified" gold badge
  const isProfileComplete = !!(userData.photoURL && userData.fullName && userData.phoneNumber);

  /**
   * Captures the HTML card and downloads it as a PNG image.
   * Uses 3x pixel ratio for high-quality mobile display.
   */
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

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* The Physical Card Div - This is what gets captured as an image */}
      <div className="p-4 bg-muted/20 rounded-xl w-full flex justify-center overflow-hidden">
        <div 
            ref={cardRef} 
            id="pdds-id-card"
            className="w-full max-w-[320px] aspect-[1/1.58] overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-[#002366] via-[#002366] to-[#00153d] text-white relative flex flex-col"
        >
          {/* Security Guilloche Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="id-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#id-grid)" />
            </svg>
          </div>
          
          {/* Dynamic Background Glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          
          <CardContent className="p-6 flex flex-col items-center gap-4 relative z-10 h-full">
            {/* Header Branding */}
            <div className="flex w-full items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="bg-white p-1 rounded-full shadow-sm border border-[#D4AF37]">
                  <PddsLogo className="h-8 w-8" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-black tracking-tighter uppercase leading-none font-headline">Federalismo</span>
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase text-[#D4AF37]">Official Membership</span>
                </div>
              </div>
              {isProfileComplete && (
                <Badge className="bg-[#D4AF37] text-[#002366] text-[8px] font-black px-2 py-0.5 border-none shadow-lg">
                  <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                  VERIFIED
                </Badge>
              )}
            </div>

            {/* Profile Photo - Binded to currentUser.photoURL */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-[#D4AF37] overflow-hidden bg-white shadow-2xl">
                {userData.photoURL ? (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.fullName} 
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-[#002366]/20">
                    <PddsLogo className="h-16 w-16 opacity-20" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-[#002366]">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Supporter Identity */}
            <div className="text-center space-y-1 w-full">
              <h2 className="text-xl font-black uppercase tracking-tight leading-none truncate px-2 font-headline">{userData.fullName}</h2>
              <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-[0.25em]">{userData.role || 'Verified Supporter'}</p>
            </div>

            {/* Jurisdictional Footprint */}
            <div className="w-full bg-white/5 rounded-xl p-3 border border-white/10 space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-3 w-3 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <p className="text-[7px] text-white/40 uppercase font-black tracking-widest leading-none">Jurisdiction</p>
                  <p className="text-[11px] font-bold leading-tight">{jurisdiction}</p>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <div className="text-left">
                  <p className="text-[7px] text-white/40 uppercase font-black tracking-widest leading-none">Joined</p>
                  <p className="text-[11px] font-bold">{joinedDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] text-white/40 uppercase font-black tracking-widest leading-none">Member ID</p>
                  <p className="text-[11px] font-mono font-bold">#{userData.uid?.substring(0, 6).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* QR Code Section - Binded to currentUser.uid for check-ins */}
            <div className="mt-auto w-full flex flex-col items-center gap-2">
              <div className="relative bg-white p-2 rounded-xl shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-2">
                  <PddsLogo className="w-full h-full opacity-[0.08] transform rotate-12 scale-125" />
                </div>
                
                <QRCodeSVG 
                  value={userData.uid || 'unauthorized'} 
                  size={60} 
                  level="H"
                  fgColor="#002366"
                  includeMargin={false}
                  className="relative z-10"
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[7px] text-white/30 font-mono uppercase tracking-[0.3em]">SECURE NATIONAL ACCESS KEY</p>
                <p className="text-[8px] text-[#D4AF37]/60 font-mono font-bold tracking-widest">
                  {userData.uid?.substring(0, 12).toUpperCase()}
                </p>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Download Action Button */}
      <Button 
        onClick={handleDownload} 
        variant="default" 
        className="w-full max-w-[320px] h-12 font-black uppercase text-xs tracking-[0.15em] shadow-lg group bg-[#002366] hover:bg-[#001a3d] text-white"
      >
        <Download className="mr-2 h-4 w-4 group-hover:animate-bounce" /> 
        Save ID to Phone
      </Button>
    </div>
  );
}
