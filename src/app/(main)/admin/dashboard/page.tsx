
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, createTemporaryApp, deleteTemporaryApp, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { useToast } from "@/hooks/use-toast";
import { updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Shield, UserPlus, Users, Camera, Pencil, Trash2, Loader2, Search, Eye, EyeOff, FileText, Upload, Type, Info, UserX, UserCheck, ArrowRightLeft, MapPin, Phone, Database, PlusCircle } from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { pddsLeadershipRoles, jurisdictionLevels } from "@/lib/data";

// ROLES THAT CAN HAVE UNLIMITED OCCUPANTS
const UNLIMITED_ROLES = ['Member', 'Supporter'];

const allAssignableRoles = [
  ...pddsLeadershipRoles,
  "Member", "Admin", "System Admin", "Supporter"
];

export default function AdminDashboard() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { userData } = useUserData();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // EXECUTIVE ACCESS BOOLEAN
    const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [barangay, setBarangay] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [zipCode, setZipCode] = useState("");
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Member");
    const [jurisdictionLevel, setJurisdictionLevel] = useState("National");
    const [assignedLocation, setAssignedLocation] = useState("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState("");
    const [resumeURL, setResumeURL] = useState<string | null>(null);
    const [aboutText, setAboutText] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    // Real-time Registry Sync & Role Tracking
    useEffect(() => {
        setUsersLoading(true);
        const usersCollection = collection(firestore, 'users');
        
        const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setAllUsers(users);
            setUsersLoading(false);
        }, (err) => {
            console.error("Registry sync error:", err);
            setUsersLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    // Track which roles are already assigned (excluding unlimited ones)
    const takenRoles = useMemo(() => {
      return allUsers
        .filter(u => u.isApproved !== false && !UNLIMITED_ROLES.includes(u.role))
        .map(u => u.role);
    }, [allUsers]);

    const filteredRegistry = useMemo(() => {
        return allUsers.filter(user => {
            const matchesSearch = 
                (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.city || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [allUsers, searchTerm]);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPhoneNumber("");
        setStreetAddress("");
        setBarangay("");
        setCity("");
        setProvince("");
        setZipCode("");
        setRole("Member");
        setJurisdictionLevel("National");
        setAssignedLocation("");
        setPhotoURL(null);
        setSelectedFile(null);
        setResumeFile(null);
        setResumeText("");
        setResumeURL(null);
        setAboutText("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoURL(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setPhoneNumber(user.phoneNumber || "");
        setStreetAddress(user.streetAddress || "");
        setBarangay(user.barangay || "");
        setCity(user.city || "");
        setProvince(user.province || "");
        setZipCode(user.zipCode || "");
        setRole(user.role || "Member");
        setJurisdictionLevel(user.jurisdictionLevel || "National");
        setAssignedLocation(user.assignedLocation || "");
        setPhotoURL(user.photoURL || null);
        setResumeURL(user.resumeURL || null);
        setResumeText(user.resumeText || "");
        setAboutText(user.aboutText || "");
        setSelectedFile(null);
        setResumeFile(null);
        setPassword("");
        setConfirmPassword("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleStatus = async (user: any) => {
        if (!hasExecutiveAccess) {
            toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to modify status." });
            return;
        }
        if (user.id === userData?.uid) {
            toast({ variant: "destructive", title: "Action Restricted", description: "You cannot suspend your own access." });
            return;
        }
        const newStatus = user.isApproved === false;
        setLoading(true);
        try {
            await updateUserDocument(firestore, user.id, { isApproved: newStatus }, userData);
            toast({ title: "Status Updated", description: `${user.fullName} is now ${newStatus ? 'Approved' : 'Suspended'}.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Update Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async (user: any) => {
        if (!hasExecutiveAccess) {
            toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to change roles." });
            return;
        }
        if (user.id === userData?.uid) {
            toast({ variant: "destructive", title: "Action Restricted", description: "You cannot change your own role." });
            return;
        }
        
        const newRole = user.role === 'Officer' ? 'Supporter' : 'Officer';
        
        // UNIQUE ROLE VALIDATION GUARD
        if (!UNLIMITED_ROLES.includes(newRole) && takenRoles.includes(newRole)) {
          toast({ variant: "destructive", title: "Position Occupied", description: `The position of ${newRole} is already filled.` });
          return;
        }

        setLoading(true);
        try {
            await updateUserDocument(firestore, user.id, { role: newRole }, userData);
            toast({ title: "Role Updated", description: `${user.fullName} is now a ${newRole}.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Update Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (user: any) => {
        if (!hasExecutiveAccess) {
            toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to remove members." });
            return;
        }
        if (user.id === userData?.uid) {
            toast({ variant: "destructive", title: "Action Restricted", description: "You cannot remove your own access." });
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to remove ${user.fullName || 'this member'}? This will permanently delete their profile and jurisdiction data.`);
        if (!confirmed) return;

        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id, userData);
            toast({ title: "Success", description: "Member successfully removed from the registry." });
        } catch (error: any) {
             console.error("Revocation Error:", error);
             toast({ variant: "destructive", title: "Revocation Error", description: error.message || "Failed to remove member." });
        } finally {
            setLoading(false);
        }
    };

    const handlePopulateSupporters = async () => {
        if (!hasExecutiveAccess) return;
        setLoading(true);
        try {
            const batch = writeBatch(firestore);
            const firstNames = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Elena", "Ramon", "Liza", "Antonio", "Carmen", "Roberto", "Isabel", "Miguel", "Rosa", "Francisco"];
            const lastNames = ["Dela Cruz", "Santos", "Reyes", "Gomez", "Bautista", "Garcia", "Perez", "Torres", "Mercado", "Quizon", "Mendoza", "Cruz", "Villanueva", "Lim", "Go"];
            const locations = [
                { province: "METRO MANILA (NCR)", city: "QUEZON CITY", brgy: "COMMONWEALTH" },
                { province: "METRO MANILA (NCR)", city: "CITY OF MANILA", brgy: "SAMPALOC" },
                { province: "METRO MANILA (NCR)", city: "MAKATI CITY", brgy: "POBLACION" },
                { province: "LAGUNA", city: "CITY OF CALAMBA", brgy: "POBLACION" },
                { province: "CAVITE", city: "CITY OF IMUS", brgy: "POBLACION IV-A" },
                { province: "CEBU", city: "CEBU CITY", brgy: "MABOLO" },
                { province: "DAVAO DEL SUR", city: "DAVAO CITY", brgy: "BUHANGIN" },
                { province: "BULACAN", city: "CITY OF MALOLOS", brgy: "GUIHANHANE" }
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
                    zipCode: '0000',
                    isApproved: true,
                    kartilyaAgreed: true,
                    recruitCount: Math.floor(Math.random() * 30),
                    createdAt: serverTimestamp(),
                });
            }

            await batch.commit();
            toast({ title: "Registry Populated", description: "100 Mock Supporters added for development testing." });
        } catch (error: any) {
            console.error("Populate Error:", error);
            toast({ variant: "destructive", title: "Populate Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDeleteSupporters = async () => {
        if (!hasExecutiveAccess) return;
        const confirmation = window.prompt('Type DELETE to confirm wiping all supporters from the database.');
        if (confirmation !== 'DELETE') return;

        setLoading(true);
        try {
            const q = query(collection(firestore, 'users'), where('role', '==', 'Supporter'));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                toast({ title: "No Supporters Found", description: "The registry is already empty." });
                setLoading(false);
                return;
            }

            const batch = writeBatch(firestore);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            toast({ title: "Test Data Wiped", description: `${snapshot.size} supporters removed.` });
        } catch (error: any) {
            console.error("Bulk Delete Error:", error);
            toast({ variant: "destructive", title: "Bulk Delete Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!hasExecutiveAccess) {
            toast({ variant: "destructive", title: "Unauthorized", description: "Only the President or Administrators can modify the registry." });
            return;
        }

        // UNIVERSAL ROLE LOCK VALIDATION
        const isRoleConflict = !UNLIMITED_ROLES.includes(role) && 
                               takenRoles.includes(role) && 
                               (!isEditMode || selectedUser?.role !== role);

        if (isRoleConflict) {
          toast({ variant: "destructive", title: "Position Occupied", description: "This position is already assigned to another individual." });
          return;
        }

        if (password && password !== confirmPassword) {
            toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
            return;
        }

        setLoading(true);
        try {
            let finalPhotoURL = photoURL;
            let uid = selectedUser?.id;

            if (isEditMode && selectedUser) {
                if (selectedFile) {
                    const storageRef = ref(storage, `users/${uid}/profile`);
                    const uploadResult = await uploadBytes(storageRef, selectedFile);
                    finalPhotoURL = await getDownloadURL(uploadResult.ref);
                }
                const dataPayload: any = { 
                    fullName: fullName.trim().toUpperCase(), 
                    phoneNumber: phoneNumber.trim(),
                    streetAddress: streetAddress.trim().toUpperCase(),
                    barangay: barangay.trim().toUpperCase(),
                    city: city.trim().toUpperCase(),
                    province: province.trim().toUpperCase(),
                    zipCode: zipCode.trim(),
                    role, 
                    jurisdictionLevel, 
                    assignedLocation: assignedLocation.trim() || city.trim(), 
                    photoURL: finalPhotoURL,
                    isApproved: selectedUser.isApproved !== false,
                    kartilyaAgreed: true
                };
                await updateUserDocument(firestore, uid, dataPayload, userData);
                toast({ title: "Updated", description: "Member record updated." });
                resetForm();
            } else {
                const tempApp = createTemporaryApp();
                const tempAuth = getAuth(tempApp);
                try {
                    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                    uid = userCredential.user.uid;
                    const dataPayload = {
                        uid: uid,
                        email: email.trim().toLowerCase(),
                        fullName: fullName.trim().toUpperCase(), 
                        phoneNumber: phoneNumber.trim(),
                        role, 
                        province: province.trim().toUpperCase(),
                        city: city.trim().toUpperCase(),
                        barangay: barangay.trim().toUpperCase(),
                        isApproved: true,
                        kartilyaAgreed: true,
                        recruitCount: 0,
                        createdAt: serverTimestamp(),
                    };
                    await setDoc(doc(firestore, 'users', uid), dataPayload);
                    toast({ title: "Registered", description: "New member registered." });
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
        <div className="p-6 bg-background min-h-screen pb-24">
            <div className="mb-8 border-b-2 border-primary pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2 font-headline uppercase tracking-tight">
                        <Shield className="h-8 w-8" />
                        Member Registry Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage all registered members and supporters.</p>
                </div>
                {hasExecutiveAccess && (
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline"
                            onClick={handlePopulateSupporters}
                            className="font-black uppercase tracking-widest text-[10px] h-9 shadow-sm border-accent text-accent-foreground hover:bg-accent/10"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <PlusCircle className="h-3.5 w-3.5 mr-2" />}
                            Write 100 Test Supporters
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleBulkDeleteSupporters}
                            className="font-black uppercase tracking-widest text-[10px] h-9 shadow-lg"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Database className="h-3.5 w-3.5 mr-2" />}
                            Wipe Test Supporters
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent sticky top-6">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? `Edit Profile` : 'Register New Member'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-primary">Full Name</Label>
                                    <Input required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-11 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-primary">Email Address</Label>
                                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} />
                                </div>
                                {!isEditMode && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Temporary Password</Label>
                                        <Input required={!isEditMode} type="password" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase opacity-60">Province</Label>
                                        <Input value={province} onChange={e => setProvince(e.target.value.toUpperCase())} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase opacity-60">City</Label>
                                        <Input value={city} onChange={e => setCity(e.target.value.toUpperCase())} className="h-9 text-xs" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] uppercase opacity-60">Role</Label>
                                    <Select onValueChange={setRole} value={role}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allAssignableRoles.map(r => {
                                              // Universal Role Lock logic: disable if taken and not unlimited
                                              const isTaken = !UNLIMITED_ROLES.includes(r) && 
                                                              takenRoles.includes(r) && 
                                                              (!isEditMode || selectedUser?.role !== r);
                                              
                                              return (
                                                <SelectItem key={r} value={r} disabled={isTaken}>
                                                  {r} {isTaken ? '(Taken)' : ''}
                                                </SelectItem>
                                              );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full h-11 font-black uppercase tracking-widest text-xs" disabled={loading || !hasExecutiveAccess}>
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isEditMode ? 'Save Profile' : 'Register Member')}
                                </Button>
                                {isEditMode && <Button variant="ghost" type="button" onClick={resetForm} className="w-full text-xs uppercase font-bold">Cancel</Button>}
                                {!hasExecutiveAccess && <p className="text-[10px] text-destructive text-center font-bold">Executive Access Required</p>}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10 h-12 shadow-sm uppercase font-bold text-xs" placeholder="Search member database..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    
                    <Card className="shadow-lg overflow-hidden border-none bg-white">
                        <CardHeader className="bg-primary text-primary-foreground py-3 border-b">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Live Member Registry ({filteredRegistry.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 border-none">
                                        <TableHead className="text-[10px] font-black uppercase pl-6">Member Info</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Role & Status</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Jurisdiction</TableHead>
                                        <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-24"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                                    ) : filteredRegistry.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground italic">No members found.</TableCell></TableRow>
                                    ) : filteredRegistry.map(member => (
                                        <TableRow key={member.id} className={`hover:bg-muted/30 ${member.isApproved === false ? 'bg-destructive/5' : ''}`}>
                                            <TableCell className="pl-6">
                                                <div className="font-bold text-sm uppercase">{member.fullName}</div>
                                                <div className="text-[10px] text-muted-foreground">{member.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] font-black uppercase">
                                                    {member.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-[11px] font-bold uppercase">{member.city}</div>
                                                <div className="text-[9px] text-muted-foreground uppercase">{member.province}</div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                {hasExecutiveAccess ? (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => handleToggleRole(member)} className="h-8 w-8 text-primary"><ArrowRightLeft className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(member)} className={`h-8 w-8 ${member.isApproved === false ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {member.isApproved === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-8 w-8 text-primary"><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRevoke(member)} disabled={member.id === userData?.uid}><Trash2 className="h-4 w-4" /></Button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">View Only</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
