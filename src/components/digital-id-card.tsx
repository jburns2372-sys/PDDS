
"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download, ShieldCheck, CheckCircle2 } from "lucide-react";

export function DigitalIdCard({ userData }: { userData: any }) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!userData) return null;

  // Formatting the join date
  let joinedDate = "Member Since 2024";
  if (userData.createdAt) {
    try {
      const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
      joinedDate = format(date, 'MMMM yyyy');
    } catch (e) {
      console.warn("Date formatting error", e);
    }
  }

  // Profile completion check for "Verified" badge
  const isProfileComplete = !!(userData.photoURL && userData.fullName && (userData.city || userData.assignedLocation));

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    
    try {
      // Export at higher pixel ratio for print/high-res quality
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
      console.error('Error exporting ID card:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      {/* Wrapper with padding for clean screenshot edges */}
      <div className="p-4 bg-muted/20 rounded-xl w-full flex justify-center overflow-hidden">
        <div 
            ref={cardRef} 
            className="w-full max-w-[320px] aspect-[1/1.58] overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-[#194278] via-[#194278] to-[#0d2a4f] text-white relative flex flex-col"
        >
          {/* Decorative Security Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Decorative Glows */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F9CB0D]/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          
          <CardContent className="p-6 flex flex-col items-center gap-5 relative z-10 h-full">
            {/* Header Area */}
            <div className="flex w-full items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PddsLogo className="h-7 w-7 text-[#F9CB0D]" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-black tracking-tighter uppercase leading-none font-headline">Federalismo</span>
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase opacity-70">Official ID</span>
                </div>
              </div>
              {isProfileComplete && (
                <Badge className="bg-[#F9CB0D] text-[#194278] text-[9px] font-black px-2 py-0.5 border-none shadow-lg">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  VERIFIED
                </Badge>
              )}
            </div>

            {/* Profile Photo - Circular with Accent Border */}
            <div className="relative group">
              <div className="h-32 w-32 rounded-full border-4 border-[#F9CB0D] overflow-hidden bg-white shadow-2xl transition-transform duration-500">
                {userData.photoURL ? (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.fullName} 
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-[#194278]/20">
                    <PddsLogo className="h-16 w-16 text-[#194278]/20" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-[#194278]">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* User Credentials */}
            <div className="text-center space-y-1.5 w-full">
              <h2 className="text-2xl font-black uppercase tracking-tight leading-none truncate px-2 font-headline">{userData.fullName}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-[#F9CB0D]/40" />
                <p className="text-[10px] text-[#F9CB0D] font-black uppercase tracking-[0.25em]">Supporter Network</p>
                <span className="h-px w-6 bg-[#F9CB0D]/40" />
              </div>
            </div>

            {/* Jurisdictional Footprint */}
            <div className="w-full grid grid-cols-2 gap-4 mt-2 pt-5 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">Joined Since</p>
                <p className="text-[13px] font-bold">{joinedDate}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">Location</p>
                <p className="text-[13px] font-bold truncate">{userData.assignedLocation || userData.city || 'National'}</p>
              </div>
            </div>

            {/* Encrypted Security QR */}
            <div className="mt-auto w-full flex flex-col items-center gap-3">
              <div className="bg-white p-2.5 rounded-xl shadow-2xl transform transition-all hover:scale-105 duration-300">
                <QRCodeSVG 
                  value={userData.uid || 'unauthorized'} 
                  size={70} 
                  level="H"
                  fgColor="#194278"
                  includeMargin={false}
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[8px] text-white/30 font-mono uppercase tracking-[0.3em]">SECURE ACCESS KEY</p>
                <p className="text-[9px] text-[#F9CB0D]/60 font-mono font-bold">{userData.uid?.substring(0, 16).toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      <Button 
        onClick={handleDownload} 
        variant="default" 
        className="w-full max-w-[320px] h-12 font-black uppercase text-xs tracking-[0.15em] shadow-lg group"
      >
        <Download className="mr-2 h-4 w-4 group-hover:animate-bounce" /> 
        Export Digital ID Card
      </Button>
    </div>
  );
}
