"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
    Database, 
    PlusCircle, 
    UserCheck, 
    UserX, 
    Smartphone, 
    Home,
    Camera,
    FileUp,
    Landmark,
    Banknote,
    ShieldCheck,
    Activity,
    History,
    FileSpreadsheet,
    ChevronDown,
    CreditCard
} from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc, query, where, getDocs, writeBatch, addDoc, orderBy, limit } from "firebase/firestore";
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
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

    // Registry fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [about, setAbout] = useState("");
    
    // Identity assets
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [idVerificationUrl, setIdVerificationUrl] = useState<string | null>(null);
    const [selectedIdFile, setSelectedIdFile] = useState<File | null>(null);

    // Jurisdictional fields
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedBarangay, setSelectedBarangay] = useState<string>("");
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [streetAddress, setStreetAddress] = useState("");
    const [zipCode, setZipCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const photoInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);

    // --- KPI CALCULATIONS ---
    const stats = useMemo(() => {
        const activeMembers = allUsers.filter(u => u.membershipStatus === "Active").length;
        return {
            total: allUsers.length,
            active: activeMembers,
            pending: allUsers.filter(u => u.membershipStatus !== "Active").length,
            treasury: activeMembers * 200 
        };
    }, [allUsers]);

    // --- ID GENERATION LOGIC ---
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

    // --- CSV EXPORT LOGIC ---
    const exportRegistryCSV = (filter?: string) => {
        const dataToExport = filter 
            ? allUsers.filter(u => u.islandGroup === filter)
            : allUsers;

        if (dataToExport.length === 0) return toast({ title: "Operation Failed", description: "No data found." });

        const headers = ["Full Name", "Email", "Phone", "Role", "Province", "City", "Island Group", "Status"];
        const rows = dataToExport.map(u => [
            u.fullName,
            u.email,
            u.phoneNumber,
            u.role,
            u.province,
            u.city,
            u.islandGroup,
            u.membershipStatus || "Pending"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PDDS_Registry_${filter || 'National'}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Intelligence Exported", description: `Downloaded ${dataToExport.length} member records.` });
    };

    const exportPaidLedgerCSV = () => {
        const paidMembers = allUsers.filter(u => u.membershipStatus === "Active");

        if (paidMembers.length === 0) {
            return toast({ 
                variant: "destructive", 
                title: "Export Failed", 
                description: "No paid members found." 
            });
        }

        const headers = ["Full Name", "Email", "Jurisdiction", "Rank", "Payment Date", "Amount"];
        const rows = paidMembers.map(u => [
            u.fullName,
            u.email,
            `${u.city}, ${u.province}`,
            u.role,
            u.lastDuesPaymentDate?.toDate ? u.lastDuesPaymentDate.toDate().toLocaleDateString() : "Legacy Record",
            "200.00"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PDDS_Paid_Ledger_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Ledger Exported", description: `Downloaded ${paidMembers.length} payment records.` });
    };

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
                const pData = await pResp.json();
                const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
                const ncrData = await ncrResp.json();
                const combined = [{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true, code: NCR_CODE }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name));
                setProvinces(combined);
            } catch (e) {}
        };
        fetchProvinces();
    }, []);

    useEffect(() => {
        if (!selectedProvince) { setCities([]); return; }
        const fetchCities = async () => {
            const province = provinces.find(p => p.name.toUpperCase() === selectedProvince.toUpperCase());
            if (province) {
                const endpoint = province.isNCR 
                    ? `https://psgc.gitlab.io/api/regions/${NCR_CODE}/cities-municipalities/`
                    : `https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities/`;
                const response = await fetch(endpoint);
                const data = await response.json();
                setCities(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
            }
        };
        fetchCities();
    }, [selectedProvince, provinces]);

    useEffect(() => {
        if (!selectedCity) { setBarangays([]); return; }
        const fetchBarangays = async () => {
            const city = cities.find(c => c.name.toUpperCase() === selectedCity.toUpperCase());
            if (city) {
                const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays/`);
                const data = await response.json();
                setBarangays(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
            }
        };
        fetchBarangays();
    }, [selectedCity, cities]);

    useEffect(() => {
        setZipCode(selectedCity ? getZipCode(selectedCity, selectedBarangay) : "");
    }, [selectedBarangay, selectedCity]);

    useEffect(() => {
        setUsersLoading(true);
        const unsubUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
            setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setUsersLoading(false);
        });

        const qLogs = query(collection(firestore, 'activity_logs'), orderBy('timestamp', 'desc'), limit(5));
        const unsubLogs = onSnapshot(qLogs, (snapshot) => {
            setRecentLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubUsers(); unsubLogs(); };
    }, [firestore]);

    const takenRoles = useMemo(() => {
      return allUsers
        .filter(u => u.isApproved !== false && !UNLIMITED_ROLES.includes(u.role))
        .map(u => u.role);
    }, [allUsers]);

    const filteredRegistry = useMemo(() => {
        return allUsers.filter(user => {
            const search = searchTerm.toLowerCase();
            return (user.fullName || '').toLowerCase().includes(search) ||
                   (user.email || '').toLowerCase().includes(search) ||
                   (user.city || '').toLowerCase().includes(search);
        }).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [allUsers, searchTerm]);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPhoneNumber("");
        setSelectedProvince("");
        setSelectedCity("");
        setSelectedBarangay("");
        setStreetAddress("");
        setZipCode("");
        setRole("");
        setPassword("");
        setAbout("");
        setPhotoURL(null);
        setSelectedPhotoFile(null);
        setIdVerificationUrl(null);
        setSelectedIdFile(null);
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phoneNumber || "");
        setSelectedProvince(user.province || "");
        setSelectedCity(user.city || "");
        setSelectedBarangay(user.barangay || "");
        setStreetAddress(user.streetAddress || "");
        setZipCode(user.zipCode || "");
        setRole(user.role || "");
        setAbout(user.about || "");
        setPhotoURL(user.photoURL || null);
        setIdVerificationUrl(user.idVerificationUrl || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleStatus = async (targetUser: any) => {
        if (!hasExecutiveAccess || targetUser.id === userData?.uid) return;
        const newStatus = targetUser.isApproved === false;
        setLoading(true);
        try {
            await updateUserDocument(firestore, targetUser.id, { isApproved: newStatus }, userData);
            await addDoc(collection(firestore, "activity_logs"), {
                adminId: userData?.uid,
                adminName: userData?.fullName || "Admin",
                action: "STATUS_TOGGLE",
                targetUserId: targetUser.id,
                targetUserName: targetUser.fullName,
                timestamp: serverTimestamp(),
                details: `Changed approval status to: ${newStatus ? 'Approved' : 'Suspended'}`
            });
            toast({ title: "Updated" });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (targetUser: any) => {
        if (!hasExecutiveAccess || targetUser.id === userData?.uid) return;
        const confirmed = confirm(`Are you sure?`);
        if (!confirmed) return;
        setLoading(true);
        try {
            await deleteUserDocument(firestore, targetUser.id, userData);
            await addDoc(collection(firestore, "activity_logs"), {
                adminId: userData?.uid,
                adminName: userData?.fullName || "Admin",
                action: "MEMBER_REVOKED",
                targetUserId: targetUser.id,
                targetUserName: targetUser.fullName,
                timestamp: serverTimestamp(),
                details: `Permanently removed from the National Registry.`
            });
            toast({ title: "Removed" });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasExecutiveAccess) return;
        if (!role) return toast({ variant: "destructive", title: "Role Required" });

        const isTaken = !UNLIMITED_ROLES.includes(role) && 
                        takenRoles.includes(role) && 
                        (!isEditMode || selectedUser?.role !== role);

        if (isTaken) return toast({ variant: "destructive", title: "Position Occupied" });

        setLoading(true);
        try {
            let finalPhotoURL = photoURL;
            let finalIdURL = idVerificationUrl;

            if (selectedPhotoFile) {
                const photoRef = ref(storage, `users/${selectedUser?.id || Date.now()}/profile.jpg`);
                const result = await uploadBytes(photoRef, selectedPhotoFile);
                finalPhotoURL = await getDownloadURL(result.ref);
            }

            if (selectedIdFile) {
                const idRef = ref(storage, `users/${selectedUser?.id || Date.now()}/verification.${selectedIdFile.name.split('.').pop()}`);
                const result = await uploadBytes(idRef, selectedIdFile);
                finalIdURL = await getDownloadURL(result.ref);
            }

            const commonData = {
                fullName: fullName.trim().toUpperCase(), 
                phoneNumber: phoneNumber.trim(),
                province: selectedProvince.toUpperCase(),
                city: selectedCity.toUpperCase(),
                barangay: selectedBarangay.toUpperCase(),
                streetAddress: streetAddress.toUpperCase(),
                zipCode: zipCode.trim(),
                islandGroup: getIslandGroup(selectedProvince),
                role,
                about: about.trim(),
                photoURL: finalPhotoURL,
                idVerificationUrl: finalIdURL
            };

            if (isEditMode && selectedUser) {
                await updateUserDocument(firestore, selectedUser.id, commonData, userData);
                await addDoc(collection(firestore, "activity_logs"), {
                    adminId: userData?.uid,
                    adminName: userData?.fullName || "Admin",
                    action: "REGISTRY_EDIT",
                    targetUserId: selectedUser.id,
                    targetUserName: fullName,
                    timestamp: serverTimestamp(),
                    details: `Updated member profile details.`
                });
                toast({ title: "Updated" });
                resetForm();
            } else {
                const tempApp = createTemporaryApp();
                const tempAuth = getAuth(tempApp);
                try {
                    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                    const uid = userCredential.user.uid;
                    await setDoc(doc(firestore, 'users', uid), {
                        uid, email: email.toLowerCase(), ...commonData, isApproved: true,
                        membershipStatus: "Pending Dues", kartilyaAgreed: true,
                        createdAt: serverTimestamp(), lastActive: serverTimestamp(),
                    });
                    await addDoc(collection(firestore, "activity_logs"), {
                        adminId: userData?.uid,
                        adminName: userData?.fullName || "Admin",
                        action: "NEW_REGISTRATION",
                        targetUserId: uid,
                        targetUserName: fullName,
                        timestamp: serverTimestamp(),
                        details: `Manually registered new member as ${role}.`
                    });
                    toast({ title: "Registered" });
                    resetForm();
                } finally {
                    await deleteTemporaryApp(tempApp);
                }
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
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
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Authorized Executive Oversight • SEC-GEN COMMAND</p>
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
                        <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-3 pb-2">Intelligence Export</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem onClick={() => exportRegistryCSV()} className="rounded-xl p-3 cursor-pointer hover:bg-[#002366]/5 group">
                          <span className="text-[11px] font-black uppercase text-[#002366]">Export National Registry</span>
                        </DropdownMenuItem>
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
                    <Card className="shadow-2xl border-none rounded-[32px] overflow-hidden">
                        <form onSubmit={handleFormSubmit} autoComplete="off">
                            <CardHeader className="bg-[#002366] text-white">
                                <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                                    <PlusCircle className="h-5 w-5 text-[#B8860B]" />
                                    {isEditMode ? 'Modify Record' : 'Registry Entry'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                                    <Input required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-12 text-base font-black border-2 rounded-xl" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label>
                                        <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 border-2 rounded-xl" disabled={isEditMode} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Phone</Label>
                                        <Input required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="h-12 border-2 rounded-xl" />
                                    </div>
                                </div>
                                {!isEditMode && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Temp Access Key</Label>
                                        <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 border-2 rounded-xl" />
                                    </div>
                                )}
                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <Label className="text-[10px] font-black uppercase text-[#002366] flex items-center gap-2"><MapPin className="h-3 w-3" /> Jurisdictional Assignment</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select onValueChange={(val) => { setSelectedProvince(val); setSelectedCity(""); }} value={selectedProvince}>
                                            <SelectTrigger className="h-11 border-2 rounded-xl font-bold text-[10px]"><SelectValue placeholder="Province" /></SelectTrigger>
                                            <SelectContent>{provinces.map(p => <SelectItem key={p.code} value={p.name} className="uppercase font-bold text-[10px]">{p.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select onValueChange={(val) => { setSelectedCity(val); }} value={selectedCity} disabled={!selectedProvince}>
                                            <SelectTrigger className="h-11 border-2 rounded-xl font-bold text-[10px]"><SelectValue placeholder="City" /></SelectTrigger>
                                            <SelectContent>{cities.map(c => <SelectItem key={c.code} value={c.name} className="uppercase font-bold text-[10px]">{c.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-dashed">
                                    <Label className="text-[10px] font-black uppercase text-[#002366]">Organizational Rank</Label>
                                    <Select onValueChange={setRole} value={role}>
                                        <SelectTrigger className="h-12 border-2 rounded-xl font-black text-sm uppercase"><SelectValue placeholder="Select Rank..." /></SelectTrigger>
                                        <SelectContent>{allAssignableRoles.map(r => <SelectItem key={r} value={r} className="font-black uppercase text-[10px]">{r}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 bg-slate-50 p-6">
                                <Button type="submit" className="w-full h-16 bg-[#002366] hover:bg-[#001a4d] text-lg font-black uppercase tracking-widest shadow-xl rounded-2xl" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (isEditMode ? 'Commit Record' : 'Register Member')}
                                </Button>
                                {isEditMode && <Button variant="ghost" onClick={resetForm} className="w-full h-12 uppercase font-black text-xs text-slate-400">Cancel</Button>}
                            </CardFooter>
                        </form>
                    </Card>
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
                            <Badge variant="outline" className="border-white/20 text-white font-black text-[10px] px-4 py-1 uppercase">AUTHORIZED ACCESS ONLY</Badge>
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
                                                member.membershipStatus === "Active" 
                                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                  : "bg-amber-50 text-amber-500 border-amber-100"
                                              )}>
                                                {member.membershipStatus === "Active" ? "PAID / ACTIVE" : "PENDING DUES"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8 space-x-2">
                                                {hasExecutiveAccess && (
                                                    <>
                                                        {member.membershipStatus === "Active" && (
                                                            <>
                                                                <div className="fixed top-[-9999px] left-[-9999px]">
                                                                    <IDCardTemplate member={member} />
                                                                </div>
                                                                <Button 
                                                                    variant="ghost" size="icon" 
                                                                    onClick={() => generateMemberID(member)}
                                                                    className="h-10 w-10 rounded-2xl text-emerald-600 bg-emerald-50 shadow-sm"
                                                                    title="Issue Official ID"
                                                                >
                                                                    <Shield className="h-5 w-5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)} className={cn("h-10 w-10 rounded-2xl shadow-sm transition-all", member.isApproved === false ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50')}>
                                                            {member.isApproved === false ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-10 w-10 rounded-2xl text-[#002366] bg-slate-100 shadow-sm"><Pencil className="h-5 w-5" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-red-600 bg-red-50 shadow-sm" onClick={() => handleRevoke(member)} disabled={member.id === userData?.uid}><Trash2 className="h-5 w-5" /></Button>
                                                    </>
                                                )}
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
    <Card className={cn("rounded-[32px] border-none shadow-xl transition-all hover:shadow-2xl bg-white", alert ? "ring-2 ring-red-100" : "")}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl bg-slate-50", color)}><Icon className="h-6 w-6" /></div>
          {alert && <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />}
        </div>
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-black tracking-tighter", color)}>{value}</span>
          {sub && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sub}</span>}
        </div>
      </CardContent>
    </Card>
  );
}