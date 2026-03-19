"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, QrCode, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function QuickScanCollector() {
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleScan = async (detectedCodes: any[]) => {
    // Prevent double-scanning while already processing a result
    if (scannedUid || loading || detectedCodes.length === 0) return;
    
    const uid = detectedCodes[0].rawValue;
    if (!uid || uid === 'PDDS-GUEST') {
      setError("Invalid QR Code or Guest Pass scanned.");
      return;
    }

    setScannedUid(uid);
    setLoading(true);
    setError(null);

    try {
      const userRef = doc(firestore, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setMember({ id: userSnap.id, ...userSnap.data() });
      } else {
        setError("Member not found in the Official Registry.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Database connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!member?.id) return;
    setProcessingPayment(true);

    try {
      const userRef = doc(firestore, "users", member.id);
      await updateDoc(userRef, {
        lastDuesPaymentDate: serverTimestamp(),
        membershipStatus: "Active"
      });

      // Update local UI immediately
      setMember({ ...member, membershipStatus: "Active", lastDuesPaymentDate: new Date() });
      
      toast({ 
        title: "PAYMENT RECORDED", 
        description: `${member.fullName}'s ID is now Active.`,
        className: "bg-green-50 border-green-200"
      });
    } catch (err) {
      console.error("Payment update failed:", err);
      toast({ title: "ERROR", description: "Could not record payment.", variant: "destructive" });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleReset = () => {
    setScannedUid(null);
    setMember(null);
    setError(null);
  };

  // Status Calculation Logic
  const currentYear = new Date().getFullYear();
  const lastPaymentYear = member?.lastDuesPaymentDate?.toDate?.()?.getFullYear() || 
                          (member?.lastDuesPaymentDate instanceof Date ? member.lastDuesPaymentDate.getFullYear() : null);
  const hasPaidCurrentYear = lastPaymentYear === currentYear;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-[#002366]">
          QR Collector
        </h2>
        <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">
          Point Camera at Digital ID
        </p>
      </div>

      {!scannedUid && !error && (
        <div className="rounded-[32px] overflow-hidden border-4 border-[#002366] shadow-2xl bg-black relative aspect-square flex items-center justify-center">
          <Scanner 
            onScan={handleScan}
            components={{ audio: true, finder: true }}
            options={{ delayBetweenScanAttempts: 1000 }}
          />
          {/* Overlay scanning graphic */}
          <div className="absolute inset-0 border-[8px] border-[#B8860B]/30 m-8 rounded-3xl pointer-events-none animate-pulse" />
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border shadow-sm">
          <Loader2 className="animate-spin h-16 w-16 text-[#002366] mb-4" />
          <p className="font-bold text-slate-400 uppercase tracking-widest">Verifying Patriot...</p>
        </div>
      )}

      {error && (
        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[32px] text-center space-y-4 shadow-sm">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="text-lg font-black text-red-700 uppercase">{error}</p>
          <Button onClick={handleReset} className="w-full bg-red-600 hover:bg-red-700 rounded-xl h-12 uppercase font-black tracking-widest">
            Scan Again
          </Button>
        </div>
      )}

      {member && !loading && (
        <div className="bg-white rounded-[32px] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 pb-4 text-center border-b border-slate-100 bg-slate-50">
            <h3 className="text-3xl font-black text-[#002366] uppercase leading-none tracking-tighter">
              {member.fullName}
            </h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              {member.city || "National"} Chapter
            </p>
          </div>

          <div className="p-8 flex flex-col items-center space-y-6">
            {hasPaidCurrentYear ? (
              <div className="flex flex-col items-center space-y-3">
                <CheckCircle className="h-20 w-20 text-green-500" />
                <Badge className="bg-green-100 text-green-800 border-none px-6 py-2 text-lg font-black uppercase tracking-widest">
                  Active Member {currentYear}
                </Badge>
                <p className="text-xs font-bold text-slate-400 uppercase">Dues Cleared</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 w-full">
                <AlertCircle className="h-20 w-20 text-red-500 animate-pulse" />
                <Badge className="bg-red-100 text-red-800 border-none px-6 py-2 text-lg font-black uppercase tracking-widest">
                  Pending Dues
                </Badge>
                
                <Button 
                  onClick={handleMarkPaid}
                  disabled={processingPayment}
                  className="w-full mt-4 h-16 bg-[#B8860B] hover:bg-[#966d09] text-white rounded-2xl font-black text-xl tracking-widest shadow-xl transition-all active:scale-95"
                >
                  {processingPayment ? <Loader2 className="animate-spin h-8 w-8" /> : "RECORD PAYMENT"}
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="w-full h-14 rounded-2xl border-2 border-slate-200 text-slate-500 font-black uppercase tracking-widest hover:bg-slate-50"
            >
              <QrCode className="mr-3 h-6 w-6" /> Next Scan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}