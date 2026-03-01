
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/context/user-data-context";
import { 
  Search, 
  Loader2, 
  MapPin, 
  Send, 
  CheckCircle2, 
  UserPlus, 
  MessageSquare, 
  TrendingUp, 
  ShieldCheck, 
  UserCheck, 
  Phone, 
  CalendarCheck,
  Check,
  Trash2,
  Clock,
  Video,
  Globe,
  Users,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { pddsLeadershipRoles } from "@/lib/data";

const UNLIMITED_ROLES = ['Member'];

export default function AdminAuditPage() {
  const firestore = useFirestore();
  const { userData } = useUserData();
  const { toast } = useToast();
  
  const { data: feedback, loading: feedbackLoading } = useCollection('community_feedback');
  const { data: allUsers, loading: usersLoading } = useCollection('users');
  
  // Data stream for unauthorized calendar activities
  const { data: pendingActivities, loading: activitiesLoading } = useCollection('calendar_activities', {
    queries: [{ attribute: 'isAuthorized', operator: '==', value: false }]
  });

  // Data stream for supporter meeting requests
  const { data: meetingRequests, loading: meetRequestsLoading } = useCollection('meeting_requests', {
    queries: [{ attribute: 'status', operator: '==', value: 'Pending' }]
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState<string | null>(null);
  const [selectedPromoRole, setSelectedPromoRole] = useState<Record<string, string>>({});

  const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;
  const isPresident = userData?.role === 'President' || userData?.isSuperAdmin;
  const isCoordinator = userData?.role === 'Coordinator';

  const provinces = useMemo(() => {
    const p = new Set<string>();
    feedback.forEach(item => {
      if (item.location) {
        const parts = item.location.split(',');
        if (parts.length > 1) p.add(parts[1].trim());
      }
    });
    return Array.from(p).sort();
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    return feedback.filter(item => {
      if (item.status === 'Addressed') return false;
      const matchesSearch = 
        (item.submittedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      const parts = (item.location || '').split(',');
      const itemProv = parts[1]?.trim();
      const matchesProvince = provinceFilter === "all" || itemProv === provinceFilter;
      return matchesSearch && matchesProvince;
    }).sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [feedback, searchTerm, provinceFilter]);

  // Coordinators only see requests from their assigned city
  const filteredMeetRequests = useMemo(() => {
    return meetingRequests.filter(r => {
      if (isCoordinator) return r.city === userData.city;
      return true;
    }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [meetingRequests, isCoordinator, userData?.city]);

  const handleApproveMeeting = async (id: string) => {
    setSaving(id);
    try {
      const docRef = doc(firestore, 'meeting_requests', id);
      await updateDoc(docRef, { status: "Approved" });
      toast({ title: "Gathering Authorized", description: "This mobilization is now live on the Supporter Map." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setSaving(null);
    }
  };

  const handleRejectMeeting = async (id: string) => {
    const reason = prompt("Enter reason for rejection:");
    if (reason === null) return;
    
    setSaving(id);
    try {
      const docRef = doc(firestore, 'meeting_requests', id);
      await updateDoc(docRef, { status: "Rejected", rejectionReason: reason });
      toast({ title: "Proposal Rejected", description: "Host has been notified." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setSaving(null);
    }
  };

  const handleReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    setSaving(id);
    try {
      const docRef = doc(firestore, 'community_feedback', id);
      await updateDoc(docRef, { officialReply: text, status: "Addressed" });
      toast({ title: "Saved" });
      setReplyText(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `community_feedback/${id}`, operation: 'update' }));
    } finally {
      setSaving(null);
    }
  };

  const handlePromote = async (supporter: any) => {
    const newRole = selectedPromoRole[supporter.id];
    if (!newRole || !hasExecutiveAccess) return;
    const confirmed = confirm(`Promote ${supporter.fullName} to ${newRole}?`);
    if (!confirmed) return;

    setPromoting(supporter.id);
    try {
      const userRef = doc(firestore, 'users', supporter.id);
      await updateDoc(userRef, { 
        role: newRole,
        jurisdictionLevel: newRole === 'Member' ? 'City/Municipal' : 'National' 
      });
      toast({ title: "Promotion Successful" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } finally {
      setPromoting(null);
    }
  };

  const handleAuthorizeActivity = async (id: string) => {
    if (!isPresident) return;
    setAuthorizing(id);
    try {
      const docRef = doc(firestore, 'calendar_activities', id);
      await updateDoc(docRef, { 
        isAuthorized: true, 
        authorizedBy: userData?.fullName || 'President' 
      });
      toast({ title: "Activity Authorized", description: "Deployment is now live nationwide." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to authorize", description: error.message });
    } finally {
      setAuthorizing(null);
    }
  };

  const handleRejectActivity = async (id: string) => {
    if (!isPresident) return;
    if (!confirm("Are you sure you want to REJECT and delete this activity proposal?")) return;
    try {
      const docRef = doc(firestore, 'calendar_activities', id);
      await deleteDoc(docRef);
      toast({ title: "Activity Rejected", description: "Proposal has been removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />
              Audit Center
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage sentiment, organizational growth, and mobilization directives.</p>
          </div>
        </div>

        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList className="bg-primary/5 border border-primary/10 h-14 p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="feedback" className="px-6 font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
              <MessageSquare className="h-3 w-3 mr-2" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="mobilization" className="px-6 font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
              <Users className="h-3 w-3 mr-2" /> Mobilization ({meetingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="promotion" className="px-6 font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
              <TrendingUp className="h-3 w-3 mr-2" /> Promotion
            </TabsTrigger>
            {isPresident && (
              <TabsTrigger value="auth" className="px-6 font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
                <CalendarCheck className="h-3 w-3 mr-2" /> Authorization
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="feedback" className="space-y-6">
            <Card className="p-4 shadow-sm border-none bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input className="h-12" placeholder="Search keyword..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Select onValueChange={setProvinceFilter} value={provinceFilter}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Province" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {feedbackLoading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> :
             filteredFeedback.length === 0 ? <p className="text-center py-24 text-muted-foreground">No pending items.</p> :
             <div className="grid gap-6">
                {filteredFeedback.map((item: any) => (
                  <Card key={item.id} className="shadow-lg border-l-4 border-l-amber-500 overflow-hidden">
                    <CardHeader className="p-4 md:p-6 bg-muted/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base md:text-lg font-headline uppercase">{item.submittedBy}</CardTitle>
                            <Badge variant="outline" className="text-[8px] font-black uppercase">{item.topic}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-1 uppercase font-bold">
                            <MapPin className="h-3 w-3" /> {item.location}
                          </div>
                        </div>
                        <Badge className="bg-amber-500 text-[8px] font-black uppercase">PENDING</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-sm italic">"{item.message}"</div>
                      <div className="space-y-3 pt-4 border-t">
                        <Label className="text-[9px] font-black uppercase text-primary">Official Reply</Label>
                        <Textarea placeholder="Type response..." className="h-24 text-sm" value={replyText[item.id] || ""} onChange={e => setReplyText({ ...replyText, [item.id]: e.target.value })} />
                        <Button onClick={() => handleReply(item.id)} className="w-full h-12 font-black uppercase text-xs" disabled={saving === item.id}>
                          {saving === item.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Mark as Addressed'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
            }
          </TabsContent>

          <TabsContent value="mobilization" className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-primary uppercase">Field Commander Audit</p>
                <p className="text-xs text-muted-foreground font-medium">Review supporter-led gathering proposals. Approved meetups will appear on the National Mobilizer Map.</p>
              </div>
            </div>

            {meetRequestsLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : filteredMeetRequests.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">No pending local gathering requests.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredMeetRequests.map((req: any) => (
                  <Card key={req.id} className="shadow-lg border-l-4 border-l-accent overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-headline font-black text-primary uppercase">{req.title}</CardTitle>
                            <Badge className="bg-accent text-accent-foreground font-black text-[8px] uppercase">{req.meetingType}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.locationAddress}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(req.dateTime), 'PPP p')}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-accent text-accent font-black text-[8px] uppercase">PENDING AUDIT</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm italic text-foreground/80 leading-relaxed border-l-2 pl-4 border-accent/20">
                        "{req.description || "Gathering objectives not detailed."}"
                      </p>
                      <div className="mt-4 pt-4 border-t flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] font-black">{req.hostName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary leading-none">Host: {req.hostName}</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Clearence: Silver/Gold Mobilizer</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 border-t flex gap-3">
                      <Button 
                        variant="destructive" 
                        className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest"
                        onClick={() => handleRejectMeeting(req.id)}
                        disabled={saving === req.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Reject Gathering
                      </Button>
                      <Button 
                        className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 shadow-xl"
                        onClick={() => handleApproveMeeting(req.id)}
                        disabled={saving === req.id}
                      >
                        {saving === req.id ? <Loader2 className="animate-spin h-4 w-4" /> : <><Check className="mr-2 h-4 w-4" /> Authorize & Publish</>}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="promotion" className="space-y-6">
            <div className="hidden md:block">
              <Card className="shadow-xl overflow-hidden border-none">
                <Table>
                  <TableHeader><TableRow className="bg-primary text-white"><TableHead className="text-[10px] uppercase font-black pl-6 text-white">Candidate</TableHead><TableHead className="text-[10px] uppercase font-black text-white">Location</TableHead><TableHead className="text-[10px] uppercase font-black text-white">Engagement</TableHead><TableHead className="text-[10px] uppercase font-black text-white">New Rank</TableHead><TableHead className="text-right pr-6 text-[10px] uppercase font-black text-white">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {usersLoading ? <TableRow><TableCell colSpan={5} className="py-24 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></TableCell></TableRow> :
                     promotionQueue.length === 0 ? <TableRow><TableCell colSpan={5} className="py-24 text-center text-muted-foreground italic">Queue is empty.</TableCell></TableRow> :
                     promotionQueue.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="pl-6"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={s.photoURL} /><AvatarFallback>{s.fullName?.charAt(0)}</AvatarFallback></Avatar><div><div className="font-bold text-sm uppercase">{s.fullName}</div><div className="text-[10px] font-mono opacity-60">{s.phoneNumber}</div></div></div></TableCell>
                        <TableCell><div className="text-[11px] font-bold uppercase">{s.city}</div><div className="text-[9px] opacity-60 uppercase">{s.province}</div></TableCell>
                        <TableCell><div className="flex items-center gap-1 font-black text-xs text-green-600"><TrendingUp className="h-3 w-3" /> {s.recruitCount || 0}</div></TableCell>
                        <TableCell><Select onValueChange={(v) => setSelectedPromoRole({ ...selectedPromoRole, [s.id]: v })} value={selectedPromoRole[s.id] || ""}><SelectTrigger className="h-9 w-44 text-[10px] uppercase font-bold"><SelectValue placeholder="Select Rank..." /></SelectTrigger><SelectContent><SelectItem value="Member">Member</SelectItem>{vacantRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></TableCell>
                        <TableCell className="text-right pr-6"><Button size="sm" className="h-9 text-[10px] font-black uppercase" disabled={!selectedPromoRole[s.id] || promoting === s.id || !hasExecutiveAccess} onClick={() => handlePromote(s)}>{promoting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Promote'}</Button></TableCell>
                      </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="md:hidden space-y-4">
              {usersLoading ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> :
               promotionQueue.length === 0 ? <p className="text-center py-12 text-muted-foreground">Queue is empty.</p> :
               promotionQueue.map(s => (
                <Card key={s.id} className="shadow-md border-l-4 border-l-accent">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12"><AvatarImage src={s.photoURL} /><AvatarFallback>{s.fullName?.charAt(0)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-black text-sm uppercase">{s.fullName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.city}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded text-[10px] font-bold uppercase">
                      <span>Recruits: {s.recruitCount || 0}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phoneNumber}</span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Assign Official Rank</Label>
                      <Select onValueChange={(v) => setSelectedPromoRole({ ...selectedPromoRole, [s.id]: v })} value={selectedPromoRole[s.id] || ""}>
                        <SelectTrigger className="h-12 w-full text-xs font-bold uppercase"><SelectValue placeholder="Select Rank..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Member">Member</SelectItem>
                          {vacantRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full h-14 font-black uppercase tracking-widest text-xs" disabled={!selectedPromoRole[s.id] || promoting === s.id || !hasExecutiveAccess} onClick={() => handlePromote(s)}>
                      {promoting === s.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                      Induct Now
                    </Button>
                  </CardContent>
                </Card>
               ))}
            </div>
          </TabsContent>

          {isPresident && (
            <TabsContent value="auth" className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-xl border border-dashed border-primary/20 flex items-center gap-3 mb-6">
                <ShieldCheck className="h-6 w-6 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Review and authorize mobilization activities proposed by the National Secretariat.
                </p>
              </div>

              {activitiesLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
              ) : pendingActivities.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                  <CalendarCheck className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No pending activity authorizations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingActivities.map((activity: any) => (
                    <Card key={activity.id} className="shadow-lg border-l-4 border-l-amber-500 overflow-hidden group">
                      <CardHeader className="bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-xl font-headline font-black text-primary uppercase">{activity.title}</CardTitle>
                              <Badge variant="outline" className="text-[9px] font-black uppercase">{activity.scope}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(activity.startDate), 'PPpp')}</span>
                              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {activity.targetCity || 'National'}, {activity.targetProvince || ''}</span>
                            </div>
                          </div>
                          <Badge className="bg-amber-500 font-black text-[9px] uppercase px-3 py-1">WAITING FOR PRESIDENT</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium italic border-l-2 pl-4 border-primary/10">
                          "{activity.description || "No detailed agenda provided."}"
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                          {activity.meetingLink && (
                            <div className="flex items-center gap-2 text-xs font-bold text-primary truncate">
                              <Video className="h-4 w-4 shrink-0" />
                              Link: <span className="font-medium text-muted-foreground underline">{activity.meetingLink}</span>
                            </div>
                          )}
                          {activity.locationAddress && (
                            <div className="flex items-center gap-2 text-xs font-bold text-primary truncate">
                              <MapPin className="h-4 w-4 shrink-0" />
                              Address: <span className="font-medium text-muted-foreground">{activity.locationAddress}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/10 border-t flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
                        <div className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-2">
                          <UserPlus className="h-3 w-3" /> Proposed by: {activity.organizerName}
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <Button 
                            variant="destructive" 
                            className="flex-1 md:flex-none h-12 font-black uppercase text-[10px] tracking-widest px-6"
                            onClick={() => handleRejectActivity(activity.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> RejectProposal
                          </Button>
                          <Button 
                            className="flex-1 md:flex-none h-12 font-black uppercase text-[10px] tracking-widest px-8 shadow-xl bg-green-600 hover:bg-green-700"
                            onClick={() => handleAuthorizeActivity(activity.id)}
                            disabled={authorizing === activity.id}
                          >
                            {authorizing === activity.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-2 h-4 w-4" /> Authorize & Deploy</>}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
