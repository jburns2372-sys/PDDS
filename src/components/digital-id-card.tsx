"use client";

import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PddsLogo from "./icons/pdds-logo";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Download, CheckCircle2, ShieldCheck, User, QrCode, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PDDS_LOGO_URL } from "@/lib/data";

/**
 * @fileOverview Master Digital ID Component (PDDS Official).
 * FORCE-FIX: Bypasses standard loading by fetching photoURL directly from Firestore.
 * Standardized 120px biometric node with object-cover and error fallbacks.
 */
export function DigitalIdCard({ userData: initialUserData }: { userData: any }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const cardRef = useRef<HTMLDivElement>(null);

  // Identity States
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [dbUserData, setDbUserData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Fallback Silhouette Styling (Official Palette)
  const DEFAULT_SILHOUETTE = "https://firebasestorage.googleapis.com/v0/b/patriot-link-production.firebasestorage.app/o/assets%2Fpatriot-silhouette.png?alt=media";

  /**
   * ASYNC FORCE-LOAD: Fetch directly from Firestore users collection
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
        console.error("Force-load failed:", err);
      } finally {
        setFetching(false);
      }
    }

    forceLoadIdentity();
  }, [user?.uid, firestore, initialUserData?.photoURL]);

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
      console.error('Export error:', err);
    }
  };

  // Tactical Data Variables
  const displayName = dbUserData?.fullName || initialUserData?.fullName || "ANONYMOUS PATRIOT";
  const vettingTier = dbUserData?.vettingLevel || initialUserData?.vettingLevel || "Bronze";
  const patriotRank = dbUserData?.role || initialUserData?.role || "Regional Member";
  const isVerified = dbUserData?.isVerified || initialUserData?.isVerified;

  // Border Logic based on Vetting Tier
  const getBorderColor = () => {
    switch (vettingTier) {
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.5)]"; // Gold
      case 'Silver': return "border-[#C0C0C0]"; // Silver
      case 'Bronze':
      default: return "border-[#8B4513]"; // Brown
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
            <pattern id="master-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#master-grid)" />
          </svg>
        </div>

        {/* Top Header: Brand Lockdown Implementation */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 bg-white p-1.5 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
              <img src={PDDS_LOGO_URL} alt="PDDS" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black uppercase tracking-tighter leading-none text-white">Federalismo ng Dugong</h1>
              <h1 className="text-[10px] font-black uppercase tracking-tighter leading-none text-accent">Dakilang Samahan</h1>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-[7px] font-black tracking-[0.2em] uppercase border-accent text-accent bg-white/5">
              Official Registry
            </Badge>
          </div>
        </div>

        {/* Center Section: Biometric Node (120px Force-Fit) */}
        <div className="flex flex-col items-center justify-center mt-8 relative z-10">
          <div className="relative">
            <div className={cn(
              "w-[120px] h-[120px] rounded-2xl overflow-hidden bg-[#001a4d] border-4 transition-all duration-500",
              getBorderColor()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-accent/20" />
                </div>
              ) : (
                <img 
                  src={loadError || !idPhoto ? DEFAULT_SILHOUETTE : idPhoto} 
                  alt={displayName} 
                  className="w-full h-full object-cover" 
                  crossOrigin="anonymous"
                  loading="eager"
                  onError={() => setLoadError(true)}
                />
              )}
            </div>
            
            {/* Verified Indicator */}
            {isVerified && (
              <div className="absolute -bottom-2 -right-2 bg-green-600 rounded-full p-1.5 border-4 border-[#002366] shadow-xl">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-[8px] font-black uppercase text-accent tracking-[0.3em]">Identity Verified</p>
          </div>
        </div>

        {/* Bottom Section: Strategic Data */}
        <div className="mt-auto flex items-end justify-between relative z-10 border-t border-white/10 pt-6">
          <div className="space-y-2 flex-1 pr-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none font-headline text-white drop-shadow-xl">
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-1">
              <Badge className="bg-accent text-primary font-black text-[10px] uppercase tracking-widest border-none px-3 py-0.5">
                {patriotRank}
              </Badge>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">
                {dbUserData?.city || initialUserData?.city || 'National'} Chapter
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="bg-white p-1.5 rounded-xl shadow-2xl border-2 border-accent/20">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={56} 
                level="H" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[6px] font-black uppercase tracking-widest text-white/40">Scan to Verify</p>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="mt-4 flex justify-between items-center opacity-20 relative z-10">
          <p className="text-[6px] font-mono">ID://{user?.uid?.substring(0, 16).toUpperCase()}</p>
          <div className="flex items-center gap-1">
            <span className="text-[6px] font-black uppercase">Archipelago Secure Node</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSaveToGallery} 
        className="w-full h-14 font-black uppercase text-xs tracking-widest bg-accent hover:bg-[#B8860B] text-primary shadow-2xl rounded-2xl transition-all active:scale-95"
      >
        <Download className="mr-2 h-5 w-5" /> Save to Gallery
      </Button>
    </div>
  );
}
