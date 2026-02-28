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
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    ConfirmationResult,
    sendEmailVerification,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, increment, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, Camera, User, Phone, Globe } from "lucide-react";

const NCR_CODE = "130000000";

export default function JoinPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
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
    const [barangays, setBarangays] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedBarangay, setSelectedBarangay] = useState<string>("");

    // UI State
    const [loading, setLoading] = useState(false);
    const [socialUser, setSocialUser] = useState<any>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [agreed, setAgreed] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const verifierRef = useRef<RecaptchaVerifier | null>(null);

    useEffect(() => {
        const fetchProvinces = async () => {
            const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
            const pData = await pResp.json();
            const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
            const ncrData = await ncrResp.json();
            const combined = [{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name));
            setProvinces(combined);
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

    useEffect(() => {
        if (!selectedCity) { setBarangays([]); return; }
        const fetchBarangays = async () => {
            const city = cities.find(c => c.name === selectedCity);
            if (city) {
                const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays/`);
                const data = await response.json();
                setBarangays(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
            }
        };
        fetchBarangays();
    }, [selectedCity, cities]);

    const handleSocialLogin = async (provider: any) => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            const docRef = doc(firestore, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                toast({ title: "Welcome Back!" });
                router.push("/home");
                return;
            }

            setSocialUser({
                uid: user.uid,
                email: user.email || "",
                fullName: user.displayName || "MEMBER",
                photoURL: user.photoURL || null
            });
            
            setFullName(user.displayName || "");
            setEmail(user.email || "");
            toast({ title: "Authenticated", description: "Please finalize your location to complete joining." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Authentication Error", description: error.message });
        } finally {
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
                barangay: selectedBarangay,
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

            toast({ title: "Welcome to PDDS!", description: "Membership confirmed." });
            router.push("/home");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
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

            let finalPhotoURL = null;
            if (selectedFile) {
                const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                const uploadResult = await uploadBytes(storageRef, selectedFile);
                finalPhotoURL = await getDownloadURL(uploadResult.ref);
            }

            const supporterData = {
                uid: user.uid,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                barangay: selectedBarangay,
                city: selectedCity,
                province: selectedProvince,
                photoURL: finalPhotoURL,
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
            router.push("/home");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/30 p-4 pb-12">
            <div className="mb-8 flex items-center gap-4">
                <PddsLogo className="h-14 w-14" />
                <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase">
                    PatriotLink
                </h1>
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-t-4 border-primary">
                {socialUser ? (
                    <form onSubmit={handleSocialComplete}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline uppercase">Complete Joining</CardTitle>
                            <CardDescription className="text-center">Finalize your location to generate your Digital ID.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center gap-3 pb-4 border-b">
                                <Avatar className="h-20 w-20 border-2 border-primary shadow-lg">
                                    <AvatarImage src={socialUser.photoURL} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <p className="font-bold text-primary">{socialUser.fullName}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Province</Label>
                                    <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{provinces.map((p) => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedProvince}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>{cities.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <Checkbox id="terms-social" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                                <Label htmlFor="terms-social" className="text-xs font-medium leading-none">I agree to the PDDS Kartilya principles.</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading || !agreed || !selectedCity}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Induction"}
                            </Button>
                        </CardFooter>
                    </form>
                ) : !showOtpInput ? (
                    <form onSubmit={handleInitialSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline uppercase">Join the Movement</CardTitle>
                            <CardDescription className="text-center">Secure your place in the national registry.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full bg-[#4285F4] text-white hover:bg-[#357ae8] border-none font-bold h-11"
                                    onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                                >
                                    Continue with Google
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full bg-[#1877F2] text-white hover:bg-[#166fe5] border-none font-bold h-11"
                                    onClick={() => handleSocialLogin(new FacebookAuthProvider())}
                                >
                                    Continue with Facebook
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground font-black">Or Join with Email</span></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input placeholder="JUAN DELA CRUZ" required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input placeholder="+639..." required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" placeholder="juan@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                                <Label htmlFor="terms" className="text-xs font-medium leading-none">I agree to the PDDS Kartilya principles.</Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading || !agreed}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Join"}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">Already a member? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link></p>
                        </CardFooter>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        <CardHeader className="px-0">
                            <CardTitle className="text-2xl text-center font-headline uppercase">Verify SMS</CardTitle>
                            <CardDescription className="text-center">Enter the code sent to {phoneNumber}</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <Input id="otp" placeholder="000000" maxLength={6} className="text-center text-2xl tracking-[1em]" value={otp} onChange={e => setOtp(e.target.value)} />
                            <Button className="w-full h-12 text-lg font-bold" onClick={handleVerifyAndComplete} disabled={loading || otp.length !== 6}>
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
