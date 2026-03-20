"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Added Button
import { Loader2, History, Lock, UserCog, CreditCard, UserPlus, Download } from "lucide-react";
import { pddsLeadershipRoles } from "@/lib/data";

export default function AuditTrailPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAndFetchLogs() {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const userSnap = await getDoc(doc(firestore, "users", user.uid));
        const role = userSnap.data()?.role || "";
        const hasAccess = pddsLeadershipRoles.includes(role) || ["Admin", "System Admin"].includes(role);

        if (!hasAccess) {
          setIsAuthorized(false);
          return;
        }
        setIsAuthorized(true);

        const q = query(
          collection(firestore, "activity_logs"),
          orderBy("timestamp", "desc"),
          limit(100)
        );

        const querySnapshot = await getDocs(q);
        setLogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Log Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }
    verifyAndFetchLogs();
  }, [user?.uid, firestore]);

  // --- NEW: CSV EXPORT LOGIC FOR LOGS ---
  const exportLogsToCSV = () => {
    if (logs.length === 0) return alert("No logs available to export.");

    const headers = ["Date/Time", "Admin Name", "Action", "Target Member", "Details"];
    const rows = logs.map(log => [
      log.timestamp?.toDate().toLocaleString() || "N/A",
      log.adminName,
      log.action,
      log.targetUserName,
      log.details?.replace(/,/g, ';') // Prevent comma clash in CSV
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `PDDS_Command_Logs_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "MEMBER_APPROVAL": return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "MANUAL_PAYMENT_RECORD": return <CreditCard className="h-4 w-4 text-emerald-500" />;
      default: return <UserCog className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin h-12 w-12 text-[#002366]" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Retrieving Audit Trail...</p>
    </div>
  );

  if (isAuthorized === false) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
       <Lock className="h-16 w-16 text-red-600 mb-4" />
       <h2 className="text-2xl font-black text-red-700 uppercase tracking-tighter">Registry Locked</h2>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#002366] rounded-2xl shadow-lg">
            <History className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-[#002366]">Command Logs</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Audit of Leadership Actions</p>
          </div>
        </div>

        <Button 
          onClick={exportLogsToCSV}
          variant="outline" 
          className="border-2 border-slate-200 font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl hover:bg-slate-50 transition-all"
        >
          <Download className="mr-2 h-4 w-4" /> Export Logs
        </Button>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[32px] shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-none">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Timestamp</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Admin/Officer</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Action</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Target Patriot</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50 transition-colors h-16">
                <TableCell className="text-[11px] font-bold text-slate-400">
                  {log.timestamp?.toDate().toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className="font-black text-[#002366] text-sm uppercase">{log.adminName}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                      {log.action?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-black text-slate-700 uppercase text-sm">
                  {log.targetUserName}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-medium">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}