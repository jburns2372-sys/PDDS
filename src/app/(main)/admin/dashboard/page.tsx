
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
    Landmark
} from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { pddsLeadershipRoles, getZipCode, getIslandGroup } from "@/lib/data";
import { DuesManagement } from "@/components/admin/dues-management";

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
    const [about, setAbout] = useState("");
    
    // Identity assets
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [idVerificationUrl, setIdVerificationUrl] = useState<string | null>(null);
    const [selectedIdFile, setSelectedIdFile] = useState<File | null>(null);

    // Jurisdictional fields
    const [streetAddress, setStreetAddress] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedBarangay, setSelectedBarangay] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const photoInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);

    // Initial Fetch for Provinces
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

    // Fetch Cities based on Province
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

    // Fetch Barangays based on City
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

    // HARDENED: Dynamic Zip Code Sync - Strict Logic
    useEffect(() => {
        setZipCode(selectedCity ? getZipCode(selectedCity, selectedBarangay) : "");
    }, [selectedBarangay, selectedCity]);

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

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasExecutiveAccess) return;

        if (!role) {
            toast({ variant: "destructive", title: "Role Required" });
            return;
        }

        const isTaken = !UNLIMITED_ROLES.includes(role) && 
                        takenRoles.includes(role) && 
                        (!isEditMode || selectedUser?.role !== role);

        if (isTaken) {
          toast({ variant: "destructive", title: "Position Occupied" });
          return;
        }

        setLoading(true);
        
        try {
            let finalPhotoURL = photoURL;
            let finalIdURL = idVerificationUrl;

            // Handle File Uploads
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
                toast({ title: "Updated" });
                resetForm();
            } else {
                const tempApp = createTemporaryApp();
                const tempAuth = getAuth(tempApp);
                try {
                    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                    const uid = userCredential.user.uid;
                    
                    // Finalize IDs if new user
                    let photoPath = finalPhotoURL;
                    let idPath = finalIdURL;
                    
                    if (selectedPhotoFile) {
                        const photoRef = ref(storage, `users/${uid}/profile.jpg`);
                        await uploadBytes(photoRef, selectedPhotoFile);
                        photoPath = await getDownloadURL(photoRef);
                    }
                    if (selectedIdFile) {
                        const idRef = ref(storage, `users/${uid}/verification.${selectedIdFile.name.split('.').pop()}`);
                        await uploadBytes(idRef, idFile);
                        idPath = await getDownloadURL(idRef);
                    }

                    await setDoc(doc(firestore, 'users', uid), {
                        uid,
                        email: email.toLowerCase(),
                        ...commonData,
                        photoURL: photoPath,
                        idVerificationUrl: idPath,
                        isApproved: true,
                        kartilyaAgreed: true,
                        createdAt: serverTimestamp(),
                        lastActive: serverTimestamp(),
                    });
                    toast({ title: "Registered", description: "Member added to National Registry." });
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
                        National Command Registry
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Full oversight of all Officers, Members, and Supporters.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                    <Card className="shadow-lg border-t-4 border-accent">
                        <form onSubmit={handleFormSubmit} autoComplete="off">
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2 uppercase tracking-tight text-primary">
                                    <UserPlus className="h-6 w-6 text-accent" />
                                    {isEditMode ? 'Edit Profile' : 'Register Member'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Full Name</Label>
                                    <Input required autoComplete="off" value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-12 text-base font-bold border-2" placeholder="JUAN DELA CRUZ" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Email Address</Label>
                                        <Input required type="email" autoComplete="new-email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 border-2" placeholder="m.delacruz@example.com" disabled={isEditMode} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Phone Number</Label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <Input required autoComplete="off" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="h-12 pl-10 border-2 font-bold" placeholder="+639..." />
                                        </div>
                                    </div>
                                </div>

                                {!isEditMode && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Temp Password</Label>
                                        <Input required type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 border-2" />
                                    </div>
                                )}

                                <div className="pt-2 border-t border-dashed">
                                    <Label className="text-[10px] font-black uppercase text-primary mb-3 block flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> Jurisdictional Deployment
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase font-bold">Province</Label>
                                            <Select onValueChange={(val) => { setSelectedProvince(val); setSelectedCity(""); setSelectedBarangay(""); }} value={selectedProvince}>
                                                <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map(p => <SelectItem key={p.code} value={p.name} className="uppercase font-bold text-[10px]">{p.name}</SelectItem>)}
                                                    {selectedProvince && !provinces.some(p => p.name === selectedProvince) && (
                                                        <SelectItem value={selectedProvince} className="font-bold uppercase text-[10px]">{selectedProvince}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase font-bold">City / Town</Label>
                                            <Select onValueChange={(val) => { setSelectedCity(val); setSelectedBarangay(""); }} value={selectedCity} disabled={!selectedProvince}>
                                                <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    {cities.map(c => <SelectItem key={c.code} value={c.name} className="uppercase font-bold text-[10px]">{c.name}</SelectItem>)}
                                                    {selectedCity && !cities.some(c => c.name === selectedCity) && (
                                                        <SelectItem value={selectedCity} className="font-bold uppercase text-[10px]">{selectedCity}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase font-bold">Barangay</Label>
                                            <Select onValueChange={setSelectedBarangay} value={selectedBarangay} disabled={!selectedCity}>
                                                <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    {barangays.map(b => <SelectItem key={b.code} value={b.name} className="uppercase font-bold text-[10px]">{b.name}</SelectItem>)}
                                                    {selectedBarangay && !barangays.some(b => b.name === selectedBarangay) && (
                                                        <SelectItem value={selectedBarangay} className="font-bold uppercase text-[10px]">{selectedBarangay}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Zip Code</Label>
                                            <Input value={zipCode} readOnly className="h-11 font-black bg-muted/50 border-2 cursor-not-allowed text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-1 mt-3">
                                        <Label className="text-[9px] uppercase font-bold">Street / House No.</Label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="House #, Street, Building" value={streetAddress} onChange={e => setStreetAddress(e.target.value.toUpperCase())} className="h-11 pl-10 border-2 font-medium" required />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-dashed">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Profile Photo</Label>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12 border-2">
                                                    <AvatarImage src={photoURL || ""} />
                                                    <AvatarFallback>{fullName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                                                    <Camera className="h-4 w-4 mr-2" /> {selectedPhotoFile ? 'Changed' : 'Upload'}
                                                </Button>
                                                <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if(f){ setSelectedPhotoFile(f); setPhotoURL(URL.createObjectURL(f)); }
                                                }} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Induction File</Label>
                                            <Button type="button" variant="outline" className="w-full h-12 text-[10px] font-bold uppercase" onClick={() => idInputRef.current?.click()}>
                                                <FileUp className="h-4 w-4 mr-2" /> {selectedIdFile ? 'File Selected' : 'Upload'}
                                            </Button>
                                            <input type="file" ref={idInputRef} className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setSelectedIdFile(e.target.files?.[0] || null)} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">About / Biography</Label>
                                        <Textarea 
                                            placeholder="Short officer description..." 
                                            value={about} 
                                            onChange={e => setAbout(e.target.value)} 
                                            className="min-h-[80px] text-xs font-medium border-2" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Organizational Rank</Label>
                                        <Select onValueChange={setRole} value={role}>
                                            <SelectTrigger className="h-12 border-2">
                                                <SelectValue placeholder="Select Rank..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allAssignableRoles.map(r => {
                                                  const isTaken = !UNLIMITED_ROLES.includes(r) && takenRoles.includes(r) && (!isEditMode || selectedUser?.role !== r);
                                                  return <SelectItem key={r} value={r} disabled={isTaken} className="font-bold uppercase text-[10px]">{r} {isTaken ? '(Taken)' : ''}</SelectItem>;
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 bg-muted/30 pt-6">
                                <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl" disabled={loading || !hasExecutiveAccess}>
                                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (isEditMode ? 'Commit Record' : 'Register Member')}
                                </Button>
                                {isEditMode && <Button variant="ghost" onClick={resetForm} className="w-full h-12 uppercase font-bold">Cancel Elevation</Button>}
                            </CardFooter>
                        </form>
                    </Card>

                    {/* DYNAMIC DUES MANAGEMENT NODE */}
                    <DuesManagement />
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input className="pl-12 h-14 shadow-sm uppercase font-bold text-sm bg-white border-2" placeholder="Search national database..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    
                    <Card className="shadow-lg overflow-hidden border-none bg-white">
                        <CardHeader className="bg-primary text-primary-foreground py-4 border-b flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-gap-2">
                                <Users className="h-5 w-5 text-accent" />
                                Registry Base ({filteredRegistry.length})
                            </CardTitle>
                            <Badge variant="outline" className="border-white/20 text-white font-black text-[10px]">AUTHORIZED ACCESS</Badge>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader><TableRow className="bg-muted/50"><TableHead className="pl-6 text-[10px] font-black uppercase">Member Identity</TableHead><TableHead className="text-[10px] font-black uppercase">Official Rank</TableHead><TableHead className="text-[10px] font-black uppercase">Jurisdiction</TableHead><TableHead className="text-right pr-6 text-[10px] font-black uppercase">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {usersLoading ? <TableRow><TableCell colSpan={4} className="text-center py-24"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow> :
                                     filteredRegistry.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">Zero records found.</TableCell></TableRow> :
                                     filteredRegistry.map(member => (
                                        <TableRow key={member.id} className={member.isApproved === false ? 'bg-destructive/5' : ''}>
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border shadow-sm">
                                                        <AvatarImage src={member.photoURL} />
                                                        <AvatarFallback className="font-black bg-muted">{member.fullName?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-black text-sm uppercase text-primary leading-tight">{member.fullName}</div>
                                                        <div className="text-[9px] font-bold text-muted-foreground uppercase">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="secondary" className="bg-primary/5 text-primary text-[9px] font-black uppercase border-none">{member.role}</Badge></TableCell>
                                            <TableCell>
                                                <div className="text-[11px] font-black text-primary uppercase leading-tight">{member.city}</div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase">{member.province}</div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                {hasExecutiveAccess ? <>
                                                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)} title="Toggle Status" className={`h-8 w-8 rounded-full ${member.isApproved === false ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                                        {member.isApproved === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} title="Edit Registry" className="h-8 w-8 rounded-full text-primary bg-primary/5"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive bg-red-50" onClick={() => handleRevoke(member)} disabled={member.id === userData?.uid} title="Remove Member"><Trash2 className="h-4 w-4" /></Button>
                                                </> : <span className="text-[9px] font-black uppercase opacity-40">READ_ONLY</span>}
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
