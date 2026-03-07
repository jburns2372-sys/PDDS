"use client";

import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PDDS_LOGO_URL } from "@/lib/data";

/**
 * @fileOverview Master Patriot Digital ID (Safe Frame Edition).
 * REFACTORED: Compact scaling to ensure 100% visibility at default zoom levels.
 * Spacing optimized to prevent content overflow within the fixed 1:1.58 aspect ratio.
 */
export function DigitalIdCard({ userData: initialUserData }: { userData: any }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const cardRef = useRef<HTMLDivElement>(null);

  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [dbUserData, setDbUserData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const DEFAULT_SILHOUETTE = "https://firebasestorage.googleapis.com/v0/b/patriot-link-production.firebasestorage.app/o/assets%2Fpatriot-silhouette.png?alt=media";

  useEffect(() => {
    async function forceLoadIdentity() {
      if (!user?.uid) return;
      try {
        setFetching(true);
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setDbUserData(data);
          setIdPhoto(data.photoURL || null);
        }
      } catch (err) {
        console.error("Registry identity fetch failed:", err);
      } finally {
        setFetching(false);
      }
    }
    forceLoadIdentity();
  }, [user?.uid, firestore]);

  const handleSaveToGallery = async () => {
    if (typeof window === "undefined" || !cardRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `PDDS-ID-${(dbUserData?.fullName || "Member").replace(/\s+/g, '-')}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error('ID Export failed:', err);
    }
  };

  const displayName = (dbUserData?.fullName || initialUserData?.fullName || "ANONYMOUS PATRIOT").toUpperCase();
  const vettingTier = dbUserData?.vettingLevel || initialUserData?.vettingLevel || "Bronze";
  const patriotRank = dbUserData?.role || initialUserData?.role || "Regional Member";
  const isVerified = dbUserData?.isVerified || initialUserData?.isVerified;

  const getBorderStyles = () => {
    switch (vettingTier) {
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]";
      case 'Silver': return "border-slate-300 shadow-lg";
      case 'Bronze':
      default: return "border-slate-100 shadow-md";
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full max-w-sm mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.58] overflow-hidden rounded-[24px] shadow-2xl bg-white text-slate-900 relative flex flex-col p-[6%] border border-slate-100"
      >
        {/* Security Watermark */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="id-grid-compact" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid-compact)" />
          </svg>
        </div>
  
        {/* Header Section - Tightened */}
        <div className="flex justify-between items-center relative z-10 w-full mb-2">
          <div className="flex items-center gap-1.5">
            <img 
              src={PDDS_LOGO_URL} 
              alt="PDDS" 
              className="h-[35px] sm:h-[45px] w-auto object-contain" 
              crossOrigin="anonymous"
              style={{ 
                mixBlendMode: 'multiply'
              }} 
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter leading-none text-[#002366]">PEDERALISMO NG DUGONG</h1>
              <h1 className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter leading-none text-[#B8860B] mt-0.5">DAKILANG SAMAHAN</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-[6px] sm:text-[8px] font-black tracking-widest uppercase border-[#B8860B] text-[#B8860B] bg-slate-50 px-1 py-0 rounded-md shrink-0">
            OFFICIAL
          </Badge>
        </div>
  
        {/* Biometric Node - Recalibrated for Frame Fitting */}
        <div className="flex flex-col items-center justify-center mt-1 relative z-10 w-full">
          <div className="relative">
            <div className={cn(
              "w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-[24px] sm:rounded-[32px] overflow-hidden bg-slate-50 border-[4px] sm:border-[6px] transition-all duration-500 shadow-lg",
              getBorderStyles()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
                </div>
              ) : (
                <img 
                  key={idPhoto}
                  src={loadError || !idPhoto ? DEFAULT_SILHOUETTE : idPhoto} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  loading="eager"
                  onError={() => setLoadError(true)}
                />
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-white shadow-lg z-20">
                <ShieldCheck className="h-3 w-3 sm:h-4 sm:h-4 text-white" />
              </div>
            )}
          </div>
          <p className="mt-2 text-[7px] sm:text-[9px] font-black uppercase text-[#B8860B] tracking-[0.3em] text-center opacity-60">National Registry Identity</p>
        </div>
  
        {/* Data Section - Optimized for Container Visibility */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t border-slate-50 pt-3 w-full">
          <div className="space-y-1.5 flex-1 pr-2 min-w-0">
            <h2 className={cn(
              "font-black uppercase tracking-tighter leading-[0.95] text-[#002366] break-words",
              displayName.length > 18 ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
            )}>
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-1">
              <Badge className="bg-[#B8860B] text-white font-black text-[8px] sm:text-[10px] uppercase tracking-widest border-none px-2 py-0.5 shadow-sm rounded-md">
                {patriotRank}
              </Badge>
              <p className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate w-full">
                {dbUserData?.city || initialUserData?.city || 'National'} Hub
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="bg-white p-1 rounded-lg shadow-md border border-slate-50">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={45} 
                className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
                level="M" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[5px] sm:text-[7px] font-black uppercase tracking-widest text-slate-300">UID AUTH</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-12 bg-[#002366] hover:bg-[#001a4d] text-white font-black uppercase tracking-widest shadow-lg rounded-xl active:scale-95 transition-all text-[10px]"
      >
        <Download className="mr-2 h-4 w-4 text-accent" /> Export Card to Registry
      </Button>
    </div>
  );
}
