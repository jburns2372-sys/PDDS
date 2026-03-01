
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
import { Progress } from "@/components/ui/progress";
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
  Newspaper,
  LayoutList,
  History,
  CheckCircle2,
  Users,
  GraduationCap,
  PlusCircle,
  FileBadge
} from "lucide-react";
import { policyCategories, NATIONAL_LAUNCH_TEMPLATE } from "@/lib/data";

/**
 * @fileOverview PRO Official Broadcast & Media Center.
 * Handles Press Releases, Asset Library, Tactical Event Deployment, Poll Management, and Policy Hub.
 */
export default function ProBulletinPage() {
  const firestore = useFirestore();
  const storage = useStorage();
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

  // Policy Hub State
  const [policyTitle, setPolicyTitle] = useState("");
  const [policySummary, setPolicySummary] = useState("");
  const [policyCat, setPolicyCat] = useState("Economy");
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const policyInputRef = useRef<HTMLInputElement>(null);
  const [isDeployingPolicy, setIsDeployingPolicy] = useState(false);
  const [policyQuiz, setPolicyQuiz] = useState<any[]>([
    { question: "", options: ["", "", ""], correctAnswerIndex: 0 }
  ]);

  // Event Command State
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("National");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Poll Management State
  const [pollView, setPollView] = useState<'create' | 'manage'>('create');
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollTargetLocation, setPollTargetLocation] = useState("National");
  const [pollTargetRole, setPollTargetRole] = useState("All Members");
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  // Live Poll Monitor
  const { data: allPolls, loading: pollsLoading } = useCollection('polls');
  const activePolls = useMemo(() => allPolls.filter(p => p.isActive).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [allPolls]);
  const archivedPolls = useMemo(() => allPolls.filter(p => !p.isActive).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [allPolls]);

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

  const loadLaunchTemplate = () => {
    setTitle(NATIONAL_LAUNCH_TEMPLATE.title);
    setMessage(NATIONAL_LAUNCH_TEMPLATE.message);
    setTargetGroup("National");
    toast({ title: "Template Loaded", description: "The National Launch Broadcast is ready for publication." });
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

  const handlePolicyDeploy = async () => {
    if (!policyFile || !policyTitle || !policySummary) {
      toast({ variant: "destructive", title: "Missing Policy Data" });
      return;
    }

    setIsDeployingPolicy(true);
    try {
      const storageRef = ref(storage, `manifestos/${Date.now()}-${policyFile.name}`);
      const uploadResult = await uploadBytes(storageRef, policyFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(firestore, 'policies'), {
        title: policyTitle.trim().toUpperCase(),
        category: policyCat,
        summary: policySummary.trim(),
        documentUrl: downloadURL,
        quiz: policyQuiz,
        shareCount: 0,
        createdAt: serverTimestamp()
      });

      toast({ title: "Manifesto Deployed", description: "The platform library has been updated." });
      setPolicyTitle(""); setPolicySummary(""); setPolicyFile(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deployment Failed", description: error.message });
    } finally {
      setIsDeployingPolicy(false);
    }
  };

  const updateQuiz = (idx: number, field: string, val: any) => {
    const next = [...policyQuiz];
    if (field === 'question') next[idx].question = val;
    if (field === 'correct') next[idx].correctAnswerIndex = val;
    if (field.startsWith('opt-')) {
      const oIdx = parseInt(field.split('-')[1]);
      next[idx].options[oIdx] = val;
    }
    setPolicyQuiz(next);
  };

  const addQuizQuestion = () => setPolicyQuiz([...policyQuiz, { question: "", options: ["", "", ""], correctAnswerIndex: 0 }]);

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
        targetGroup: pollTargetLocation,
        targetRole: pollTargetRole,
        votes: initialVotes,
        votedBy: [],
        isActive: true,
        createdBy: userData?.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "Referendum Deployed!", description: "Targeted members can now cast their ballots." });
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollTargetLocation("National");
      setPollTargetRole("All Members");
      setPollView('manage');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Poll Failed", description: error.message });
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const updatePollOption = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  const addPollOption = () => setPollOptions([...pollOptions, ""]);
  const removePollOption = (idx: number) => setPollOptions(pollOptions.filter((_, i) => i !== idx));

  const handleClosePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to close this referendum? Voting will cease immediately.")) return;
    try {
      const pollRef = doc(firestore, "polls", pollId);
      await updateDoc(pollRef, { isActive: false });
      toast({ title: "Poll Closed", description: "Results have been archived for executive review." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to close poll", description: error.message });
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
            <TabsTrigger value="policy" className="px-8 font-black uppercase text-[10px] tracking-widest">
              <GraduationCap className="h-4 w-4 mr-2" /> Policy Hub
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

          {/* POLICY HUB TAB */}
          <TabsContent value="policy">
            <Card className="shadow-xl border-t-4 border-primary">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary uppercase">
                  <GraduationCap className="h-5 w-5" />
                  Party Manifesto Hub
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Deploy manifestos and proficiency quizzes to the National Library.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-primary">Manifesto Title</Label>
                      <Input placeholder="e.g. 10% Flat Tax Framework" value={policyTitle} onChange={e => setPolicyTitle(e.target.value)} className="h-12 border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-primary">Pillar Category</Label>
                      <Select value={policyCat} onValueChange={setPolicyCat}>
                        <SelectTrigger className="h-12 border-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {policyCategories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-primary">Document (PDF)</Label>
                      <Input type="file" accept="application/pdf" onChange={e => setPolicyFile(e.target.files?.[0] || null)} className="h-12 border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-primary">Member Summary</Label>
                      <Textarea placeholder="Quick read summary for members..." value={policySummary} onChange={e => setPolicySummary(e.target.value)} className="h-24 border-2" />
                    </div>
                  </div>

                  <div className="space-y-4 border-l pl-6">
                    <Label className="text-[10px] font-black uppercase text-primary flex items-center justify-between">
                      Briefing Proficiency Quiz
                      <Button variant="ghost" size="sm" onClick={addQuizQuestion} className="h-6 text-[8px] font-black"><PlusCircle className="h-3 w-3 mr-1" /> Add Question</Button>
                    </Label>
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                      {policyQuiz.map((q, qIdx) => (
                        <Card key={qIdx} className="p-4 bg-muted/30 border-dashed">
                          <Input placeholder={`Question ${qIdx + 1}`} value={q.question} onChange={e => updateQuiz(qIdx, 'question', e.target.value)} className="mb-3 font-bold" />
                          <div className="space-y-2">
                            {q.options.map((o: any, oIdx: any) => (
                              <div key={oIdx} className="flex gap-2">
                                <Input placeholder={`Option ${oIdx + 1}`} value={o} onChange={e => updateQuiz(qIdx, `opt-${oIdx}`, e.target.value)} className="h-8 text-xs" />
                                <Button 
                                  variant={q.correctAnswerIndex === oIdx ? 'default' : 'outline'} 
                                  size="sm" 
                                  onClick={() => updateQuiz(qIdx, 'correct', oIdx)}
                                  className="h-8 w-8 p-0"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t pt-6">
                <Button onClick={handlePolicyDeploy} disabled={isDeployingPolicy} className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl">
                  {isDeployingPolicy ? <><Loader2 className="animate-spin mr-2 h-6 w-6" /> Deploying Manifesto...</> : <><GraduationCap className="mr-2 h-6 w-6" /> Publish to National Library</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ANNOUNCEMENTS TAB */}
          <TabsContent value="announcements">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <Card className="shadow-xl border-t-4 border-red-700 overflow-hidden">
                  <form onSubmit={handlePublish}>
                    <CardHeader className="bg-red-50/50 border-b flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-headline flex items-center gap-2 text-red-800">
                          <ShieldCheck className="h-5 w-5" />
                          Official Directive
                        </CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                          Pushes a news alert to the National Bulletin feed.
                        </CardDescription>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={loadLaunchTemplate}
                        className="h-8 text-[9px] font-black uppercase tracking-widest border-red-200 text-red-700"
                      >
                        <FileBadge className="mr-1.5 h-3 w-3" /> Load Launch Template
                      </Button>
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
                          className="min-h-[250px] text-sm font-medium leading-relaxed border-2"
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
                    <p className="font-bold text-primary">Tip: Use the National Launch Template for the initial platform rollout to maximize member onboarding.</p>
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
              <div className="lg:col-span-8 space-y-6">
                
                <div className="flex bg-primary/5 p-1 rounded-lg border border-primary/10 mb-4">
                  <Button 
                    variant={pollView === 'create' ? 'default' : 'ghost'} 
                    onClick={() => setPollView('create')} 
                    className="flex-1 h-10 font-black uppercase text-[10px] tracking-widest"
                  >
                    <Plus className="h-3 w-3 mr-2" /> Create Ballot
                  </Button>
                  <Button 
                    variant={pollView === 'manage' ? 'default' : 'ghost'} 
                    onClick={() => setPollView('manage')} 
                    className="flex-1 h-10 font-black uppercase text-[10px] tracking-widest"
                  >
                    <LayoutList className="h-3 w-3 mr-2" /> Live Monitor ({activePolls.length})
                  </Button>
                </div>

                {pollView === 'create' ? (
                  <Card className="shadow-xl border-t-4 border-accent overflow-hidden">
                    <form onSubmit={handleCreatePoll}>
                      <CardHeader className="bg-accent/5 border-b">
                        <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary uppercase">
                          <BarChart3 className="h-5 w-5 text-accent" />
                          Official Referendum Tool
                        </CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                          Gauge sentiment on specific policies or localized directives.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Jurisdiction</Label>
                            <Select value={pollTargetLocation} onValueChange={setPollTargetLocation}>
                              <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Select Scope" /></SelectTrigger>
                              {targetOptions}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Member Tier</Label>
                            <Select value={pollTargetRole} onValueChange={setPollTargetRole}>
                              <SelectTrigger className="h-12 border-2"><SelectValue placeholder="Select Tier" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="All Members" className="font-bold uppercase text-[10px]">All Members</SelectItem>
                                <SelectItem value="Only Vetted Officers" className="font-bold uppercase text-[10px]">Only Vetted Officers</SelectItem>
                                <SelectItem value="Leadership Core" className="font-bold uppercase text-[10px]">National Leadership Core</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Referendum Question</Label>
                          <Input 
                            placeholder="e.g. Do you support the 10% Flat Tax proposal?" 
                            className="h-12 font-bold border-2"
                            value={pollQuestion}
                            onChange={e => setPollQuestion(e.target.value)}
                          />
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
                            <Plus className="h-3 w-3 mr-1" /> Add Ballot Choice
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/30 border-t pt-6">
                        <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90" disabled={isCreatingPoll}>
                          {isCreatingPoll ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Deploying Ballot...</> : <><ShieldCheck className="mr-2 h-6 w-6 text-accent" /> Execute Referendum</>}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {pollsLoading ? (
                      <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                    ) : activePolls.length === 0 ? (
                      <Card className="p-24 text-center border-dashed border-2 bg-muted/20">
                        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">No active referendums found.</p>
                      </Card>
                    ) : (
                      <div className="grid gap-6">
                        {activePolls.map((poll: any) => {
                          const totalVotes = Object.values(poll.votes || {}).reduce((a: any, b: any) => a + b, 0);
                          return (
                            <Card key={poll.id} className="shadow-lg border-l-4 border-l-green-600">
                              <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-base font-black uppercase text-primary font-headline">{poll.question}</CardTitle>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[8px] font-black">ACTIVE</Badge>
                                    </div>
                                    <div className="flex gap-3 text-[9px] font-bold text-muted-foreground uppercase">
                                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {poll.targetGroup}</span>
                                      <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" /> {poll.targetRole}</span>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => handleClosePoll(poll.id)} className="h-8 text-destructive font-black uppercase text-[9px]">
                                    Close & Archive
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-6 space-y-4">
                                <div className="grid gap-4">
                                  {poll.options.map((opt: string) => {
                                    const count = poll.votes[opt] || 0;
                                    const perc = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                    return (
                                      <div key={opt} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                          <span>{opt}</span>
                                          <span className="text-primary">{count} votes ({perc}%)</span>
                                        </div>
                                        <Progress value={perc} className="h-2" />
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="pt-4 border-t border-dashed flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground">
                                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Live Synchronized</span>
                                  <span>Total Engagement: {totalVotes}</span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="lg:col-span-4">
                <Card className="shadow-lg border-l-4 border-l-primary bg-primary/5 h-fit">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" />Audit Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-4">
                    <p className="italic text-xs text-muted-foreground leading-relaxed">
                      "One-member-one-vote security is strictly enforced via registry tracking. Archiving a poll removes it from the member dash but preserves results for the Executive Board."
                    </p>
                    <div className="pt-4 border-t">
                      <h4 className="text-[9px] font-black uppercase text-primary mb-3 flex items-center gap-2"><History className="h-3 w-3" /> Recent History</h4>
                      <div className="space-y-2">
                        {archivedPolls.slice(0, 3).map((ap: any) => (
                          <div key={ap.id} className="p-2 bg-white rounded border text-[10px] font-bold text-muted-foreground truncate">
                            {ap.question}
                          </div>
                        ))}
                        {archivedPolls.length === 0 && <p className="text-[9px] opacity-40 italic">No archived referendums.</p>}
                      </div>
                    </div>
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
