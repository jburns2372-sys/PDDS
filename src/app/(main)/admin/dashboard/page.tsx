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
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { createUserDocument, updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Shield, UserPlus, Users, Camera, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { collection, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { createTemporaryApp, deleteTemporaryApp } from "@/firebase";

// Official 13 PDDS roles for Registry visibility
const pddsLeadershipRoles = [
  'President', 'Chairman', 'Vice Chairman', 'VP', 'Sec Gen', 'Treasurer', 'Auditor', 
  'VP Ways & Means Chair', 'VP Media Comms', 'VP Soc Med Comms', 'VP Events and Programs', 
  'VP Membership', 'VP legal affairs'
];

// All roles available for assignment
const allAssignableRoles = [
  ...pddsLeadershipRoles,
  "Member", "Admin", "System Admin"
];

const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export default function AdminDashboard() {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Member");
    const [level, setLevel] = useState("National");
    const [locationName, setLocationName] = useState("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 100% Reliable Real-time Sync for Registry
    useEffect(() => {
        const q = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setAllUsers(users);
            setUsersLoading(false);
        }, (err) => {
            console.error("Registry Sync Error:", err);
            setUsersLoading(false);
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "The registry is currently unavailable."
            });
        });
        return () => unsubscribe();
    }, [firestore, toast]);

    // Filtering: Only official 13 PDDS roles, EXCLUDING System Admin
    // NO "HIDDEN SELF" BLOCK: The President must always be visible.
    const activeOfficers = useMemo(() => {
        return allUsers.filter(user => {
            const isPoliticalOfficer = pddsLeadershipRoles.includes(user.role);
            const matchesSearch = 
                (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            return isPoliticalOfficer && matchesSearch;
        });
    }, [allUsers, searchTerm]);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("Member");
        setLevel("National");
        setLocationName("");
        setPhotoURL(null);
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setRole(user.role || "Member");
        setLevel(user.level || "National");
        setLocationName(user.locationName || user.assignedLocation || "");
        setPhotoURL(user.photoURL || user.avatarUrl || null);
        setPassword("");
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
                description: "You cannot revoke your own access from this dashboard."
            });
            return;
        }
        if (!confirm(`Are you sure you want to revoke access for ${user.fullName || user.email}?`)) return;
        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id);
            toast({ title: "Access Revoked", description: "Officer record removed." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataPayload = { 
            fullName, 
            email, 
            role, 
            level, 
            locationName, 
            photoURL: photoURL || null,
            avatarUrl: photoURL || null,
            isApproved: true,
            kartilyaAgreed: true
        };

        if (isEditMode && selectedUser) {
            try {
                await updateUserDocument(firestore, selectedUser.id, dataPayload);
                toast({ title: "Updated", description: "Officer record updated successfully." });
                resetForm();
            } catch (error: any) {
                toast({ variant: "destructive", title: "Update Error", description: error.message });
            } finally {
                setLoading(false);
            }
        } else {
            const tempApp = createTemporaryApp();
            const tempAuth = getAuth(tempApp);
            try {
                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                await createUserDocument(firestore, userCredential.user.uid, {
                    uid: userCredential.user.uid,
                    fullName,
                    email,
                    role,
                    level,
                    locationName,
                    avatarUrl: photoURL || undefined,
                    kartilyaAgreed: true,
                    isApproved: true,
                    passwordIsTemporary: true,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Success", description: "New officer registered." });
                resetForm();
            } catch (error: any) {
                toast({ variant: "destructive", title: "Registration Error", description: error.message });
            } finally {
                await deleteTemporaryApp(tempApp);
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 bg-background min-h-screen">
            <div className="mb-8 border-b-2 border-primary pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-2 font-headline">
                        <Shield className="h-8 w-8" />
                        Officer Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage the 13 PDDS leadership roles.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-10 px-4 bg-white shadow-sm border-primary/20 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{activeOfficers.length} Officers Found</span>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? `Edit Officer` : 'Register Officer'}
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
                                    <Input required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Juan dela Cruz" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} placeholder="officer@pdds.ph" />
                                </div>
                                {!isEditMode && (
                                    <div className="space-y-2">
                                        <Label>Temporary Password</Label>
                                        <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select onValueChange={setRole} value={role}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {allAssignableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Jurisdiction Level</Label>
                                    <Select onValueChange={setLevel} value={level}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Location Name</Label>
                                    <Input required placeholder="Province, City, or Barangay" value={locationName} onChange={e => setLocationName(e.target.value)} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isEditMode ? 'Update Record' : 'Create Registry Record')}
                                </Button>
                                {isEditMode && <Button variant="ghost" onClick={resetForm} className="w-full">Cancel</Button>}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            className="pl-10 h-12" 
                            placeholder="Search active officers by name..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <Card className="shadow-lg">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-lg">Active Officers Registry</CardTitle>
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
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                                                    <span className="text-muted-foreground font-medium">Syncing...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : activeOfficers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                                                {searchTerm ? "No matches found." : "The Registry is currently empty."}
                                            </TableCell>
                                        </TableRow>
                                    ) : activeOfficers.map(officer => (
                                        <TableRow key={officer.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="pl-6">
                                                <Avatar className="h-12 w-12 border-2 border-primary/10 shadow-sm">
                                                    <AvatarImage src={officer.photoURL || officer.avatarUrl || ""} className="object-cover" />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                        {officer.fullName?.charAt(0) || 'P'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-foreground">{officer.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{officer.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary border-none">
                                                    {officer.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-semibold text-foreground">
                                                    {officer.level || officer.jurisdictionLevel || "National"}
                                                </div>
                                                <div className="text-xs text-muted-foreground italic">
                                                    {officer.locationName || officer.assignedLocation || "Headquarters"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 space-x-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(officer)} className="h-9 w-9 text-primary hover:bg-primary/10">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-destructive hover:bg-destructive/10 disabled:opacity-30" 
                                                    onClick={() => handleRevoke(officer)}
                                                    disabled={officer.id === currentUser?.uid}
                                                    title={officer.id === currentUser?.uid ? "You cannot delete yourself" : "Revoke Access"}
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
