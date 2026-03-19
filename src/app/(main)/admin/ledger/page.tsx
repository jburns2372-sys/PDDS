"use client";

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wallet, Users, AlertCircle, CheckCircle2, ArrowDownToLine } from "lucide-react";

export default function FinancialLedger() {
  const [members, setMembers] = useState<any[]>([]);
  const [duesAmount, setDuesAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const firestore = useFirestore();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function fetchLedgerData() {
      setLoading(true);
      try {
        // 1. Fetch the Global Dues Amount
        const settingsRef = doc(firestore, "metadata", "settings");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setDuesAmount(settingsSnap.data().yearlyDuesAmount || 0);
        }

        // 2. Fetch all Official Members
        const q = query(collection(firestore, "users"), where("role", "==", "Official Member"));
        const querySnapshot = await getDocs(q);
        const fetchedMembers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort alphabetically by name
        fetchedMembers.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        setMembers(fetchedMembers);

      } catch (error) {
        console.error("Error fetching ledger data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLedgerData();
  }, [firestore]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-12 w-12 text-[#002366]" />
      </div>
    );
  }

  // Calculate Ledger Statistics
  const paidMembers = members.filter(m => {
    const paymentYear = m.lastDuesPaymentDate?.toDate?.()?.getFullYear() || 
                        (m.lastDuesPaymentDate instanceof Date ? m.lastDuesPaymentDate.getFullYear() : null);
    return paymentYear === currentYear;
  });

  const pendingMembers = members.filter(m => {
    const paymentYear = m.lastDuesPaymentDate?.toDate?.()?.getFullYear() || 
                        (m.lastDuesPaymentDate instanceof Date ? m.lastDuesPaymentDate.getFullYear() : null);
    return paymentYear !== currentYear;
  });

  const totalCollected = paidMembers.length * duesAmount;
  const potentialRevenue = members.length * duesAmount;

  // Format currency
  const formatPHP = (amount: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#002366]">
            National Treasury Ledger
          </h2>
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mt-1">
            Fiscal Year {currentYear}
          </p>
        </div>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-[#002366] shadow-md bg-[#002366] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-300">Total Collected</CardTitle>
            <Wallet className="h-5 w-5 text-[#B8860B]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-[#B8860B]">
              {formatPHP(totalCollected)}
            </div>
            <p className="text-xs font-medium text-slate-300 mt-2 uppercase">
              Out of {formatPHP(potentialRevenue)} projected
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Active (Paid)</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-green-600">
              {paidMembers.length}
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
              Patriots Cleared
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Pending Dues</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black tracking-tighter text-red-600">
              {pendingMembers.length}
            </div>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
              Awaiting Payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roster Table */}
      <Card className="border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100 text-xs font-black uppercase tracking-widest text-slate-500">
                <th className="p-4">Patriot Name</th>
                <th className="p-4">Chapter</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Date Cleared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => {
                const paymentDate = member.lastDuesPaymentDate?.toDate?.() || 
                                    (member.lastDuesPaymentDate instanceof Date ? member.lastDuesPaymentDate : null);
                const isPaid = paymentDate?.getFullYear() === currentYear;

                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-[#002366] uppercase">
                      {member.fullName || "UNNAMED"}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
                      {member.city || "NATIONAL"}
                    </td>
                    <td className="p-4 text-center">
                      {isPaid ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">ACTIVE</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">PENDING</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right text-sm font-bold text-slate-500 uppercase tracking-widest">
                      {isPaid && paymentDate ? (
                        paymentDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">
              No Official Members Found in Registry
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}