
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
import { useFirestore, useUser, createTemporaryApp, deleteTemporaryApp, useStorage } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Shield, UserPlus, Users, Camera, Pencil, Trash2, Loader2, Search, Eye, EyeOff, FileText, Upload, Type, Info, UserX, UserCheck, ArrowRightLeft, MapPin, Phone } from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { pddsLeadershipRoles, jurisdictionLevels } from "@/lib/data";

const allAssignableRoles = [
  ...pddsLeadershipRoles,
  "Member", "Admin", "System Admin", "Supporter"
];

export default function AdminDashboard() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form State (Synced with Profile/Registration)
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

    // Real-time Registry Sync
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

    const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResumeFile(file);
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
        if (user.id === currentUser?.uid) {
            toast({ variant: "destructive", title: "Action Restricted", description: "You cannot suspend your own access." });
            return;
        }
        const newStatus = user.isApproved === false;
        setLoading(true);
        try {
            await updateUserDocument(firestore, user.id, { isApproved: newStatus });
            toast({ title: "Status Updated", description: `${user.fullName} is now ${newStatus ? 'Approved' : 'Suspended'}.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Update Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async (user: any) => {
        if (user.id === currentUser?.uid) {
            toast({ variant: "destructive", title: "Action Restricted", description: "You cannot change your own role." });
            return;
        }
        const newRole = user.role === 'Officer' ? 'Supporter' : 'Officer';
        setLoading(true);
        try {
            await updateUserDocument(firestore, user.id, { role: newRole });
            toast({ title: "Role Updated", description: `${user.fullName} is now a ${newRole}.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Update Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (user: any) => {
        if (user.id === currentUser?.uid) {
            toast({ variant: "destructive", title: "Action Restricted", description: "You cannot remove your own access." });
            return;
        }
        
        const confirmed = confirm(`Are you sure you want to remove ${user.fullName || 'this member'}? This will permanently delete their profile and jurisdiction data.`);
        if (!confirmed) return;

        setLoading(true);
        try {
            // Optimistic UI Update: Filter out from local state for instant removal
            setAllUsers(prev => prev.filter(u => u.id !== user.id));
            
            await deleteUserDocument(firestore, user.id);
            toast({ title: "Success", description: "Supporter successfully removed from the registry." });
        } catch (error: any) {
             console.error("Revocation Error:", error);
             toast({ variant: "destructive", title: "Revocation Error", description: "Failed to remove member. Please try again." });
             
             // The real-time listener will restore the state if the deletion actually failed
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password && password !== confirmPassword) {
            toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
            return;
        }

        setLoading(true);

        try {
            let finalPhotoURL = photoURL;
            let finalResumeURL = resumeURL;
            let uid = selectedUser?.id;

            if (isEditMode && selectedUser) {
                if (password) {
                    try {
                        if (selectedUser.id === currentUser?.uid) {
                            const auth = getAuth();
                            if (auth.currentUser) await updatePassword(auth.currentUser, password);
                        } else {
                            toast({ variant: "default", title: "Auth Note", description: "Remote password resets must be done via Firebase Console." });
                        }
                    } catch (authError: any) {
                        toast({ variant: "destructive", title: "Auth Failed", description: "Password update failed." });
                        setLoading(false);
                        return;
                    }
                }

                if (selectedFile) {
                    const storageRef = ref(storage, `users/${uid}/profile`);
                    const uploadResult = await uploadBytes(storageRef, selectedFile);
                    finalPhotoURL = await getDownloadURL(uploadResult.ref);
                }

                if (resumeFile) {
                    const resumeRef = ref(storage, `users/${uid}/resume_${Date.now()}`);
                    const uploadResult = await uploadBytes(resumeRef, resumeFile);
                    finalResumeURL = await getDownloadURL(uploadResult.ref);
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
                    resumeURL: finalResumeURL,
                    resumeText: resumeText.trim(),
                    aboutText: aboutText.trim(),
                    isApproved: selectedUser.isApproved !== false,
                    kartilyaAgreed: true
                };

                await updateUserDocument(firestore, uid, dataPayload);
                toast({ title: "Updated", description: "Member record has been updated." });
                resetForm();
            } else {
                const tempApp = createTemporaryApp();
                const tempAuth = getAuth(tempApp);
                try {
                    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                    uid = userCredential.user.uid;

                    if (selectedFile) {
                        const storageRef = ref(storage, `users/${uid}/profile`);
                        const uploadResult = await uploadBytes(storageRef, selectedFile);
                        finalPhotoURL = await getDownloadURL(uploadResult.ref);
                    }

                    if (resumeFile) {
                        const resumeRef = ref(storage, `users/${uid}/resume_${Date.now()}`);
                        const uploadResult = await uploadBytes(resumeRef, resumeFile);
                        finalResumeURL = await getDownloadURL(uploadResult.ref);
                    }

                    const dataPayload = {
                        uid: uid,
                        email: email.trim().toLowerCase(),
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
                        resumeURL: finalResumeURL,
                        resumeText: resumeText.trim(),
                        aboutText: aboutText.trim(),
                        isApproved: true,
                        kartilyaAgreed: true,
                        recruitCount: 0,
                        createdAt: serverTimestamp(),
                    };
                    
                    await setDoc(doc(firestore, 'users', uid), dataPayload);
                    toast({ title: "Registered", description: "New member has been registered." });
                    resetForm();
                } catch (regError: any) {
                    toast({ variant: "destructive", title: "Registration Failed", description: regError.message });
                } finally {
                    await deleteTemporaryApp(tempApp);
                }
            }
        } catch (error: any) {
            console.error("Process error:", error);
            toast({ variant: "destructive", title: "Process Error", description: error.message });
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
                        Official Member Registry
                    </h1>
                    <p className="text-muted-foreground mt-2">Maintain the official leadership and supporter database.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent sticky top-6 max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? `Edit Profile` : 'Register New Member'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar className="h-24 w-24 border-4 border-accent shadow-md bg-background">
                                        <AvatarImage src={photoURL || ""} className="object-cover" />
                                        <AvatarFallback><Camera className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            Select Photo
                                        </Button>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-primary">Full Name</Label>
                                    <Input 
                                        required 
                                        value={fullName} 
                                        onChange={e => setFullName(e.target.value.toUpperCase())} 
                                        placeholder="ENTER FULL NAME" 
                                        className="h-11 font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Email Address</Label>
                                        <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} placeholder="email@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Phone Number</Label>
                                        <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+639..." />
                                    </div>
                                </div>
                                
                                {!isEditMode && (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-widest text-primary">Password</span>
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary hover:underline">
                                                    {showPassword ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                                                </button>
                                            </Label>
                                            <Input 
                                                required={!isEditMode} 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={e => setPassword(e.target.value)} 
                                                placeholder="Minimum 6 characters"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-primary">Confirm Password</Label>
                                            <Input 
                                                required={!isEditMode} 
                                                type={showPassword ? "text" : "password"} 
                                                value={confirmPassword} 
                                                onChange={e => setConfirmPassword(e.target.value)} 
                                                placeholder="Repeat password"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
                                        <MapPin className="h-3 w-3" /> Residence Information
                                    </Label>
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase opacity-60">Barangay</Label>
                                            <Input value={barangay} onChange={e => setBarangay(e.target.value.toUpperCase())} className="h-9 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase opacity-60">Zip Code</Label>
                                            <Input value={zipCode} onChange={e => setZipCode(e.target.value)} className="h-9 text-xs" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] uppercase opacity-60">Street Address</Label>
                                        <Input value={streetAddress} onChange={e => setStreetAddress(e.target.value.toUpperCase())} className="h-9 text-xs" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
                                        <Shield className="h-3 w-3" /> Party Designation
                                    </Label>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] uppercase opacity-60">Role</Label>
                                        <Select onValueChange={setRole} value={role}>
                                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Role" /></SelectTrigger>
                                            <SelectContent>
                                                {allAssignableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase opacity-60">Level</Label>
                                            <Select onValueChange={setJurisdictionLevel} value={jurisdictionLevel}>
                                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {jurisdictionLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] uppercase opacity-60">Assign Loc.</Label>
                                            <Input placeholder="HQ or Region" value={assignedLocation} onChange={e => setAssignedLocation(e.target.value)} className="h-9 text-xs" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t">
                                    <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                        <Info className="h-3 w-3" /> Biography
                                    </Label>
                                    <Textarea 
                                        placeholder="Write a brief bio..." 
                                        value={aboutText} 
                                        onChange={e => setAboutText(e.target.value)}
                                        className="min-h-[80px] text-xs"
                                    />
                                </div>

                                <div className="space-y-2 pt-4 border-t">
                                    <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                        <FileText className="h-3 w-3" /> Resume/Credentials
                                    </Label>
                                    <Tabs defaultValue="text" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-2">
                                            <TabsTrigger value="text" className="text-xs"><Type className="h-3 w-3 mr-1" /> Text</TabsTrigger>
                                            <TabsTrigger value="file" className="text-xs"><Upload className="h-3 w-3 mr-1" /> File</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="text">
                                            <Textarea 
                                                placeholder="Paste credentials..." 
                                                value={resumeText} 
                                                onChange={e => setResumeText(e.target.value)}
                                                className="min-h-[100px] text-xs"
                                            />
                                        </TabsContent>
                                        <TabsContent value="file" className="space-y-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => resumeInputRef.current?.click()} className="w-full h-9 text-xs">
                                                {resumeFile ? resumeFile.name : (resumeURL ? "Attached Resume" : "Upload Document")}
                                            </Button>
                                            <input type="file" ref={resumeInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeFileChange} />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full h-11 font-black uppercase tracking-widest text-xs" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isEditMode ? 'Save Profile' : 'Register Member')}
                                </Button>
                                {isEditMode && <Button variant="ghost" type="button" onClick={resetForm} className="w-full text-xs uppercase font-bold">Cancel</Button>}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            className="pl-10 h-12 shadow-sm uppercase font-bold text-xs" 
                            placeholder="Search by Name, Email, or City..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Card className="shadow-lg overflow-hidden border-none bg-white">
                        <CardHeader className="bg-primary text-primary-foreground py-3 border-b">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Live Member Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 border-none">
                                        <TableHead className="w-[80px] pl-6 text-[10px] font-black uppercase">Photo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Member Info</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Role & Status</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase">Jurisdiction</TableHead>
                                        <TableHead className="text-right pr-6 text-[10px] font-black uppercase">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24">
                                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRegistry.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24 text-muted-foreground font-medium italic">
                                                No members found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRegistry.map(member => (
                                        <TableRow key={member.id} className={`hover:bg-muted/30 transition-colors ${member.isApproved === false ? 'bg-destructive/5' : ''}`}>
                                            <TableCell className="pl-6">
                                                <Avatar className="h-10 w-10 border shadow-sm bg-background">
                                                    <AvatarImage src={member.photoURL || ""} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                                                        {member.fullName?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-sm uppercase tracking-tight">{member.fullName}</div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-2.5 w-2.5" /> {member.phoneNumber || 'NO PHONE'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-tighter">
                                                        {member.role}
                                                    </Badge>
                                                    {member.isApproved === false && (
                                                        <Badge variant="destructive" className="text-[8px] font-black uppercase px-1 h-4">Suspended</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-[11px] font-bold uppercase tracking-tighter">
                                                    {member.city}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground uppercase">
                                                    {member.jurisdictionLevel}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleToggleRole(member)} 
                                                    className="h-8 w-8 text-primary"
                                                    title="Toggle Role"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleToggleStatus(member)} 
                                                    className={`h-8 w-8 ${member.isApproved === false ? 'text-green-600' : 'text-amber-600'}`}
                                                    title="Toggle Access"
                                                >
                                                    {member.isApproved === false ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(member)} className="h-8 w-8 text-primary" title="Edit Profile">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive" 
                                                    onClick={() => handleRevoke(member)}
                                                    disabled={member.id === currentUser?.uid}
                                                    title="Permanent Revoke"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
