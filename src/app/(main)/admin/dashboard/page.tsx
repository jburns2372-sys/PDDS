
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

    // 100% Reliable Registry Sync via onSnapshot
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
            console.error("Registry Sync Error:", err);
            setUsersLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    // Role Visibility Filter: Exact mapping of the 13 PDDS Leadership Roles.
    // Explicitly excludes "System Admin" and "Admin" from the public political registry view.
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
        // Prevention: President and currently logged in user cannot be deleted by themselves
        if (user.id === currentUser?.uid) {
            toast({
                variant: "destructive",
                title: "Action Restricted",
                description: "You cannot revoke your own access. Please contact another System Administrator."
            });
            return;
        }
        if (!confirm(`Revoke access for ${user.fullName || user.email}?`)) return;
        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id);
            toast({ title: "Success", description: "Officer record removed from registry." });
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
            // Isolate Auth update from Firestore update
            if (password) {
                try {
                    // Update current user's password if they are editing themselves,
                    // otherwise mark password as temporary for the target user (if admin can do it)
                    if (selectedUser.id === currentUser?.uid) {
                        const auth = getAuth();
                        if (auth.currentUser) await updatePassword(auth.currentUser, password);
                    }
                    dataPayload.passwordIsTemporary = true;
                } catch (authError: any) {
                    toast({ variant: "destructive", title: "Auth Failed", description: "Could not update credentials. " + authError.message });
                    setLoading(false);
                    return;
                }
            }

            try {
                await updateUserDocument(firestore, selectedUser.id, dataPayload);
                toast({ title: "Updated", description: "Profile synchronized with registry." });
                resetForm();
            } catch (fsError: any) {
                toast({ variant: "destructive", title: "Registry Error", description: "Firestore write failed. " + fsError.message });
            } finally {
                setLoading(false);
            }
        } else {
            // New Registration Flow
            const tempApp = createTemporaryApp();
            const tempAuth = getAuth(tempApp);
            try {
                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                const uid = userCredential.user.uid;
                
                // Absolute Firestore write using setDoc for new document
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

                toast({ title: "Registered", description: "New officer added to registry." });
                resetForm();
            } catch (regError: any) {
                toast({ variant: "destructive", title: "Registration Error", description: regError.message });
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
                    <p className="text-muted-foreground mt-2">Maintain the official leadership registry and access levels.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-10 px-4 bg-white shadow-sm border-primary/20 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{activeOfficers.length} Officers Online</span>
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
                                    {isEditMode ? `Edit Officer` : 'Register New Officer'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center gap-4">
                                    <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
                                        <AvatarImage src={photoURL || ""} className="object-cover" />
                                        <AvatarFallback><Camera className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        Select Photo
                                    </Button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Officer Full Name</Label>
                                    <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter full name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} placeholder="email@pdds.ph" />
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center justify-between">
                                            <span>Password</span>
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary hover:underline">
                                                {showPassword ? <EyeOff className="h-3 w-3 inline" /> : <Eye className="h-3 w-3 inline" />}
                                            </button>
                                        </Label>
                                        <Input 
                                            required={!isEditMode} 
                                            type={showPassword ? "text" : "password"} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            placeholder={isEditMode ? "Leave blank to keep current" : "Minimum 6 characters"}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm Password</Label>
                                        <Input 
                                            required={!isEditMode || (password.length > 0)} 
                                            type={showPassword ? "text" : "password"} 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            placeholder={isEditMode ? "Repeat if changing" : "Repeat password"}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Designated Role</Label>
                                    <Select onValueChange={setRole} value={role}>
                                        <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                        <SelectContent>
                                            {allAssignableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Jurisdiction Level</Label>
                                        <Select onValueChange={setJurisdictionLevel} value={jurisdictionLevel}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {jurisdictionLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assigned Location</Label>
                                        <Input required placeholder="City or Province" value={assignedLocation} onChange={e => setAssignedLocation(e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isEditMode ? 'Save Changes' : 'Register Officer')}
                                </Button>
                                {isEditMode && <Button variant="ghost" type="button" onClick={resetForm} className="w-full">Cancel Edit</Button>}
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
                    
                    <Card className="shadow-lg overflow-hidden border-none">
                        <CardHeader className="bg-primary/5 py-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Active Officers Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
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
                                                No political officers found in registry.
                                            </TableCell>
                                        </TableRow>
                                    ) : activeOfficers.map(officer => (
                                        <TableRow key={officer.id} className="hover:bg-muted/20">
                                            <TableCell className="pl-6">
                                                <Avatar className="h-10 w-10 border shadow-sm bg-background">
                                                    <AvatarImage src={officer.photoURL || ""} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                                                        {officer.fullName?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-sm">{officer.fullName}</div>
                                                <div className="text-[11px] text-muted-foreground">{officer.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-tighter">
                                                    {officer.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-[11px] font-bold">
                                                    {officer.jurisdictionLevel}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
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
