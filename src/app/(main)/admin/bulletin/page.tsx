
"use client";

import { useState, useRef, useMemo } from "react";
import { useFirestore, useUser, useStorage, useCollection } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import { 
  Megaphone, 
  Send, 
  Globe, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Library, 
  Upload, 
  FileText, 
  Image as ImageIcon,
  CalendarDays,
  MapPin,
  Clock,
  BarChart3,
  Plus,
  X,
  Newspaper,
  LayoutList,
  History,
  CheckCircle2,
  Users,
  GraduationCap,
  PlusCircle,
  FileBadge,
  Navigation,
  FileDown,
  Eye,
  ArrowDownToLine,
  Share2,
  TrendingUp,
  Activity,
  FileSearch
} from "lucide-react";
import { PDDS_LOGO_URL } from "@/lib/data";
import { format } from "date-fns";
import PddsLogo from "@/components/icons/pdds-logo";

/**
 * @fileOverview PRO Official Broadcast & Media Studio.
 * Handles Press Releases, Media Kit, Tactical Event Deployment, Poll Management, Policy Hub, and Accountability Reports.
 */
export default function ProMediaStudioPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { userData } = useUserData();
  const { toast } = useToast();

  // 📊 Analytics Data
  const { data: allUsers } = useCollection('users');
  const { data: policies } = useCollection('policies');
  const { data: reports, loading: reportsLoading } = useCollection('civic_reports');

  // State Management
  const [activeTab, setActiveTab] = useState("war-room");
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Announcement Form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("National");
  const [pushToHub, setPushToHub] = useState(false);

  // Infographic Export
  const infographicRef = useRef<HTMLDivElement>(null);

  // Media Kit Upload
  const [assetTitle, setAssetTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analytics Logic
  const analytics = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const dailyReach = allUsers.filter(u => {
      const lastActive = u.lastActive?.toDate ? u.lastActive.toDate().setHours(0,0,0,0) : 0;
      return lastActive === today;
    }).length;

    const topPolicy = [...policies].sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0))[0];

    return { dailyReach, topPolicy };
  }, [allUsers, policies]);

  // War Room Logic
  const warRoomReports = useMemo(() => {
    return [...reports]
      .filter(r => r.status !== 'Resolved')
      .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));
  }, [reports]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setIsPublishing(true);
    try {
      // 1. Save to Announcements
      const annRef = await addDoc(collection(firestore, "announcements"), {
        title: title.trim().toUpperCase(),
        message: message.trim(),
        targetGroup,
        status: "published",
        authorName: userData?.fullName || "PRO Office",
        timestamp: serverTimestamp(),
      });

      // 2. Optional Hub Push (Global Pin)
      if (pushToHub) {
        await addDoc(collection(firestore, "patriothub_pins"), {
          text: `${title.toUpperCase()}: ${message.substring(0, 100)}...`,
          authorName: userData?.fullName || "PRO Office",
          isActive: true,
          isSystem: true,
          type: "OFFICIAL_DIRECTIVE",
          timestamp: serverTimestamp(),
        });
      }

      toast({ title: "Directive Published", description: pushToHub ? "Alerted all Regional Hubs." : "" });
      setTitle(""); setMessage(""); setPushToHub(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Publish Failed", description: error.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDraftPressRelease = (report: any) => {
    setTitle(`OFFICIAL STATEMENT: ${report.title}`);
    setMessage(`QUEZON CITY, PH — The PDDS National Headquarters has been alerted to a critical community concern in ${report.city}, ${report.province} regarding ${report.category}. 

Over ${report.upvotes?.length || 0} verified citizens have documented this issue through the Bantay Bayan registry. 

[INSERT ACTION PLAN HERE]

Our movement stands for accountability and local empowerment. We call upon the relevant authorities to address this matter with the urgency it deserves.`);
    setActiveTab("announcements");
    toast({ title: "Template Loaded", description: "War Room data synchronized with composer." });
  };

  const handleExportInfographic = async () => {
    if (!infographicRef.current) return;
    try {
      const dataUrl = await toPng(infographicRef.current, { backgroundColor: '#002366', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `PDDS-Infographic-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Infographic Exported" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetTitle) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `media_kit/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(firestore, "vault"), {
        title: assetTitle.toUpperCase(),
        description: "Official Media Kit Asset",
        fileUrl: url,
        fileType: file.type,
        uploadedBy: "PRO Office",
        targetAudience: ["All Members"],
        createdAt: serverTimestamp()
      });

      toast({ title: "Asset Archived", description: "Material added to the National Tactical Library." });
      setAssetTitle("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-primary pb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary text-white rounded-2xl shadow-xl">
              <Megaphone className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tighter">PRO Media Studio</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-red-100 text-red-700 font-black text-[10px] uppercase border-none">Communications Center</Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20">Authorized by National HQ</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <PddsLogo className="h-16 w-auto" />
          </div>
        </div>

        {/* Tactical Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-l-4 border-l-primary bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-xl"><Activity className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Daily Reach</p>
                <p className="text-2xl font-black text-primary">{analytics.dailyReach}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-l-4 border-l-accent bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-accent/5 rounded-xl"><Share2 className="h-6 w-6 text-accent" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Top Viral Policy</p>
                <p className="text-sm font-black text-primary truncate max-w-[150px] uppercase">{analytics.topPolicy?.title || "None"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-l-4 border-l-red-600 bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Grievance Signal</p>
                <p className="text-2xl font-black text-red-600">{warRoomReports.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-l-4 border-l-emerald-600 bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">System Status</p>
                <p className="text-xs font-black text-emerald-600 uppercase">Secure & Online</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="war-room" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <FileSearch className="h-4 w-4 mr-2" /> Bantay Bayan War Room
            </TabsTrigger>
            <TabsTrigger value="announcements" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <Newspaper className="h-4 w-4 mr-2" /> Directive Composer
            </TabsTrigger>
            <TabsTrigger value="media-kit" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <Library className="h-4 w-4 mr-2" /> Media Kit Library
            </TabsTrigger>
          </TabsList>

          {/* WAR ROOM TAB */}
          <TabsContent value="war-room" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-headline text-primary uppercase flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                Community Grievance Monitor
              </h2>
              <Badge className="bg-red-600 text-white font-black text-[9px] uppercase px-3 py-1">REAL-TIME SIGNALS</Badge>
            </div>

            <Card className="shadow-2xl overflow-hidden border-none bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary text-white hover:bg-primary">
                    <TableHead className="text-white font-black uppercase text-[10px] pl-6">Reported Concern</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px]">Location</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px]">Pulse</TableHead>
                    <TableHead className="text-white font-black uppercase text-[10px] text-right pr-6">Tactical Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsLoading ? (
                    <TableRow><TableCell colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                  ) : warRoomReports.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-24 text-center text-muted-foreground italic">No signals detected.</TableCell></TableRow>
                  ) : (
                    warRoomReports.map(report => (
                      <TableRow key={report.id} className="hover:bg-muted/30">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 border">
                              <img src={report.photoUrl} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase text-primary leading-tight">{report.title}</p>
                              <Badge variant="outline" className="text-[8px] font-black uppercase mt-1 border-primary/20">{report.category}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {report.city}, {report.province}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <span className="font-black text-primary">{report.upvotes?.length || 0} Votes</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button size="sm" onClick={() => handleDraftPressRelease(report)} className="h-9 font-black uppercase text-[10px] tracking-widest bg-red-700 hover:bg-red-800">
                            Draft Press Release
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* COMPOSER TAB */}
          <TabsContent value="announcements" className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-t-4 border-red-700 overflow-hidden">
                  <form onSubmit={handlePublish}>
                    <CardHeader className="bg-red-50/50 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg font-headline flex items-center gap-2 text-red-800"><Edit3 className="h-5 w-5" />National Briefing Composer</CardTitle>
                          <CardDescription className="text-[10px] font-black uppercase tracking-widest">Authorized PR Communications Terminal.</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-red-200">
                          <Label className="text-[9px] font-black uppercase text-red-800">Push to PatriotHub</Label>
                          <input type="checkbox" checked={pushToHub} onChange={e => setPushToHub(e.target.checked)} className="h-4 w-4 accent-red-700" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Audience</Label>
                          <Select value={targetGroup} onValueChange={setTargetGroup}>
                            <SelectTrigger className="h-12 border-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="National" className="font-bold uppercase text-[10px]">National Directive</SelectItem>
                              <SelectItem value="QUEZON CITY" className="font-bold uppercase text-[10px]">Quezon City Hub</SelectItem>
                              <SelectItem value="CITY OF MANILA" className="font-bold uppercase text-[10px]">Manila Hub</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Headline</Label>
                          <Input placeholder="e.g. PRESS STATEMENT ON INFRASTRUCTURE" className="h-12 font-bold border-2" value={title} onChange={e => setTitle(e.target.value.toUpperCase())} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Briefing Content</Label>
                        <Textarea placeholder="Type your briefing or press release here..." className="min-h-[300px] text-sm font-medium leading-relaxed border-2" value={message} onChange={e => setMessage(e.target.value)} />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t pt-6 flex flex-col md:flex-row gap-4">
                      <Button type="submit" className="flex-1 h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-red-700 hover:bg-red-800" disabled={isPublishing}>
                        {isPublishing ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Distributing...</> : <><Send className="mr-2 h-6 w-6" /> Publish Official Update</>}
                      </Button>
                      <Button type="button" onClick={handleExportInfographic} variant="outline" className="h-16 px-8 border-2 font-black uppercase text-xs">
                        <FileDown className="mr-2 h-5 w-5" /> Export Infographic
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="shadow-lg border-l-4 border-l-accent bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4 text-accent" />
                      Live Infographic Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div 
                      ref={infographicRef}
                      className="w-full aspect-[4/5] bg-[#002366] rounded-xl p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl"
                    >
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <PddsLogo className="w-full h-full object-contain scale-150" />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <PddsLogo className="h-16 w-auto mx-auto brightness-0 invert" />
                        <div className="h-0.5 w-12 bg-accent mx-auto" />
                        <h3 className="text-center text-xl font-black uppercase leading-tight tracking-tight">
                          {title || "OFFICIAL PRESS STATEMENT"}
                        </h3>
                      </div>
                      <div className="relative z-10 bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] font-medium leading-relaxed line-clamp-12 italic opacity-90">
                          {message || "Crafting the narrative of the movement..."}
                        </p>
                      </div>
                      <div className="relative z-10 border-t border-white/10 pt-4 flex justify-between items-end">
                        <div className="space-y-0.5">
                          <p className="text-[7px] font-black uppercase text-white/40">Office of the PRO</p>
                          <p className="text-[9px] font-bold uppercase">{format(new Date(), 'MMMM dd, yyyy')}</p>
                        </div>
                        <Badge className="bg-accent text-primary font-black text-[8px] uppercase">VERIFIED DIRECTIVE</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* MEDIA KIT TAB */}
          <TabsContent value="media-kit" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="shadow-xl border-t-4 border-emerald-600">
                <CardHeader>
                  <CardTitle className="text-lg font-headline uppercase font-black text-emerald-800 flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Archive New Asset
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase">Upload logos, portraits, or fact sheets for members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Asset Title</Label>
                    <Input placeholder="e.g. OFFICIAL LOGO 2025 (4K)" value={assetTitle} onChange={e => setAssetTitle(e.target.value)} />
                  </div>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 transition-all bg-white"
                  >
                    <PlusCircle className="h-8 w-8 mx-auto text-emerald-300 mb-2" />
                    <p className="text-[10px] font-black uppercase text-emerald-400">Select File to Archive</p>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleMediaUpload} />
                  </div>
                  {isUploading && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-black animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin" /> SYNCING WITH NATIONAL VAULT...
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl border-t-4 border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-accent" />
                    PR Strategy Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="italic text-xs text-muted-foreground leading-relaxed">
                  "Visual consistency is our strength. Ensure all members have access to the correct high-resolution assets to prevent the spread of unofficial or low-quality materials."
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Edit3({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  );
}
