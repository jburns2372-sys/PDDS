"use client";

import { useState, useEffect, useRef } from "react";
import { useUserData } from "@/context/user-data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, updateEmail } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
    Camera, 
    User, 
    Loader2, 
    LogOut, 
    Save, 
    Phone, 
    X, 
    Check, 
    ShieldCheck, 
    MapPin, 
    Trash2, 
    AlertTriangle, 
    ShieldAlert,
    FileUp,
    Mail,
    Image as ImageIcon
} from "lucide-react";
import { getIslandGroup, getZipCode } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NCR_CODE = "130000000";

/**
 * @fileOverview Member Profile & Registry Management.
 * UPDATED: Added explicit 1x1 ID Photo management terminal.
 */
export default function ProfilePage() {
    const { user, userData, loading: userLoading } = useUserData();
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    // Registry fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
    
    // Cascading Location State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedBarangay, setSelectedBarangay] = useState<string>("");

    // UI State
    const [isInitialized, setIsInitialized] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // RA 10173 Consent State
    const [showConsent, setShowConsent] = useState(false);
    const [idForUpload, setIdForUpload] = useState<File | null>(null);
    const [isUploadingId, setIsUploadingId] = useState(false);

    // Phone Verification State
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isPhoneVerified, setIsPhoneVerified] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const idInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const verifierRef = useRef<RecaptchaVerifier | null>(null);

    // Fetch Provinces on load
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
                const pData = await pResp.json();
                const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
                const ncrData = await ncrResp.json();
                const combined = [{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true, code: NCR_CODE }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name));
                setProvinces(combined);
            } catch (error) {}
        };
        fetchProvinces();
    }, []);

    // Initialize Form from Firestore Data
    useEffect(() => {
        if (userData && !isInitialized) {
            setFullName(userData.fullName?.toUpperCase() || "");
            setEmail(userData.email?.toLowerCase() || "");
            setPhoneNumber(userData.phoneNumber || "");
            setStreetAddress(userData.streetAddress?.toUpperCase() || "");
            setZipCode(userData.zipCode || "");
            setPhotoURL(userData.photoURL || null);
            
            // Normalize names to match API capitalization (UPPERCASE)
            const prov = userData.province?.toUpperCase() || "";
            const city = userData.city?.toUpperCase() || "";
            const brgy = userData.barangay?.toUpperCase() || "";

            setSelectedProvince(prov);
            setSelectedCity(city);
            setSelectedBarangay(brgy);
            
            setIsPhoneVerified(!!userData.phoneNumber);
            setIsInitialized(true);
        }
    }, [userData, isInitialized]);

    // Cascading City Fetch
    useEffect(() => {
        if (!selectedProvince) { setCities([]); return; }
        if (provinces.length === 0) return;

        const fetchCities = async () => {
            const province = provinces.find((p: any) => p.name.toUpperCase() === selectedProvince.toUpperCase());
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

    // Cascading Barangay Fetch
    useEffect(() => {
        if (!selectedCity) { setBarangays([]); return; }
        if (cities.length === 0) return;

        const fetchBarangays = async () => {
            const city = cities.find((c: any) => c.name.toUpperCase() === selectedCity.toUpperCase());
            if (city) {
                const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays/`);
                const data = await response.json();
                setBarangays(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
            }
        };
        fetchBarangays();
    }, [selectedCity, cities]);

    // Automatic Zip Code Sync
    useEffect(() => {
        if (selectedCity && selectedBarangay) {
            const code = getZipCode(selectedCity, selectedBarangay);
            setZipCode(code);
        } else {
            setZipCode("");
        }
    }, [selectedBarangay, selectedCity]);

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Camera Error', description: 'Please enable camera permissions.' });
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

    const handleSendVerificationSms = async () => {
        if (!phoneNumber || phoneNumber.length < 13) {
            toast({ variant: "destructive", title: "Invalid Phone Number", description: "Use +639XXXXXXXXX format." });
            return;
        }
        setSaving(true);
        try {
            if (!verifierRef.current) {
                verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-profile', { 'size': 'invisible' });
            }
            const result = await signInWithPhoneNumber(auth, phoneNumber, verifierRef.current);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "Verification SMS Sent" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "SMS Service Failed", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmationResult || otp.length !== 6) return;
        setSaving(true);
        try {
            await confirmationResult.confirm(otp);
            setIsPhoneVerified(true);
            setShowOtpInput(false);
            toast({ title: "Phone Number Verified" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Incorrect OTP", description: "Verification code does not match." });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (phoneNumber !== userData?.phoneNumber && !isPhoneVerified) {
            handleSendVerificationSms();
            return;
        }

        setSaving(true);
        try {
            if (email !== user.email) {
                try {
                    await updateEmail(user, email);
                } catch (emailError: any) {
                    console.warn("Auth email update requires recent login:", emailError);
                }
            }

            let finalPhotoURL = photoURL;
            if (selectedFile) {
                const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
                await uploadBytes(photoRef, selectedFile);
                finalPhotoURL = await getDownloadURL(photoRef);
            }

            const userRef = doc(firestore, "users", user.uid);
            const registryData = {
                fullName: fullName.trim().toUpperCase(),
                email: email.trim().toLowerCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                barangay: selectedBarangay,
                city: selectedCity,
                province: selectedProvince,
                islandGroup: getIslandGroup(selectedProvince),
                zipCode: zipCode.trim(),
                photoURL: finalPhotoURL,
                lastActive: serverTimestamp(),
            };

            await updateDoc(userRef, registryData);

            toast({ title: "Registry Synchronized", description: "Your information has been updated in the National Database." });
            setSelectedFile(null);
            setIsInitialized(false); 
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sync Failed", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdForUpload(file);
            setShowConsent(true);
        }
    };

    const confirmIdUpload = async () => {
        if (!idForUpload || !user) return;
        setIsUploadingId(true);
        try {
            const storageRef = ref(storage, `users/${user.uid}/id_verification.${idForUpload.name.split('.').pop()}`);
            await uploadBytes(storageRef, idForUpload);
            const downloadURL = await getDownloadURL(storageRef);

            const userRef = doc(firestore, "users", user.uid);
            await updateDoc(userRef, {
                idVerificationUrl: downloadURL,
                idConsentRA10173: true,
                idUploadTimestamp: serverTimestamp(),
                vettingStatus: "Pending Audit"
            });

            toast({ title: "Identification Logged", description: "Document archived for Sec-Gen review." });
            setShowConsent(false);
            setIdForUpload(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Asset Upload Failed" });
        } finally {
            setIsUploadingId(false);
        }
    };

    const handleRequestErasure = async () => {
        const conf = prompt("DANGER ZONE: Type 'PURGE MY DATA' to formally request account deletion under RA 10173.");
        if (conf !== "PURGE MY DATA") return;

        try {
            await addDoc(collection(firestore, "security_logs"), {
                adminUid: "SYSTEM",
                action: "DATA_ERASURE_REQUESTED",
                targetUid: user?.uid,
                targetName: userData?.fullName,
                timestamp: serverTimestamp(),
                systemLevel: "PRIVACY_PROTOCOL"
            });
            toast({ title: "Purge Request Logged", description: "The Secretary General has been alerted to your data rights request." });
        } catch (e) {}
    };

    if (userLoading) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Fetching Registry Defaults...</p>
            </div>
        </div>
    );

    const needsVerification = phoneNumber !== userData?.phoneNumber && !isPhoneVerified;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-32">
            <div id="recaptcha-profile"></div>
            <div className="bg-card p-6 md:p-8 lg:px-10 border-b shadow-sm">
                <div className="w-full flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black font-headline text-primary uppercase tracking-tight">Member Profile</h1>
                        <p className="mt-1 text-xs text-muted-foreground font-bold uppercase tracking-widest">National Registry Oversight</p>
                    </div>
                    <Button onClick={() => auth.signOut()} variant="outline" size="sm" className="text-destructive font-black uppercase text-[10px] tracking-widest border-2">
                        <LogOut className="mr-2 h-3 w-3" /> Sign Out
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-8 lg:p-10 w-full space-y-8">
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left: Identity & Vetting (4/12) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="shadow-lg overflow-hidden border-none bg-white">
                            <CardHeader className="bg-primary text-primary-foreground text-center pb-8 pt-10 relative">
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                        <pattern id="profile-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                                        </pattern>
                                        <rect width="100%" height="100%" fill="url(#profile-grid)" />
                                    </svg>
                                </div>
                                <Avatar className="h-32 w-32 border-4 border-white shadow-2xl bg-background mx-auto relative z-10">
                                    <AvatarImage src={photoURL || ""} className="object-cover" />
                                    <AvatarFallback className="text-4xl font-black bg-muted text-primary">{fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="mt-4 relative z-10">
                                    <h2 className="text-xl font-black uppercase tracking-tight leading-none">{fullName || 'PATRIOT'}</h2>
                                    <Badge className="bg-accent text-primary font-black text-[9px] uppercase border-none mt-2">
                                        {userData?.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Official Digital ID Photo (1x1 Standard)</Label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {isCameraOpen ? (
                                            <div className="space-y-3">
                                                <div className="relative rounded-2xl overflow-hidden bg-black aspect-square shadow-inner">
                                                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="button" onClick={capturePhoto} className="flex-1 font-black uppercase text-xs">Capture</Button>
                                                    <Button type="button" variant="outline" onClick={stopCamera} className="h-10 px-3"><X className="h-4 w-4" /></Button>
                                                </div>
                                                <canvas ref={canvasRef} className="hidden" />
                                            </div>
                                        ) : (
                                            <>
                                                <Button type="button" variant="outline" className="w-full font-black uppercase text-[10px] tracking-widest h-14 border-2 flex flex-col items-center justify-center gap-1" onClick={startCamera}>
                                                    <Camera className="h-5 w-5 text-primary" />
                                                    <span>Open Identity Camera</span>
                                                </Button>
                                                <Button type="button" variant="outline" className="w-full font-black uppercase text-[10px] tracking-widest h-14 border-2 flex flex-col items-center justify-center gap-1" onClick={() => fileInputRef.current?.click()}>
                                                    <ImageIcon className="h-5 w-5 text-primary" />
                                                    <span>Upload 1x1 Portrait</span>
                                                </Button>
                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {const f=e.target.files?.[0]; if(f){setSelectedFile(f); const r=new FileReader(); r.onloadend=()=>setPhotoURL(r.result as string); r.readAsDataURL(f);}}} />
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase text-center mt-2">Professional 1x1 portraits are recommended for field verification.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-emerald-600 bg-white">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Account Vetting
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                    <p className="text-[9px] font-bold text-emerald-800 uppercase leading-relaxed">
                                        Tier: <span className="font-black underline">{userData?.vettingLevel || 'BRONZE'}</span>
                                    </p>
                                    <p className="text-[8px] font-medium text-emerald-600 uppercase mt-1">
                                        Upload documents to request Gold elevation.
                                    </p>
                                </div>
                                <Button 
                                    type="button"
                                    onClick={() => idInputRef.current?.click()} 
                                    variant="outline"
                                    className="w-full h-12 border-emerald-600 text-emerald-700 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50"
                                    disabled={userData?.vettingStatus === "Pending Audit"}
                                >
                                    <FileUp className="mr-2 h-4 w-4" />
                                    {userData?.vettingStatus === "Pending Audit" ? "Awaiting Audit..." : "Upload Identity File"}
                                </Button>
                                <input type="file" ref={idInputRef} className="hidden" onChange={handleIdSelect} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: National Registry Data (8/12) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="shadow-xl border-t-4 border-primary bg-white">
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2 uppercase tracking-tight text-primary">
                                    <User className="h-5 w-5 text-accent" /> 
                                    National Registry Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Full Legal Name</Label>
                                        <Input value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-12 font-bold uppercase border-2 focus:border-primary transition-all" />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 pl-10 border-2" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Contact Number</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Phone className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                                                    <Input value={phoneNumber} onChange={e => {setPhoneNumber(e.target.value); setIsPhoneVerified(false);}} className="h-12 pl-10 border-2 font-bold" placeholder="+639..." />
                                                </div>
                                                {needsVerification && !showOtpInput && (
                                                    <Button type="button" onClick={handleSendVerificationSms} variant="outline" className="h-12 border-primary text-primary font-black uppercase text-[10px] px-4">
                                                        Verify
                                                    </Button>
                                                )}
                                            </div>
                                            {showOtpInput && (
                                                <div className="mt-2 p-4 bg-muted/50 rounded-xl space-y-3 border-2 border-primary/20">
                                                    <Label className="text-[10px] font-black uppercase">Induction OTP</Label>
                                                    <div className="flex gap-2">
                                                        <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="h-12 text-center font-black tracking-[0.5em] text-lg" />
                                                        <Button type="button" onClick={handleVerifyOtp} className="h-12 font-black uppercase text-xs">Confirm</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-dashed">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block flex items-center gap-2">
                                            <MapPin className="h-3 w-3" /> Jurisdictional Footprint
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase">Province</Label>
                                                <Select 
                                                    onValueChange={(val) => { setSelectedProvince(val); setSelectedCity(""); setSelectedBarangay(""); }} 
                                                    value={selectedProvince}
                                                >
                                                    <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {provinces.map((p: any) => (
                                                            <SelectItem key={p.code} value={p.name} className="font-bold uppercase text-[10px]">{p.name}</SelectItem>
                                                        ))}
                                                        {selectedProvince && !provinces.some(p => p.name === selectedProvince) && (
                                                            <SelectItem value={selectedProvince} className="font-bold uppercase text-[10px]">{selectedProvince}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase">City / Municipality</Label>
                                                <Select 
                                                    onValueChange={(val) => { setSelectedCity(val); setSelectedBarangay(""); }} 
                                                    value={selectedCity} 
                                                    disabled={!selectedProvince && !userData?.province}
                                                >
                                                    <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cities.map((c: any) => (
                                                            <SelectItem key={c.code} value={c.name} className="font-bold uppercase text-[10px]">{c.name}</SelectItem>
                                                        ))}
                                                        {selectedCity && !cities.some(c => c.name === selectedCity) && (
                                                            <SelectItem value={selectedCity} className="font-bold uppercase text-[10px]">{selectedCity}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase">Barangay</Label>
                                                <Select 
                                                    onValueChange={setSelectedBarangay} 
                                                    value={selectedBarangay} 
                                                    disabled={!selectedCity && !userData?.city}
                                                >
                                                    <SelectTrigger className="h-11 border-2"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {barangays.map((b: any) => (
                                                            <SelectItem key={b.code} value={b.name} className="font-bold uppercase text-[10px]">{b.name}</SelectItem>
                                                        ))}
                                                        {selectedBarangay && !barangays.some(b => b.name === selectedBarangay) && (
                                                            <SelectItem value={selectedBarangay} className="font-bold uppercase text-[10px]">{selectedBarangay}</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-black uppercase">Zip Code (Auto-Sync)</Label>
                                                <Input value={zipCode} readOnly className="h-11 font-black bg-muted/50 border-2 cursor-not-allowed text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            <Label className="text-[9px] font-black uppercase">Street / House No.</Label>
                                            <Input placeholder="House #, Building, Street" value={streetAddress} onChange={e => setStreetAddress(e.target.value.toUpperCase())} className="h-11 border-2 font-medium" required />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-[8px] font-black uppercase text-muted-foreground tracking-widest text-center md:text-left">
                                    Registry ID: {userData?.uid?.substring(0, 12).toUpperCase()}
                                </div>
                                <Button type="submit" className="w-full md:w-auto h-14 px-12 text-sm font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90" disabled={saving || needsVerification}>
                                    {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <><Save className="mr-2 h-5 w-5 text-accent" /> Sync Profile</>}
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-red-200 bg-red-50/30 overflow-hidden">
                            <CardHeader className="bg-red-50">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Data Sovereignty Zone
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <p className="text-[10px] font-bold text-red-900/60 uppercase leading-relaxed">
                                    In accordance with **RA 10173 (Data Privacy Act of 2012)**, you may request the full erasure of your induction metadata and associated biometric assets from the National Registry.
                                </p>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full border-red-200 text-red-700 hover:bg-red-100 font-black uppercase text-[10px] tracking-widest transition-colors h-12"
                                    onClick={handleRequestErasure}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Formal Data Purge Request
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>

            <Dialog open={showConsent} onOpenChange={setShowConsent}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2 text-xl">
                            <ShieldAlert className="h-6 w-6 text-accent" />
                            Security Protocol
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-tight pt-2">
                            RA 10173 COMPLIANCE AUTHORIZATION
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="bg-primary/5 p-5 rounded-2xl border-2 border-dashed border-primary/20">
                            <p className="text-xs font-medium text-foreground/80 leading-relaxed italic text-center">
                                "I hereby authorize the PDDS National Secretariat to securely store and process my identification assets strictly for organizational vetting and jurisdictional auditing purposes."
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col gap-3">
                        <Button 
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl rounded-xl" 
                            onClick={confirmIdUpload}
                            disabled={isUploadingId}
                        >
                            {isUploadingId ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "I Consent & Archive File"}
                        </Button>
                        <Button variant="ghost" onClick={() => {setShowConsent(false); setIdForUpload(null);}} className="text-[10px] font-black uppercase text-muted-foreground">Cancel Protocol</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
