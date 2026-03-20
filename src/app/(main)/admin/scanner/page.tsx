"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useUser, useFirestore } from "@/firebase";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc // Added for logging
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, CheckCircle, AlertCircle, XCircle, Lock } from "lucide-react";
import { pddsLeadershipRoles } from "@/lib/data";

export default function QuickScanCollector() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSecurity() {
      if (!user?.uid) return;
      try {
        const userSnap = await getDoc(doc(firestore, "users", user.uid));
        const role = userSnap.data()?.role || "";
        const hasAccess = pddsLeadershipRoles.includes(role) || ["Admin", "System Admin", "Officer"].includes(role);
        setIsAuthorized(hasAccess);
      } finally {
        setLoading(false);
      }
    }
    checkSecurity();
  }, [user?.uid, firestore]);

  const handleScan = async (detectedCodes: any[]) => {
    if (scannedUid || loading || detectedCodes.length === 0) return;
    const uid = detectedCodes[0].rawValue;
    if (!uid || uid === 'PDDS-GUEST') { setError("Invalid QR Code."); return; }

    setScannedUid(uid);
    setLoading(true);
    try {
      const userSnap = await getDoc(doc(firestore, "users", uid));
      if (userSnap.exists()) setMember({ id: userSnap.id, ...userSnap.data() });
      else setError("Member not found.");
    } finally { setLoading(false); }
  };

  const handleMarkPaid = async () => {
    if (!member?.id) return;
    setProcessingPayment(true);
    try {
      // 1. UPDATE THE MEMBER STATUS
      await updateDoc(doc(firestore, "users", member.id), {
        lastDuesPaymentDate: serverTimestamp(),
        membershipStatus: "Active"
      });

      // 2. LOG THE ACTION (Audit Trail)
      await addDoc(collection(firestore, "activity_logs"), {
        adminId: user?.uid,
        adminName: user?.displayName || "Officer",
        action: "MANUAL_PAYMENT_RECORD",
        targetUserId: member.id,
        targetUserName: member.fullName,
        timestamp: serverTimestamp(),
        details: `Manually recorded ₱500 dues payment via QR Scanner`
      });

      alert(`PAYMENT RECORDED: ${member.fullName}`);
      setMember({ ...member, membershipStatus: "Active", lastDuesPaymentDate: new Date() });
    } catch (err) {
      console.error("Payment update failed:", err);
      alert("Error: Could not record payment.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-[#002366]" /></div>;

  if (isAuthorized === false) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
       <Lock className="h-16 w-16 text-red-600 mb-4" />
       <h2 className="text-2xl font-black text-red-700 uppercase">Scanner Locked</h2>
       <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Requires Officer Vetting Privileges</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-[#002366]">QR Collector</h2>
        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Sec-Gen Command Mode</p>
      </div>

      {!scannedUid && !error && (
        <div className="rounded-[40px] overflow-hidden border-4 border-[#002366] shadow-2xl relative aspect-square bg-black">
          <Scanner onScan={handleScan} components={{ audio: true, finder: true }} />
          <div className="absolute inset-0 border-[8px] border-[#B8860B]/20 m-12 rounded-3xl pointer-events-none animate-pulse" />
        </div>
      )}

      {error && (
        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[32px] text-center space-y-4 shadow-sm">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="text-lg font-black text-red-700 uppercase">{error}</p>
          <Button onClick={() => {setScannedUid(null); setError(null);}} className="w-full bg-red-600 hover:bg-red-700 rounded-2xl h-14 uppercase font-black tracking-widest">
            Try Again
          </Button>
        </div>
      )}

      {member && !loading && (
        <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <div className="p-8 pb-4 text-center border-b border-slate-100 bg-slate-50">
            <h3 className="text-3xl font-black text-[#002366] uppercase leading-none tracking-tighter">{member.fullName}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{member.city || "National"} Chapter</p>
          </div>

          <div className="p-8 space-y-6 text-center">
            {member.membershipStatus === "Active" ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-20 w-20 text-green-500" />
                <Badge className="bg-green-100 text-green-700 px-6 py-2 text-lg font-black uppercase tracking-widest">Already Active</Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <AlertCircle className="h-20 w-20 text-red-500 mx-auto animate-pulse" />
                <Badge className="bg-red-100 text-red-700 px-6 py-2 text-lg font-black uppercase tracking-widest">Pending Dues</Badge>
                <Button 
                  onClick={handleMarkPaid} 
                  disabled={processingPayment} 
                  className="w-full h-16 bg-[#B8860B] hover:bg-[#966d09] text-white rounded-2xl font-black text-xl tracking-widest shadow-xl"
                >
                  {processingPayment ? <Loader2 className="animate-spin h-8 w-8" /> : "RECORD PAYMENT"}
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => {setScannedUid(null); setMember(null);}} 
              className="w-full h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
            >
              <QrCode className="mr-3 h-5 w-5" /> Next Scan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}