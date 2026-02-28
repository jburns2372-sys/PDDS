
"use client";

import { useState, useEffect, useRef } from "react";
import { useUserData } from "@/context/user-data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { useRouter } from "next/navigation";
import { updatePassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateUserDocument } from "@/firebase/firestore/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Loader2, LogOut, Save, Phone, Lock, Eye, EyeOff, X, Check, ShieldCheck, MapPin } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

const NCR_CODE = "130000000";

const ZIP_CODE_MAP: Record<string, { default: string; [barangay: string]: string }> = {
    "CITY OF MANILA": { 
        default: "1000", 
        "SAMPALOC": "1008", "MALATE": "1004", "BINONDO": "1006", "ERMITA": "1000", 
        "QUIAPO": "1001", "TONDO": "1012", "SANTA CRUZ": "1014", "SANTA ANA": "1009",
        "SAN MIGUEL": "1005", "SAN NICOLAS": "1010", "PANDACAN": "1011", "PACO": "1007",
        "INTRAMUROS": "1002", "PORT AREA": "1018"
    },
    "QUEZON CITY": { 
        default: "1100", 
        "COMMONWEALTH": "1121", "DILIMAN": "1101", "BATASAN HILLS": "1126", "CUBAO": "1109",
        "LOYOLA HEIGHTS": "1108", "PASONG TAMO": "1107", "PAANG BUNDOK": "1114",
        "BAGONG SILANGAN": "1119", "NOVALICHES": "1123", "NEW ERA": "1107",
        "SAN BARTOLOME": "1116", "TANDANG SORA": "1116", "PROJECT 4": "1109",
        "PROJECT 6": "1100", "PROJECT 7": "1105", "PROJECT 8": "1106",
        "FAIRVIEW": "1118", "HOLY SPIRIT": "1127", "PAYATAS": "1119", "UP CAMPUS": "1101"
    },
    "MAKATI CITY": { 
        default: "1200", 
        "BEL-AIR": "1209", "FORBES PARK": "1219", "MAGALLANES VILLAGE": "1232",
        "DASMARIÑAS VILLAGE": "1222", "GUADALUPE NUEVO": "1212", "GUADALUPE VIEJO": "1211",
        "POBLACION": "1210", "SAN LORENZO": "1223", "URA-DANZA": "1200"
    },
};

