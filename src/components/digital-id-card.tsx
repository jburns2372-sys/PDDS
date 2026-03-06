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
 * REFACTORED: Maximized typographic nodes for field legibility and high-stakes auditing.
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
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.7)] animate-pulse";
      case 'Silver': return "border-[#C0C0C0] shadow-2xl";
      case 'Bronze':
      default: return "border-[#8B4513] shadow-xl";
    }
  };

  return (
    <div className="flex flex-col gap-10 items-center w-full max-w-md mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.58] overflow-hidden rounded-[48px] shadow-2xl bg-white text-slate-900 relative flex flex-col p-10 border-4 border-slate-100"
      >
        {/* Security Watermark */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="id-grid-max" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid-max)" />
          </svg>
        </div>
  
        {/* Top Header */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-5 bg-transparent shrink-0">
            <img 
              src={PDDS_LOGO_URL} 
              alt="PDDS" 
              className="h-[65px] w-auto object-contain" 
              crossOrigin="anonymous"
              style={{ filter: 'drop-shadow(0px 0px 12px rgba(212, 175, 55, 0.6))' }}
            />
            <div className="flex flex-col">
              <h1 className="text-[12px] font-black uppercase tracking-tighter leading-none text-[#002366]">Pederalismo ng Dugong</h1>
              <h1 className="text-[12px] font-black uppercase tracking-tighter leading-none text-[#B8860B]">Dakilang Samahan</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] uppercase border-[#B8860B] text-[#B8860B] bg-white px-3 py-1.5 rounded-xl">
            OFFICIAL REGISTRY
          </Badge>
        </div>
  
        {/* Center: Photo Node */}
        <div className="flex flex-col items-center justify-center mt-16 relative z-10">
          <div className="relative">
            <div className={cn(
              "w-[200px] h-[200px] rounded-[40px] overflow-hidden bg-slate-50 border-[8px] transition-all duration-500 shadow-2xl",
              getBorderStyles()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-slate-300" />
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
              <div className="absolute -bottom-4 -right-4 bg-blue-600 rounded-full p-3.5 border-4 border-white shadow-2xl">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <p className="mt-8 text-[12px] font-black uppercase text-[#B8860B] tracking-[0.5em]">Patriot Identity</p>
        </div>
  
        {/* Bottom Data - Maximized for read-aloud */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t-4 border-slate-50 pt-10">
          <div className="space-y-4 flex-1 pr-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-[0.9] text-[#002366] break-words">
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-3">
              <Badge className="bg-[#B8860B] text-white font-black text-sm uppercase tracking-widest border-none px-6 py-2 shadow-xl rounded-2xl">
                {patriotRank}
              </Badge>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                {dbUserData?.city || initialUserData?.city || 'National'} Chapter
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-[24px] shadow-2xl border-4 border-slate-50">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={80} 
                level="H" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">UID://{user?.uid?.substring(0,8)}</p>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-20 bg-[#002366] hover:bg-[#001a3d] text-white font-black uppercase tracking-widest shadow-2xl rounded-3xl active:scale-95 transition-all text-xl"
      >
        <Download className="mr-4 h-8 w-8 text-accent" /> Export Digital ID
      </Button>
    </div>
  );
}
