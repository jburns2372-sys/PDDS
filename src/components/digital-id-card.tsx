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
 * @fileOverview Master Patriot Digital ID (Strict Frame Edition).
 * REFACTORED: Optimized scaling to ensure full content containment within the ID frame.
 * NOMENCLATURE: PEDERALISMO NG DUGONG DAKILANG SAMAHAN.
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
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-pulse";
      case 'Silver': return "border-slate-300 shadow-xl";
      case 'Bronze':
      default: return "border-slate-100 shadow-lg";
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.58] overflow-hidden rounded-[32px] shadow-2xl bg-white text-slate-900 relative flex flex-col p-[5%] border border-slate-100"
      >
        {/* Security Watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="id-grid-fixed" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid-fixed)" />
          </svg>
        </div>
  
        {/* Header Section */}
        <div className="flex justify-between items-center relative z-10 w-full mb-3">
          <div className="flex items-center gap-2">
            <img 
              src={PDDS_LOGO_URL} 
              alt="PDDS" 
              className="h-[45px] sm:h-[55px] w-auto object-contain" 
              crossOrigin="anonymous"
              style={{ 
                mixBlendMode: 'multiply',
                filter: 'drop-shadow(0px 0px 5px rgba(0, 35, 102, 0.1))' 
              }} 
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter leading-none text-[#002366]">Pederalismo ng Dugong</h1>
              <h1 className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter leading-none text-[#B8860B] mt-0.5">Dakilang Samahan</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-[7px] sm:text-[9px] font-black tracking-widest uppercase border-[#B8860B] text-[#B8860B] bg-slate-50 px-1.5 py-0.5 rounded-md shrink-0">
            REGISTRY
          </Badge>
        </div>
  
        {/* Biometric Node */}
        <div className="flex flex-col items-center justify-center mt-2 relative z-10 w-full">
          <div className="relative">
            <div className={cn(
              "w-[150px] h-[150px] sm:w-[190px] sm:h-[190px] rounded-[32px] sm:rounded-[40px] overflow-hidden bg-slate-50 border-[6px] sm:border-[8px] transition-all duration-500 shadow-xl",
              getBorderStyles()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
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
              <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 bg-blue-600 rounded-full p-1.5 sm:p-2.5 border-4 border-white shadow-xl z-20">
                <ShieldCheck className="h-4 w-4 sm:h-6 sm:h-6 text-white" />
              </div>
            )}
          </div>
          <p className="mt-3 text-[8px] sm:text-[10px] font-black uppercase text-[#B8860B] tracking-[0.4em] text-center">Patriot Identity</p>
        </div>
  
        {/* Data Section */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t border-slate-100 pt-4 w-full">
          <div className="space-y-2 flex-1 pr-2 min-w-0">
            <h2 className={cn(
              "font-black uppercase tracking-tighter leading-[0.9] text-[#002366] break-words",
              displayName.length > 20 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            )}>
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-1.5">
              <Badge className="bg-[#B8860B] text-white font-black text-[10px] sm:text-xs uppercase tracking-widest border-none px-3 py-1 shadow-md rounded-lg">
                {patriotRank}
              </Badge>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate w-full">
                {dbUserData?.city || initialUserData?.city || 'National'} Chapter
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="bg-white p-1.5 rounded-xl shadow-lg border border-slate-50">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={60} 
                className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px]"
                level="M" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest text-slate-300">UID VERIFIED</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-14 bg-[#002366] hover:bg-[#001a4d] text-white font-black uppercase tracking-widest shadow-xl rounded-2xl active:scale-95 transition-all text-sm"
      >
        <Download className="mr-2 h-5 w-5 text-accent" /> Export Identity Card
      </Button>
    </div>
  );
}
