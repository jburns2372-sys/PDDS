
"use client";

import { useState, useMemo } from "react";
import { useUserData } from "@/context/user-data-context";
import { useCollection, useFirestore } from "@/firebase";
import { AgendaCard } from "@/components/agenda-card";
import { agendas } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Video, 
  Plus, 
  Users, 
  Clock, 
  Lock, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  FileText,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, subMinutes, parseISO } from "date-fns";

const ROLES_FOR_TARGETING = [
  "All Members",
  "President",
  "Officer",
  "Admin",
  "Supporter",
  "Member"
];

export default function AgendasPage() {
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Data Stream
  const { data: meetings, loading: meetingsLoading } = useCollection('meeting_agendas');

  // Creation State
  const [isModalOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string[]>(["All Members"]);

  const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

  // RBAC Filtering Logic
  const visibleMeetings = useMemo(() => {
    if (!userData) return [];
    return meetings.filter(m => {
      const audience = m.targetAudience || [];
      return (
        audience.includes("All Members") || 
        audience.includes(userData.role) || 
        hasExecutiveAccess
      );
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [meetings, userData, hasExecutiveAccess]);

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !meetingLink) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'meeting_agendas'), {
        title,
        description,
        date,
        time,
        meetingLink,
        targetAudience: selectedAudience,
        createdBy: userData?.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "Briefing Scheduled", description: "All targeted members will see this in their agenda." });
      setIsOpen(false);
      // Reset form
      setTitle(""); setDescription(""); setDate(""); setTime(""); setMeetingLink(""); setSelectedAudience(["All Members"]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to Schedule", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAudience = (role: string) => {
    setSelectedAudience(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const canJoinMeeting = (meetingDate: string, meetingTime: string) => {
    try {
      const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
      const now = new Date();
      const fifteenMinutesBefore = subMinutes(meetingDateTime, 15);
      return isBefore(fifteenMinutesBefore, now);
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-card p-6 md:p-8 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
              National Agenda Center
            </h1>
            <p className="mt-2 text-muted-foreground font-medium">
              Explore our core pillars and synchronize with upcoming party briefings.
            </p>
          </div>

          {hasExecutiveAccess && (
            <Dialog open={isModalOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 font-black uppercase tracking-widest shadow-xl rounded-xl">
                  <Plus className="mr-2 h-5 w-5" />
                  Schedule Briefing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
                <form onSubmit={handleCreateAgenda}>
                  <DialogHeader>
                    <DialogTitle className="font-headline text-xl flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                      Create Strategic Briefing
                    </DialogTitle>
                    <DialogDescription>
                      Broadcast an upcoming meeting link to specific organizational tiers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Briefing Title</Label>
                      <Input placeholder="e.g. Regional Coordination Meeting" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Meeting URL (Zoom/Meet)</Label>
                      <div className="relative">
                        <Video className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="https://..." value={meetingLink} onChange={e => setMeetingLink(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Audience</Label>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {ROLES_FOR_TARGETING.map(role => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`role-${role}`} 
                              checked={selectedAudience.includes(role)} 
                              onCheckedChange={() => toggleAudience(role)} 
                            />
                            <label htmlFor={`role-${role}`} className="text-xs font-bold uppercase">{role}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Agenda Notes</Label>
                      <Textarea placeholder="Describe the briefing objectives..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full font-black uppercase tracking-widest h-12" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Deploy Agenda"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="platform" className="space-y-12">
          <TabsList className="bg-primary/5 p-1 border h-14 w-full md:w-auto">
            <TabsTrigger value="platform" className="px-10 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              National Platform
            </TabsTrigger>
            <TabsTrigger value="briefings" className="px-10 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              <Video className="h-4 w-4 mr-2" />
              Meetings & Briefings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
              {agendas.map((agenda) => (
                <AgendaCard key={agenda.title} agenda={agenda} />
              ))}
            </div>
            
            <Card className="bg-primary/5 border-dashed border-primary/20">
              <CardContent className="p-8 flex items-start gap-4">
                <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-primary uppercase font-headline">Platform Continuity</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    These six pillars represent the core ideological foundation of PDDS. Click any card to review detailed policy proposals and legislative objectives associated with each pillar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="briefings" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {meetingsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing Secure Channels...</p>
              </div>
            ) : visibleMeetings.length === 0 ? (
              <Card className="p-24 text-center border-dashed bg-muted/20">
                <div className="flex flex-col items-center gap-4">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium">No strategic briefings scheduled for your role at this time.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6">
                {visibleMeetings.map((m: any) => {
                  const isJoinable = canJoinMeeting(m.date, m.time);
                  
                  return (
                    <Card key={m.id} className="shadow-lg border-l-4 border-l-accent overflow-hidden hover:shadow-xl transition-all">
                      <CardHeader className="bg-primary/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-xl font-headline uppercase font-black text-primary">{m.title}</CardTitle>
                              <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 text-[9px] font-black uppercase tracking-widest">
                                {m.targetAudience?.includes("All Members") ? "National" : "Restricted Access"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <div className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-primary" /> {format(new Date(m.date), 'PPPP')}</div>
                              <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" /> {m.time} (PH Time)</div>
                            </div>
                          </div>
                          
                          {isJoinable ? (
                            <Badge className="bg-green-600 font-black text-[9px] uppercase px-3 py-1">LIVE / STARTING SOON</Badge>
                          ) : (
                            <Badge variant="secondary" className="font-black text-[9px] uppercase px-3 py-1">SCHEDULED</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium italic mb-6">
                          "{m.description || "Secure briefing for authorized personnel only. Ensure your connection is encrypted before joining."}"
                        </p>
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <Lock className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground">
                              Target Audience: <span className="text-primary">{m.targetAudience?.join(', ')}</span>
                            </div>
                          </div>
                          
                          <Button 
                            asChild={isJoinable} 
                            disabled={!isJoinable}
                            className={`h-12 px-10 font-black uppercase tracking-widest shadow-lg ${isJoinable ? 'bg-green-600 hover:bg-green-700' : 'bg-muted text-muted-foreground'}`}
                          >
                            {isJoinable ? (
                              <a href={m.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Video className="mr-2 h-4 w-4" />
                                Join Briefing Now
                              </a>
                            ) : (
                              <>
                                <Clock className="mr-2 h-4 w-4" />
                                Waiting for Start
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
