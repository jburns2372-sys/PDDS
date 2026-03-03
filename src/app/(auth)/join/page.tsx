"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    ConfirmationResult
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, XCircle, Camera, Upload, MapPin, Check, ShieldCheck, FileUp } from "lucide-react";
import { getIslandGroup, getZipCode } from "@/lib/data";

const NCR_CODE = "130000000";

/**
 * @fileOverview Enhanced National Member Induction Page.
 * Optimized for horizontal/vertical alignment on all platforms.
 */
export default function JoinPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const referralUid = searchParams.get('ref');

    // Registry fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("+63");
    
    // Address fields
    const [streetAddress, setStreetAddress] = useState("");
    const [zipCode, setZipCode] = useState("");
    
    // Biometric / Photo State
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Location Data
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedBarangay, setSelectedBarangay] = useState<string>("");

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
                const combined = [{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true, code: NCR_CODE }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name));
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

    useEffect(() => {
        if (selectedCity && selectedBarangay) {
            setZipCode(getZipCode(selectedCity, selectedBarangay));
        }
    }, [selectedBarangay, selectedCity]);

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Camera Error', description: 'Please allow camera access.' });
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    setSelectedFile(blob);
                    setPhotoURL(canvas.toDataURL('image/jpeg'));
                    stopCamera();
                }
            }, 'image/jpeg', 0.9);
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) return;
        if (!selectedFile) {
            toast({ variant: "destructive", title: "Identity Required", description: "Please take a selfie or upload a photo." });
            return;
        }
        
        setLoading(true);
        try {
            if (!verifierRef.current) {
                verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            }
            const result = await signInWithPhoneNumber(auth, phoneNumber, verifierRef.current);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "SMS Sent", description: "Verify your number to continue induction." });
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
                const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
                await uploadBytes(photoRef, selectedFile);
                finalPhotoURL = await getDownloadURL(photoRef);
            }

            let finalIdURL = null;
            if (idFile) {
                const idRef = ref(storage, `users/${user.uid}/id_verification.${idFile.name.split('.').pop()}`);
                await uploadBytes(idRef, idFile);
                finalIdURL = await getDownloadURL(idRef);
            }

            const memberData = {
                uid: user.uid,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.toUpperCase(),
                barangay: selectedBarangay,
                city: selectedCity,
                province: selectedProvince,
                islandGroup: getIslandGroup(selectedProvince),
                zipCode: zipCode,
                photoURL: finalPhotoURL,
                idVerificationUrl: finalIdURL,
                role: "Member",
                jurisdictionLevel: "City/Municipal",
                isAdmin: false,
                isApproved: true,
                isVerified: true,
                vettingLevel: "Bronze",
                kartilyaAgreed: true,
                meritPoints: 110,
                referralCount: 0,
                referredBy: referralUid || null,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
                isFoundingPatriot: true,
                consentTimestamp: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", user.uid), memberData);
            
            toast({ title: "Welcome Patriot!", description: "Induction complete. Digital ID issued." });
            setTimeout(() => {
                window.location.href = "/home?registered=true";
            }, 500);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
            setLoading(false);
        }
    };

    const isPhoneValid = phoneNumber.startsWith("+63") && phoneNumber.length === 13;

    return (
        <div className="flex min-h-dynamic w-full flex-col items-center justify-center bg-muted/30 p-4 pb-12 relative overflow-y-auto">
            {loading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest text-primary animate-pulse text-center px-4 font-headline">
                        Syncing with National Registry...
                    </p>
                </div>
            )}

            <div className="mb-8 flex flex-col items-center gap-4 mt-8">
                <PddsLogo className="h-24 w-auto" />
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase">
                        PatriotLink
                    </h1>
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mt-1">National Member Induction</p>
                </div>
            </div>

            <div className="w-full max-w-lg space-y-4">
                <Card className="shadow-2xl border-t-4 border-primary bg-white">
                    {!showOtpInput ? (
                        <form onSubmit={handleInitialSubmit}>
                            <CardHeader>
                                <CardTitle className="text-2xl text-center font-headline uppercase tracking-tight">Join the movement</CardTitle>
                                <CardDescription className="text-center font-medium text-muted-foreground italic">"One App, One Goal."</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Identity Verification (Profile Photo)</Label>
                                    <div className="flex flex-col items-center gap-4 p-4 bg-muted/30 rounded-2xl border-2 border-dashed">
                                        {isCameraOpen ? (
                                            <div className="w-full space-y-3">
                                                <div className="relative aspect-square rounded-xl overflow-hidden bg-black max-w-[240px] mx-auto shadow-inner">
                                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={capturePhoto} className="flex-1 font-black uppercase text-xs">Capture</Button>
                                                    <Button type="button" variant="outline" onClick={stopCamera} className="h-10 px-3"><XCircle className="h-4 w-4" /></Button>
                                                </div>
                                                <canvas ref={canvasRef} className="hidden" />
                                            </div>
                                        ) : photoURL ? (
                                            <div className="relative group">
                                                <img src={photoURL} className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg" alt="Selfie" />
                                                <Button type="button" onClick={() => {setPhotoURL(null); setSelectedFile(null);}} variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full"><XCircle className="h-4 w-4" /></Button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                <Button type="button" variant="outline" className="h-20 flex flex-col gap-2 border-2" onClick={startCamera}>
                                                    <Camera className="h-6 w-6" />
                                                    <span className="text-[10px] font-black uppercase">Take Selfie</span>
                                                </Button>
                                                <Button type="button" variant="outline" className="h-20 flex flex-col gap-2 border-2" onClick={() => document.getElementById('photo-upload')?.click()}>
                                                    <Upload className="h-6 w-6" />
                                                    <span className="text-[10px] font-black uppercase">Upload Photo</span>
                                                </Button>
                                                <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={e => {const f=e.target.files?.[0]; if(f){setSelectedFile(f); const r=new FileReader(); r.onloadend=()=>setPhotoURL(r.result as string); r.readAsDataURL(f);}}} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Full Name</Label>
                                        <Input placeholder="JUAN DELA CRUZ" className="h-12 font-bold uppercase border-2" required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Phone Number</Label>
                                        <Input placeholder="+639..." className="h-12 font-bold border-2" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Email Address</Label>
                                    <Input type="email" placeholder="juan@example.com" className="h-12 font-bold border-2" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Password</Label>
                                    <Input type="password" required className="h-12 border-2" value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
                                </div>

                                <div className="space-y-4 pt-2 border-t">
                                    <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><MapPin className="h-3 w-3" /> Jurisdictional Address</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase">Province</Label>
                                            <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                                <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{provinces.map((p) => <SelectItem key={p.code} value={p.name} className="uppercase font-bold text-[10px]">{p.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase">City / Town</Label>
                                            <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedProvince}>
                                                <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{cities.map((c) => <SelectItem key={c.code} value={c.name} className="uppercase font-bold text-[10px]">{c.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase">Barangay</Label>
                                            <Select onValueChange={setSelectedBarangay} value={selectedBarangay} disabled={!selectedCity}>
                                                <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{barangays.map((b) => <SelectItem key={b.code} value={b.name} className="uppercase font-bold text-[10px]">{b.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase">Zip Code</Label>
                                            <Input value={zipCode} readOnly className="h-11 font-black bg-muted/50 border-2 cursor-not-allowed" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase">Street / House No.</Label>
                                        <Input placeholder="House #, Building, Street" value={streetAddress} onChange={e => setStreetAddress(e.target.value.toUpperCase())} className="h-11 border-2" required />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><FileUp className="h-3 w-3" /> Vetting Documents (Optional)</Label>
                                    <div className="flex flex-col gap-3">
                                        <Input type="file" className="h-11 pt-2 border-2" onChange={e => setIdFile(e.target.files?.[0] || null)} />
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Upload a government ID to fast-track your induction status.</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <Checkbox 
                                            id="terms" 
                                            checked={agreed} 
                                            onCheckedChange={(checked) => setAgreed(checked === true)} 
                                            className="mt-1" 
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="terms" className="text-xs font-bold leading-none text-primary uppercase">Accept National Registry Terms</Label>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                I confirm my alignment with PDDS principles and RA 10173 compliance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl" disabled={loading || !agreed || !isPhoneValid || !selectedBarangay}>
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Induct"}
                                </Button>
                                <p className="text-sm text-center text-muted-foreground font-medium">Already a member? <Link href="/login" className="text-primary font-black hover:underline uppercase text-xs tracking-widest">Sign In</Link></p>
                            </CardFooter>
                        </form>
                    ) : (
                        <div className="p-6 space-y-6">
                            <CardHeader className="px-0 text-center">
                                <CardTitle className="text-2xl font-headline uppercase">Verify Induction</CardTitle>
                                <CardDescription className="font-medium text-muted-foreground">Enter the 6-digit code sent to {phoneNumber}</CardDescription>
                            </CardHeader>
                            <div className="space-y-4">
                                <Input id="otp" placeholder="000000" maxLength={6} className="text-center text-3xl font-black tracking-[0.5em] h-16 border-2" value={otp} onChange={e => setOtp(e.target.value)} />
                                <Button className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl" onClick={handleVerifyAndComplete} disabled={loading || otp.length !== 6}>
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Complete Registry"}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <div id="recaptcha-container"></div>
        </div>
    );
}