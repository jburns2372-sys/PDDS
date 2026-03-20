"use client";

import { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PDDS_LOGO_URL, pddsLeadershipRoles } from "@/lib/data";
import { PayDuesButton } from "./pay-dues-button";

/**
 * @fileOverview Master Patriot Digital ID (Compact Safe Edition).
 * Refined dimensions for standard laptop viewports.
 * UPDATED: Automatic 'Active' status override for Officers/Leadership.
 */
export function DigitalIdCard({ userData: initialUserData }: { userData: any }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const cardRef = useRef<HTMLDivElement>(null);

  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [dbUserData, setDbUserData] = useState<any>(null);
  const [duesAmount, setDuesAmount] = useState<number>(0);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const DEFAULT_SILHOUETTE = "https://firebasestorage.googleapis.com/v0/b/patriot-link-production.firebasestorage.app/o/assets%2Fpatriot-silhouette.png?alt=media";
  
  useEffect(() => {
    async function forceLoadIdentity() {
      if (!user?.uid) return;
      try {
        setFetching(true);
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef).catch(() => null);
        if (userSnap?.exists()) {
          const data = userSnap.data();
          setDbUserData(data);
          setIdPhoto(data.photoURL || null);
        }
        const settingsRef = doc(firestore, "metadata", "settings");
        const settingsSnap = await getDoc(settingsRef).catch(() => null);
        if (settingsSnap?.exists()) {
          setDuesAmount(settingsSnap.data().yearlyDuesAmount || 0);
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
  const patriotRank = dbUserData?.role || initialUserData?.role || "Member";
  const isVerified = dbUserData?.isVerified || initialUserData?.isVerified;
  
  // LOGIC: Check if user is an Officer or in a Leadership position
  const isOfficer = pddsLeadershipRoles?.includes(patriotRank) || patriotRank.includes("Officer") || patriotRank === "Admin" || patriotRank === "System Admin";
  
  const lastPaymentDate = dbUserData?.lastDuesPaymentDate?.toDate ? dbUserData.lastDuesPaymentDate.toDate() : null;
  
  // LOGIC: Status is ACTIVE if user is an Officer OR has paid current year dues
  const isDuesActive = isOfficer || (lastPaymentDate && lastPaymentDate.getFullYear() === new Date().getFullYear());
  
  // THE FIX: Only show payment button if they are NOT active, NOT an officer, and NOT a supporter.
  const showPaymentButton = !isDuesActive && !isOfficer && patriotRank !== "Supporter" && !fetching;

  const getBorderStyles = () => {
    switch (vettingTier) {
      case 'Gold': return "border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]";
      case 'Silver': return "border-slate-300 shadow-md";
      default: return "border-slate-100 shadow-sm";
    }
  };

  return (
    // Reduced max-w to 260px to ensure it fits laptop heights perfectly
    <div className="flex flex-col gap-3 items-center w-full max-w-[260px] mx-auto">
      <div 
        ref={cardRef} 
        className="w-full aspect-[1/1.4] overflow-hidden rounded-[16px] shadow-xl bg-white text-slate-900 relative flex flex-col p-3 border border-slate-100"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="id-grid-compact" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#id-grid-compact)" />
          </svg>
        </div>
  
        <div className="flex justify-between items-center relative z-10 w-full mb-1">
          <div className="flex items-center gap-1.5">
            <img 
              src={PDDS_LOGO_URL} 
              alt="PDDS" 
              className="h-[28px] w-auto object-contain" 
              crossOrigin="anonymous"
              style={{ mixBlendMode: 'multiply' }} 
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-[6px] font-black uppercase tracking-tighter leading-none text-[#002366]">PEDERALISMO NG DUGONG</h1>
              <h1 className="text-[6px] font-black uppercase tracking-tighter leading-none text-[#B8860B] mt-0.5">DAKILANG SAMAHAN</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-[5px] font-black tracking-widest uppercase border-[#B8860B] text-[#B8860B] px-1 py-0 rounded-md">
            OFFICIAL
          </Badge>
        </div>
  
        <div className="flex flex-col items-center justify-center relative z-10 w-full mb-2 mt-2">
          <div className="relative">
            <div className={cn(
              "w-[100px] h-[100px] rounded-[16px] overflow-hidden bg-slate-50 border-[3px] transition-all shadow-md",
              getBorderStyles()
            )}>
              {fetching ? (
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-200" />
                </div>
              ) : (
                <img 
                  key={idPhoto}
                  src={loadError || !idPhoto ? DEFAULT_SILHOUETTE : idPhoto} 
                  alt={displayName} 
                  className="w-full h-full object-cover object-center"
                  crossOrigin="anonymous"
                  onError={() => setLoadError(true)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full mb-2">
          {fetching ? (
            <div className="h-5 w-full bg-slate-50 animate-pulse rounded-lg" />
          ) : patriotRank === "Supporter" ? (
             <div className="bg-slate-200 text-slate-600 py-1 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-300">
              <ShieldCheck className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">Status: Supporter</span>
            </div>
          ) : isDuesActive ? (
            <div className="bg-emerald-600 text-white py-1 px-2 rounded-lg flex items-center justify-center gap-1 shadow-lg border border-white/20">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">Status: Active</span>
            </div>
          ) : (
            <div className="bg-red-600 text-white py-1 px-2 rounded-lg flex items-center justify-center gap-1 shadow-lg border border-white/20 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">Status: Pending Dues</span>
            </div>
          )}
        </div>
  
        <div className="mt-auto flex items-end justify-between relative z-10 border-t border-slate-100 pt-2 w-full">
          <div className="space-y-0.5 flex-1 pr-2 min-w-0">
            <h2 className={cn(
              "font-black uppercase tracking-tighter leading-[0.9] text-[#002366] break-words",
              displayName.length > 15 ? "text-sm" : "text-base"
            )}>
              {displayName}
            </h2>
            <div className="flex flex-col items-start gap-1 mt-1">
              <Badge className="bg-[#B8860B] text-white font-black text-[7px] uppercase tracking-widest border-none px-1.5 py-0.5 rounded-sm">
                {patriotRank}
              </Badge>
              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest truncate w-full">
                {dbUserData?.city || initialUserData?.city || 'National'} Hub
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="bg-white p-0.5 rounded-sm shadow-sm border border-slate-100">
              <QRCodeSVG 
                value={user?.uid || 'PDDS-GUEST'} 
                size={26} 
                className="w-[26px] h-[26px]"
                level="M" 
                fgColor="#002366" 
                includeMargin={false}
              />
            </div>
            <p className="text-[4px] font-black uppercase tracking-widest text-slate-300">UID AUTH</p>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        {/* The Payment Button will now securely pop up here ONLY if they owe dues */}
        {showPaymentButton && (
          <PayDuesButton 
            userId={user?.uid || ""}
            userName={displayName}
            amount={duesAmount}
          />
        )}

        <Button 
          onClick={handleSaveToGallery} 
          className="w-full h-10 bg-[#002366] hover:bg-[#001a4d] text-white font-black uppercase tracking-widest shadow-md rounded-lg text-[10px]"
        >
          <Download className="mr-1.5 h-4 w-4 text-accent" /> Export Card
        </Button>
      </div>
    </div>
  );
}