
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PddsLogo from "@/components/icons/pdds-logo";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { MapPin, Phone, CheckCircle2, Loader2 } from "lucide-react";

export default function JoinPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [location, setLocation] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("+63");
    const [otp, setOtp] = useState("");
    const [agreed, setAgreed] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [smsLoading, setSmsLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);

    useEffect(() => {
        // Initialize reCAPTCHA
        if (typeof window !== "undefined") {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
    }, [auth]);

    const handleDetectLocation = async () => {
        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "Geolocation Error", description: "Geolocation is not supported by your browser." });
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    
                    const city = data.address.city || data.address.town || data.address.village || "";
                    const province = data.address.province || data.address.state || "";
                    const formatted = city && province ? `${city}, ${province}` : (city || province || "Unknown Location");
                    
                    setLocation(formatted);
                    toast({ title: "Location Detected", description: `We found you in ${formatted}` });
                } catch (error) {
                    toast({ variant: "destructive", title: "Lookup Failed", description: "Could not retrieve location details." });
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                toast({ variant: "destructive", title: "Permission Denied", description: "Please enable location access." });
                setLocationLoading(false);
            }
        );
    };

    const handleSendSms = async () => {
        if (phoneNumber.length < 10) {
            toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid phone number." });
            return;
        }

        setSmsLoading(true);
        try {
            const appVerifier = (window as any).recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            setShowOtpInput(true);
            toast({ title: "SMS Sent", description: "Please check your phone for the 6-digit verification code." });
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "SMS Failed", description: error.message });
        } finally {
            setSmsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmationResult || otp.length !== 6) return;

        setOtpLoading(true);
        try {
            await confirmationResult.confirm(otp);
            setIsPhoneVerified(true);
            setShowOtpInput(false);
            toast({ title: "Phone Verified", description: "Your phone number has been successfully verified." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: "Invalid code. Please try again." });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isPhoneVerified) {
            toast({ variant: "destructive", title: "Verification Required", description: "Please verify your phone number first." });
            return;
        }

        if (!agreed) {
            toast({ variant: "destructive", title: "Agreement Required", description: "You must agree to the Kartilya principles." });
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const supporterData = {
                uid: uid,
                email: email.trim().toLowerCase(),
                fullName: fullName.trim(),
                phoneNumber: phoneNumber,
                role: "Supporter",
                jurisdictionLevel: "City/Municipal",
                assignedLocation: location.trim(),
                isApproved: true,
                isVerified: true,
                kartilyaAgreed: true,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, "users", uid), supporterData);

            toast({ title: "Welcome to PDDS!", description: "Your verified supporter account has been created." });
            router.push("/home");
        } catch (error: any) {
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

            <Card className="w-full max-w-md shadow-2xl border-t-4 border-primary">
                <form onSubmit={handleRegister}>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center font-headline">Supporter Registration</CardTitle>
                        <CardDescription className="text-center">Secure your place in the Federalismo ng Dugong Dakilang Samahan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" placeholder="Juan Dela Cruz" required value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="juan@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Phone Number (Verified)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="phoneNumber" 
                                        className="pl-9" 
                                        placeholder="+639123456789" 
                                        value={phoneNumber} 
                                        onChange={e => setPhoneNumber(e.target.value)} 
                                        disabled={isPhoneVerified || smsLoading || loading}
                                    />
                                </div>
                                {!isPhoneVerified && !showOtpInput && (
                                    <Button type="button" onClick={handleSendSms} disabled={smsLoading || loading} variant="outline">
                                        {smsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                    </Button>
                                )}
                                {isPhoneVerified && (
                                    <div className="flex items-center text-green-600 px-3">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {showOtpInput && (
                            <div className="space-y-2 bg-primary/5 p-3 rounded-md border border-primary/10 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="otp">Enter 6-digit Code</Label>
                                <div className="flex gap-2">
                                    <Input id="otp" placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                                    <Button type="button" onClick={handleVerifyOtp} disabled={otpLoading}>
                                        {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="location">Region / City</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        id="location" 
                                        className="pl-9" 
                                        placeholder="City or Province" 
                                        required 
                                        value={location} 
                                        onChange={e => setLocation(e.target.value)} 
                                        disabled={loading}
                                    />
                                </div>
                                <Button type="button" variant="secondary" onClick={handleDetectLocation} disabled={locationLoading || loading}>
                                    {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Detect"}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Create Password</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} disabled={loading} />
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
                            disabled={loading || !isPhoneVerified || !agreed}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing...</>
                            ) : "Register as Supporter"}
                        </Button>
                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
