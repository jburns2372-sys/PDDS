
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShieldCheck, Loader2, Sparkles, Heart } from "lucide-react";
import { DonorCertificateDialog } from "./donor-certificate-dialog";

const AMOUNTS = [50, 100, 500];

export function PondoDonationCard() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"GCASH" | "MAYA" | "CARD">("GCASH");
  
  // Post-donation state
  const [showCertificate, setShowCertificate] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const handleDonate = async () => {
    const finalAmount = customAmount ? Number(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) return;

    setLoading(true);
    try {
      // Simulate Payment Gateway Handshake
      await new Promise(resolve => setTimeout(resolve, 1500));

      const donationData = {
        uid: user?.uid || "anonymous",
        donorName: userData?.fullName || "Guest Patriot",
        amount: finalAmount,
        status: "Successful",
        isAnonymous,
        region: userData?.city || "National",
        paymentMethod,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(firestore, "donations"), donationData);

      toast({
        title: "Patriot Contribution Confirmed!",
        description: `Your contribution of ₱${finalAmount.toLocaleString()} has been added to the National Vault.`,
      });
      
      setLastAmount(finalAmount);
      setCustomAmount("");
      
      // If not anonymous, offer the social share certificate
      if (!isAnonymous) {
        setShowCertificate(true);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Transaction Failed", description: error.message });
    } finally {
      setLoading(false);
    }
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
            Fuel the Federalism Roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-3 gap-3">
            {AMOUNTS.map((amt) => (
              <Button 
                key={amt} 
                variant={amount === amt && !customAmount ? "default" : "outline"}
                className="h-12 font-black uppercase text-xs border-2 transition-all"
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
              className="h-12 border-2 font-bold text-lg" 
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-[10px] font-black uppercase text-primary">Select Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["GCASH", "MAYA", "CARD"] as const).map(m => (
                <button 
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`h-10 text-[9px] font-black uppercase rounded-lg border-2 transition-all ${paymentMethod === m ? 'border-primary bg-primary text-white' : 'border-primary/10 text-primary/40 hover:border-primary/20'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-dashed">
            <div className="space-y-0.5">
              <Label className="text-[10px] font-black uppercase text-primary">Anonymize My Donation</Label>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Hide name from public ledger</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t pt-6 flex flex-col gap-4">
          <Button 
            onClick={handleDonate} 
            className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl" 
            disabled={loading || (!amount && !customAmount)}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Transmitting...</>
            ) : (
              <><Heart className="mr-2 h-6 w-6 text-red-500 fill-current" /> Confirm Contribution</>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3 text-primary opacity-40" />
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">Secure Multi-Gateway Bridge Active</span>
          </div>
        </CardFooter>
      </Card>

      <DonorCertificateDialog 
        isOpen={showCertificate} 
        onOpenChange={setShowCertificate}
        donationAmount={lastAmount}
        isAnonymous={isAnonymous}
      />
    </>
  );
}
