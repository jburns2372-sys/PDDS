"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    ConfirmationResult,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, increment, updateDoc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, User, Phone, Globe, ShieldCheck } from "lucide-react";

const NCR_CODE = "130000000";

export default function JoinPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const referralUid = searchParams.get('ref');

    // Form fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    
    // Location State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");

    // UI State
    const [loading, setLoading] = useState(false);
    const [socialUser, setSocialUser] = useState<any>(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [agreed, setAgreed] = useState(false);

    const verifierRef = useRef<RecaptchaVerifier | null>(null);

    // Handle Redirect Result on Mount
    useEffect(() => {
        const handleAuthRedirect = async () => {
            setLoading(true);
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    const user = result.user;
                    
                    const docRef = doc(firestore, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        // User exists, move to dashboard with buffer
                        setTimeout(() => {
                            toast({ title: "Welcome Back!" });
                            router.push("/home");
                        }, 500);
                        return;
                    }

                    // New User - Hold for Induction Completion
                    setSocialUser({
                        uid: user.uid,
                        email: user.email || "",
                        fullName: user.displayName || "MEMBER",
                        photoURL: user.photoURL || null
                    });
                    
                    setFullName(user.displayName || "");
                    setEmail(user.email || "");
                    toast({ title: "Authenticated", description: "Complete your location to finalize membership." });
                }
            } catch (error: any) {
                console.error("Redirect Error:", error);
                if (error.code !== 'auth/redirect-cancelled-by-user') {
                    toast({ variant: "destructive", title: "Authentication Error", description: error.message });
                }
            } finally {
                setLoading(false);
            }
        };
        handleAuthRedirect();
    }, [auth, firestore, router, toast]);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
                const pData = await pResp.json();
                const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
                const ncrData = await ncrResp.json();
                const combined = [{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name));
                setProvinces(combined);
            } catch (e) {}
        };
        fetchProvinces();
    }, []);

    useEffect(() => {
        if (!selectedProvince) { setCities([]); return; }
        const fetchCities = async () => {
            const province = provinces.find(p => p.name === selectedProvince);
            if (province) {
                const endpoint = province.isNCR 
                    ? `https://psgc.gitlab.io/api/regions/${NCR_CODE}/cities-municipalities/`
                    : `https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities/`;
                const response = await fetch(endpoint);
                const data = await response.json();
                setCities(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
            }
        };
        fetchCities();
    }, [selectedProvince, provinces]);

    const handleSocialLogin = async (provider: any) => {
        setLoading(true);
        try {
            await signInWithRedirect(auth, provider);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Authentication Error", description: error.message });
            setLoading(false);
        }
    };

    const handleSocialComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!socialUser || !agreed) return;
        
        setLoading(true);
        try {
            const supporterData = {
                uid: socialUser.uid,
                email: socialUser.email,
                fullName: fullName.trim().toUpperCase() || socialUser.fullName.toUpperCase(),
                phoneNumber: phoneNumber.trim() || "",
                streetAddress: streetAddress.trim().toUpperCase(),
                city: selectedCity,
                province: selectedProvince,
                photoURL: socialUser.photoURL,
                role: "Supporter",
                isApproved: true,
                kartilyaAgreed: true,
                recruitCount: 0,
                referredBy: referralUid || null,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", socialUser.uid), supporterData);
            
            if (referralUid) {
                const referrerRef = doc(firestore, "users", referralUid);
                updateDoc(referrerRef, { recruitCount: increment(1) }).catch(e => console.error(e));
            }

            setTimeout(() => {
                toast({ title: "Welcome to PDDS!", description: "Membership officially confirmed." });
                router.push("/home?registered=true");
            }, 500);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
            setLoading(false);
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) return;
        
        setLoading(true);
        try {
            if (!verifierRef.current) {
                verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            }
            const result = await signInWithPhoneNumber(auth, phoneNumber, verifierRef.current);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "SMS Sent", description: "Verify your number to continue." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndComplete = async () => {
        if (!confirmationResult || otp.length !== 6) return;
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const supporterData = {
                uid: user.uid,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                city: selectedCity,
                province: selectedProvince,
                photoURL: null,
                role: "Supporter",
                isApproved: true,
                kartilyaAgreed: true,
                recruitCount: 0,
                referredBy: referralUid || null,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", user.uid), supporterData);
            
            if (referralUid) {
                const referrerRef = doc(firestore, "users", referralUid);
                updateDoc(referrerRef, { recruitCount: increment(1) }).catch(e => console.error(e));
            }

            setTimeout(() => {
                toast({ title: "Welcome!", description: "Registry record created." });
                router.push("/home?registered=true");
            }, 500);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/30 p-4 pb-12 relative">
            {loading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse text-center px-4">
                        Securing your place in the national registry...
                    </p>
                </div>
            )}

            <div className="mb-8 flex items-center gap-4">
                <PddsLogo className="h-14 w-14" />
                <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase text-center">
                    PatriotLink
                </h1>
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-t-4 border-primary bg-white">
                {socialUser ? (
                    <form onSubmit={handleSocialComplete}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline uppercase">Complete Induction</CardTitle>
                            <CardDescription className="text-center font-medium text-muted-foreground">Finalize your location to generate your Digital ID.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center gap-3 pb-4 border-b">
                                <Avatar className="h-20 w-20 border-2 border-primary shadow-lg">
                                    <AvatarImage src={socialUser.photoURL} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <p className="font-bold text-primary flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    {socialUser.fullName}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Province</Label>
                                    <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                        <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{provinces.map((p) => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">City</Label>
                                    <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedProvince}>
                                        <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{cities.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <Checkbox id="terms-social" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                                <Label htmlFor="terms-social" className="text-xs font-bold leading-none text-muted-foreground">I agree to the official PDDS Kartilya principles.</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl" disabled={loading || !agreed || !selectedCity}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Induction"}
                            </Button>
                        </CardFooter>
                    </form>
                ) : !showOtpInput ? (
                    <form onSubmit={handleInitialSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline uppercase tracking-tight">Join the Movement</CardTitle>
                            <CardDescription className="text-center font-medium text-muted-foreground">Secure your place in the national registry.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full bg-[#4285F4] text-white hover:bg-[#357ae8] border-none font-black uppercase tracking-widest text-xs h-12 shadow-md"
                                    onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                                    disabled={loading}
                                >
                                    Continue with Google
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full bg-[#1877F2] text-white hover:bg-[#166fe5] border-none font-black uppercase tracking-widest text-xs h-12 shadow-md"
                                    onClick={() => handleSocialLogin(new FacebookAuthProvider())}
                                    disabled={loading}
                                >
                                    Continue with Facebook
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-4 text-muted-foreground font-black tracking-[0.2em]">Or Join with Email</span></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Full Name</Label>
                                    <Input placeholder="JUAN DELA CRUZ" className="h-12 font-bold" required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Phone Number</Label>
                                    <Input placeholder="+639..." className="h-12 font-bold" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-primary">Email Address</Label>
                                <Input type="email" placeholder="juan@example.com" className="h-12 font-bold" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-primary">Password</Label>
                                <Input type="password" required className="h-12" value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                                <Label htmlFor="terms" className="text-xs font-bold leading-none text-muted-foreground">I agree to the official PDDS Kartilya principles.</Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl" disabled={loading || !agreed}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Join"}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground font-medium">Already a member? <Link href="/login" className="text-primary font-black hover:underline uppercase text-xs tracking-widest">Sign In</Link></p>
                        </CardFooter>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        <CardHeader className="px-0 text-center">
                            <CardTitle className="text-2xl font-headline uppercase">Verify SMS</CardTitle>
                            <CardDescription className="font-medium text-muted-foreground">Enter the 6-digit code sent to {phoneNumber}</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <Input id="otp" placeholder="000000" maxLength={6} className="text-center text-3xl font-black tracking-[0.5em] h-16" value={otp} onChange={e => setOtp(e.target.value)} />
                            <Button className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl" onClick={handleVerifyAndComplete} disabled={loading || otp.length !== 6}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Registration"}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <div id="recaptcha-container"></div>
        </div>
    );
}
