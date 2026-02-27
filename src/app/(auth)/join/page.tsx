"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Phone, Loader2, Mail, Lock, User, Home as HomeIcon, Camera, X } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

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
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("+63");
    
    // Photo State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
    }, [auth]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setSelectedFile(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agreed) {
            toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the PDDS Kartilya principles." });
            return;
        }

        if (phoneNumber.length < 10) {
            toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid phone number." });
            return;
        }

        setLoading(true);
        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Step 3: Handle Photo Upload if any
            let finalPhotoURL = null;
            if (selectedFile) {
                try {
                    const storageRef = ref(storage, `users/${user.uid}/profile`);
                    const uploadResult = await uploadBytes(storageRef, selectedFile);
                    finalPhotoURL = await getDownloadURL(uploadResult.ref);
                } catch (storageError) {
                    console.error("Storage upload failed:", storageError);
                    // Continue registration even if photo fails
                }
            }

            // Step 4: Send Email Verification
            await sendEmailVerification(user);

            // Step 5: Save to Firestore
            const supporterData = {
                uid: user.uid,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber,
                address: address.trim(),
                city: city.trim(),
                province: province.trim(),
                zipCode: zipCode.trim(),
                photoURL: finalPhotoURL,
                role: "Supporter",
                jurisdictionLevel: "City/Municipal",
                assignedLocation: city.trim() || province.trim() || "National",
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

            <Card className="w-full max-w-lg shadow-2xl border-t-4 border-primary">
                {!showOtpInput ? (
                    <form onSubmit={handleInitialSubmit}>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center font-headline">Supporter Registration</CardTitle>
                            <CardDescription className="text-center">Secure your place in the Federalismo ng Dugong Dakilang Samahan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Photo Upload Section */}
                            <div className="flex flex-col items-center gap-3 pb-4 border-b">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Upload Profile Photo (Optional)
                                </Label>
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-muted">
                                        <AvatarImage src={photoPreview || ""} className="object-cover" />
                                        <AvatarFallback><Camera className="h-8 w-8 text-muted-foreground/40" /></AvatarFallback>
                                    </Avatar>
                                    {photoPreview && (
                                        <button 
                                            type="button" 
                                            onClick={removePhoto}
                                            className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                    disabled={loading}
                                />
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

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="password" data-mask-password="true" className="pl-9" type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} disabled={loading} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="phoneNumber" className="pl-9" placeholder="+639123456789" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} disabled={loading} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative">
                                    <HomeIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="address" className="pl-10" placeholder="Street, Barangay" required value={address} onChange={e => setAddress(e.target.value)} disabled={loading} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="City" required value={city} onChange={e => setCity(e.target.value)} disabled={loading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province">Province</Label>
                                    <Input id="province" placeholder="Province" required value={province} onChange={e => setProvince(e.target.value)} disabled={loading} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zipCode">Zip Code</Label>
                                <Input id="zipCode" placeholder="0000" required value={zipCode} onChange={e => setZipCode(e.target.value)} disabled={loading} />
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
