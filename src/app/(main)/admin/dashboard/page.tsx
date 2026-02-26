"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, createTemporaryApp, deleteTemporaryApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { createUserDocument, updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Shield, UserPlus, Users, Info, Camera, RefreshCw, Pencil, Trash2 } from "lucide-react";
import type { UserProfile } from "@/context/user-data-context";
import { serverTimestamp } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const roles = [
  "Member", "Admin", "System Admin", "Chairman", "Vice Chairman", "President", "Vice President", 
  "Secretary General", "Treasurer", "Auditor", "VP Ways & Means", "VP Media Comms", 
  "VP Soc Med Comms", "VP Events and Programs", "VP Membership", "VP Legal Affairs"
];

// The 13 PDDS Leadership Roles + Admin roles to ensure visibility
const pddsLeadershipRoles = [
  "President", "Chairman", "Vice Chairman", "Vice President", 
  "Secretary General", "Treasurer", "Auditor", "VP Ways & Means", 
  "VP Media Comms", "VP Soc Med Comms", "VP Events and Programs", 
  "VP Membership", "VP Legal Affairs", "Admin", "System Admin"
];

const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export default function AdminDashboard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // Real-time Firestore listener using the pre-built useCollection hook (wraps onSnapshot)
    const { data: allUsers, loading: usersLoading, error } = useCollection<UserProfile>('users');

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Member");
    const [level, setLevel] = useState("National");
    const [locationName, setLocationName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filtering logic: Includes all leadership roles and approved users, sorted by creation date
    const activeOfficers = useMemo(() => {
        return allUsers
            .filter(u => 
                pddsLeadershipRoles.includes(u.role) || 
                u.isApproved === true
            )
            .sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
    }, [allUsers]);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("Member");
        setLevel("National");
        setLocationName("");
        setAvatarUrl(undefined);
    }

    const handleEditClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setRole(user.role || "Member");
        setLevel(user.level || "National");
        setLocationName(user.locationName || "");
        setAvatarUrl(user.avatarUrl);
        setPassword("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { 
                toast({ variant: "destructive", title: "File too large", description: "Please select an image smaller than 1MB." });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setAvatarUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    const handleRevoke = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to revoke access for ${user.fullName || user.email}?`)) return;
        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id);
            toast({ title: "Access Revoked", description: `Record for ${user.fullName || user.email} deleted.` });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Action Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataPayload = { 
            fullName, 
            email, 
            role, 
            level, 
            locationName, 
            avatarUrl: avatarUrl || null,
            isApproved: true,
            kartilyaAgreed: true
        };

        if (isEditMode && selectedUser) {
            try {
                await updateUserDocument(firestore, selectedUser.id, dataPayload);
                toast({ title: "User Updated", description: `${fullName} has been updated.` });
                resetForm();
            } catch (error: any) {
                toast({ variant: "destructive", title: "Update Failed", description: error.message });
            } finally {
                setLoading(false);
            }
        } else {
            if (password.length < 6) {
                toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 chars." });
                setLoading(false);
                return;
            }

            const tempApp = createTemporaryApp();
            const tempAuth = getAuth(tempApp);

            try {
                const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
                const user = userCredential.user;
                
                await createUserDocument(firestore, user.uid, {
                    uid: user.uid,
                    fullName,
                    email,
                    role,
                    level,
                    locationName,
                    avatarUrl: avatarUrl || undefined,
                    isApproved: true,
                    kartilyaAgreed: true,
                    passwordIsTemporary: true,
                    createdAt: serverTimestamp(),
                });
                
                toast({ title: "User Created", description: `${fullName} added to registry.` });
                resetForm();
            } catch (error: any) {
                toast({ variant: "destructive", title: "Creation Failed", description: error.message });
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
                        <Shield className="h-8 w-8 text-primary" />
                        Admin Registry
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage PDDS leadership and organizational structure in real-time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-10 px-4 bg-white shadow-sm border-primary/20 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{activeOfficers.length} Active Officers</span>
                    </Badge>
                    <Button variant="outline" size="icon" onClick={() => window.location.reload()} title="Refresh Page" className="border-primary/20 hover:bg-primary/5">
                        <RefreshCw className="h-4 w-4 text-primary" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent h-fit">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? `Edit Profile` : 'Register Officer'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-4 border-accent shadow-md">
                                            {avatarUrl ? (
                                                <AvatarImage src={avatarUrl} alt="Preview" className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="bg-muted">
                                                    <Camera className="h-8 w-8 text-muted-foreground" />
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                                            <Button type="button" variant="secondary" size="sm" className="h-8 w-8 rounded-full p-0" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                                                <Camera className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode || loading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Officer Full Name</Label>
                                        <Input id="fullName" required placeholder="Juan Dela Cruz" value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} />
                                    </div>
                                    {!isEditMode && (
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Temporary Password</Label>
                                            <Input id="password" required type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Assign Role</Label>
                                        <Select onValueChange={setRole} value={role} disabled={loading}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="level">Jurisdiction Level</Label>
                                        <Select onValueChange={setLevel} value={level} disabled={loading}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="locationName">Assigned Location</Label>
                                        <Input id="locationName" placeholder="e.g. Quezon City" required value={locationName} onChange={e => setLocationName(e.target.value)} disabled={loading} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                                    {loading ? 'Processing...' : isEditMode ? 'Update Officer' : 'Create Registry Record'}
                                </Button>
                                {isEditMode && <Button variant="ghost" onClick={resetForm} className="w-full" disabled={loading}>Cancel</Button>}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="shadow-lg border-t-4 border-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Active Officers Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[80px]">Photo</TableHead>
                                            <TableHead>Officer</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Jurisdiction</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersLoading ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Syncing with PDDS database...</TableCell></TableRow>
                                        ) : error ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-20 text-destructive">{error.message}</TableCell></TableRow>
                                        ) : activeOfficers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-20 px-6">
                                                    <Alert>
                                                        <Info className="h-4 w-4" />
                                                        <AlertTitle>Registry Empty</AlertTitle>
                                                        <AlertDescription>
                                                            No officer records match the filter. Start by creating a record in the sidebar.
                                                        </AlertDescription>
                                                    </Alert>
                                                </TableCell>
                                            </TableRow>
                                        ) : activeOfficers.map(user => (
                                            <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <Avatar className="h-10 w-10 border shadow-sm">
                                                        <AvatarImage src={user.avatarUrl} className="object-cover" />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.fullName?.charAt(0) || '?'}</AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{user.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary uppercase">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs font-medium">{user.level}</div>
                                                    <div className="text-[10px] text-muted-foreground">{user.locationName}</div>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)} disabled={loading} className="h-8 w-8 p-0" title="Edit Profile">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleRevoke(user)} disabled={loading} className="h-8 w-8 p-0" title="Revoke Access">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
