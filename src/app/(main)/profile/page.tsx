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
import { Camera, User, Mail, Home, MapPin, Loader2, LogOut, Save } from "lucide-react";

export default function ProfilePage() {
    const { user, userData, loading: userLoading } = useUserData();
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = useStorage();
    const router = useRouter();
    const { toast } = useToast();

    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
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
            setAddress(userData.address || "");
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
                address: address.trim(),
                city: city.trim(),
                province: province.trim(),
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
                        <h1 className="text-3xl font-bold font-headline text-primary">Member Profile</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Manage your personal information and credentials.</p>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="text-destructive hover:bg-destructive/5 border-destructive/20">
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Photo & Brief Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 text-center pb-8 pt-10">
                                <div className="relative inline-block">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-background mx-auto">
                                        <AvatarImage src={photoURL || ""} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-4xl font-bold">
                                            {fullName?.charAt(0) || <User className="h-16 w-16" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="mt-4">
                                    <h2 className="text-xl font-bold text-primary uppercase">{fullName || 'MEMBER NAME'}</h2>
                                    <p className="text-xs font-bold text-accent-foreground/60 uppercase tracking-widest">
                                        {userData?.role || 'Supporter'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 text-primary" />
                                        <span className="truncate">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{city || 'No City'}, {province || 'No Province'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                            <h3 className="text-xs font-black uppercase text-accent-foreground tracking-widest mb-2">Member Note</h3>
                            <p className="text-xs text-accent-foreground/80 leading-relaxed">
                                Updating your address and photo helps us coordinate local LEADCON events and community actions in your area.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Form Fields */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-xl border-t-4 border-primary">
                            <CardHeader>
                                <CardTitle className="text-xl font-headline flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Account Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                                        <Input 
                                            id="fullName" 
                                            value={fullName} 
                                            onChange={e => setFullName(e.target.value.toUpperCase())} 
                                            placeholder="YOUR COMPLETE NAME"
                                            required
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Street Address</Label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="address" 
                                                value={address} 
                                                onChange={e => setAddress(e.target.value)} 
                                                placeholder="Block, Street, Barangay"
                                                className="pl-10 h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City / Municipality</Label>
                                            <Input 
                                                id="city" 
                                                value={city} 
                                                onChange={e => setCity(e.target.value)} 
                                                placeholder="City"
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="province" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Province</Label>
                                            <Input 
                                                id="province" 
                                                value={province} 
                                                onChange={e => setProvince(e.target.value)} 
                                                placeholder="Province"
                                                className="h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="zipCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zip Code</Label>
                                        <Input 
                                            id="zipCode" 
                                            value={zipCode} 
                                            onChange={e => setZipCode(e.target.value)} 
                                            placeholder="0000"
                                            className="h-11 w-1/2"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/30 border-t pt-6">
                                <Button type="submit" className="w-full md:w-auto h-12 px-10 text-lg font-bold shadow-lg" disabled={saving}>
                                    {saving ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Changes...</>
                                    ) : (
                                        <><Save className="mr-2 h-5 w-5" /> Update Profile</>
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
