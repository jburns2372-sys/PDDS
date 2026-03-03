"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, XCircle } from "lucide-react";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

/**
 * @fileOverview Login Page with Social and Credential access.
 * Optimized for horizontal and vertical centering on all platforms.
 */
export default function LoginPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userRef = doc(firestore, 'users', user.uid);
            
            updateDoc(userRef, { lastActive: serverTimestamp() }).catch(err => {
                console.error("Activity log failed", err);
            });

            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                window.location.href = "/home";
            } else {
                router.push('/join?induction=pending');
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message,
            });
            setLoading(false);
        }
    };

    const handleSocialAuth = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userEmail = (user.email || '').toLowerCase();

            const userRef = doc(firestore, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: userEmail,
                    fullName: user.displayName?.toUpperCase() || "NEW PDDS SUPPORTER",
                    photoURL: user.photoURL || null,
                    role: "Supporter",
                    jurisdictionLevel: "National",
                    isAdmin: false,
                    isApproved: true,
                    isVerified: false, 
                    kartilyaAgreed: true,
                    recruitCount: 0,
                    createdAt: serverTimestamp(),
                    lastActive: serverTimestamp(),
                });
                toast({ title: "Welcome!", description: "You have been registered as a Supporter." });
            } else {
                updateDoc(userRef, { lastActive: serverTimestamp() }).catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'update',
                        requestResourceData: { lastActive: 'serverTimestamp()' }
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            }

            setTimeout(() => {
                window.location.href = "/home";
            }, 500);
        } catch (error: any) {
            console.error("Social Auth Error:", error);
            
            let errorMessage = error.message;
            if (error.code === 'auth/popup-blocked') {
                errorMessage = "Login popup was blocked by your browser. Please allow popups for this site.";
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "The login window was closed. Please try again.";
            }

            toast({
                variant: "destructive",
                title: "Authentication Failed",
                description: errorMessage,
            });
            
            setLoading(false);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        }
    };

  return (
    <div className="flex h-dynamic w-full flex-col items-center justify-center bg-muted/30 p-4 relative overflow-y-auto">
        {loading && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse text-center px-4 font-headline">
                    Establishing Secure Connection...
                </p>
                <div className="mt-8 flex flex-col items-center gap-2">
                    <Button 
                        variant="destructive" 
                        size="sm"
                        className="font-bold uppercase text-[10px] tracking-widest"
                        onClick={() => setLoading(false)}
                    >
                        <XCircle className="mr-2 h-3 w-3" /> Cancel Connection
                    </Button>
                </div>
            </div>
        )}

        <div className="mb-8 flex items-center gap-4 mt-4">
            <PddsLogo className="h-16 w-16" />
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-primary font-headline uppercase">
                PDDS Portal
            </h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary bg-white">
        <CardHeader>
            <CardTitle className="text-2xl text-center font-headline uppercase">Member Login</CardTitle>
            <CardDescription className="text-center font-medium text-muted-foreground">Access your official PDDS credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Email Address</Label>
                    <Input id="email" type="email" placeholder="m.delacruz@example.com" className="h-12 font-bold" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary">Password</Label>
                    <Input id="password" type="password" className="h-12" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-14 font-black uppercase tracking-widest text-lg shadow-xl" disabled={loading}>
                    {loading ? "Verifying..." : "Sign In"}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground font-bold">Or use social access</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Button 
                    variant="outline" 
                    className="w-full h-14 border-2 border-primary/20 font-black uppercase tracking-widest text-primary hover:bg-primary/5 shadow-md"
                    onClick={handleSocialAuth}
                    disabled={loading}
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </Button>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mb-4">
            <div className="text-center w-full">
                <p className="text-sm text-muted-foreground font-medium">
                    New to PDDS? <Link href="/join" className="text-primary font-black hover:underline uppercase text-xs tracking-widest ml-1">Join the Movement</Link>
                </p>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}