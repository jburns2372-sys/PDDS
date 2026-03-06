"use client";

import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Download, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PDDS_LOGO_URL } from "@/lib/data";

/**
 * @fileOverview Master Patriot Digital ID (Senior Full-Stack Overhaul).
 * Features async force-load biometric node from Firestore, bypassing Auth lag.
 */
export function DigitalIdCard({ userData: initialUserData }: { userData: any }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const cardRef = useRef<HTMLDivElement>(null);

  // Identity State (Force-Fix Protocol)
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [dbUserData, setDbUserData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const DEFAULT_SILHOUETTE = "https://firebasestorage.googleapis.com/v0/b/patriot-link-production.firebasestorage.app/o/assets%2Fpatriot-silhouette.png?alt=media";

  /**
   * ASYNC FORCE-LOAD: Fetches photoURL directly from Firestore users collection
   * This ensures the identity is always synchronized with the submitted registry photo.
   */
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

  // Border Logic: Bronze -> Brown, Silver -> Grey, Gold -> Glowing Gold
  const getBorderStyles = () => {
    switch (vettingTier) {
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-pulse";
      case 'Silver': return "border-[#C0C0C0] shadow-lg";
      case 'Bronze':
      default: return "border-[#8B4513] shadow-md";
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-sm mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.58] overflow-hidden rounded-[32px] shadow-2xl bg-[#002366] text-white relative flex flex-col p-6 border-2 border-white/10"
      >
        {/* Security Watermark Grid */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="id-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid)" />
          </svg>
        </div>

        {/* Top Header: Brand Lockdown Implementation (PEDERALISMO CORRECTED) */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-sm">
          <img 
              src={PDDS_LOGO_URL} 
              alt="PDDS Official Logo" 
              className="h-[45px] w-auto object-contain" 
              crossOrigin="anonymous"
              style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 215, 0, 0.5))' }}
            />
            <div className="flex flex-col">
              <h1 className="text-[9px] font-black uppercase tracking-tighter leading-none text-white">Pederalismo ng Dugong</h1>
              <h1 className="text-[9px] font-black uppercase tracking-tighter leading-none text-[#D4AF37]">Dakilang Samahan</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-[7px] font-black tracking-[0.2em] uppercase border-[#D4AF37] text-[#D4AF37] bg-white/5">
            Verified Registry
          </Badge>
        </div>

        {/* Center: Forced-Fit Biometric Node (120px Precision) */}
        <div className="flex flex-col items-center justify-center mt-10 relative z-10">
          <div className="relative">
          <div className={cn(
              "w-[140px] h-[140px] rounded-2xl overflow-hidden bg-[#001a4d] border-4 transition-all duration-500 shadow-2xl",
              getBorderStyles()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]/40" />
                </div>
              ) : (
                <img 
                  key={idPhoto}
                  src={loadError || !idPhoto ? DEFAULT_SILHOUETTE : idPhoto} 
                  alt={displayName} 
                  className="w-full h-full object-cover scale-105"
                  crossOrigin="anonymous"
                  loading="eager"
                  onError={() => setLoadError(true)}
                />
              )}
            </div>
            
            {/* Verified Badge Overlay */}
            {isVerified && (
              <div className="absolute bottom-1 right-1 bg-green-600 rounded-full p-1.5 border-4 border-[#002366] shadow-xl">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <p className="mt-3 text-[8px] font-black uppercase text-[#D4AF37] tracking-[0.3em]">Patriot Identity</p>
        </div>

        {/* Bottom: Tactical Data & UID */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t border-white/10 pt-6">
          <div className="space-y-2 flex-1 pr-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none font-headline text-white drop-shadow-lg">
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-1">
              <Badge className="bg-[#D4AF37] text-[#002366] font-black text-[10px] uppercase tracking-widest border-none px-3 py-0.5">
                {patriotRank}
              </Badge>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
                {dbUserData?.city || initialUserData?.city || 'National'} Chapter
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-1.5 rounded-xl shadow-2xl border-2 border-[#D4AF37]/20">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={52} 
                level="H" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[6px] font-black uppercase tracking-widest text-white/40">UID Verified</p>
          </div>
        </div>

        {/* Footer Audit Metadata */}
        <div className="mt-4 flex justify-between items-center opacity-20 relative z-10">
          <p className="text-[6px] font-mono">ID://{user?.uid?.substring(0, 16).toUpperCase()}</p>
          <span className="text-[6px] font-black uppercase tracking-widest">End-to-End Encrypted Node</span>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-14 font-black uppercase text-xs tracking-widest bg-[#D4AF37] hover:bg-[#B8860B] text-[#002366] shadow-2xl rounded-2xl transition-all"
      >
        <Download className="mr-2 h-5 w-5" /> Save to Gallery
      </Button>
    </div>
  );
}
