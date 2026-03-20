"use client";

import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShieldCheck, Loader2, Heart, Smartphone, Landmark, Info, Copy, CheckCircle2, Shield } from "lucide-react";
import { DonorCertificateDialog } from "./donor-certificate-dialog";
import { PayDuesButton } from "./pay-dues-button";
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
 * @fileOverview PatriotPondo Contribution Hub.
 * Features the tactical dues requirement card and voluntary contribution tools.
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
  const [yearlyDues, setYearlyDues] = useState<number>(500);
  const [currency, setCurrency] = useState("PHP");
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function fetchSettings() {
      const docRef = doc(firestore, "metadata", "settings");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setYearlyDues(snap.data().yearlyDuesAmount || 500);
        setCurrency(snap.data().currency || "PHP");
      }
    }
    fetchSettings();
  }, [firestore]);

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
    if (!user) return;
    setLoading(true);
    try {
      // Voluntary contribution logic
      const donationData = {
        uid: user.uid,
        donorName: userData?.fullName || "Guest Patriot",
        amount: lastAmount,
        status: "Successful",
        isAnonymous,
        region: userData?.city || "National",
        paymentMethod: "GCASH",
        type: "Contribution",
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
      <div className="space-y-6">
        {/* TACTICAL DUES REQUIREMENT CARD */}
        <Card className="border-2 border-[#B8860B] bg-slate-50/50 overflow-hidden shadow-xl">
          <CardContent className="p-0">
            <div className="bg-[#002366] p-4 flex justify-between items-center">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#B8860B]" /> Official Requirement
              </span>
              <Badge className="bg-[#B8860B] text-white text-[10px] font-black uppercase px-3 py-0.5">
                {currentYear} CYCLE
              </Badge>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Membership Dues</p>
                <h3 className="text-4xl font-black text-[#002366] tracking-tighter">
                  {currency} {yearlyDues.toLocaleString()}.00
                </h3>
              </div>
              
              <PayDuesButton 
                userId={user?.uid || ""}
                userName={userData?.fullName || "Patriot"}
                amount={yearlyDues}
                variant="tactical"
              />
              
              <p className="text-[9px] font-medium text-slate-500 uppercase text-center leading-relaxed">
                Settling dues activates your verified status in the National Registry.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VOLUNTARY CONTRIBUTION HUB */}
        <Card className="shadow-2xl border-t-4 border-primary bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle className="text-xl font-headline font-black text-primary uppercase flex items-center gap-2">
              <Wallet className="h-6 w-6 text-accent" />
              Fuel the Roadmap
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-tight text-primary/60">
              Support national tactical operations
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
              <Label className="text-[10px] font-black uppercase text-primary">Custom Contribution (PHP)</Label>
              <Input 
                type="number" 
                placeholder="Enter custom amount..." 
                className="h-12 border-2 font-bold text-lg focus:ring-primary" 
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
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
      </div>

      {/* VOLUNTARY CONTRIBUTION DIALOG */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
              <Landmark className="h-5 w-5 text-accent" />
              Contribution Instruction
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-tight">
              Test Mode Active: Use the credentials below to simulate a contribution.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="p-4 rounded-xl text-center space-y-1 shadow-lg bg-primary text-white">
              <p className="text-[10px] font-black uppercase opacity-60">Total Contribution</p>
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
                  Instruction: Complete the transfer in your payment app, then click verify below to finalize your contribution.
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
              Verify & Complete
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
