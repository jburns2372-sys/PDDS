"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, createTemporaryApp, deleteTemporaryApp } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { createUserDocument } from "@/firebase/firestore/firestore-service";

const roles = [
  "Administrator", "Chairman", "Vice Chairman", "President", "Vice President", 
  "Secretary General", "Treasurer", "Auditor", "VP Ways & Means", "VP Media Comms", 
  "VP Soc Med Comms", "VP Events", "VP Membership", "VP Legal Affairs", "Member"
];
const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export default function CreateUserPage() {
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [level, setLevel] = useState("");
    const [locationName, setLocationName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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
                kartilyaAgreed: true, // Assuming admins onboard users properly
                passwordIsTemporary: true,
            });
            
            toast({
                title: "User Created Successfully",
                description: `${fullName} can now log in with the temporary password.`,
            });
            // Reset form
            setFullName("");
            setEmail("");
            setPassword("");
            setRole("");
            setLevel("");
            setLocationName("");

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
    };

    return (
        <div className="flex flex-col">
            <div className="bg-card p-6 md:p-8 border-b">
                <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
                    Create New User
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Create a new member account and assign their role and a temporary password.
                </p>
                </div>
            </div>
            <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
                <Card className="w-full shadow-lg">
                    <form onSubmit={handleCreateUser}>
                        <CardHeader>
                            <CardTitle className="text-xl font-headline">New User Details</CardTitle>
                            <CardDescription>The user will be prompted to change their password on first login.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" placeholder="Juan Dela Cruz" required value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="m.delacruz@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input id="password" type="text" required value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select onValueChange={setRole} required value={role}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Level</Label>
                                <Select onValueChange={setLevel} required value={level}>
                                    <SelectTrigger id="level">
                                        <SelectValue placeholder="Select a level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="locationName">Location Name (e.g. Province/City)</Label>
                                <Input id="locationName" placeholder="e.g. Cebu" required value={locationName} onChange={e => setLocationName(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                                {loading ? "Creating User..." : "Create User"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
