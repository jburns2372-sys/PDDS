
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
import { useFirestore, useUser, createTemporaryApp, deleteTemporaryApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { Shield, UserPlus, Users, Camera, Pencil, Trash2, Loader2, Search, Eye, EyeOff } from "lucide-react";
import { collection, onSnapshot, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { pddsLeadershipRoles, jurisdictionLevels } from "@/lib/data";

const allAssignableRoles = [
  ...pddsLeadershipRoles,
  "Member", "Admin", "System Admin"
];

export default function AdminDashboard() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Member");
    const [jurisdictionLevel, setJurisdictionLevel] = useState("National");
    const [assignedLocation, setAssignedLocation] = useState("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 100% Reliable Registry Sync
    useEffect(() => {
        setUsersLoading(true);
        const usersCollection = collection(firestore, 'users');
        
        // No server-side filters to avoid indexing or sync issues
        const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setAllUsers(users);
            setUsersLoading(false);
        }, (err) => {
            setUsersLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    // Role Visibility Filter: Exactly the 13 political roles. 
    // Do NOT hide the currentUser (President/Admin).
    const activeOfficers = useMemo(() => {
        return allUsers.filter(user => {
            const isPoliticalRole = pddsLeadershipRoles.includes(user.role);
            const matchesSearch = 
                (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            return isPoliticalRole && matchesSearch;
        });
    }, [allUsers, searchTerm]);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setRole("Member");
        setJurisdictionLevel("National");
        setAssignedLocation("");
        setPhotoURL(null);
        setPassword("");
        setConfirmPassword("");
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setRole(user.role || "Member");
        setJurisdictionLevel(user.jurisdictionLevel || "National");
        setAssignedLocation(user.assignedLocation || "");
        setPhotoURL(user.photoURL || null);
        setPassword("");
        setConfirmPassword("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoURL(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRevoke = async (user: any) => {
        if (user.id === currentUser?.uid) {
            toast({
                variant: "destructive",
                title: "Action Restricted",
                description: "Self-revocation is disabled. Please contact another Admin for role changes."
            });
            return;
        }
        if (!confirm(`Revoke access for ${user.fullName || user.email}?`)) return;
        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id);
            toast({ title: "Success", description: "Officer record removed." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Revocation Error", description: error.message });
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

        const dataPayload: any = { 
            fullName, 
            email, 
            role, 
            jurisdictionLevel, 
            assignedLocation, 
            photoURL: photoURL || null,
            isApproved: true,
            kartilyaAgreed: true
        };

        if (isEditMode && selectedUser) {
            // 1. Auth Update (Isolated)
            if (password) {
                try {
                    if (selectedUser.id === currentUser?.uid) {
                        const auth = getAuth();
                        if (auth.currentUser) await updatePassword(auth.currentUser, password);
                    }
                    dataPayload.passwordIsTemporary = true;
                } catch (authError: any) {
                    toast({ variant: "destructive", title: "Auth Update Failed", description: authError.message });
                    setLoading(false);
                    return;
                }
            }

            // 2. Firestore Update (Isolated)
            try {
                await updateUserDocument(firestore, selectedUser.id, dataPayload);
                toast({ title: "Success", description: "Officer record updated." });
                resetForm();
            } catch (fsError: any) {
                toast({ variant: "destructive", title: "Firestore Update Failed", description: fsError.message });
            } finally {
                setLoading(false);
            }
        } else {
            // New Registration
            const tempApp = createTemporaryApp();
            const tempAuth = getAuth(tempApp);
            try {
                // 1. Auth Creation
                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                const uid = userCredential.user.uid;
                
                // 2. Firestore Document (Isolated setDoc)
                await setDoc(doc(firestore, 'users', uid), {
                    uid: uid,
                    fullName,
                    email,
                    role,
                    jurisdictionLevel,
                    assignedLocation,
                    photoURL: photoURL || null,
                    kartilyaAgreed: true,
                    isApproved: true,
                    passwordIsTemporary: true,
                    createdAt: serverTimestamp(),
                });

                toast({ title: "Success", description: "New officer registered." });
                resetForm();
            } catch (regError: any) {
                toast({ variant: "destructive", title: "Registration Failed", description: regError.message });
            } finally {
                await deleteTemporaryApp(tempApp);
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 bg-background min-h-screen pb-24">
            <div className="mb-8 border-b-2 border-primary pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2 font-headline">
                        <Shield className="h-8 w-8" />
                        Officer Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage the official PDDS leadership registry.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-10 px-4 bg-white shadow-sm border-primary/20 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{activeOfficers.length} Officers In Registry</span>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent sticky top-6">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? `Edit Profile` : 'Register Officer'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
                                        <AvatarImage src={photoURL || ""} className="object-cover" />
                                        <AvatarFallback><Camera className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Upload Photo
                                    </Button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} placeholder="officer@pdds.ph" />
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center justify-between">
                                            <span>{isEditMode ? 'New Password' : 'Password'}</span>
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary hover:underline">
                                                {showPassword ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                                            </button>
                                        </Label>
                                        <Input 
                                            required={!isEditMode} 
                                            type={showPassword ? "text" : "password"} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            placeholder={isEditMode ? "Leave blank to keep current" : ""}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm Password</Label>
                                        <Input 
                                            required={!isEditMode || password !== ""} 
                                            type={showPassword ? "text" : "password"} 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            placeholder={isEditMode ? "Leave blank to keep current" : ""}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select onValueChange={setRole} value={role}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allAssignableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Level</Label>
                                        <Select onValueChange={setJurisdictionLevel} value={jurisdictionLevel}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {jurisdictionLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input required placeholder="Province/City" value={assignedLocation} onChange={e => setAssignedLocation(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isEditMode ? 'Update Officer' : 'Create Registry Record')}
                                </Button>
                                {isEditMode && <Button variant="ghost" type="button" onClick={resetForm} className="w-full">Cancel</Button>}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            className="pl-10 h-12 shadow-sm" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Card className="shadow-lg overflow-hidden">
                        <CardHeader className="bg-primary/5 py-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Active Officers Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[80px] pl-6">Photo</TableHead>
                                        <TableHead>Officer</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Jurisdiction</TableHead>
                                        <TableHead className="text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usersLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24">
                                                <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : activeOfficers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                                                Registry Empty
                                            </TableCell>
                                        </TableRow>
                                    ) : activeOfficers.map(officer => (
                                        <TableRow key={officer.id} className="hover:bg-muted/30">
                                            <TableCell className="pl-6">
                                                <Avatar className="h-10 w-10 border shadow-sm">
                                                    <AvatarImage src={officer.photoURL || ""} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                        {officer.fullName?.charAt(0) || 'P'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold">{officer.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{officer.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                                                    {officer.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-semibold">
                                                    {officer.jurisdictionLevel}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {officer.assignedLocation}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(officer)} className="h-8 w-8 text-primary">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive" 
                                                    onClick={() => handleRevoke(officer)}
                                                    disabled={officer.id === currentUser?.uid}
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
