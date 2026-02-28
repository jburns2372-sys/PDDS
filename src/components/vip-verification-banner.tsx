"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { doc, updateDoc } from "firebase/firestore";
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
import { ShieldCheck, Phone, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VipVerificationBanner() {
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("+63");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Only show if phone number is missing
  if (!userData || userData.phoneNumber) return null;

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Please enter a valid mobile number." });
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(firestore, "users", userData.uid);
      await updateDoc(userRef, {
        phoneNumber: phoneNumber.trim(),
        isPhoneVerified: true
      });

      toast({
        title: "Verification Successful!",
        description: "Your number has been added and your Digital ID is now Verified.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
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
                Unlock VIP SMS Alerts & Get Verified!
                <Sparkles className="h-4 w-4 animate-pulse" />
              </h3>
              <p className="text-[#002366]/80 text-sm font-bold max-w-xl leading-snug mt-1">
                Add your mobile number to receive direct updates from National Leadership and unlock the Verified Shield on your official Digital ID.
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#002366] hover:bg-[#001a3d] text-white font-black uppercase tracking-widest px-8 h-14 shadow-2xl rounded-xl">
                <Phone className="mr-2 h-5 w-5" />
                Add Mobile Number
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleUpdatePhone}>
                <DialogHeader>
                  <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Verify Your Identity
                  </DialogTitle>
                  <DialogDescription>
                    Enter your active mobile number to receive encrypted party directives and mobilization alerts.
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
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-primary/70 leading-relaxed italic">
                      Note: Your number will only be used for official party alerts and verified identification.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Verify ID"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
