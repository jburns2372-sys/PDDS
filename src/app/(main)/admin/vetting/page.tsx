
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { doc, updateDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, 
  Loader2, 
  Eye, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  MapPin, 
  Clock, 
  History, 
  Lock,
  ArrowRightLeft
} from "lucide-react";
import { format } from "date-fns";
import PddsLogo from "@/components/icons/pdds-logo";

/**
 * @fileOverview Sec-Gen National Vetting Command.
 * Side-by-side identity verification and tier assessment.
 */
export default function SecGenVettingPage() {
  const { userData: currentSecGen } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: users, loading: usersLoading } = useCollection('users');
  const [searchTerm, setSearchTerm] = useState("");
  const [vettingUser, setVettingUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const vettingQueue = useMemo(() => {
    return users.filter(u => {
      const isCandidate = u.role === 'Supporter' || u.isVerified === false;
      const matchesSearch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return isCandidate && matchesSearch;
    }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [users, searchTerm]);

  const logSecurityAction = async (targetUid: string, targetName: string, action: string) => {
    await addDoc(collection(firestore, "security_logs"), {
      adminUid: currentSecGen?.uid,
      adminName: currentSecGen?.fullName,
      targetUid,
      targetName,
      action,
      timestamp: serverTimestamp(),
      systemLevel: "VETTING_PROTOCOL"
    });
  };

  const handleApprove = async (user: any, level: string) => {
    setIsProcessing(true);
    try {
      const userRef = doc(firestore, "users", user.id);
      await updateDoc(userRef, {
        isVerified: true,
        vettingLevel: level,
        role: level === 'Gold' ? 'Officer' : 'Member',
        verifiedAt: serverTimestamp(),
        verifiedBy: currentSecGen?.fullName
      });

      await logSecurityAction(user.id, user.fullName, `APPROVED_IDENTITY_LEVEL_${level.toUpperCase()}`);
      
      toast({ title: "Identity Verified", description: `${user.fullName} elevated to ${level}.` });
      setVettingUser(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (user: any) => {
    const reason = prompt("Enter rejection reason for audit log:");
    if (!reason) return;

    setIsProcessing(true);
    try {
      const userRef = doc(firestore, "users", user.id);
      await updateDoc(userRef, {
        isVerified: false,
        vettingStatus: "Rejected",
        rejectionReason: reason
      });

      await logSecurityAction(user.id, user.fullName, `REJECTED_IDENTITY_REASON: ${reason}`);
      
      toast({ title: "Vetting Rejected", variant: "destructive" });
      setVettingUser(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] text-white min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Security Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-emerald-500/30 pb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tighter text-emerald-400">Registry Vetting Command</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-black text-[9px] uppercase">Sec-Gen Clearance Level</Badge>
                <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-400/60 border-emerald-500/20">Archipelago Oversight Active</Badge>
              </div>
            </div>
          </div>
          <PddsLogo variant="white" className="h-16 w-auto opacity-50 grayscale" />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Vetting Queue */}
          <div className="lg:col-span-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold font-headline uppercase tracking-tight flex items-center gap-3 text-emerald-400">
                <History className="h-5 w-5" />
                Pending Verification Queue
              </h2>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500/50" />
                <input 
                  className="w-full bg-emerald-950/20 border-2 border-emerald-500/20 rounded-xl h-12 pl-10 pr-4 text-xs font-bold uppercase text-emerald-400 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="Scan Identity Hash..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card className="bg-[#111] border-emerald-500/20 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-emerald-500/10 hover:bg-transparent">
                      <TableHead className="text-emerald-500/50 font-black uppercase text-[10px] py-6 pl-6">Candidate Identity</TableHead>
                      <TableHead className="text-emerald-500/50 font-black uppercase text-[10px]">Location</TableHead>
                      <TableHead className="text-emerald-500/50 font-black uppercase text-[10px]">Registry Date</TableHead>
                      <TableHead className="text-emerald-500/50 font-black uppercase text-[10px]">Status</TableHead>
                      <TableHead className="text-emerald-500/50 font-black uppercase text-[10px] text-right pr-6">Tactical Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={5} className="py-24 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-500" /></TableCell></TableRow>
                    ) : vettingQueue.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="py-24 text-center text-emerald-900 font-black uppercase text-xs tracking-[0.2em]">Zero pending inductions found.</TableCell></TableRow>
                    ) : (
                      vettingQueue.map(user => (
                        <TableRow key={user.id} className="border-b border-emerald-500/5 hover:bg-emerald-500/5 transition-colors group">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-emerald-500/20 rounded-xl">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback className="bg-emerald-950 text-emerald-400 font-black">{user.fullName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-black text-sm uppercase text-emerald-500 leading-tight">{user.fullName}</p>
                                <p className="text-[10px] font-mono text-emerald-700 uppercase mt-1">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {user.city}, {user.province}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-[10px] font-mono text-emerald-700">
                              {user.createdAt ? format(user.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-amber-950 text-amber-500 border border-amber-500/30 text-[8px] font-black uppercase px-2">PENDING_VET</Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              onClick={() => setVettingUser(user)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-[10px] h-9 px-6 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                              <Eye className="h-3.5 w-3.5 mr-2" /> Inspect Evidence
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>

        {/* SECURITY INSPECTION DIALOG */}
        <Dialog open={!!vettingUser} onOpenChange={(o) => !o && setVettingUser(null)}>
          <DialogContent className="sm:max-w-4xl bg-[#0a0a0a] border-emerald-500/30 text-white">
            <DialogHeader className="border-b border-emerald-500/20 pb-4">
              <DialogTitle className="font-headline uppercase text-emerald-400 flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-emerald-500" />
                Evidence Inspection: {vettingUser?.fullName}
              </DialogTitle>
              <DialogDescription className="text-emerald-700 font-bold uppercase text-[10px] tracking-widest">
                Classified: Side-by-side biometric and credential verification.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
              {/* Profile Photo */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest text-center">Induction Profile Photo</p>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/20 bg-emerald-950/10 p-2">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <img src={vettingUser?.photoURL} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Government ID */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-emerald-500/60 tracking-widest text-center">Government Credential (Binary)</p>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/20 bg-emerald-950/10 p-2 flex items-center justify-center">
                  {vettingUser?.idVerificationUrl ? (
                    <div className="w-full h-full rounded-xl overflow-hidden">
                      <img src={vettingUser.idVerificationUrl} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
                      <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">No Binary Evidence Uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="bg-emerald-950/10 p-6 -m-6 mt-4 border-t border-emerald-500/20 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  className="h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2 border-red-900 bg-red-950/50"
                  onClick={() => handleReject(vettingUser)}
                  disabled={isProcessing}
                >
                  <UserX className="h-4 w-4 mr-2" /> Reject Signal
                </Button>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  className="flex-1 md:flex-none h-14 px-10 font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  onClick={() => handleApprove(vettingUser, 'Silver')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <><UserCheck className="h-4 w-4 mr-2" /> Approve Silver</>}
                </Button>
                <Button 
                  className="flex-1 md:flex-none h-14 px-10 font-black uppercase text-[10px] tracking-widest bg-emerald-400 hover:bg-emerald-300 text-black shadow-[0_0_25px_rgba(16,185,129,0.6)]"
                  onClick={() => handleApprove(vettingUser, 'Gold')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <><ShieldAlert className="h-4 w-4 mr-2" /> Approve Gold</>}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
