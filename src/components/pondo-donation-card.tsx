"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShieldCheck, Loader2, Heart, Smartphone, Landmark, Info, Copy, CheckCircle2, Shield } from "lucide-react";
import { DonorCertificateDialog } from "./donor-certificate-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AMOUNTS = [50, 100, 500];

/**
 * @fileOverview PatriotPondo Donation Card.
 * UPDATED: Integrated Annual Membership Dues settlement logic.
 */
export function PondoDonationCard() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDuesPayment, setIsDuesPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"GCASH" | "MAYA" | "BANK">("GCASH");
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const currentYear = new Date().getFullYear();

  const handleOpenInstructions = () => {
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please select or enter a valid donation amount." });
      return;
    }
    setLastAmount(finalAmount);
    setShowInstructions(true);
  };

  const handleSettleDues = () => {
    setAmount(500);
    setCustomAmount("");
    setIsDuesPayment(true);
    setLastAmount(500);
    setShowInstructions(true);
  };

  const handleFinalizeDonation = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Simulate payment verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 1. Log to the Public Donations Ledger
      const donationData = {
        uid: user.uid,
        donorName: userData?.fullName || "Guest Patriot",
        amount: lastAmount,
        status: "Successful",
        isAnonymous,
        region: userData?.city || "National",
        paymentMethod,
        type: isDuesPayment ? "Membership Dues" : "Contribution",
        timestamp: serverTimestamp()
      };

      await addDoc(collection(firestore, "donations"), donationData);

      // 2. If this is a Dues Payment, update the User Registry Document
      if (isDuesPayment) {
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, {
          membershipStatus: "Active",
          lastDuesPaymentDate: serverTimestamp()
        });
      }

      toast({
        title: isDuesPayment ? "Registry Status: ACTIVE" : "Contribution Audited",
        description: isDuesPayment 
          ? `Your ${currentYear} dues have been settled. Digital ID updated.`
          : `₱${lastAmount.toLocaleString()} successfully added to the National Vault.`,
      });
      
      setShowInstructions(false);
      setCustomAmount("");
      setIsDuesPayment(false);
      
      if (!isAnonymous) {
        setShowCertificate(true);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} saved to clipboard.` });
  };

  return (
    <>
      <Card className="shadow-2xl border-t-4 border-primary bg-white overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4 border-b">
          <CardTitle className="text-xl font-headline font-black text-primary uppercase flex items-center gap-2">
            <Wallet className="h-6 w-6 text-accent" />
            Fuel the Movement
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-tight text-primary/60">
            Contribute to the Pederalismo Roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          
          {/* Annual Dues Section */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Annual Membership Dues</Label>
            <Button 
              onClick={handleSettleDues}
              variant="outline"
              className="w-full h-16 border-2 border-[#B8860B] bg-[#B8860B]/5 hover:bg-[#B8860B] hover:text-white transition-all group flex items-center justify-between px-6 rounded-xl shadow-md active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-[#B8860B] group-hover:text-white" />
                <span className="font-black uppercase tracking-tight text-sm">Settle {currentYear} Dues</span>
              </div>
              <span className="font-black text-lg">₱500</span>
            </Button>
            <p className="text-[8px] font-bold text-muted-foreground uppercase text-center">Settling dues unlocks "Active" status on your Digital ID.</p>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
            <div className="relative flex justify-center text-[8px] uppercase"><span className="bg-white px-2 text-muted-foreground font-black tracking-widest">Or Voluntary Contribution</span></div>
          </div>

          {/* Preset Amounts */}
          <div className="grid grid-cols-3 gap-3">
            {AMOUNTS.map((amt) => (
              <Button 
                key={amt} 
                variant={amount === amt && !customAmount && !isDuesPayment ? "default" : "outline"}
                className="h-12 font-black uppercase text-xs border-2 transition-all active:scale-95"
                onClick={() => { setAmount(amt); setCustomAmount(""); setIsDuesPayment(false); }}
              >
                ₱{amt}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary">Custom Contribution (PHP)</Label>
            <Input 
              type="number" 
              placeholder="Enter custom amount..." 
              className="h-12 border-2 font-bold text-lg focus:ring-primary" 
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(0); setIsDuesPayment(false); }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
            <div className="space-y-0.5">
              <Label className="text-[10px] font-black uppercase text-primary">Anonymize My Donation</Label>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Hide name from public ledger</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} className="data-[state=checked]:bg-primary" />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t pt-6 flex flex-col gap-4">
          <Button 
            onClick={handleOpenInstructions} 
            className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all" 
            disabled={loading}
          >
            <Heart className="mr-2 h-6 w-6 text-red-500 fill-current" /> Confirm Contribution
          </Button>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3 text-primary opacity-40" />
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">Secure Multi-Gateway Bridge Active</span>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
              <Landmark className="h-5 w-5 text-accent" />
              Official Payment Instruction
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-tight">
              Test Mode Active: Use the credentials below to simulate a contribution.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className={`p-4 rounded-xl text-center space-y-1 shadow-lg ${isDuesPayment ? 'bg-[#B8860B] text-white' : 'bg-primary text-white'}`}>
              <p className="text-[10px] font-black uppercase opacity-60">
                {isDuesPayment ? `Official ${currentYear} Dues` : 'Total Contribution'}
              </p>
              <p className="text-3xl font-black">₱{lastAmount.toLocaleString()}.00</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg"><Smartphone className="h-5 w-5 text-blue-600" /></div>
                  <p className="text-xs font-black uppercase text-primary">Send via GCash</p>
                </div>
                <div className="p-4 border-2 border-dashed rounded-xl flex items-center justify-between bg-muted/20">
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Recipient Number</p>
                    <p className="text-lg font-black text-primary">09053300021</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard('09053300021', 'GCash Number')} className="active:scale-95 transition-all">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-800 leading-snug uppercase">
                  Instruction: Complete the transfer in your payment app, then click verify below to finalize your patriot status.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleFinalizeDonation} 
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              Verify & Complete Contribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DonorCertificateDialog 
        isOpen={showCertificate} 
        onOpenChange={setShowCertificate}
        donationAmount={lastAmount}
        isAnonymous={isAnonymous}
      />
    </>
  );
}
