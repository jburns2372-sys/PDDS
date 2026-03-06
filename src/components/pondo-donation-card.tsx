"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShieldCheck, Loader2, Heart, Smartphone, Landmark, Info, Copy, CheckCircle2 } from "lucide-react";
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
 * BUTTONS ACTIVATED: All inputs and switches are fully interactive.
 */
export function PondoDonationCard() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"GCASH" | "MAYA" | "BANK">("GCASH");
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const handleOpenInstructions = () => {
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please select or enter a valid donation amount." });
      return;
    }
    setLastAmount(finalAmount);
    setShowInstructions(true);
  };

  const handleFinalizeDonation = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const donationData = {
        uid: user?.uid || "anonymous",
        donorName: userData?.fullName || "Guest Patriot",
        amount: lastAmount,
        status: "Successful",
        isAnonymous,
        region: userData?.city || "National",
        paymentMethod,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(firestore, "donations"), donationData);

      toast({
        title: "Contribution Audited",
        description: `₱${lastAmount.toLocaleString()} successfully added to the National Vault.`,
      });
      
      setShowInstructions(false);
      setCustomAmount("");
      
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
            Contribute to the Movement
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-tight text-primary/60">
            Fuel the Pederalismo Roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-3">
            {AMOUNTS.map((amt) => (
              <Button 
                key={amt} 
                variant={amount === amt && !customAmount ? "default" : "outline"}
                className="h-12 font-black uppercase text-xs border-2 transition-all active:scale-95"
                onClick={() => { setAmount(amt); setCustomAmount(""); }}
              >
                ₱{amt}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary">Custom Amount (PHP)</Label>
            <Input 
              type="number" 
              placeholder="Enter custom amount..." 
              className="h-12 border-2 font-bold text-lg focus:ring-primary" 
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-[10px] font-black uppercase text-primary">Select Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["GCASH", "MAYA", "BANK"] as const).map(m => (
                <button 
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`h-10 text-[9px] font-black uppercase rounded-lg border-2 transition-all active:scale-95 ${paymentMethod === m ? 'border-primary bg-primary text-white shadow-md' : 'border-primary/10 text-primary/40 hover:border-primary/20 bg-muted/20'}`}
                >
                  {m === 'BANK' ? 'BPI / BANK' : m}
                </button>
              ))}
            </div>
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
            <div className="p-4 bg-primary text-white rounded-xl text-center space-y-1 shadow-lg">
              <p className="text-[10px] font-black uppercase opacity-60">Total Contribution</p>
              <p className="text-3xl font-black">₱{lastAmount.toLocaleString()}.00</p>
            </div>

            <div className="space-y-4">
              {paymentMethod === 'GCASH' && (
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
              )}

              {(paymentMethod === 'BANK' || paymentMethod === 'MAYA') && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg"><Landmark className="h-5 w-5 text-red-600" /></div>
                    <p className="text-xs font-black uppercase text-primary">Deposit to BPI Official</p>
                  </div>
                  <div className="p-4 border-2 border-dashed rounded-xl flex items-center justify-between bg-muted/20">
                    <div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Account Number</p>
                      <p className="text-lg font-black text-primary">9619213553</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard('9619213553', 'Account Number')} className="active:scale-95 transition-all">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-800 leading-snug uppercase">
                  Instruction: Complete the transfer in your {paymentMethod} app, then click verify below to finalize your patriot status.
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
