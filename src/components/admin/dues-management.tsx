
"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, RefreshCw, ShieldCheck, Loader2, Landmark } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * @fileOverview Admin Dues Management Component.
 * Allows executives to set the yearly membership dues amount.
 */
export function DuesManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDues = async () => {
      try {
        const docRef = doc(firestore, "metadata", "settings");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAmount(snap.data().yearlyDuesAmount || 0);
        }
      } catch (error: any) {
        console.error("Failed to fetch dues setting:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
  }, [firestore]);

  const handleUpdate = async () => {
    setUpdating(true);
    const settingsRef = doc(firestore, "metadata", "settings");
    const data = {
      yearlyDuesAmount: amount,
      lastUpdated: serverTimestamp()
    };

    try {
      await setDoc(settingsRef, data, { merge: true });
      toast({ title: "Dues Calibrated", description: `National Yearly Dues set to ₱${amount.toLocaleString()}.` });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: settingsRef.path,
        operation: 'write',
        requestResourceData: data
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-dashed">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-t-4 border-accent bg-white overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Landmark className="h-4 w-4 text-accent" />
              Membership Dues Protocol
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase mt-1">
              National Financial Governance
            </CardDescription>
          </div>
          <Badge className="bg-primary text-white text-[8px] font-black uppercase">FINANCE_CMD</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-primary/60">Current Yearly Dues (PHP)</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-12 pl-10 border-2 font-black text-lg focus:border-accent transition-all"
              placeholder="0.00"
            />
          </div>
        </div>
        <p className="text-[9px] font-medium text-muted-foreground italic leading-relaxed">
          "Updating this value will instantly synchronize the 'Payment Required' status on all non-compliant Digital ID cards nationwide."
        </p>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t pt-4">
        <Button 
          onClick={handleUpdate} 
          disabled={updating}
          className="w-full h-12 font-black uppercase tracking-widest shadow-lg text-xs"
        >
          {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Commit New Amount
        </Button>
      </CardFooter>
    </Card>
  );
}
