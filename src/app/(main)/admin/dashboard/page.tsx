
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection, useFirestore, createTemporaryApp, deleteTemporaryApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { createUserDocument, updateUserDocument, deleteUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Shield, UserPlus, Users, Info } from "lucide-react";
import type { UserProfile } from "@/context/user-data-context";
import { serverTimestamp } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const roles = [
  "Member", "Admin", "Chairman", "Vice Chairman", "President", "Vice President", 
  "Secretary General", "Treasurer", "Auditor", "VP Ways & Means", "VP Media Comms", 
  "VP Soc Med Comms", "VP Events and Programs", "VP Membership", "VP Legal Affairs"
];
const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export default function AdminDashboard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { data: users, loading: usersLoading, error } = useCollection<UserProfile>('users');

    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Member");
    const [level, setLevel] = useState("National");
    const [locationName, setLocationName] = useState("");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("Member");
        setLevel("National");
        setLocationName("");
    }

    const handleEditClick = (user: UserProfile) => {
        setSelectedUser(user);
        setIsEditMode(true);
        setFullName(user.fullName || "");
        setEmail(user.email || "");
        setRole(user.role || "Member");
        setLevel(user.level || "National");
        setLocationName(user.locationName || "");
        setPassword("");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleRevoke = async (user: UserProfile) => {
        if (!confirm(`Are you sure you want to revoke access for ${user.fullName || user.email}? This will permanently delete their user record. This action cannot be undone.`)) {
            return;
        }
        setLoading(true);
        try {
            await deleteUserDocument(firestore, user.id);
            toast({
                title: "User Record Deleted",
                description: `Access for ${user.fullName || user.email} has been revoked.`,
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isEditMode && selectedUser) {
            try {
                await updateUserDocument(firestore, selectedUser.id, {
                    fullName,
                    email,
                    role,
                    level,
                    locationName,
                });
                toast({
                    title: "User Updated",
                    description: `${fullName}'s details have been updated.`,
                });
                resetForm();
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: error.message,
                });
            } finally {
                setLoading(false);
            }
        } else {
            if (password.length < 6) {
                toast({
                    variant: "destructive",
                    title: "Creation Failed",
                    description: "Password must be at least 6 characters long.",
                });
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
                    kartilyaAgreed: true,
                    passwordIsTemporary: true,
                    createdAt: serverTimestamp(),
                });
                
                toast({
                    title: "User Created",
                    description: `${fullName} can now log in.`,
                });
                resetForm();

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Creation Failed",
                    description: error.message,
                });
            } finally {
                await deleteTemporaryApp(tempApp);
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 bg-background min-h-screen">
            <div className="mb-8 border-b-2 border-destructive pb-4">
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    Admin Panel
                </h1>
                <p className="text-muted-foreground mt-2">Manage PDDS Officers and their roles and jurisdictions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <UserPlus className="h-5 w-5" />
                                    {isEditMode ? `Editing ${selectedUser?.fullName}` : 'Assign Officer Role'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" placeholder="user@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" placeholder="Juan Dela Cruz" required value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                 {!isEditMode && (
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Temporary Password</Label>
                                        <Input id="password" type="text" required value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="role">Assign Role</Label>
                                    <Select onValueChange={setRole} required value={role}>
                                        <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                                        <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="level">Jurisdiction Level</Label>
                                    <Select onValueChange={setLevel} required value={level}>
                                        <SelectTrigger id="level"><SelectValue placeholder="Select a level" /></SelectTrigger>
                                        <SelectContent>{levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="locationName">Location Detail</Label>
                                    <Input id="locationName" placeholder="e.g. Cebu" required value={locationName} onChange={e => setLocationName(e.target.value)} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Assignment'}
                                </Button>
                                {isEditMode && (
                                    <Button variant="ghost" onClick={resetForm} className="w-full" disabled={loading}>Cancel Edit</Button>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="shadow-lg border-t-4 border-primary">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Active Officers Registry {!usersLoading && `(${users.length})`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersLoading ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-10">Loading officers...</TableCell></TableRow>
                                        ) : error ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-destructive">{error.message}</TableCell></TableRow>
                                        ) : users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-10">
                                                    <Alert>
                                                        <Info className="h-4 w-4" />
                                                        <AlertTitle>No Records Found</AlertTitle>
                                                        <AlertDescription>
                                                            The Firestore 'users' collection is currently empty or records haven't been created yet. Note: Users added in the Firebase Console Auth tab will not appear here until their Firestore profile is created (either by logging in or via the form on the left).
                                                        </AlertDescription>
                                                    </Alert>
                                                </TableCell>
                                            </TableRow>
                                        ) : users.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="font-medium">{user.fullName || 'Anonymous Member'}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                        {user.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{user.level}</TableCell>
                                                <TableCell>{user.locationName}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)} disabled={loading}>Edit</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleRevoke(user)} disabled={loading}>Revoke</Button>
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
