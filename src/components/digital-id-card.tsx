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
 * @fileOverview Master Patriot Digital ID.
 * Features maximized typography for ultimate field readability.
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

  const getBorderStyles = () => {
    switch (vettingTier) {
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.6)] animate-pulse";
      case 'Silver': return "border-[#C0C0C0] shadow-xl";
      case 'Bronze':
      default: return "border-[#8B4513] shadow-lg";
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-sm mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.58] overflow-hidden rounded-[40px] shadow-2xl bg-white text-slate-900 relative flex flex-col p-8 border-2 border-slate-200"
      >
        {/* Security Watermark */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="id-grid-max" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid-max)" />
          </svg>
        </div>
  
        {/* Top Header */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-4 bg-transparent shrink-0">
            <img 
              src={PDDS_LOGO_URL} 
              alt="PDDS" 
              className="h-[55px] w-auto object-contain" 
              crossOrigin="anonymous"
              style={{ filter: 'drop-shadow(0px 0px 10px rgba(212, 175, 55, 0.5))' }}
            />
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black uppercase tracking-tighter leading-none text-[#002366]">Pederalismo ng Dugong</h1>
              <h1 className="text-[10px] font-black uppercase tracking-tighter leading-none text-[#B8860B]">Dakilang Samahan</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-[8px] font-black tracking-[0.2em] uppercase border-[#B8860B] text-[#B8860B] bg-white px-2 py-1">
            Verified Registry
          </Badge>
        </div>
  
        {/* Center: Photo Node */}
        <div className="flex flex-col items-center justify-center mt-12 relative z-10">
          <div className="relative">
            <div className={cn(
              "w-[160px] h-[160px] rounded-3xl overflow-hidden bg-slate-50 border-[6px] transition-all duration-500 shadow-2xl",
              getBorderStyles()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
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
            {isVerified && (
              <div className="absolute -bottom-3 -right-3 bg-blue-600 rounded-full p-2.5 border-4 border-white shadow-2xl">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <p className="mt-6 text-[10px] font-black uppercase text-[#B8860B] tracking-[0.4em]">Patriot Identity</p>
        </div>
  
        {/* Bottom Data - Maximized Text */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t-2 border-slate-100 pt-8">
          <div className="space-y-3 flex-1 pr-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-[#002366] break-words">
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-2">
              <Badge className="bg-[#B8860B] text-white font-black text-xs uppercase tracking-widest border-none px-4 py-1 shadow-md">
                {patriotRank}
              </Badge>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                {dbUserData?.city || initialUserData?.city || 'National'} Chapter
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-2 rounded-2xl shadow-xl border-2 border-slate-100">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={64} 
                level="H" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">UID Verified</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-16 bg-[#002366] hover:bg-[#001a3d] text-white font-black uppercase tracking-widest shadow-2xl rounded-2xl active:scale-95 transition-all text-lg"
      >
        <Download className="mr-3 h-6 w-6 text-accent" /> Save to Gallery
      </Button>
    </div>
  );
}