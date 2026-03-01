
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { doc, updateDoc } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldCheck, Phone, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VipVerificationBanner() {
  const { userData } = useUserData();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState("+63");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Only show if phone number is missing
  if (!userData || userData.phoneNumber) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 13) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Format: +63XXXXXXXXXX" });
      return;
    }

    setLoading(true);
    try {
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-banner', { 'size': 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifierRef.current);
      setConfirmationResult(result);
      setShowOtp(true);
      toast({ title: "OTP Sent", description: "Verify your number to unlock Member status." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndPromote = async () => {
    if (!confirmationResult || otp.length !== 6) return;
    
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      
      const userRef = doc(firestore, "users", userData.uid);
      const updates: any = {
        phoneNumber: phoneNumber.trim(),
        isPhoneVerified: true,
        isVerified: true, // Elevate status
        vettingLevel: "Bronze"
      };

      // Supporter -> Member Elevation
      if (userData.role === 'Supporter') {
        updates.role = 'Member';
        updates.jurisdictionLevel = 'City/Municipal';
      }

      await updateDoc(userRef, updates);

      toast({
        title: "Induction Upgraded!",
        description: "You are now an official Verified Member of PDDS.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: "Incorrect code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="recaptcha-banner"></div>
      <Card className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] border-none shadow-xl overflow-hidden relative group mb-8">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="vip-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#vip-grid)" />
          </svg>
        </div>

        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-[#002366] p-4 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-[#002366] uppercase tracking-tight font-headline flex items-center justify-center md:justify-start gap-2">
                  Upgrade to Verified Member Status!
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </h3>
                <p className="text-[#002366]/80 text-sm font-bold max-w-xl leading-snug mt-1">
                  Supporters who verify their mobile number are automatically elevated to **Official Member** status with a verified Digital ID.
                </p>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#002366] hover:bg-[#001a3d] text-white font-black uppercase tracking-widest px-8 h-14 shadow-2xl rounded-xl">
                  <Phone className="mr-2 h-5 w-5" />
                  Begin Induction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                {!showOtp ? (
                  <form onSubmit={handleSendOtp}>
                    <DialogHeader>
                      <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Official Registry Link
                      </DialogTitle>
                      <DialogDescription>
                        Enter your mobile number to receive your induction code.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-primary">
                          Mobile Number (PH)
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+639123456789"
                            className="pl-10 h-12 text-lg font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Verification SMS"}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="space-y-6 py-4">
                    <DialogHeader>
                      <DialogTitle className="font-headline uppercase text-primary">Confirm Induction</DialogTitle>
                      <DialogDescription>Enter the 6-digit code sent to your mobile.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="000000" 
                        maxLength={6} 
                        className="text-center text-3xl font-black tracking-[0.5em] h-16" 
                      />
                      <Button onClick={handleVerifyAndPromote} className="w-full h-14 font-black uppercase tracking-widest" disabled={loading || otp.length !== 6}>
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Member Induction"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
