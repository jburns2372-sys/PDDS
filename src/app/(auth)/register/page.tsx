"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { createUserDocument } from "@/firebase/firestore/firestore-service";

const roles = [
  "Chairman", "Vice Chairman", "President", "Vice President", "Secretary General", 
  "Treasurer", "Auditor", "VP Ways & Means", "VP Media Comms", "VP Soc Med Comms", 
  "VP Events", "VP Membership", "VP Legal Affairs", "Member"
];
const levels = ["National", "Regional", "Provincial", "City/Municipal", "Barangay"];

export default function RegisterPage() {
    const auth = useAuth();
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (password.length < 6) {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "Password must be at least 6 characters long.",
            });
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            createUserDocument(firestore, user.uid, {
                uid: user.uid,
                fullName,
                email,
                role,
                level,
                locationName,
                kartilyaAgreed: false, // Will be updated after onboarding
            });
            
            toast({
                title: "Registration Successful",
                description: "You can now log in.",
            });
            router.push("/login");

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
        <div className="mb-8 flex items-center gap-4">
            <PddsLogo className="h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold tracking-tighter text-primary font-headline">
            PDDS Portal
            </h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleRegister}>
            <CardHeader>
                <CardTitle className="text-2xl text-center font-headline">Create an Account</CardTitle>
                <CardDescription className="text-center">Join the Federalismo movement.</CardDescription>
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
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={setRole} required>
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
                    <Select onValueChange={setLevel} required>
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
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </Button>
                 <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Log in
                    </Link>
                </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
