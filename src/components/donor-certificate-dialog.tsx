
"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { Share2, Download, ShieldCheck, Trophy, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import PddsLogo from "./icons/pdds-logo";
import { useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DonorCertificateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  donationAmount: number;
  isAnonymous: boolean;
}

/**
 * @fileOverview Patriot Donor Certificate.
 * Features the official circular emblem centrally as the source of recognition.
 */
export function DonorCertificateDialog({ 
  isOpen, 
  onOpenChange, 
  donationAmount,
  isAnonymous 
}: DonorCertificateDialogProps) {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  const certRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (isAnonymous) return null;

  const handleShare = async () => {
    if (!certRef.current || !user) return;
    setIsProcessing(true);

    try {
      const dataUrl = await toPng(certRef.current, { 
        pixelRatio: 2, 
        backgroundColor: '#002366',
        cacheBust: true 
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'PDDS-Patriot-Donor.png', { type: 'image/png' });

      if (!userData?.sharedDonationReceipt) {
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, { meritPoints: increment(5), sharedDonationReceipt: true });
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'I am a Proud PDDS Supporter',
          text: 'I just contributed to the movement for a Federal Philippines! 🇵🇭 #PDDS #Federalismo',
        });
      } else {
        const link = document.createElement('a');
        link.download = `PDDS-Patriot-Donor.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-none shadow-2xl">
        <div className="p-6 bg-primary text-white border-b border-white/10">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Patriot Recognition
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs font-bold uppercase">
              Official Digital Contribution Receipt
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 flex justify-center bg-muted/30">
          <div 
            ref={certRef}
            className="w-[300px] aspect-[9/16] bg-[#002366] text-white p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl rounded-xl"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <PddsLogo className="w-full h-full object-contain scale-150" />
            </div>

            <div className="space-y-4 relative z-10 w-full">
              <PddsLogo className="h-20 w-auto mx-auto" />
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-accent">PatriotLink</h2>
              <div className="h-0.5 w-16 bg-accent mx-auto" />
            </div>

            <div className="space-y-6 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Official Declaration</p>
              <h1 className="text-3xl font-black text-white font-headline uppercase leading-tight">
                I am a Proud<br />
                <span className="text-accent">Supporter</span><br />
                of Federalism
              </h1>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/40 uppercase">Awarded to</p>
                <p className="text-xl font-black uppercase tracking-tighter border-b border-accent/30 pb-1">{userData?.fullName || 'A PATRIOT'}</p>
              </div>
            </div>

            <div className="w-full space-y-6 relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-full border-4 border-accent flex items-center justify-center bg-white/5">
                  <ShieldCheck className="h-10 w-10 text-accent" />
                </div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-accent">Verified Donor Badge</p>
              </div>

              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <div className="text-left space-y-0.5">
                  <p className="text-[7px] font-black uppercase text-white/40">Date</p>
                  <p className="text-[10px] font-bold uppercase">{format(new Date(), 'MMM dd, yyyy')}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[7px] font-black uppercase text-white/40">Auth ID</p>
                  <p className="text-[10px] font-mono font-bold uppercase">PDDS-{user?.uid?.substring(0,6)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-background flex flex-col gap-3">
          <Button 
            onClick={handleShare} 
            disabled={isProcessing}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl rounded-xl"
          >
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Share2 className="mr-2 h-5 w-5" />}
            Share & Earn +5 Merit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
