
"use client";

import { useState, useEffect, useRef } from "react";
import { useUserData } from "@/context/user-data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth, useFirestore, useStorage } from "@/firebase";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateUserDocument } from "@/firebase/firestore/firestore-service";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Mail, Home, MapPin, Loader2, LogOut, Save, Phone } from "lucide-react";

export default function ProfilePage() {
    const { user, userData, loading: userLoading } = useUserData();
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const { toast } = useToast();

    // Standardized fields to match registry/signup
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [barangay, setBarangay] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userData) {
            setFullName(userData.fullName || "");
            setPhoneNumber(userData.phoneNumber || "");
            setStreetAddress(userData.streetAddress || "");
            setBarangay(userData.barangay || "");
            setCity(userData.city || "");
            setProvince(userData.province || "");
            setZipCode(userData.zipCode || "");
            setPhotoURL(userData.photoURL || null);
        }
    }, [userData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoURL(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            let finalPhotoURL = photoURL;

            if (selectedFile) {
                const storageRef = ref(storage, `users/${user.uid}/profile`);
                const uploadResult = await uploadBytes(storageRef, selectedFile);
                finalPhotoURL = await getDownloadURL(uploadResult.ref);
            }

            await updateUserDocument(firestore, user.uid, {
                fullName: fullName.trim().toUpperCase(),
                phoneNumber: phoneNumber.trim(),
                streetAddress: streetAddress.trim().toUpperCase(),
                barangay: barangay.trim().toUpperCase(),
                city: city.trim().toUpperCase(),
                province: province.trim().toUpperCase(),
                zipCode: zipCode.trim(),
                photoURL: finalPhotoURL,
            });

            toast({ 
                title: "Profile Updated", 
                description: "Your changes have been saved successfully." 
            });
        } catch (error: any) {
            console.error("Save error:", error);
            toast({ 
                variant: "destructive", 
                title: "Update Failed", 
                description: error.message 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    }

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <div className="bg-card p-6 md:p-8 border-b shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-tight">Member Profile</h1>
                        <p className="mt-1 text-sm text-muted-foreground font-medium">Manage your personal information and party credentials.</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="text-destructive hover:bg-destructive/5 border-destructive/20 font-bold uppercase text-[10px] tracking-widest">
                        <LogOut className="mr-2 h-3 w-3" /> Sign Out
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
                    {/* Left Column: Photo & Brief Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary text-primary-foreground text-center pb-8 pt-10 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10">
                                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                        <pattern id="grid-profile" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                                        </pattern>
                                        <rect width="100%" height="100%" fill="url(#grid-profile)" />
                                    </svg>
                                </div>
                                <div className="relative inline-block z-10">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-background mx-auto">
                                        <AvatarImage src={photoURL || ""} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-4xl font-bold">
                                            {fullName?.charAt(0) || <User className="h-16 w-16" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-accent text-accent-foreground rounded-full shadow-lg hover:bg-accent/90 transition-colors"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="mt-4 relative z-10">
                                    <h2 className="text-xl font-black uppercase tracking-tight">{fullName || 'MEMBER NAME'}</h2>
                                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                                        {userData?.role || 'Supporter'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 text-primary" />
                                        <span className="truncate font-medium">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{phoneNumber || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{city || 'National HQ'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-primary/5 p-4 rounded-lg border border-dashed border-primary/20">
                            <h3 className="text-xs font-black uppercase text-primary tracking-widest mb-2">Registry Note</h3>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                Maintaining accurate residential information is critical for regional mobilization and leadership auditing. Updates made here are reflected instantly in the National Registry.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Form Fields */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-xl border-t-4 border-primary">
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2 uppercase tracking-tight">
                                    <User className="h-5 w-5 text-primary" />
                                    Account Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-primary">Full Name</Label>
                                        <Input 
                                            id="fullName" 
                                            value={fullName} 
                                            onChange={e => setFullName(e.target.value.toUpperCase())} 
                                            placeholder="YOUR COMPLETE NAME"
                                            required
                                            className="h-11 font-bold uppercase"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phoneNumber" className="text-[10px] font-black uppercase tracking-widest text-primary">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="phoneNumber" 
                                                value={phoneNumber} 
                                                onChange={e => setPhoneNumber(e.target.value)} 
                                                placeholder="+639..."
                                                className="pl-10 h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="province" className="text-[10px] font-black uppercase tracking-widest text-primary">Province / Region</Label>
                                            <Input 
                                                id="province" 
                                                value={province} 
                                                onChange={e => setProvince(e.target.value.toUpperCase())} 
                                                placeholder="Province"
                                                className="h-11 uppercase font-bold"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-primary">City / Municipality</Label>
                                            <Input 
                                                id="city" 
                                                value={city} 
                                                onChange={e => setCity(e.target.value.toUpperCase())} 
                                                placeholder="City"
                                                className="h-11 uppercase font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="barangay" className="text-[10px] font-black uppercase tracking-widest text-primary">Barangay</Label>
                                            <Input 
                                                id="barangay" 
                                                value={barangay} 
                                                onChange={e => setBarangay(e.target.value.toUpperCase())} 
                                                placeholder="Barangay"
                                                className="h-11 uppercase font-bold"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest text-primary">Zip Code</Label>
                                            <Input 
                                                id="zipCode" 
                                                value={zipCode} 
                                                onChange={e => setZipCode(e.target.value)} 
                                                placeholder="0000"
                                                className="h-11 font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="streetAddress" className="text-[10px] font-black uppercase tracking-widest text-primary">Street Address / House No.</Label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="streetAddress" 
                                                value={streetAddress} 
                                                onChange={e => setStreetAddress(e.target.value.toUpperCase())} 
                                                placeholder="Block No., Street Name, Phase"
                                                className="pl-10 h-11 uppercase font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t pt-6">
                                <Button type="submit" className="w-full md:w-auto h-12 px-10 text-lg font-black uppercase tracking-widest shadow-lg" disabled={saving}>
                                    {saving ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Registry...</>
                                    ) : (
                                        <><Save className="mr-2 h-5 w-5" /> Update Member Profile</>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </form>
            </div>
        </div>
    );
}
