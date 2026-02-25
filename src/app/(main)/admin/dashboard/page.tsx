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
import { createUserDocument, updateUserDocument } from "@/firebase/firestore/firestore-service";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Shield } from "lucide-react";
import type { UserProfile } from "@/context/user-data-context";
import { serverTimestamp } from "firebase/firestore";

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
    const [password, setPassword] = useState(""); // Only for new users
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
        setFullName(user.fullName);
        setEmail(user.email);
        setRole(user.role);
        setLevel(user.level);
        setLocationName(user.locationName || "");
        setPassword(""); // Clear password field in edit mode
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleRevoke = (user: UserProfile) => {
        // This would be a delete operation in a real application
        toast({
            variant: "destructive",
            title: "Access Revoked (Simulated)",
            description: `Access for ${user.fullName} has been revoked.`,
        });
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isEditMode && selectedUser) {
            // Update existing user
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
            // Create new user
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
                    kartilyaAgreed: true, // Admins onboard users
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
                    <Shield className="h-8 w-8" />
                    Admin Panel
                </h1>
                <p className="text-muted-foreground mt-2">Manage PDDS Officers and their roles and jurisdictions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <Card className="shadow-lg border-t-4 border-accent">
                        <form onSubmit={handleFormSubmit}>
                            <CardHeader>
                                <CardTitle className="text-xl font-headline">{isEditMode ? `Editing ${selectedUser?.fullName}` : 'Assign Officer Role'}</CardTitle>
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
                                    <Button variant="ghost" onClick={resetForm} className="w-full">Cancel Edit</Button>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                </div>

                {/* Data Table Section */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg border-t-4 border-primary">
                        <CardHeader>
                            <CardTitle>Active Officers Registry</CardTitle>
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
                                            <TableRow><TableCell colSpan={5} className="text-center">Loading users...</TableCell></TableRow>
                                        ) : error ? (
                                            <TableRow><TableCell colSpan={5} className="text-center text-destructive">{error.message}</TableCell></TableRow>
                                        ) : users.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="font-medium">{user.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                <TableCell>{user.level}</TableCell>
                                                <TableCell>{user.locationName}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>Edit</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleRevoke(user)}>Revoke</Button>
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
