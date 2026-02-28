
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    ConfirmationResult
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, increment, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
    const [phoneNumber, setPhoneNumber] = useState("+63");
    
    // Location State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");

    // UI State
    const [loading, setLoading] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [agreed, setAgreed] = useState(false);

    const verifierRef = useRef<RecaptchaVerifier | null>(null);

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

            toast({ title: "Welcome!", description: "Registry record created." });
            setTimeout(() => {
                router.push("/home?registered=true");
            }, 500);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
            setLoading(false);
        }
    };

    const isPhoneValid = phoneNumber.startsWith("+63") && phoneNumber.length === 13;

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/30 p-4 pb-12 relative">
            {loading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse text-center px-4 font-headline">
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
                {!showOtpInput ? (
                    <form onSubmit={handleInitialSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline uppercase tracking-tight">Join the Movement</CardTitle>
                            <CardDescription className="text-center font-medium text-muted-foreground">Secure your place in the national registry.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="flex items-start space-x-3">
                                <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                                <Label htmlFor="terms" className="text-xs font-bold leading-none text-muted-foreground">I agree to the official PDDS Kartilya principles.</Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl" disabled={loading || !agreed || !isPhoneValid || !selectedCity}>
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
