"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useFirestore, createTemporaryApp, deleteTemporaryApp, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
    Shield, 
    UserPlus, 
    Users, 
    Pencil, 
    Trash2, 
    Loader2, 
    Search, 
    MapPin, 
    PlusCircle, 
    UserCheck, 
    UserX, 
    Banknote, 
    ShieldCheck, 
    FileSpreadsheet, 
    ChevronDown 
} from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc, query, orderBy, limit, addDoc } from "firebase/firestore";
import { pddsLeadershipRoles, getZipCode, getIslandGroup } from "@/lib/data";
import { DuesManagement } from "@/components/admin/dues-management";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { IDCardTemplate } from "@/components/admin/id-card-template";

const UNLIMITED_ROLES = ['Member', 'Supporter', 'Volunteer', 'Coordinator', 'Moderator'];
const NCR_CODE = "130000000";

const allAssignableRoles = [
  ...pddsLeadershipRoles,
  "Member", "Admin", "Volunteer", "Coordinator", "Moderator", "Supporter"
].filter(r => r !== 'System Admin');

export default function AdminDashboard() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { userData } = useUserData();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

    // Registry fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const stats = useMemo(() => {
        const activeMembers = allUsers.filter(u => u.membershipStatus === "Active").length;
        return {
            total: allUsers.length,
            active: activeMembers,
            pending: allUsers.filter(u => u.membershipStatus !== "Active").length,
            treasury: activeMembers * 200 
        };
    }, [allUsers]);

    const generateMemberID = async (member: any) => {
        const element = document.getElementById(`id-card-${member.id}`);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 3, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            pdf.addImage(imgData, "PNG", 55, 40, 100, 157);
            pdf.save(`PDDS_ID_${member.fullName.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "ID Generated", description: "Official credential has been issued." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to render ID card." });
        }
    };

    const exportPaidLedgerCSV = () => {
        const paidMembers = allUsers.filter(u => u.membershipStatus === "Active");
        if (paidMembers.length === 0) return toast({ variant: "destructive", title: "No Paid Members" });

        const headers = ["Full Name", "Email", "Jurisdiction", "Rank", "Amount"];
        const rows = paidMembers.map(u => [u.fullName, u.email, `${u.city || 'National'}`, u.role, "200.00"]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PDDS_Paid_Ledger_${new Date().toLocaleDateString()}.csv`);
        link.click();
        toast({ title: "Ledger Exported" });
    };

    useEffect(() => {
        setUsersLoading(true);
        const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setUsersLoading(false);
        });
        return () => unsubUsers();
    }, [firestore]);

    const filteredRegistry = useMemo(() => {
        return allUsers.filter(user => {
            const search = searchTerm.toLowerCase();
            return (user.fullName || '').toLowerCase().includes(search) || (user.email || '').toLowerCase().includes(search);
        }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [allUsers, searchTerm]);

    const handleToggleStatus = async (targetUser: any) => {
        if (!hasExecutiveAccess) return;
        const newStatus = targetUser.isApproved === false;
        try {
            await updateUserDocument(firestore, targetUser.id, { isApproved: newStatus }, userData);
            toast({ title: "Updated" });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    return (
        <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen pb-32 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#002366] pb-6">
                <div>
                    <h1 className="text-4xl font-black text-[#002366] flex items-center gap-3 uppercase tracking-tighter">
                        <Shield className="h-10 w-10 text-[#B8860B]" />
                        National Command Registry
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Authorized Executive Oversight • PDDS SEC-GEN COMMAND</p>
                </div>
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-2 border-slate-200 font-black uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl hover:bg-white shadow-sm transition-all active:scale-95">
                          <FileSpreadsheet className="mr-2 h-4 w-4 text-[#B8860B]" />
                          Quick Reports
                          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 border-none rounded-2xl shadow-2xl p-2" align="end">
                        <DropdownMenuItem onClick={exportPaidLedgerCSV} className="rounded-xl p-3 cursor-pointer hover:bg-emerald-50 group">
                          <span className="text-[11px] font-black uppercase text-emerald-700">Export Paid Ledger</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge className="bg-emerald-500 font-black h-6">SYSTEM LIVE</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patriots" value={stats.total} icon={Users} color="text-blue-600" />
                <StatCard title="Active Status" value={stats.active} icon={ShieldCheck} color="text-emerald-600" sub="Verified" />
                <StatCard title="Treasury Est." value={`₱${stats.treasury.toLocaleString()}`} icon={Banknote} color="text-[#B8860B]" />
                <StatCard title="Pending Vetting" value={stats.pending} icon={UserPlus} color="text-red-600" alert={stats.pending > 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                    <DuesManagement />
                </div>

                <div className="lg:col-span-8 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                        <Input className="pl-14 h-16 shadow-2xl uppercase font-black text-sm bg-white border-none rounded-[24px]" placeholder="Search National Database..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    
                    <Card className="shadow-2xl border-none rounded-[40px] overflow-hidden bg-white">
                        <CardHeader className="bg-[#002366] text-white py-5 px-8 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3"><Users className="h-6 w-6 text-[#B8860B]" /> National Registry Base ({filteredRegistry.length})</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-50 border-none">
                                    <TableHead className="pl-8 text-[10px] font-black uppercase h-14">Member Identity</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase h-14">Official Rank</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase h-14">Jurisdiction</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase h-14 text-center">Status</TableHead>
                                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase h-14">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading ? <TableRow><TableCell colSpan={5} className="text-center py-32"><Loader2 className="animate-spin h-10 w-10 mx-auto text-[#002366]" /></TableCell></TableRow> :
                                     filteredRegistry.map(member => (
                                        <TableRow key={member.id} className={cn("hover:bg-slate-50/50 transition-colors border-slate-50", member.isApproved === false ? 'bg-red-50/30' : '')}>
                                            <TableCell className="pl-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                        <AvatarImage src={member.photoURL} />
                                                        <AvatarFallback className="font-black bg-[#002366] text-white">{member.fullName?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-black text-sm uppercase text-[#002366] leading-none mb-1">{member.fullName}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge className="bg-slate-100 text-[#002366] text-[9px] font-black uppercase border-none">{member.role}</Badge></TableCell>
                                            <TableCell>
                                                <div className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{member.city || "NATIONAL"}</div>
                                                <div className="text-[9px] font-bold text-slate-300 uppercase">{member.province}</div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge className={cn(
                                                "text-[9px] font-black uppercase px-3 py-1 border-2",
                                                member.membershipStatus === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-500 border-amber-100"
                                              )}>
                                                {member.membershipStatus === "Active" ? "PAID / ACTIVE" : "PENDING DUES"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8 space-x-2">
                                                {member.membershipStatus === "Active" && (
                                                    <>
                                                        <div className="fixed top-[-9999px] left-[-9999px]"><IDCardTemplate member={member} /></div>
                                                        <Button variant="ghost" size="icon" onClick={() => generateMemberID(member)} className="h-10 w-10 rounded-2xl text-emerald-600 bg-emerald-50 shadow-sm" title="Issue ID"><Shield className="h-5 w-5" /></Button>
                                                    </>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)} className={cn("h-10 w-10 rounded-2xl shadow-sm", member.isApproved === false ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50')}><UserCheck className="h-5 w-5" /></Button>
                                            </TableCell>
                                        </TableRow>
                                     ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, sub, alert }: any) {
  return (
    <Card className={cn("rounded-[32px] border-none shadow-xl bg-white", alert ? "ring-2 ring-red-100" : "")}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl bg-slate-50", color)}><Icon className="h-6 w-6" /></div>
        </div>
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-black tracking-tighter", color)}>{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