export default function ProfilePage() {
    const { user, userData, loading: userLoading } = useUserData();
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const { toast } = useToast();

    // Profile fields
    const [fullName, setFullName] = useState("");
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

    // Password fields
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // UI State
    const [saving, setSaving] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    // Phone Verification State
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isPhoneVerified, setIsPhoneVerified] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Fetch Provinces on mount
    useEffect(() => {
        const fetchProvincesAndNCR = async () => {
            try {
                const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
                const pData = await pResp.json();
                const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
                const ncrData = await ncrResp.json();
                const combined = [
                    { ...ncrData, name: "METRO MANILA (NCR)", isNCR: true },
                    ...pData
                ].sort((a: any, b: any) => a.name.localeCompare(b.name));
                setProvinces(combined);
            } catch (error) {
                console.error("Error fetching provinces:", error);
            }
        };
        fetchProvincesAndNCR();
    }, []);

    // Set initial form data
    useEffect(() => {
        if (userData && provinces.length > 0) {
            setFullName(userData.fullName || "");
            setPhoneNumber(userData.phoneNumber || "");
            setStreetAddress(userData.streetAddress || "");
            setZipCode(userData.zipCode || "");
            setPhotoURL(userData.photoURL || null);
            setSelectedProvince(userData.province || "");
            setSelectedCity(userData.city || "");
            setSelectedBarangay(userData.barangay || "");
            setIsPhoneVerified(true);
        }
    }, [userData, provinces]);

    // Handle Cascading Location Logic
    useEffect(() => {
        if (!selectedProvince) {
            setCities([]);
            return;
        }
        const fetchCities = async () => {
            try {
                const province = provinces.find(p => p.name === selectedProvince);
                if (province) {
                    const endpoint = province.isNCR 
                        ? `https://psgc.gitlab.io/api/regions/${NCR_CODE}/cities-municipalities/`
                        : `https://psgc.gitlab.io/api/provinces/${province.code}/cities-municipalities/`;
                    const response = await fetch(endpoint);
                    const data = await response.json();
                    setCities(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
            }
        };
        fetchCities();
    }, [selectedProvince, provinces]);

    useEffect(() => {
        if (!selectedCity) {
            setBarangays([]);
            return;
        }
        const fetchBarangays = async () => {
            try {
                const city = cities.find(c => c.name === selectedCity);
                if (city) {
                    const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays/`);
                    const data = await response.json();
                    setBarangays(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
                }
            } catch (error) {
                console.error("Error fetching barangays:", error);
            }
        };
        fetchBarangays();
    }, [selectedCity, cities]);

    useEffect(() => {
        if (!selectedCity) {
            setZipCode("");
            return;
        }
        const cityKey = selectedCity.toUpperCase();
        const cityData = ZIP_CODE_MAP[cityKey];
        if (cityData) {
            const brgyKey = selectedBarangay.toUpperCase();
            const matchedBrgyKey = Object.keys(cityData).find(key => 
                brgyKey.includes(key) || key.includes(brgyKey)
            );
            const specificZip = matchedBrgyKey ? cityData[matchedBrgyKey] : null;
            if (specificZip) setZipCode(specificZip);
            else setZipCode(cityData.default || "");
        } else {
            // Synchronized fallback zip codes for non-mapped cities
            setZipCode("0000"); 
        }
    }, [selectedCity, selectedBarangay]);

    // Initialize Recaptcha
    useEffect(() => {
        if (typeof window !== "undefined" && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-profile', {
                'size': 'invisible',
            });
        }
    }, [auth]);

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
            });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        setSelectedFile(blob);
                        setPhotoURL(canvas.toDataURL('image/jpeg'));
                        stopCamera();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoURL(reader.result as string);
            };
            reader.readAsDataURL(file);
            setIsCameraOpen(false);
        }
    };

    const handleSendVerificationSms = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast({ variant: "destructive", title: "Invalid Phone Number" });
            return;
        }
        setSaving(true);
        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "Verification Sent", description: "Please enter the code sent to your mobile." });
        } catch (error: any) {
            console.error(error);
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
            toast({ title: "Phone Verified", description: "You can now save your profile changes." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Incorrect Code" });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword && newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: "Password Mismatch" });
            return;
        }

        if (phoneNumber !== userData?.phoneNumber && !isPhoneVerified) {
            handleSendVerificationSms();
            return;
        }

        setSaving(true);
        try {
            let finalPhotoURL = photoURL;
            if (selectedFile) {
                const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                const uploadResult = await uploadBytes(storageRef, selectedFile);
                finalPhotoURL = await getDownloadURL(uploadResult.ref);
            }

            if (newPassword) {
                await updatePassword(user, newPassword);
            }

            await updateUserDocument(firestore, user.uid, {
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                barangay: selectedBarangay,
                city: selectedCity,
                province: selectedProvince,
                zipCode: zipCode.trim(),
                photoURL: finalPhotoURL,
            });

            toast({ title: "Profile Updated", description: "Changes saved to the National Registry." });
            setNewPassword("");
            setConfirmPassword("");
            setSelectedFile(null);
            setIsPhoneVerified(true);
        } catch (error: any) {
            console.error("Save error:", error);
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    };

    if (userLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const needsPhoneVerification = phoneNumber !== userData?.phoneNumber && !isPhoneVerified;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-20">
            <div id="recaptcha-container-profile"></div>
            <div className="bg-card p-6 md:p-8 border-b shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-tight">Member Profile</h1>
                        <p className="mt-1 text-sm text-muted-foreground font-medium">Manage your personal information and party credentials.</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="text-destructive font-bold uppercase text-[10px] tracking-widest">
                        <LogOut className="mr-2 h-3 w-3" /> Sign Out
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
                    
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg overflow-hidden border-primary/10">
                            <CardHeader className="bg-primary text-primary-foreground text-center pb-8 pt-10 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10">
                                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                        <pattern id="grid-profile" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                                        </pattern>
                                        <rect width="100%" height="100%" fill="url(#grid-profile)" />
                                    </svg>
                                </div>
                                <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-background mx-auto relative z-10">
                                    <AvatarImage src={photoURL || ""} className="object-cover" />
                                    <AvatarFallback className="bg-muted text-muted-foreground text-4xl font-bold">
                                        {fullName?.charAt(0) || <User className="h-16 w-16" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="mt-4 relative z-10">
                                    <h2 className="text-xl font-black uppercase tracking-tight">{fullName || 'MEMBER NAME'}</h2>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{userData?.role || 'Supporter'}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary text-center block">Update Photo</Label>
                                {isCameraOpen ? (
                                    <div className="space-y-3">
                                        <div className="relative rounded-lg overflow-hidden bg-black aspect-square shadow-inner border">
                                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                            {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Access Denied</AlertTitle></Alert>}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" onClick={capturePhoto} className="flex-1 text-xs font-bold"><Check className="mr-2 h-3 w-3" /> Capture</Button>
                                            <Button type="button" variant="outline" size="sm" onClick={stopCamera}><X className="h-3 w-3" /></Button>
                                        </div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Button type="button" variant="outline" className="w-full text-xs font-bold" onClick={startCamera}><Camera className="mr-2 h-4 w-4 text-primary" /> Take Selfie</Button>
                                        <Button type="button" variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest" onClick={() => fileInputRef.current?.click()}>Upload File</Button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-destructive/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-destructive" /> Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">New Password</Label>
                                    <div className="relative">
                                        <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="h-10 text-xs" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Confirm Password</Label>
                                    <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="h-10 text-xs" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-xl border-t-4 border-primary">
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2 uppercase tracking-tight">
                                    <User className="h-5 w-5 text-primary" /> Registry Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</Label>
                                        <Input value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} className="h-11 font-bold uppercase" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Contact Number</Label>
                                        <div className="flex gap-2">
                                            <Input value={phoneNumber} onChange={e => {setPhoneNumber(e.target.value); setIsPhoneVerified(false);}} className="h-11" placeholder="+639..." />
                                            {needsPhoneVerification && !showOtpInput && (
                                                <Button type="button" onClick={handleSendVerificationSms} variant="outline" className="border-primary text-primary font-bold">Verify</Button>
                                            )}
                                        </div>
                                        {showOtpInput && (
                                            <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-3">
                                                <Label className="text-[10px] font-black">Enter 6-Digit Code</Label>
                                                <div className="flex gap-2">
                                                    <Input value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="text-center font-bold tracking-widest" />
                                                    <Button type="button" onClick={handleVerifyOtp} disabled={saving}>Confirm</Button>
                                                </div>
                                            </div>
                                        )}
                                        {isPhoneVerified && phoneNumber !== userData?.phoneNumber && (
                                            <div className="flex items-center gap-2 text-green-600 text-xs font-bold mt-1">
                                                <ShieldCheck className="h-3 w-3" /> Verified & Ready to Save
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Province / Region</Label>
                                            <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                                <SelectTrigger className="h-11"><SelectValue placeholder="Select Province" /></SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((p) => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">City / Municipality</Label>
                                            <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedProvince}>
                                                <SelectTrigger className="h-11"><SelectValue placeholder="Select City" /></SelectTrigger>
                                                <SelectContent>
                                                    {cities.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Barangay</Label>
                                            <Select onValueChange={setSelectedBarangay} value={selectedBarangay} disabled={!selectedCity}>
                                                <SelectTrigger className="h-11"><SelectValue placeholder="Select Barangay" /></SelectTrigger>
                                                <SelectContent>
                                                    {barangays.map((b) => <SelectItem key={b.code} value={b.name}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Zip Code (Auto)</Label>
                                            <Input value={zipCode} readOnly className="h-11 bg-muted font-mono" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Street Address</Label>
                                        <Input value={streetAddress} onChange={e => setStreetAddress(e.target.value.toUpperCase())} className="h-11 uppercase" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t pt-6">
                                <Button type="submit" className="w-full md:w-auto h-12 px-10 text-lg font-black uppercase tracking-widest" disabled={saving || (phoneNumber !== userData?.phoneNumber && !isPhoneVerified)}>
                                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
