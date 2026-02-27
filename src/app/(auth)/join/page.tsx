
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function JoinPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [location, setLocation] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agreed) {
            toast({
                variant: "destructive",
                title: "Agreement Required",
                description: "You must agree to the Kartilya principles to join.",
            });
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Create Firestore profile automatically
            const supporterData = {
                uid: uid,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim(),
                role: "Supporter",
                jurisdictionLevel: "City/Municipal", // Default for supporters
                assignedLocation: location.trim(),
                isApproved: false,
                isVerified: false,
                kartilyaAgreed: true,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", uid), supporterData);

            toast({
                title: "Welcome to PDDS!",
                description: "Your supporter account has been created successfully.",
            });
            
            router.push("/home");
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
                <PddsLogo className="h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold tracking-tighter text-primary font-headline">
                    Join the Movement
                </h1>
            </div>
            <Card className="w-full max-w-md shadow-2xl">
                <form onSubmit={handleRegister}>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center font-headline">Supporter Registration</CardTitle>
                        <CardDescription className="text-center">Become a part of the Federalismo ng Dugong Dakilang Samahan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" placeholder="Juan Dela Cruz" required value={fullName} onChange={e => setFullName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="juan@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Region / City</Label>
                            <Input id="location" placeholder="e.g. Metro Manila / Quezon City" required value={location} onChange={e => setLocation(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Create Password</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
                        </div>
                        <div className="flex items-start space-x-3 pt-2">
                            <Checkbox 
                                id="terms" 
                                checked={agreed} 
                                onCheckedChange={(checked) => setAgreed(checked === true)} 
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms"
                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I agree to the PDDS Kartilya and its principles of batch at katarungan.
                                </label>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating Account..." : "Register as Supporter"}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
