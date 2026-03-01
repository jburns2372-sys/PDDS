
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
import { useFirestore, createTemporaryApp, deleteTemporaryApp, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Shield, UserPlus, Users, Pencil, Trash2, Loader2, Search, ArrowRightLeft, MapPin, Database, PlusCircle, UserCheck, UserX } from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { pddsLeadershipRoles } from "@/lib/data";

const UNLIMITED_ROLES = ['Member', 'Supporter', 'Volunteer', 'Coordinator', 'Moderator'];

const allAssignableRoles = [
  ...pddsLeadershipRoles,
  "Member", "Admin", "Volunteer", "Coordinator", "Moderator"
].filter(r => r !== 'Supporter' && r !== 'System Admin');

export default function AdminDashboard() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { userData } = useUserData();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [province, setProvince] = useState("");
    const [city, setCity] = useState("");
    const [barangay, setBarangay] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Member");
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        setUsersLoading(true);
        const unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(users);
            setUsersLoading(false);
        });
        return () => unsubscribe();
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
        });
    }, [allUsers, searchTerm]);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPhoneNumber("");
        setProvince("");
        setCity("");
        setBarangay("");
        setRole("Member");
        setPassword("");
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phoneNumber || "");
        setProvince(user.province || "");
        setCity(user.city || "");
        setBarangay(user.barangay || "");
        setRole(user.role || "Member");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleStatus = async (user: any) => {
        if (!hasExecutiveAccess || user.id === userData?.uid) return;
        const newStatus = user.isApproved === false;
        setLoading(true);
        try {
            await updateUserDocument(firestore, user.id, { isApproved: newStatus }, userData);
            toast({ title: "Updated", description: `${user.fullName} status modified.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async (user: any) => {
        if (!hasExecutiveAccess || user.id === userData?.uid) return;
        const newRole = user.role === 'Officer' ? 'Member' : 'Officer';
        if (!UNLIMITED_ROLES.includes(newRole) && takenRoles.includes(newRole)) {
          toast({ variant: "destructive", title: "Position Occupied" });
          return;
        }
        setLoading(true);
        try {
            await updateUserDocument(firestore, user.id, { role: newRole }, userData);
            toast({ title: "Updated", description: `${user.fullName} role modified.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (user: any) => {
        if (!hasExecutiveAccess || user.id === userData?.uid) return;
        const confirmed = confirm(`Are you sure you want to remove ${user.fullName}?`);
        if (!confirmed) return;
        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id, userData);
            toast({ title: "Removed", description: "Member record deleted." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePopulateSupporters = async () => {
        if (!hasExecutiveAccess) return;
        setLoading(true);
        try {
            const batch = writeBatch(firestore);
            const firstNames = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Elena", "Ramon", "Liza"];
            const lastNames = ["Dela Cruz", "Santos", "Reyes", "Gomez", "Bautista", "Garcia"];
            const locations = [
                { province: "METRO MANILA (NCR)", city: "QUEZON CITY", brgy: "COMMONWEALTH" },
                { province: "CEBU", city: "CEBU CITY", brgy: "MABOLO" },
                { province: "DAVAO DEL SUR", city: "DAVAO CITY", brgy: "BUHANGIN" }
            ];

            for (let i = 0; i < 100; i++) {
                const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const fullName = `${fName} ${lName} ${i + 1}`;
                const loc = locations[Math.floor(Math.random() * locations.length)];
                const id = `mock-supporter-${Date.now()}-${i}`;
                const ref = doc(firestore, 'users', id);
                
                batch.set(ref, {
                    uid: id,
                    fullName: fullName.toUpperCase(),
                    email: `supporter${i + 1}@pdds-test.com`,
                    phoneNumber: `+639${Math.floor(100000000 + Math.random() * 900000000)}`,
                    role: 'Supporter',
                    province: loc.province,
                    city: loc.city,
                    barangay: loc.brgy,
                    isApproved: true,
                    kartilyaAgreed: true,
                    recruitCount: Math.floor(Math.random() * 10),
                    createdAt: serverTimestamp(),
                });
            }
            await batch.commit();
            toast({ title: "Success", description: "100 test supporters added." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDeleteSupporters = async () => {
        if (!hasExecutiveAccess) return;
        const conf = prompt('Type DELETE to wipe all supporters');
        if (conf !== 'DELETE') return;
        setLoading(true);
        try {
            const q = query(collection(firestore, 'users'), where('role', '==', 'Supporter'));
            const snap = await getDocs(q);
            const batch = writeBatch(firestore);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            toast({ title: "Success", description: "All supporters removed." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasExecutiveAccess) return;

        const isTaken = !UNLIMITED_ROLES.includes(role) && 
                        takenRoles.includes(role) && 
                        (!isEditMode || selectedUser?.role !== role);

        if (isTaken) {
          toast({ variant: "destructive", title: "Position Occupied" });
          return;
        }

        setLoading(true);
        try {
            if (isEditMode && selectedUser) {
                await updateUserDocument(firestore, selectedUser.id, { 
                    fullName: fullName.trim().toUpperCase(), 
                    phoneNumber: phoneNumber.trim(),
                    province: province.trim().toUpperCase(),
                    city: city.trim().toUpperCase(),
                    barangay: barangay.trim().toUpperCase(),
                    role 
                }, userData);
                toast({ title: "Updated" });
                resetForm();
            } else {
                const tempApp = createTemporaryApp();
                const tempAuth = getAuth(tempApp);
                try {
                    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                    const uid = userCredential.user.uid;
                    await setDoc(doc(firestore, 'users', uid), {
                        uid,
                        email: email.toLowerCase(),
                        fullName: fullName.toUpperCase(),
                        role,
                        province: province.toUpperCase(),
                        city: city.toUpperCase(),
                        isApproved: true,
                        kartilyaAgreed: true,
                        createdAt: serverTimestamp(),
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
        <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
            <div className="mb-8 border-b-2 border-primary pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 font-headline uppercase tracking-tight">
                        <Shield className="h-6 w-6 md:h-8 md:w-8" />
                        Member Registry
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Command center for national organizational management.</p>
                </div>
                {hasExecutiveAccess && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={handlePopulateSupporters} className="text-[9px] uppercase font-black h-8" disabled={loading}>
                            <PlusCircle className="h-3 w-3 mr-1" /> Populate
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDeleteSupporters} className="text-[9px] uppercase font-black h-8" disabled={loading}>
                            <Database className="h-3 w-3 mr-1" /> Wipe Test
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-lg font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? 'Edit Profile' : 'Register Member'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Full Name</Label>
                                    <Input required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-12 text-base font-bold" />
                                </div>
                                {!isEditMode && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Email</Label>
                                            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Temp Password</Label>
                                            <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12" />
                                        </div>
                                    </>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase">Province</Label>
                                        <Input value={province} onChange={e => setProvince(e.target.value.toUpperCase())} className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase">City</Label>
                                        <Input value={city} onChange={e => setCity(e.target.value.toUpperCase())} className="h-10 text-xs" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Role</Label>
                                    <Select onValueChange={setRole} value={role}>
                                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allAssignableRoles.map(r => {
                                              const isTaken = !UNLIMITED_ROLES.includes(r) && takenRoles.includes(r) && (!isEditMode || selectedUser?.role !== r);
                                              return <SelectItem key={r} value={r} disabled={isTaken}>{r} {isTaken ? '(Taken)' : ''}</SelectItem>;
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full h-14 text-base font-black uppercase tracking-widest" disabled={loading || !hasExecutiveAccess}>
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isEditMode ? 'Save Record' : 'Register Member')}
                                </Button>
                                {isEditMode && <Button variant="ghost" onClick={resetForm} className="w-full h-12 uppercase font-bold">Cancel</Button>}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input className="pl-12 h-14 shadow-sm uppercase font-bold text-sm" placeholder="Search database..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <Card className="shadow-lg overflow-hidden border-none bg-white">
                            <CardHeader className="bg-primary text-primary-foreground py-3 border-b">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Registry ({filteredRegistry.length})
                                </CardTitle>
                            </CardHeader>
                            <Table>
                                <TableHeader><TableRow className="bg-muted/50"><TableHead className="pl-6 text-[10px] font-black uppercase">Member</TableHead><TableHead className="text-[10px] font-black uppercase">Role</TableHead><TableHead className="text-[10px] font-black uppercase">Jurisdiction</TableHead><TableHead className="text-right pr-6 text-[10px] font-black uppercase">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {usersLoading ? <TableRow><TableCell colSpan={4} className="text-center py-24"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow> :
                                     filteredRegistry.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">No results.</TableCell></TableRow> :
                                     filteredRegistry.map(member => (
                                        <TableRow key={member.id} className={member.isApproved === false ? 'bg-destructive/5' : ''}>
                                            <TableCell className="pl-6"><div className="font-bold text-sm uppercase">{member.fullName}</div><div className="text-[10px] text-muted-foreground">{member.email}</div></TableCell>
                                            <TableCell><Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] font-black uppercase">{member.role}</Badge></TableCell>
                                            <TableCell><div className="text-[11px] font-bold uppercase">{member.city}</div><div className="text-[9px] text-muted-foreground uppercase">{member.province}</div></TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                {hasExecutiveAccess ? <>
                                                    <Button variant="ghost" size="icon" onClick={() => handleToggleRole(member)} className="h-8 w-8 text-primary"><ArrowRightLeft className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)} className={`h-8 w-8 ${member.isApproved === false ? 'text-green-600' : 'text-amber-600'}`}>
                                                        {member.isApproved === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-8 w-8 text-primary"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRevoke(member)} disabled={member.id === userData?.uid}><Trash2 className="h-4 w-4" /></Button>
                                                </> : <span className="text-[10px] italic">View Only</span>}
                                            </TableCell>
                                        </TableRow>
                                     ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {usersLoading ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> :
                         filteredRegistry.length === 0 ? <p className="text-center py-12 text-muted-foreground">No records found.</p> :
                         filteredRegistry.map(member => (
                            <Card key={member.id} className={`shadow-md border-l-4 ${member.isApproved === false ? 'border-destructive' : 'border-primary'}`}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-sm uppercase leading-tight">{member.fullName}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase mt-1">{member.role}</p>
                                        </div>
                                        <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase">
                                            {member.city || 'National'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t pt-3">
                                        <MapPin className="h-3 w-3" /> {member.province}
                                    </div>
                                    {hasExecutiveAccess && (
                                        <div className="flex justify-around items-center pt-3 border-t border-dashed">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)}><Pencil className="h-5 w-5 text-primary" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)} className={member.isApproved === false ? 'text-green-600' : 'text-amber-600'}>
                                                {member.isApproved === false ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRevoke(member)} disabled={member.id === userData?.uid}><Trash2 className="h-5 w-5" /></Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
