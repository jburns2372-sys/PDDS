"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Added Button
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Banknote, Users, CalendarCheck, Lock, Download } from "lucide-react"; // Added Download icon
import { pddsLeadershipRoles } from "@/lib/data";

export default function CollectionLedger() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAndFetch() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const userSnap = await getDoc(doc(firestore, "users", user.uid));
        const role = userSnap.data()?.role || "";
        const hasAccess = pddsLeadershipRoles.includes(role) || ["Admin", "System Admin", "Officer"].includes(role);

        if (!hasAccess) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setIsAuthorized(true);

        const q = query(
          collection(firestore, "users"), 
          where("membershipStatus", "==", "Active"),
          orderBy("lastDuesPaymentDate", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        setActiveMembers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Ledger Error:", error);
      } finally {
        setLoading(false);
      }
    }
    verifyAndFetch();
  }, [user?.uid, firestore]);

  // --- NEW: CSV EXPORT LOGIC ---
  const exportToCSV = () => {
    if (activeMembers.length === 0) return alert("No data to export.");

    const headers = ["Full Name", "Chapter/City", "Payment Date", "Status", "Amount"];
    const rows = activeMembers.map(m => [
      m.fullName,
      m.city || "National",
      m.lastDuesPaymentDate?.toDate().toLocaleDateString() || "N/A",
      "Active",
      "500"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `PDDS_Collections_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin h-12 w-12 text-[#002366]" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Verifying Clearance...</p>
    </div>
  );

  if (isAuthorized === false) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
       <Lock className="h-16 w-16 text-red-600 mb-4" />
       <h2 className="text-2xl font-black text-red-700 uppercase">Access Denied</h2>
    </div>
  );

  const totalCollected = activeMembers.length * 500;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-[#002366]">Collection Ledger</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Verified Active Membership Dues</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <Button 
            onClick={exportToCSV}
            variant="outline" 
            className="w-full sm:w-auto border-2 border-slate-200 font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl hover:bg-slate-50"
          >
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>

          <div className="bg-[#B8860B] text-white p-4 rounded-2xl shadow-lg flex items-center gap-4 w-full sm:w-auto">
            <Banknote className="h-8 w-8" />
            <div>
              <p className="text-[10px] font-bold uppercase opacity-80 leading-none mb-1">Total Collected</p>
              <p className="text-2xl font-black leading-none">₱{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[32px] border-2 border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-[#002366] font-black uppercase tracking-widest text-sm">
              <Users className="h-4 w-4" /> Paid Members
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
             <span className="text-5xl font-black text-[#002366]">{activeMembers.length}</span>
             <span className="text-slate-300 font-bold ml-2 uppercase text-xs">Verified</span>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-2 border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-[#002366] font-black uppercase tracking-widest text-sm">
              <CalendarCheck className="h-4 w-4" /> Latest Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
             <span className="text-lg font-black text-[#002366] uppercase">
               {activeMembers[0]?.fullName || "No Payments Yet"}
             </span>
             <p className="text-slate-400 text-xs font-bold uppercase mt-1">
               {activeMembers[0]?.lastDuesPaymentDate?.toDate().toLocaleDateString() || "--"}
             </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[32px] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#002366]">
              <TableRow className="hover:bg-[#002366] border-none">
                <TableHead className="text-white font-black uppercase tracking-widest">Patriot Name</TableHead>
                <TableHead className="text-white font-black uppercase tracking-widest">Chapter</TableHead>
                <TableHead className="text-white font-black uppercase tracking-widest">Date Paid</TableHead>
                <TableHead className="text-white font-black uppercase tracking-widest text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.map((m) => (
                <TableRow key={m.id} className="hover:bg-slate-50 border-slate-100 h-16">
                  <TableCell className="font-black text-[#002366] uppercase">{m.fullName}</TableCell>
                  <TableCell className="font-bold text-slate-400 uppercase text-xs">{m.city || "National"}</TableCell>
                  <TableCell className="font-bold text-slate-600">
                    {m.lastDuesPaymentDate?.toDate().toLocaleDateString('en-PH', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-black uppercase tracking-widest px-3">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {activeMembers.length === 0 && (
          <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-[0.2em]">
            No payments recorded in ledger
          </div>
        )}
      </div>
    </div>
  );
}