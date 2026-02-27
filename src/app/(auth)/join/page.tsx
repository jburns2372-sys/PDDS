
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Phone, Loader2, Mail, Lock, User, Home as HomeIcon, Camera, X, Check, MapPin, Eye, EyeOff } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

const NCR_CODE = "130000000";

export default function JoinPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const { toast } = useToast();
    
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

    // UI State
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [agreed, setAgreed] = useState(false);

    // Fetch Provinces on Load (Plus NCR Fix)
    useEffect(() => {
        const fetchProvincesAndNCR = async () => {
            try {
                // Fetch regular provinces
                const pResp = await fetch('https://psgc.gitlab.io/api/provinces/');
                const pData = await pResp.json();
                
                // Fetch NCR specifically from regions
                const ncrResp = await fetch(`https://psgc.gitlab.io/api/regions/${NCR_CODE}`);
                const ncrData = await ncrResp.json();
                
                const combined = [
                    { ...ncrData, name: "METRO MANILA (NCR)", isNCR: true },
                    ...pData
                ].sort((a: any, b: any) => a.name.localeCompare(b.name));
                
                setProvinces(combined);
            } catch (error) {
                console.error("Error fetching provinces:", error);
                toast({ variant: "destructive", title: "Location Error", description: "Failed to load provinces. Please refresh." });
            }
        };
        fetchProvincesAndNCR();
    }, [toast]);

    // Fetch Cities when Province Changes
    useEffect(() => {
        if (!selectedProvince) {
            setCities([]);
            return;
        }
        const fetchCities = async () => {
            try {
                const province = provinces.find(p => p.name === selectedProvince);
                if (province) {
                    // Use NCR regions endpoint for Metro Manila, otherwise use provinces endpoint
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
        setSelectedCity("");
        setSelectedBarangay("");
    }, [selectedProvince, provinces]);

    // Fetch Barangays when City Changes
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
        setSelectedBarangay("");
    }, [selectedCity, cities]);

    useEffect(() => {
        if (typeof window !== "undefined" && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
        return () => {
            stopCamera();
        };
    }, [auth]);

    // Camera Logic
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
                description: 'Please enable camera permissions or upload a file manually.',
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
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setIsCameraOpen(false);
        }
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agreed) {
            toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the PDDS Kartilya principles." });
            return;
        }

        const phoneTrimmed = phoneNumber.trim();
        if (phoneTrimmed.length < 10) {
            toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid phone number." });
            return;
        }

        if (!selectedProvince || !selectedCity || !selectedBarangay) {
            toast({ variant: "destructive", title: "Incomplete Address", description: "Please select your Province, City, and Barangay." });
            return;
        }

        setLoading(true);
        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneTrimmed, appVerifier);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "SMS Sent", description: "Verification code sent to your phone." });
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "SMS Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndComplete = async () => {
        if (!confirmationResult || otp.length !== 6) {
            toast({ variant: "destructive", title: "Error", description: "Please enter the 6-digit code." });
            return;
        }

        setLoading(true);
        try {
            // Step 1: Verify OTP
            await confirmationResult.confirm(otp);
            
            // Step 2: Create Email/Password account
            const trimmedEmail = email.trim().toLowerCase();
            const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            const user = userCredential.user;

            // Step 3: Handle Photo Upload
            let finalPhotoURL = null;
            if (selectedFile) {
                try {
                    const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                    const uploadResult = await uploadBytes(storageRef, selectedFile);
                    finalPhotoURL = await getDownloadURL(uploadResult.ref);
                } catch (storageError) {
                    console.error("Storage upload failed:", storageError);
                }
            }

            // Step 4: Send Email Verification
            await sendEmailVerification(user);

            // Step 5: Save to Firestore
            const supporterData = {
                uid: user.uid,
                email: trimmedEmail,
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                barangay: selectedBarangay,
                city: selectedCity,
                province: selectedProvince,
                zipCode: zipCode.trim(),
                photoURL: finalPhotoURL,
                role: "Supporter",
                jurisdictionLevel: "City/Municipal",
                assignedLocation: selectedCity,
                isApproved: true,
                isVerified: true,
                isEmailVerified: false,
                isPhoneVerified: true,
                kartilyaAgreed: true,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", user.uid), supporterData);

            toast({ 
                title: "Welcome to PDDS!", 
                description: "Account created. Please check your email for a verification link." 
            });
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
            <div id="recaptcha-container"></div>
            
            <div className="mb-8 flex items-center gap-4">
                <PddsLogo className="h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold tracking-tighter text-primary font-headline">
                    Join the Movement
                </h1>
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-t-4 border-primary overflow-hidden">
                {!showOtpInput ? (
                    <form onSubmit={handleInitialSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline">Supporter Registration</CardTitle>
                            <CardDescription className="text-center">Secure your place in the Federalismo ng Dugong Dakilang Samahan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Photo & Camera Section */}
                            <div className="flex flex-col items-center gap-4 pb-6 border-b">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Profile Photo (Optional)
                                </Label>
                                
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-muted">
                                        <AvatarImage src={photoPreview || ""} className="object-cover" />
                                        <AvatarFallback><Camera className="h-10 w-10 text-muted-foreground/30" /></AvatarFallback>
                                    </Avatar>
                                    {photoPreview && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setSelectedFile(null); setPhotoPreview(null); }}
                                            className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {isCameraOpen ? (
                                    <div className="w-full space-y-3">
                                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-inner">
                                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                            {hasCameraPermission === false && (
                                                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                                    <Alert variant="destructive">
                                                        <AlertTitle>Camera Access Required</AlertTitle>
                                                        <AlertDescription>Please enable camera access or use file upload.</AlertDescription>
                                                    </Alert>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" onClick={capturePhoto} className="flex-1 font-bold">
                                                <Check className="mr-2 h-4 w-4" /> Capture Selfie
                                            </Button>
                                            <Button type="button" variant="outline" onClick={stopCamera}>
                                                Cancel
                                            </Button>
                                        </div>
                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={startCamera} className="font-bold">
                                            <Camera className="mr-2 h-4 w-4" /> 
                                            {photoPreview ? "Retake Photo" : "Open Camera"}
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            Upload File
                                        </Button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleFileChange} 
                                            disabled={loading}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="fullName" 
                                            className="pl-9" 
                                            placeholder="JUAN DELA CRUZ" 
                                            required 
                                            value={fullName} 
                                            onChange={e => setFullName(e.target.value.toUpperCase())} 
                                            disabled={loading} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="email" className="pl-9" type="email" placeholder="juan@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="password" 
                                            className="pl-9 pr-9" 
                                            type={showPassword ? "text" : "password"} 
                                            required 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            minLength={6} 
                                            disabled={loading} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="phoneNumber" className="pl-9" placeholder="+639123456789" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} disabled={loading} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Residence Information</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Province / Region</Label>
                                        <Select onValueChange={setSelectedProvince} value={selectedProvince}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Province" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {provinces.map((p) => (
                                                    <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City / Municipality</Label>
                                        <Select 
                                            onValueChange={setSelectedCity} 
                                            value={selectedCity}
                                            disabled={!selectedProvince}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={!selectedProvince ? "Select Province First" : "Select City"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.map((c) => (
                                                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Barangay</Label>
                                        <Select 
                                            onValueChange={setSelectedBarangay} 
                                            value={selectedBarangay}
                                            disabled={!selectedCity}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={!selectedCity ? "Select City First" : "Select Barangay"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {barangays.map((b) => (
                                                    <SelectItem key={b.code} value={b.name}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode">Zip Code</Label>
                                        <Input id="zipCode" placeholder="0000" required value={zipCode} onChange={e => setZipCode(e.target.value)} disabled={loading} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="streetAddress">Street Address / House No.</Label>
                                    <Input 
                                        id="streetAddress" 
                                        placeholder="Block No., Street Name, Phase" 
                                        required 
                                        value={streetAddress} 
                                        onChange={e => setStreetAddress(e.target.value.toUpperCase())} 
                                        disabled={loading} 
                                    />
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <Checkbox 
                                    id="terms" 
                                    checked={agreed} 
                                    onCheckedChange={(checked) => setAgreed(checked === true)} 
                                    disabled={loading}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="terms"
                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        I agree to the PDDS Kartilya and its principles of batas at katarungan.
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-lg font-bold" 
                                disabled={loading || !agreed}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                ) : "Register"}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                                Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                            </p>
                        </CardFooter>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        <CardHeader className="px-0">
                            <CardTitle className="text-2xl text-center font-headline">Verify OTP</CardTitle>
                            <CardDescription className="text-center">Enter the 6-digit code sent to {phoneNumber}</CardDescription>
                        </CardHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">6-Digit Code</Label>
                                <Input 
                                    id="otp" 
                                    placeholder="000000" 
                                    maxLength={6} 
                                    className="text-center text-2xl tracking-[1em] h-14"
                                    value={otp} 
                                    onChange={e => setOtp(e.target.value)} 
                                />
                            </div>
                            <Button 
                                className="w-full h-12 text-lg font-bold" 
                                onClick={handleVerifyAndComplete}
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                                ) : "Confirm & Complete"}
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full" 
                                onClick={() => setShowOtpInput(false)}
                                disabled={loading}
                            >
                                Change Phone Number
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
