"use client";

import { useState, useEffect, useRef } from "react";
import { useUserData } from "@/context/user-data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
    Mail
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
 * Features automated Zip Code sync when Barangay is selected and verified Phone Number flow.
 */
export default function ProfilePage() {
    const { user, userData, loading: userLoading } = useUserData();
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    // Profile fields
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

    useEffect(() => {
        if (userData) {
            setFullName(userData.fullName || "");
            setEmail(userData.email || "");
            setPhoneNumber(userData.phoneNumber || "");
            setStreetAddress(userData.streetAddress || "");
            setZipCode(userData.zipCode || "");
            setPhotoURL(userData.photoURL || null);
            setSelectedProvince(userData.province || "");
            setSelectedCity(userData.city || "");
            setSelectedBarangay(userData.barangay || "");
            setIsPhoneVerified(!!userData.phoneNumber);
        }
    }, [userData]);

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

    // AUTO-SYNC ZIP CODE TO BARANGAY / CITY
    useEffect(() => {
        if (selectedCity) {
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
            toast({ variant: 'destructive', title: 'Camera Error', description: 'Enable permissions.' });
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
            toast({ variant: "destructive", title: "Invalid Phone Number" });
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
            toast({ title: "Verification Sent" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "SMS Failed", description: error.message });
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
            toast({ title: "Phone Verified" });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Incorrect Code" });
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
            // 1. Update Auth Email if changed
            if (email !== user.email) {
                try {
                    await updateEmail(user, email);
                } catch (emailError: any) {
                    toast({ variant: "destructive", title: "Email Update Error", description: "Re-login required to update email for security reasons." });
                }
            }

            // 2. Upload Profile Photo if changed
            let finalPhotoURL = photoURL;
            if (selectedFile) {
                const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
                await uploadBytes(photoRef, selectedFile);
                finalPhotoURL = await getDownloadURL(photoRef);
            }

            // 3. Update Firestore Registry
            const userRef = doc(firestore, "users", user.uid);
            await updateDoc(userRef, {
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
            });

            toast({ title: "Profile Updated", description: "Induction record synchronized." });
            setSelectedFile(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
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

            toast({ title: "ID Uploaded", description: "Vetting queue updated for Sec-Gen audit." });
            setShowConsent(false);
            setIdForUpload(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setIsUploadingId(false);
        }
    };

    const handleRequestErasure = async () => {
        const conf = prompt("WARNING: Type 'PURGE MY DATA' to formally request account deletion.");
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
            toast({ title: "Request Logged", description: "The Secretary General has been notified." });
        } catch (e) {}
    };

    if (userLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    const needsVerification = phoneNumber !== userData?.phoneNumber && !isPhoneVerified;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-32">
            <div id="recaptcha-profile"></div>
            <div className="bg-card p-6 md:p-8 border-b shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-primary uppercase">Member Profile</h1>
                        <p className="mt-1 text-sm text-muted-foreground font-medium">Manage your induction data.</p>
                    </div>
                    <Button onClick={() => auth.signOut()} variant="outline" size="sm" className="text-destructive font-bold uppercase text-[10px] tracking-widest">
                        <LogOut className="mr-2 h-3 w-3" /> Sign Out
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg overflow-hidden">
                            <CardHeader className="bg-primary text-primary-foreground text-center pb-8 pt-10">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-background mx-auto">
                                    <AvatarImage src={photoURL || ""} className="object-cover" />
                                    <AvatarFallback className="text-4xl font-bold">{fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="mt-4">
                                    <h2 className="text-xl font-black uppercase tracking-tight">{fullName || 'PATRIOT'}</h2>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{userData?.role}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {isCameraOpen ? (
                                    <div className="space-y-3">
                                        <div className="relative rounded-lg overflow-hidden bg-black aspect-square"><video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline /></div>
                                        <div className="flex gap-2"><Button type="button" onClick={capturePhoto} className="flex-1 text-xs font-bold">Capture</Button><Button type="button" variant="outline" size="sm" onClick={stopCamera}><X className="h-3 w-3" /></Button></div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Button type="button" variant="outline" className="w-full text-xs font-bold" onClick={startCamera}><Camera className="mr-2 h-4 w-4" /> Take Selfie</Button>
                                        <Button type="button" variant="ghost" className="w-full text-[10px] font-bold uppercase" onClick={() => fileInputRef.current?.click()}>Upload Photo</Button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {const f=e.target.files?.[0]; if(f){setSelectedFile(f); const r=new FileReader(); r.onloadend=()=>setPhotoURL(r.result as string); r.readAsDataURL(f);}}} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-emerald-600">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    Account Vetting
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                                    Upload documents to upgrade your vetting status.
                                </p>
                                <Button 
                                    type="button"
                                    onClick={() => idInputRef.current?.click()} 
                                    variant="outline"
                                    className="w-full h-12 border-emerald-600 text-emerald-700 font-black uppercase text-[10px] tracking-widest"
                                    disabled={userData?.vettingStatus === "Pending Audit"}
                                >
                                    <FileUp className="mr-2 h-4 w-4" />
                                    {userData?.vettingStatus === "Pending Audit" ? "Awaiting Audit..." : "Upload Identity File"}
                                </Button>
                                <input type="file" ref={idInputRef} className="hidden" onChange={handleIdSelect} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-xl border-t-4 border-primary">
                            <CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2 uppercase tracking-tight"><User className="h-5 w-5" /> National Registry Data</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</Label>
                                        <Input value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-11 font-bold uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Contact Number</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                <Input value={phoneNumber} onChange={e => {setPhoneNumber(e.target.value); setIsPhoneVerified(false);}} className="h-11 pl-10" placeholder="+639..." />
                                            </div>
                                            {needsVerification && !showOtpInput && <Button type="button" onClick={handleSendVerificationSms} variant="outline" className="border-primary text-primary font-bold">Verify</Button>}
                                        </div>
                                        {showOtpInput && (
                                            <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-3">
                                                <Label className="text-[10px] font-black">Induction Code</Label>
                                                <div className="flex gap-2"><Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="text-center font-bold" /><Button type="button" onClick={handleVerifyOtp}>Confirm</Button></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Province</Label>
                                            <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{provinces.map(p => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">City</Label>
                                            <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedProvince}>
                                                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{cities.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Barangay</Label>
                                            <Select onValueChange={setSelectedBarangay} value={selectedBarangay} disabled={!selectedCity}>
                                                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>{barangays.map(b => <SelectItem key={b.code} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary">Zip Code</Label>
                                            <Input value={zipCode} readOnly className="h-11 font-bold bg-muted/50" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-primary">Street / House No.</Label>
                                        <Input placeholder="House #, Building, Street" value={streetAddress} onChange={e => setStreetAddress(e.target.value.toUpperCase())} className="h-11" required />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t pt-6">
                                <Button type="submit" className="w-full md:w-auto h-12 px-10 text-lg font-black uppercase tracking-widest" disabled={saving || (phoneNumber !== userData?.phoneNumber && !isPhoneVerified)}>
                                    {saving ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Sync Profile</>}
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border-red-200 bg-red-50/30">
                            <CardHeader>
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Privacy Control
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-[10px] font-bold text-red-900/60 uppercase leading-relaxed">
                                    Under **RA 10173**, you have the right to request the erasure of your personal data from the movement's digital ledger.
                                </p>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full border-red-200 text-red-700 hover:bg-red-50 font-black uppercase text-[10px] tracking-widest"
                                    onClick={handleRequestErasure}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Request Data Erasure
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>

            {/* RA 10173 Consent Dialog */}
            <Dialog open={showConsent} onOpenChange={setShowConsent}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-accent" />
                            Data Consent Protocol
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-tight pt-2">
                            RA 10173 Compliance Authorization
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                                "I hereby consent to the secure collection and processing of my identification documents by the PDDS strictly for membership vetting and organizational auditing."
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col gap-3">
                        <Button 
                            className="w-full h-14 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-xl" 
                            onClick={confirmIdUpload}
                            disabled={isUploadingId}
                        >
                            {isUploadingId ? <Loader2 className="animate-spin h-5 w-5" /> : "I Consent & Upload"}
                        </Button>
                        <Button variant="ghost" onClick={() => {setShowConsent(false); setIdForUpload(null);}} className="text-[10px] font-black uppercase">Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
