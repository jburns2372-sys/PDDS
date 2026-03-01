
"use client";

import { useState, useMemo, useRef } from "react";
import { useUserData } from "@/context/user-data-context";
import { useCollection, useFirestore, useStorage } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Library, 
  FileText, 
  FileDown, 
  Plus, 
  Loader2, 
  ShieldCheck, 
  Search, 
  Image as ImageIcon, 
  File as FileIcon,
  ExternalLink,
  Lock
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ROLES_FOR_TARGETING = [
  "All Members",
  "President",
  "Officer",
  "Admin",
  "Supporter",
  "Member"
];

export default function DocumentVaultPage() {
  const { userData } = useUserData();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  // Data Stream
  const { data: documents, loading: docsLoading } = useCollection('vault');

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string[]>(["All Members"]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Privileged roles recognized for vault management
  const hasExecutiveAccess = 
    userData?.role === 'President' || 
    userData?.role === 'Admin' || 
    userData?.role === 'Public Relations Officer' || 
    userData?.isSuperAdmin;

  // RBAC Filtering & Search
  const visibleDocs = useMemo(() => {
    if (!userData) return [];
    return documents.filter(doc => {
      const audience = doc.targetAudience || [];
      const matchesRole = audience.includes("All Members") || audience.includes(userData.role) || hasExecutiveAccess;
      const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [documents, userData, hasExecutiveAccess, searchTerm]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Title and File are required." });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}.${fileExt}`;
      const storageRef = ref(storage, `vault_files/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Save Metadata to Firestore
      await addDoc(collection(firestore, 'vault'), {
        title: title.trim().toUpperCase(),
        description: description.trim(),
        fileUrl: downloadURL,
        fileType: selectedFile.type,
        uploadedBy: userData?.role || "Admin",
        targetAudience: selectedAudience,
        createdAt: serverTimestamp()
      });

      toast({ title: "Material Uploaded", description: "The document is now live in the Secure Vault." });
      setIsOpen(false);
      // Reset form
      setTitle(""); setDescription(""); setSelectedAudience(["All Members"]); setSelectedFile(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAudience = (role: string) => {
    setSelectedAudience(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const getFileIcon = (type: string) => {
    if (!type) return <FileIcon className="h-8 w-8 text-primary" />;
    if (type.includes('pdf')) return <FileText className="h-8 w-8 text-destructive" />;
    if (type.includes('image')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    return <FileIcon className="h-8 w-8 text-primary" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-card p-6 md:p-8 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
              National Tactical Library
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Access official party posters, directives, policies, and operational materials.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10 w-64 bg-background" 
                placeholder="Search tactical assets..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {hasExecutiveAccess && (
              <Dialog open={isModalOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="h-14 px-8 font-black uppercase tracking-widest shadow-xl rounded-xl">
                    <Plus className="mr-2 h-5 w-5" />
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <form onSubmit={handleUpload}>
                    <DialogHeader>
                      <DialogTitle className="font-headline text-xl flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Deposit Secure Material
                      </DialogTitle>
                      <DialogDescription>
                        Distribute documents to specific organizational tiers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Material Name</Label>
                        <Input placeholder="e.g. 2025 Campaign Handbook" value={title} onChange={e => setTitle(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>File Selection</Label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors bg-white"
                        >
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-2">
                              {getFileIcon(selectedFile.type)}
                              <span className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <FileDown className="h-8 w-8 mx-auto text-muted-foreground" />
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Select PDF or Image Asset</p>
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
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {ROLES_FOR_TARGETING.map(role => (
                            <div key={role} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`vault-role-${role}`} 
                                checked={selectedAudience.includes(role)} 
                                onCheckedChange={() => toggleAudience(role)} 
                              />
                              <label htmlFor={`vault-role-${role}`} className="text-xs font-bold uppercase">{role}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Brief Description</Label>
                        <Textarea placeholder="What is this document for?" value={description} onChange={e => setDescription(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full font-black uppercase tracking-widest h-12" disabled={isUploading || !selectedFile}>
                        {isUploading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Deploy to Vault"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10 bg-card" 
              placeholder="Search tactical assets..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {docsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Decrypting Tactical Files...</p>
          </div>
        ) : visibleDocs.length === 0 ? (
          <Card className="p-24 text-center border-dashed bg-muted/20">
            <div className="flex flex-col items-center gap-4">
              <Library className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No materials found in your clearance level.</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleDocs.map((doc: any) => (
              <Card key={doc.id} className="group shadow-lg border-t-4 border-t-primary hover:shadow-xl transition-all flex flex-col">
                <CardHeader className="bg-primary/5 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white">
                      {doc.uploadedBy || "National HQ"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-headline uppercase font-black text-primary leading-tight group-hover:text-accent transition-colors">
                    {doc.title}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">
                    Added: {doc.createdAt ? format(doc.createdAt.toDate(), 'PPP') : 'Recently'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium italic">
                    "{doc.description || "Official party material for verified personnel. Maintain operational security."}"
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {doc.targetAudience?.slice(0, 3).map((aud: string) => (
                      <Badge key={aud} variant="secondary" className="text-[8px] font-bold uppercase py-0 px-1.5 opacity-60">
                        {aud}
                      </Badge>
                    ))}
                    {doc.targetAudience?.length > 3 && (
                      <Badge variant="secondary" className="text-[8px] font-bold uppercase py-0 px-1.5 opacity-60">
                        +{doc.targetAudience.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t pt-4">
                  <Button asChild className="w-full font-black uppercase tracking-widest h-11 shadow-md">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Access Material
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="bg-primary text-primary-foreground p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
          <Lock className="h-3 w-3" />
          End-to-End Encrypted Tactical Storage
        </div>
      </div>
    </div>
  );
}
