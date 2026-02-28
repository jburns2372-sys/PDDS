
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    ConfirmationResult,
    sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, increment, updateDoc, collection, getDocs, query, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Phone, Loader2, Mail, Lock, User, Camera, X, Check, MapPin, Eye, EyeOff } from "lucide-react";

const NCR_CODE = "130000000";

const ZIP_CODE_MAP: Record<string, any> = {
    "METRO MANILA (NCR)": {
        "CITY OF MANILA": { 
            default: "1000", "SAMPALOC": "1008", "MALATE": "1004", "BINONDO": "1006", "ERMITA": "1000", "QUIAPO": "1001", "TONDO": "1012", "SANTA CRUZ": "1014", "SANTA ANA": "1009", "SAN MIGUEL": "1005", "SAN NICOLAS": "1010", "PANDACAN": "1011", "PACO": "1007", "INTRAMUROS": "1002", "PORT AREA": "1018"
        },
        "QUEZON CITY": { 
            default: "1100", "COMMONWEALTH": "1121", "DILIMAN": "1101", "BATASAN HILLS": "1126", "CUBAO": "1109", "LOYOLA HEIGHTS": "1108", "PASONG TAMO": "1107", "PAANG BUNDOK": "1114", "BAGONG SILANGAN": "1119", "NOVALICHES": "1123", "NEW ERA": "1107", "SAN BARTOLOME": "1116", "TANDANG SORA": "1116", "PROJECT 4": "1109", "PROJECT 6": "1100", "PROJECT 7": "1105", "PROJECT 8": "1106", "FAIRVIEW": "1118", "HOLY SPIRIT": "1127", "PAYATAS": "1119", "UP CAMPUS": "1101"
        },
        "MAKATI CITY": { 
            default: "1200", "BEL-AIR": "1209", "FORBES PARK": "1219", "MAGALLANES VILLAGE": "1232", "DASMARIÑAS VILLAGE": "1222", "GUADALUPE NUEVO": "1212", "GUADALUPE VIEJO": "1211", "POBLACION": "1210", "SAN LORENZO": "1223", "URA-DANZA": "1200"
        },
        "CALOOCAN CITY": "1400", "PASIG CITY": "1600", "TAGUIG CITY": "1630", "PARAÑAQUE CITY": "1700", "VALENZUELA CITY": "1440", "LAS PIÑAS CITY": "1740", "MUNTINLUPA CITY": "1770", "MARIKINA CITY": "1800", "PASAY CITY": "1300", "MALABON CITY": "1470", "NAVOTAS CITY": "1485", "SAN JUAN CITY": "1500", "PATEROS": "1620", "default": "1000"
    },
    "BASILAN": { "CITY OF LAMITAN": "7302", "CITY OF ISABELA": "7300", "default": "7300" },
    "CEBU": { "CEBU CITY": "6000", "default": "6000" },
    "DAVAO DEL SUR": { "DAVAO CITY": "8000", "default": "8000" },
    "BULACAN": { "default": "3000" },
    "CAVITE": { "default": "4100" },
    "LAGUNA": { "default": "4000" },
    "RIZAL": { "default": "1900" },
    "BATANGAS": { "default": "4200" },
    "PAMPANGA": { "default": "2000" }
};

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
    const [showPassword, setShowPassword] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("+63");
    const [zipCode, setZipCode] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    
    // Cascading Location State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<string>("");
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedBarangay, setSelectedBarangay] = useState<string>("");

    // Photo & Camera State
    const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // reCAPTCHA Verifier Ref
    const verifierRef = useRef<RecaptchaVerifier | null>(null);

    // UI State
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const fetchProvincesAndNCR = async () => {
            try {
                const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
                const pData = await pResp.json();
                const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
                const ncrData = await ncrResp.json();
                const combined = [{ ...ncrData, name: "METRO MANILA (NCR)", isNCR: true }, ...pData].sort((a: any, b: any) => a.name.localeCompare(b.name));
                setProvinces(combined);
            } catch (error) {
                console.error("Error fetching provinces:", error);
            }
        };
        fetchProvincesAndNCR();
    }, []);

    useEffect(() => {
        if (!selectedProvince) { setCities([]); return; }
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
            } catch (error) { console.error("Error fetching cities:", error); }
        };
        fetchCities();
        setSelectedCity("");
        setSelectedBarangay("");
        setZipCode("");
    }, [selectedProvince, provinces]);

    useEffect(() => {
        if (!selectedCity) { setBarangays([]); return; }
        const fetchBarangays = async () => {
            try {
                const city = cities.find(c => c.name === selectedCity);
                if (city) {
                    const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays/`);
                    const data = await response.json();
                    setBarangays(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
                }
            } catch (error) { console.error("Error fetching barangays:", error); }
        };
        fetchBarangays();
        setSelectedBarangay("");
    }, [selectedCity, cities]);

    useEffect(() => {
        if (!selectedProvince) { setZipCode(""); return; }
        const provinceKey = selectedProvince.toUpperCase();
        const cityKey = selectedCity.toUpperCase();
        const brgyKey = selectedBarangay.toUpperCase();
        const provinceData = ZIP_CODE_MAP[provinceKey];
        if (provinceData) {
            const cityData = provinceData[cityKey];
            if (cityData) {
                if (typeof cityData === 'string') { setZipCode(cityData); } 
                else if (typeof cityData === 'object') {
                    const matchedBrgyKey = Object.keys(cityData).find(key => brgyKey.includes(key) || key.includes(brgyKey));
                    setZipCode(matchedBrgyKey ? cityData[matchedBrgyKey] : (cityData.default || "0000"));
                }
            } else { setZipCode(provinceData.default || "0000"); }
        } else { setZipCode("0000"); }
    }, [selectedProvince, selectedCity, selectedBarangay]);

    /**
     * Singleton Pattern for reCAPTCHA initialization
     */
    const setupRecaptcha = () => {
        if (typeof window !== "undefined" && !verifierRef.current) {
            try {
                // Invisible Mode configured
                verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                });
            } catch (e) {
                console.error("reCAPTCHA init failed:", e);
            }
        }
    };

    useEffect(() => {
        setupRecaptcha();
        return () => {
            if (verifierRef.current) {
                verifierRef.current.clear();
                verifierRef.current = null;
            }
            // Clean Up logic for unmount
            const container = document.getElementById('recaptcha-container');
            if (container) container.innerHTML = "";
            stopCamera();
        };
    }, [auth]);

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
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
                        setPhotoPreview(canvas.toDataURL('image/jpeg'));
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
            reader.onloadend = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
            setIsCameraOpen(false);
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) { toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the Kartilya." }); return; }
        const phoneTrimmed = phoneNumber.trim();
        if (phoneTrimmed.length < 10) { toast({ variant: "destructive", title: "Invalid Phone", description: "Enter valid number." }); return; }
        if (!selectedProvince || !selectedCity || !selectedBarangay) { toast({ variant: "destructive", title: "Incomplete Address", description: "Select full location." }); return; }

        setLoading(true);
        try {
            setupRecaptcha();
            if (!verifierRef.current) throw new Error("reCAPTCHA initialization failed.");

            const result = await signInWithPhoneNumber(auth, phoneTrimmed, verifierRef.current);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "SMS Sent", description: "Check your phone for verification code." });
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "SMS Failed", description: error.message });
            
            // Error Recovery: Reset widget if SMS fails
            if (typeof window !== "undefined" && (window as any).grecaptcha) {
                try {
                    (window as any).grecaptcha.reset();
                } catch (resetError) {
                    if (verifierRef.current) verifierRef.current.clear();
                    verifierRef.current = null;
                    setupRecaptcha();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndComplete = async () => {
        if (!confirmationResult || otp.length !== 6) { toast({ variant: "destructive", title: "Error", description: "Enter 6-digit code." }); return; }
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            const usersRef = collection(firestore, "users");
            const firstUserCheck = await getDocs(query(usersRef, limit(1)));
            const isFirstUser = firstUserCheck.empty;

            const trimmedEmail = email.trim().toLowerCase();
            const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            const user = userCredential.user;

            let finalPhotoURL = null;
            if (selectedFile) {
                const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                const uploadResult = await uploadBytes(storageRef, selectedFile);
                finalPhotoURL = await getDownloadURL(uploadResult.ref);
            }

            await sendEmailVerification(user);

            const supporterData = {
                uid: user.uid,
                email: trimmedEmail,
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                barangay: selectedBarangay,
                city: selectedCity,
                province: selectedProvince,
                zipCode: zipCode,
                photoURL: finalPhotoURL,
                role: isFirstUser ? "Admin" : "Supporter",
                isSuperAdmin: isFirstUser,
                jurisdictionLevel: isFirstUser ? "National" : "City/Municipal",
                assignedLocation: isFirstUser ? "National Headquarters" : selectedCity,
                isApproved: true,
                kartilyaAgreed: true,
                recruitCount: 0,
                referredBy: referralUid || null,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", user.uid), supporterData);

            if (referralUid && !isFirstUser) {
              const referrerRef = doc(firestore, "users", referralUid);
              updateDoc(referrerRef, { recruitCount: increment(1) }).catch(e => console.error(e));
            }

            toast({ title: "Welcome to PDDS!", description: isFirstUser ? "Production Environment Initialized. You have been granted Administrative access." : "Account created. Check email for verification link." });
            router.push("/home");
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Registration Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4 pb-12">
            <div className="mb-8 flex items-center gap-4">
                <PddsLogo className="h-14 w-14" />
                <h1 className="text-4xl font-black tracking-tighter text-primary font-headline uppercase">
                    PDDS Portal
                </h1>
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-t-4 border-primary overflow-hidden">
                {!showOtpInput ? (
                    <form onSubmit={handleInitialSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline uppercase">Supporter Registration</CardTitle>
                            <CardDescription className="text-center">Secure your place in the Federalismo ng Dugong Dakilang Samahan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Form fields remain consistent with previous logic for location selection and selfie */}
                            <div className="flex flex-col items-center gap-4 pb-6 border-b">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-muted">
                                    <AvatarImage src={photoPreview || ""} className="object-cover" />
                                    <AvatarFallback><Camera className="h-10 w-10 text-muted-foreground/30" /></AvatarFallback>
                                </Avatar>
                                {isCameraOpen ? (
                                    <div className="w-full space-y-3">
                                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" onClick={capturePhoto} className="flex-1 font-bold">Capture</Button>
                                            <Button type="button" variant="outline" onClick={stopCamera}>Cancel</Button>
                                        </div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={startCamera}><Camera className="mr-2 h-4 w-4" /> Camera</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input placeholder="JUAN DELA CRUZ" required value={fullName} onChange={e => setFullName(e.target.value.toUpperCase())} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" placeholder="juan@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input placeholder="+639123456789" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Province</Label>
                                        <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                            <SelectTrigger><SelectValue placeholder="Province" /></SelectTrigger>
                                            <SelectContent>{provinces.map((p) => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedProvince}>
                                            <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
                                            <SelectContent>{cities.map((c) => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Barangay</Label>
                                        <Select onValueChange={setSelectedBarangay} value={selectedBarangay} disabled={!selectedCity}>
                                            <SelectTrigger><SelectValue placeholder="Barangay" /></SelectTrigger>
                                            <SelectContent>{barangays.map((b) => <SelectItem key={b.code} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Zip Code</Label>
                                        <Input value={zipCode} readOnly className="bg-muted" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                                <Label htmlFor="terms" className="text-xs font-medium leading-none">I agree to the PDDS Kartilya principles.</Label>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading || !agreed || !zipCode}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Register"}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link></p>
                        </CardFooter>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        <CardHeader className="px-0">
                            <CardTitle className="text-2xl text-center font-headline uppercase">Verify OTP</CardTitle>
                            <CardDescription className="text-center">Enter code sent to {phoneNumber}</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <Input id="otp" placeholder="000000" maxLength={6} className="text-center text-2xl tracking-[1em]" value={otp} onChange={e => setOtp(e.target.value)} />
                            <Button className="w-full h-12 text-lg font-bold" onClick={handleVerifyAndComplete} disabled={loading || otp.length !== 6}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Complete"}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setShowOtpInput(false)} disabled={loading}>Change Phone Number</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* DOM Stability: Placed at the very bottom and NEVER hidden */}
            <div id="recaptcha-container"></div>
        </div>
    );
}
