
"use client";

import { useState, useRef } from "react";
import { useFirestore, useUser, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Loader2, Send, ShieldAlert, Image as ImageIcon, CheckCircle2, Navigation } from "lucide-react";
import { cityCoords } from "@/lib/data";

/**
 * @fileOverview Bantay Bayan - Issue Submission Form.
 * Handles photo evidence upload and precision GPS tagging with jurisdictional fallback.
 */
export function BantayBayanForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /**
   * Resilient Location Acquisition
   * Attempts GPS but falls back to user city if denied.
   */
  const getLocation = (): Promise<{ lat: number, lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(getFallbackCoords());
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          toast({ 
            title: "GPS Restricted", 
            description: "Falling back to city-based tagging.",
            variant: "default"
          });
          resolve(getFallbackCoords());
        },
        { timeout: 5000 }
      );
    });
  };

  const getFallbackCoords = () => {
    const city = (userData?.city || "").toUpperCase();
    const coords = cityCoords[city];
    if (coords) return { lat: coords[0], lng: coords[1] };
    return { lat: 14.5995, lng: 120.9842 }; // Manila default
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !selectedFile) {
      toast({ variant: "destructive", title: "Evidence Required", description: "Please upload a photo of the issue." });
      return;
    }

    setLoading(true);

    try {
      // 1. Get Coordinates (Resilient)
      const location = await getLocation();

      // 2. Upload Evidence to Storage
      const storageRef = ref(storage, `civic_reports/${user.uid}/${Date.now()}.jpg`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const photoUrl = await getDownloadURL(uploadResult.ref);

      // 3. Save Report to Firestore
      const reportData = {
        uid: user.uid,
        authorName: userData.fullName,
        title: title.trim().toUpperCase(),
        category,
        description: description.trim(),
        photoUrl,
        location,
        city: userData.city,
        province: userData.province,
        status: "Pending",
        upvotes: [],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(firestore, "civic_reports"), reportData);
      
      toast({ 
        title: "Report Documented", 
        description: "Your entry has been logged in the National Accountability Ledger.",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-2xl border-t-4 border-red-700">
      <form onSubmit={handleSubmit}>
        <CardHeader className="bg-red-50/50 border-b">
          <CardTitle className="text-xl font-headline font-black text-red-800 uppercase flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Bantay Bayan Submission
          </CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-tight text-red-900/60">
            Precision Issue Documentation Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary">Concern Title</Label>
              <Input 
                placeholder="e.g. UNFINISHED ROAD WORKS" 
                value={title} 
                onChange={e => setTitle(e.target.value.toUpperCase())}
                className="h-12 border-2 font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-primary">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Infrastructure" className="font-bold">INFRASTRUCTURE</SelectItem>
                  <SelectItem value="Environment" className="font-bold">ENVIRONMENT (TRASH/WASTE)</SelectItem>
                  <SelectItem value="Corruption" className="font-bold">CORRUPTION (WATCHDOG)</SelectItem>
                  <SelectItem value="Public Safety" className="font-bold">PUBLIC SAFETY</SelectItem>
                  <SelectItem value="Others" className="font-bold">OTHERS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary">Evidence Upload (Mandatory)</Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-red-200 rounded-xl p-8 text-center cursor-pointer hover:bg-red-50 transition-all bg-white relative overflow-hidden"
            >
              {previewUrl ? (
                <img src={previewUrl} className="max-h-48 mx-auto rounded-lg shadow-lg" alt="Evidence Preview" />
              ) : (
                <div className="space-y-2">
                  <Camera className="h-10 w-10 mx-auto text-red-300" />
                  <p className="text-[10px] font-black uppercase text-red-400">Capture Issue Photo</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary">Detailed Account</Label>
            <Textarea 
              placeholder="Describe the issue, its impact, and exact location markers..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[120px] border-2 text-sm leading-relaxed"
              required
            />
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-3">
            <Navigation className="h-5 w-5 text-primary" />
            <p className="text-[9px] font-black uppercase text-primary/60 leading-tight">
              Reports are auto-tagged via GPS or Jurisdictional Fallback for verification.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t pt-6">
          <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-red-700 hover:bg-red-800" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Logged Signal...</>
            ) : (
              <><Send className="mr-2 h-6 w-6" /> Deploy Civic Report</>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
