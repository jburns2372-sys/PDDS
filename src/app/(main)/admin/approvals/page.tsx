"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserCheck } from "lucide-react";

export default function AdminMemberApproval() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchSupporters = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, "users"), where("role", "==", "Supporter"));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(users);
    } catch (error) {
      console.error("Failed to fetch supporters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupporters();
  }, [firestore]);

  const approveMember = async (userId: string, name: string) => {
    setProcessingId(userId);
    try {
      const userRef = doc(firestore, "users", userId);
      
      // The exact logic to trigger the "Pending Dues" red badge on their ID
      await updateDoc(userRef, {
        role: "Official Member",
        membershipStatus: "Pending Dues",
        vettedAt: serverTimestamp(),
        lastDuesPaymentDate: null 
      });
      
      toast({ 
        title: "PROMOTION SUCCESSFUL", 
        description: `${name.toUpperCase()} is now an Official Member.`,
        className: "bg-green-50 border-green-200"
      });
      
      // Remove the user from the local state so they disappear from the list
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      
    } catch (error) {
      console.error("Promotion failed:", error);
      toast({ 
        title: "ERROR", 
        description: "Could not approve member. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-12 w-12 text-[#002366]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-[#002366]">
          Pending Approvals
        </h2>
        <Badge className="bg-[#B8860B] text-white px-4 py-1 text-sm font-black tracking-widest uppercase">
          {pendingUsers.length} Waiting
        </Badge>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="p-16 border-2 border-dashed border-slate-200 rounded-3xl text-center flex flex-col items-center gap-4 bg-slate-50">
          <UserCheck className="h-16 w-16 text-slate-300" />
          <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">
            Registry is up to date
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((u) => (
            <div 
              key={u.id} 
              className="p-6 bg-white border-2 border-slate-100 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow-md transition-shadow gap-4"
            >
              <div className="flex flex-col">
                <span className="font-black text-2xl text-[#002366] uppercase leading-none">
                  {u.fullName || "UNNAMED PATRIOT"}
                </span>
                <span className="text-sm text-slate-400 uppercase font-bold tracking-[0.2em] mt-2">
                  {u.city || "NATIONAL"} CHAPTER
                </span>
              </div>
              
              <Button 
                onClick={() => approveMember(u.id, u.fullName || "Patriot")}
                disabled={processingId === u.id}
                className="bg-[#002366] hover:bg-[#001a4d] text-white rounded-2xl px-8 h-14 w-full md:w-auto font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                {processingId === u.id ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  "APPROVE MEMBER"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}