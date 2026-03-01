
"use client";

import { useState, useRef } from "react";
import { useFirestore, useUser, useStorage } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Send, Globe, Loader2, Sparkles, ShieldCheck, Library, Upload, FileText, Image as ImageIcon } from "lucide-react";

/**
 * @fileOverview PRO Official Broadcast & Asset Center.
 * Handles the publication of official party announcements and tactical asset library management.
 */
export default function ProBulletinPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { userData } = useUserData();
  const { toast } = useToast();

  // Announcement State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("National");
  const [isPublishing, setIsPublishing] = useState(false);

  // Asset Manager State
  const [assetName, setAssetName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Incomplete Fields", description: "Please provide a headline and body content." });
      return;
    }

    setIsPublishing(true);
    const announcementData = {
      title: title.trim(),
      message: message.trim(),
      targetGroup: targetGroup,
      status: "published",
      authorName: userData?.fullName || "PRO Office",
      authorRole: userData?.role || "PRO",
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, "announcements"), announcementData);
      
      toast({ 
        title: "Update Published!", 
        description: `Your announcement is now live for: ${targetGroup}` 
      });
      
      setTitle("");
      setMessage("");
      setTargetGroup("National");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Publication Failed", description: error.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAssetUpload = async () => {
    if (!selectedFile || !assetName) {
      toast({ variant: "destructive", title: "Missing Asset Data", description: "Please name your asset and select a file." });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Tactical Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${assetName.replace(/\s+/g, '-').toLowerCase()}.${fileExt}`;
      const storageRef = ref(storage, `vault_files/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Share via National Vault
      await addDoc(collection(firestore, 'vault'), {
        title: assetName.trim().toUpperCase(),
        description: `Official shared asset published by PRO: ${userData?.fullName || 'National HQ'}`,
        fileUrl: downloadURL,
        fileType: selectedFile.type,
        uploadedBy: "Public Relations Officer",
        targetAudience: ["All Members"],
        createdAt: serverTimestamp()
      });

      toast({ 
        title: "Asset Shared!", 
        description: `"${assetName}" is now available in the National Vault for all members.` 
      });
      
      setAssetName("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({ variant: "destructive", title: "Asset Upload Failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-red-700 text-white rounded-lg shadow-xl">
            <Megaphone className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline uppercase tracking-tight">Broadcast & Media Center</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">Official PRO Terminal for directives and tactical assets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Console: Announcements */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="shadow-xl border-t-4 border-red-700 overflow-hidden">
              <form onSubmit={handlePublish}>
                <CardHeader className="bg-red-50/50 border-b">
                  <CardTitle className="text-lg font-headline flex items-center gap-2 text-red-800">
                    <ShieldCheck className="h-5 w-5" />
                    Official Press Release
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                    Pushes a news alert to the National Bulletin feed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Hub</Label>
                    <Select value={targetGroup} onValueChange={setTargetGroup}>
                      <SelectTrigger className="h-12 border-2">
                        <SelectValue placeholder="Select Scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="National" className="font-bold uppercase text-[10px]">National (All Members)</SelectItem>
                        <SelectItem value="Quezon City" className="font-bold uppercase text-[10px]">Quezon City Hub</SelectItem>
                        <SelectItem value="Manila" className="font-bold uppercase text-[10px]">Manila Hub</SelectItem>
                        <SelectItem value="Cebu" className="font-bold uppercase text-[10px]">Cebu Hub</SelectItem>
                        <SelectItem value="Davao" className="font-bold uppercase text-[10px]">Davao Hub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Headline</Label>
                    <Input 
                      placeholder="e.g. NEW FEDERALISM ROADMAP RELEASED" 
                      className="h-12 font-bold text-lg border-2"
                      value={title}
                      onChange={e => setTitle(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Body Content</Label>
                    <Textarea 
                      placeholder="Detailed party update..." 
                      className="min-h-[200px] text-base font-medium leading-relaxed border-2"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-red-700 hover:bg-red-800"
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Distributing...</>
                    ) : (
                      <><Send className="mr-2 h-6 w-6" /> Publish Official Update</>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Sidebar: Asset Library & Strategy */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Asset Manager Card */}
            <Card className="shadow-xl border-t-4 border-emerald-600 bg-emerald-50/10">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-emerald-800">
                  <Library className="h-5 w-5" />
                  Tactical Asset Manager
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                  Upload official posters and roadmaps to the shared library.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-700">Material Name</Label>
                  <Input 
                    placeholder="e.g. FEDERALISM Q&A POSTER" 
                    className="h-11 font-bold border-emerald-200"
                    value={assetName}
                    onChange={e => setAssetName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-emerald-700">File Selection</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center cursor-pointer hover:bg-emerald-50 transition-all bg-white"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        {selectedFile.type.includes('image') ? <ImageIcon className="h-6 w-6 text-emerald-600" /> : <FileText className="h-6 w-6 text-emerald-600" />}
                        <span className="text-xs font-bold truncate max-w-[150px]">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 mx-auto text-emerald-400" />
                        <p className="text-[10px] font-black uppercase text-emerald-500">Select Image or PDF</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAssetUpload}
                  disabled={isUploading || !selectedFile || !assetName}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest shadow-lg"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Deploy to Library
                </Button>
              </CardContent>
            </Card>

            {/* Strategy Note */}
            <Card className="shadow-lg border-l-4 border-l-accent bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  PRO Strategy Note
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 italic text-xs text-muted-foreground leading-relaxed">
                "Materials uploaded to the Library are automatically archived in the Document Vault. Use the Bulletin for text updates and the Asset Manager for high-impact visual directives."
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-primary bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                  <Globe className="h-4 w-4" />
                  Network Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex justify-between py-2 border-b border-primary/10 text-[10px] font-bold uppercase">
                  <span>Target Range</span>
                  <Badge variant="outline" className="text-[9px] font-black text-primary border-primary/20">{targetGroup}</Badge>
                </div>
                <div className="flex justify-between py-2 text-[10px] font-bold uppercase">
                  <span>Encryption</span>
                  <span className="text-green-600 font-black">Active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
