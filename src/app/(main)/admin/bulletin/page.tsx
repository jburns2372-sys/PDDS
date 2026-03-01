
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  Newspaper
} from "lucide-react";

/**
 * @fileOverview PRO Official Broadcast & Media Center.
 * Handles Press Releases, Asset Library, Tactical Event Deployment, and Polls.
 */
export default function ProBulletinPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { userData } = useUserData();
  const { toast } = useToast();

  const isPresident = userData?.role === 'President';

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

  // Event Command State
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("National");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Poll State
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollTarget, setPollTarget] = useState("National");
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

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
      toast({ title: "Update Published!", description: `Your announcement is now live for: ${targetGroup}` });
      setTitle(""); setMessage(""); setTargetGroup("National");
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
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${assetName.replace(/\s+/g, '-').toLowerCase()}.${fileExt}`;
      const storageRef = ref(storage, `vault_files/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(firestore, 'vault'), {
        title: assetName.trim().toUpperCase(),
        description: `Official shared asset published by PRO: ${userData?.fullName || 'National HQ'}`,
        fileUrl: downloadURL,
        fileType: selectedFile.type,
        uploadedBy: "Public Relations Officer",
        targetAudience: ["All Members"],
        createdAt: serverTimestamp()
      });

      toast({ title: "Asset Shared!", description: `"${assetName}" is now available in the National Vault.` });
      setAssetName(""); setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({ variant: "destructive", title: "Asset Upload Failed", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Title and Date are required for event deployment." });
      return;
    }

    setIsCreatingEvent(true);
    try {
      const eventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        startDate: eventDate, 
        scope: eventLocation === 'National' ? 'National' : 'Regional',
        targetCity: eventLocation === 'National' ? null : eventLocation,
        targetProvince: eventLocation === 'National' ? null : "REGIONAL HUB",
        isAuthorized: isPresident, 
        authorizedBy: isPresident ? userData?.fullName : null,
        organizerName: userData?.fullName || 'Executive Command',
        organizerUid: userData?.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(firestore, "calendar_activities"), eventData);
      
      toast({ 
        title: isPresident ? "Event Published!" : "Proposal Submitted", 
        description: isPresident ? "The event is now live on the National Calendar." : "Your event proposal has been sent for Presidential Authorization."
      });
      
      setEventTitle(""); setEventDescription(""); setEventDate(""); setEventLocation("National");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Event Deployment Failed", description: error.message });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const addPollOption = () => setPollOptions([...pollOptions, ""]);
  const removePollOption = (index: number) => setPollOptions(pollOptions.filter((_, i) => i !== index));
  const updatePollOption = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.filter(o => o.trim() !== "");
    if (!pollQuestion.trim() || validOptions.length < 2) {
      toast({ variant: "destructive", title: "Invalid Poll", description: "Question and at least 2 options are required." });
      return;
    }

    setIsCreatingPoll(true);
    try {
      const initialVotes: Record<string, number> = {};
      validOptions.forEach(opt => initialVotes[opt] = 0);

      await addDoc(collection(firestore, "polls"), {
        question: pollQuestion.trim(),
        options: validOptions,
        targetGroup: pollTarget,
        votes: initialVotes,
        votedBy: [],
        isActive: true,
        createdBy: userData?.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "Ballot Deployed!", description: "Members can now cast their votes in the Daily Pulse." });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollTarget("National");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Poll Failed", description: error.message });
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const targetOptions = (
    <SelectContent>
      <SelectItem value="National" className="font-bold uppercase text-[10px]">National (All Members)</SelectItem>
      <SelectItem value="QUEZON CITY" className="font-bold uppercase text-[10px]">Quezon City Hub</SelectItem>
      <SelectItem value="CITY OF MANILA" className="font-bold uppercase text-[10px]">Manila Hub</SelectItem>
      <SelectItem value="CEBU CITY" className="font-bold uppercase text-[10px]">Cebu Hub</SelectItem>
      <SelectItem value="DAVAO CITY" className="font-bold uppercase text-[10px]">Davao Hub</SelectItem>
    </SelectContent>
  );

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-red-700 text-white rounded-lg shadow-xl">
            <Megaphone className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline uppercase tracking-tight">Broadcast & Media Center</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">Official Command Terminal for directives, assets, and event deployment.</p>
          </div>
        </div>

        <Tabs defaultValue="announcements" className="space-y-8">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="announcements" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <Newspaper className="h-4 w-4 mr-2" /> Press Release
            </TabsTrigger>
            <TabsTrigger value="events" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <CalendarDays className="h-4 w-4 mr-2" /> Event Command
            </TabsTrigger>
            <TabsTrigger value="polls" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <BarChart3 className="h-4 w-4 mr-2" /> Referendum
            </TabsTrigger>
            <TabsTrigger value="assets" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <Library className="h-4 w-4 mr-2" /> Asset Manager
            </TabsTrigger>
          </TabsList>

          {/* ANNOUNCEMENTS TAB */}
          <TabsContent value="announcements">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-t-4 border-red-700 overflow-hidden">
                  <form onSubmit={handlePublish}>
                    <CardHeader className="bg-red-50/50 border-b">
                      <CardTitle className="text-lg font-headline flex items-center gap-2 text-red-800">
                        <ShieldCheck className="h-5 w-5" />
                        Official Directive
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                        Pushes a news alert to the National Bulletin feed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Hub</Label>
                          <Select value={targetGroup} onValueChange={setTargetGroup}>
                            <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Select Scope" /></SelectTrigger>
                            {targetOptions}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Headline</Label>
                          <Input 
                            placeholder="e.g. NEW FEDERALISM ROADMAP RELEASED" 
                            className="h-12 font-bold border-2"
                            value={title}
                            onChange={e => setTitle(e.target.value.toUpperCase())}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Body Content</Label>
                        <Textarea 
                          placeholder="Detailed party update..." 
                          className="min-h-[200px] text-sm font-medium leading-relaxed border-2"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t pt-6">
                      <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-red-700 hover:bg-red-800" disabled={isPublishing}>
                        {isPublishing ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Distributing...</> : <><Send className="mr-2 h-6 w-6" /> Publish Official Update</>}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card className="shadow-lg border-l-4 border-l-accent bg-accent/5 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      PRO Strategy Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 italic text-xs text-muted-foreground leading-relaxed space-y-4">
                    <p>"Announcements targeted to specific cities will only appear on the feed of members registered in that city, alongside national alerts."</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* EVENTS TAB */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-t-4 border-primary">
                  <form onSubmit={handleCreateEvent}>
                    <CardHeader className="bg-primary/5 border-b">
                      <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary uppercase">
                        <CalendarDays className="h-5 w-5" />
                        Official Event Command
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                        Publish mobilization activities to the National Registry.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Event Title</Label>
                          <Input 
                            placeholder="e.g. GRAND FEDERALISMO RALLY" 
                            className="h-12 font-bold uppercase border-2"
                            value={eventTitle}
                            onChange={e => setEventTitle(e.target.value.toUpperCase())}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target City / Region</Label>
                          <Select value={eventLocation} onValueChange={setEventLocation}>
                            <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Select Deployment Zone" /></SelectTrigger>
                            {targetOptions}
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Date & Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                            <Input 
                              type="datetime-local" 
                              className="h-12 pl-10 border-2 font-bold"
                              value={eventDate}
                              onChange={e => setEventDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Detailed Agenda</Label>
                          <Input 
                            placeholder="Objectives and operational notes..." 
                            className="h-12 border-2"
                            value={eventDescription}
                            onChange={e => setEventDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t pt-6">
                      <Button 
                        type="submit" 
                        className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90"
                        disabled={isCreatingEvent}
                      >
                        {isCreatingEvent ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Deploying Activity...</> : <><Send className="mr-2 h-6 w-6" /> Publish Event to Members</>}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card className="shadow-lg border-l-4 border-l-emerald-600 bg-emerald-50/10 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-800"><MapPin className="h-4 w-4" />Deployment Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 italic text-xs text-muted-foreground leading-relaxed">
                    <p>"Events created here are added to the National Calendar upon Presidential authorization."</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* POLLS TAB */}
          <TabsContent value="polls">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-t-4 border-accent overflow-hidden">
                  <form onSubmit={handleCreatePoll}>
                    <CardHeader className="bg-accent/5 border-b">
                      <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary uppercase">
                        <BarChart3 className="h-5 w-5 text-accent" />
                        Create Official Referendum
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                        Gauge member sentiment on party policies and local issues.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Audience</Label>
                          <Select value={pollTarget} onValueChange={setPollTarget}>
                            <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Select Scope" /></SelectTrigger>
                            {targetOptions}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Poll Question</Label>
                          <Input 
                            placeholder="e.g. Do you support the 10% Flat Tax policy?" 
                            className="h-12 font-bold border-2"
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Ballot Options</Label>
                        <div className="grid gap-3">
                          {pollOptions.map((opt, i) => (
                            <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                              <Input 
                                placeholder={`Option ${i + 1}`} 
                                className="h-11 border-2 font-medium"
                                value={opt}
                                onChange={e => updatePollOption(i, e.target.value)}
                              />
                              {pollOptions.length > 2 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePollOption(i)} className="text-destructive shrink-0 h-11 w-11"><X className="h-4 w-4" /></Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addPollOption} className="mt-2 border-dashed border-2 text-[10px] font-black uppercase tracking-widest">
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t pt-6">
                      <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90" disabled={isCreatingPoll}>
                        {isCreatingPoll ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Deploying Ballot...</> : <><ShieldCheck className="mr-2 h-6 w-6 text-accent" /> Execute National Referendum</>}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>
              <div className="lg:col-span-4">
                <Card className="shadow-lg border-l-4 border-l-primary bg-primary/5 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary"><BarChart3 className="h-4 w-4" />Referendum Protocol</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 italic text-xs text-muted-foreground leading-relaxed">
                    <p>"One-member-one-vote security is active. Members can only see results after casting their ballot. Ensure options are clear and unbiased."</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ASSETS TAB */}
          <TabsContent value="assets">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <Card className="shadow-xl border-t-4 border-emerald-600 bg-emerald-50/10 h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline flex items-center gap-2 text-emerald-800 uppercase"><Library className="h-5 w-5" />Tactical Asset Manager</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest">Upload official posters and roadmaps to the shared library.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-emerald-700">Material Name</Label>
                      <Input placeholder="e.g. FEDERALISM Q&A POSTER" className="h-11 font-bold border-emerald-200" value={assetName} onChange={e => setAssetName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-emerald-700">File Selection</Label>
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center cursor-pointer hover:bg-emerald-50 transition-all bg-white">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">{selectedFile.type.includes('image') ? <ImageIcon className="h-6 w-6 text-emerald-600" /> : <FileText className="h-6 w-6 text-emerald-600" />}<span className="text-xs font-bold truncate max-w-[150px]">{selectedFile.name}</span></div>
                        ) : (
                          <div className="space-y-1"><Upload className="h-6 w-6 mx-auto text-emerald-400" /><p className="text-[10px] font-black uppercase text-emerald-500">Select Image or PDF</p></div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                    <Button onClick={handleAssetUpload} disabled={isUploading || !selectedFile || !assetName} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest shadow-lg">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Deploy to Library
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-5">
                <Card className="shadow-lg border-l-4 border-l-emerald-600 bg-emerald-50/10 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-800"><Library className="h-4 w-4" />Asset Protocol</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 italic text-xs text-muted-foreground leading-relaxed"><p>"Materials uploaded here are instantly distributed to the National Tactical Library (Vault) for all members."</p></CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
