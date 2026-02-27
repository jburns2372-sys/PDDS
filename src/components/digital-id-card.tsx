"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PddsLogo from "./icons/pdds-logo";
import { format } from "date-fns";

export function DigitalIdCard({ userData }: { userData: any }) {
  if (!userData) return null;

  // Handle Firestore Timestamp
  let joinedDate = "Joined 2024";
  if (userData.createdAt) {
    try {
      // If it's a Firestore Timestamp, it has a toDate method
      const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
      joinedDate = format(date, 'MMMM yyyy');
    } catch (e) {
      console.warn("Date formatting error", e);
    }
  }

  return (
    <Card className="w-full max-w-sm overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground relative">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      
      <CardContent className="p-6 flex flex-col items-center gap-4 relative z-10">
        <div className="flex w-full items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PddsLogo className="h-6 w-6 text-accent" />
            <span className="text-[10px] font-extrabold tracking-tighter uppercase font-headline text-accent">PDDS Official ID</span>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground text-[9px] font-black h-5 border-none">
            VERIFIED SUPPORTER
          </Badge>
        </div>

        <div className="h-28 w-28 rounded-full border-4 border-accent overflow-hidden bg-white/10 flex items-center justify-center shadow-2xl">
          {userData.photoURL ? (
            <img src={userData.photoURL} alt={userData.fullName} className="h-full w-full object-cover" />
          ) : (
             <div className="flex items-center justify-center h-full w-full bg-primary/20">
                <PddsLogo className="h-14 w-14 text-white/30" />
             </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black font-headline leading-none tracking-tight">{userData.fullName}</h2>
          <p className="text-[11px] text-accent font-bold uppercase tracking-[0.2em] mt-1">National Supporter Network</p>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Member Since</p>
            <p className="text-sm font-bold">{joinedDate}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Jurisdiction</p>
            <p className="text-sm font-bold truncate">{userData.assignedLocation || userData.city || 'National'}</p>
          </div>
        </div>

        <div className="w-full flex justify-center pt-2">
            <div className="bg-white p-2 rounded-lg shadow-inner">
                {/* Simulated QR Code SVG */}
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <rect x="2" y="2" width="6" height="6" />
                    <rect x="16" y="2" width="6" height="6" />
                    <rect x="2" y="16" width="6" height="6" />
                    <path d="M12 2v4M2 12h4M16 12h4M12 16v4M8 8h8v8H8z" />
                </svg>
            </div>
        </div>
        
        <p className="text-[9px] text-white/40 font-mono mt-2">UID: {userData.uid?.substring(0, 12).toUpperCase() || 'ANONYMOUS'}</p>
      </CardContent>
    </Card>
  );
}