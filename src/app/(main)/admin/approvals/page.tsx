"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDoc, 
  addDoc // Added for logging
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserCheck, Lock } from "lucide-react";
import { pddsLeadershipRoles } from "@/lib/data";

export default function AdminMemberApproval() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAndFetch() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        // 1. GATEKEEPER CHECK: Verify role before showing any data
        const userSnap = await getDoc(doc(firestore, "users", user.uid));
        const role = userSnap.data()?.role || "";
        const hasAccess = pddsLeadershipRoles.includes(role) || ["Admin", "System Admin", "Officer"].includes(role);

        if (!hasAccess) {
          setIsAuthorized(false);
          return;
        }
        setIsAuthorized(true);

        // 2. FETCH DATA: Only runs if authorized
        const q = query(collection(firestore, "users"), where("role", "==", "Supporter"));
        const querySnapshot = await getDocs(q);
        setPendingUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Auth/Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    verifyAndFetch();
  }, [user?.uid, firestore]);

  const approveMember = async (userId: string, name: string) => {
    setProcessingId(userId);
    try {
      // STEP 1: Update the member's status in Firestore
      await updateDoc(doc(firestore, "users", userId), {
        role: "Official Member",
        membershipStatus: "Pending Dues",
        vettedAt: serverTimestamp(),
        lastDuesPaymentDate: null 
      });

      // STEP 2: LOG THE ACTION (Audit Trail)
      await addDoc(collection(firestore, "activity_logs"), {
        adminId: user?.uid,
        adminName: user?.displayName || "Admin",
        action: "MEMBER_APPROVAL",
        targetUserId: userId,
        targetUserName: name,
        timestamp: serverTimestamp(),
        details: `Promoted from Supporter to Official Member (Pending Dues)`
      });

      alert(`${name.toUpperCase()} IS NOW AN OFFICIAL MEMBER.`);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Approval error:", error);
      alert("Error: Could not approve member.");
    } finally {
      setProcessingId(null);
    }
  };

  // RENDER: Loading State
  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="animate-spin h-12 w-12 text-[#002366]" />
    </div>
  );

  // RENDER: Access Denied State
  if (isAuthorized === false) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
       <Lock className="h-16 w-16 text-red-600 mb-4" />
       <h2 className="text-2xl font-black text-red-700 uppercase">Unauthorized Access</h2>
       <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Sec-Gen Command Only</p>
    </div>
  );

  // RENDER: Main List
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-[#002366]">Pending Approvals</h2>
        <Badge className="bg-[#B8860B] text-white px-4 py-1 font-black tracking-widest uppercase">{pendingUsers.length} Waiting</Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="p-16 border-2 border-dashed border-slate-200 rounded-[32px] text-center bg-slate-50">
          <UserCheck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">Registry Clear</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((u) => (
            <div key={u.id} className="p-6 bg-white border-2 border-slate-100 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
              <div className="flex flex-col">
                <span className="font-black text-2xl text-[#002366] uppercase leading-none">{u.fullName}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-[0.2em] mt-2">{u.city || "National"} Chapter</span>
              </div>
              <Button 
                onClick={() => approveMember(u.id, u.fullName)} 
                disabled={processingId === u.id} 
                className="bg-[#002366] hover:bg-[#001a4d] rounded-2xl px-10 h-14 font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
              >
                {processingId === u.id ? <Loader2 className="animate-spin h-6 w-6" /> : "APPROVE MEMBER"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}