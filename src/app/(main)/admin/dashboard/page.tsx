"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const roles = [
  "Member", "Admin", "Chairman", "Vice Chairman", "President", "Vice President", 
  "Secretary General", "Treasurer", "Auditor", "VP Ways & Means", "VP Media Comms", 
  "VP Soc Med Comms", "VP Events & Programs", "VP Membership", "VP Legal Affairs"
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
    const [role, setRole] = useState("");
    const [level, setLevel] = useState("");
    const [locationName, setLocationName] = useState("");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setSelectedUser(null);
        setIsEditMode(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("");
        setLevel("");
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
        <div className="flex flex-col">
            <div className="bg-card p-6 md:p-8 border-b">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary flex items-center gap-2">
                        <Shield className="h-8 w-8" />
                        User & Officer Management
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Create new users or edit officer roles and assignments.
                    </p>
                </div>
            </div>
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
                <Card className="shadow-lg">
                    <form onSubmit={handleFormSubmit}>
                        <CardHeader>
                            <CardTitle className="text-xl font-headline">{isEditMode ? `Editing ${selectedUser?.fullName}` : 'Add New User'}</CardTitle>
                            <CardDescription>
                                {isEditMode ? 'Modify the details below and click save.' : 'Create a new member account and assign their role.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" placeholder="Juan Dela Cruz" required value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="m.delacruz@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isEditMode} />
                            </div>
                            {!isEditMode && (
                                <div className="space-y-2 md:col-span-2">
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
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="locationName">Location Detail (e.g. Region III)</Label>
                                <Input id="locationName" placeholder="e.g. Cebu" required value={locationName} onChange={e => setLocationName(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Officer Assignment'}
                            </Button>
                            {isEditMode && (
                                <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Active Roster</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersLoading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center">Loading users...</TableCell></TableRow>
                                ) : error ? (
                                     <TableRow><TableCell colSpan={6} className="text-center text-destructive">{error.message}</TableCell></TableRow>
                                ) : users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.fullName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.level}</TableCell>
                                        <TableCell>{user.locationName}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
