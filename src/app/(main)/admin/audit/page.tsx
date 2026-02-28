
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Search, Loader2, MapPin, Send, CheckCircle2, UserPlus, MessageSquare, TrendingUp, ShieldCheck, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { pddsLeadershipRoles } from "@/lib/data";

const UNLIMITED_ROLES = ['Member'];

export default function AdminAuditPage() {
  const firestore = useFirestore();
  const { userData } = useUserData();
  const { toast } = useToast();
  
  // Data Streams
  const { data: feedback, loading: feedbackLoading } = useCollection('community_feedback');
  const { data: allUsers, loading: usersLoading } = useCollection('users');
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [selectedPromoRole, setSelectedPromoRole] = useState<Record<string, string>>({});

  const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

  // --- LOGIC FOR FEEDBACK TAB ---
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

  const cities = useMemo(() => {
    const c = new Set<string>();
    feedback.forEach(item => {
      if (item.location) {
        const parts = item.location.split(',');
        const city = parts[0].trim();
        const prov = parts[1]?.trim();
        if (provinceFilter === 'all' || prov === provinceFilter) {
          c.add(city);
        }
      }
    });
    return Array.from(c).sort();
  }, [feedback, provinceFilter]);

  const filteredFeedback = useMemo(() => {
    return feedback.filter(item => {
      if (item.status === 'Addressed') return false;
      const matchesSearch = 
        (item.submittedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      const parts = (item.location || '').split(',');
      const itemCity = parts[0]?.trim();
      const itemProv = parts[1]?.trim();
      const matchesProvince = provinceFilter === "all" || itemProv === provinceFilter;
      const matchesCity = cityFilter === "all" || itemCity === cityFilter;
      return matchesSearch && matchesProvince && matchesCity;
    }).sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [feedback, searchTerm, cityFilter, provinceFilter]);

  // --- LOGIC FOR PROMOTION TAB ---
  const takenRoles = useMemo(() => {
    return allUsers
      .filter(u => !UNLIMITED_ROLES.includes(u.role) && u.role !== 'Supporter')
      .map(u => u.role);
  }, [allUsers]);

  const vacantRoles = useMemo(() => {
    return pddsLeadershipRoles.filter(role => !takenRoles.includes(role));
  }, [takenRoles]);

  const promotionQueue = useMemo(() => {
    return allUsers.filter(u => u.role === 'Supporter' && u.isApproved !== false)
      .sort((a: any, b: any) => (b.recruitCount || 0) - (a.recruitCount || 0));
  }, [allUsers]);

  const handleReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) {
      toast({ variant: "destructive", title: "Missing Remarks", description: "Please enter officer remarks before saving." });
      return;
    }
    setSaving(id);
    try {
      const docRef = doc(firestore, 'community_feedback', id);
      await updateDoc(docRef, { officialReply: text, status: "Addressed" });
      toast({ title: "Response Saved", description: "Submission marked as addressed." });
      setReplyText(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `community_feedback/${id}`, operation: 'update', requestResourceData: { officialReply: text, status: 'Addressed' } }));
    } finally {
      setSaving(null);
    }
  };

  const handlePromote = async (supporter: any) => {
    const newRole = selectedPromoRole[supporter.id];
    if (!newRole) {
      toast({ variant: "destructive", title: "Select Role", description: "Please choose a destination role for promotion." });
      return;
    }

    const confirmed = window.confirm(`OFFICIAL PROMOTION: Are you sure you want to promote ${supporter.fullName} to ${newRole}?`);
    if (!confirmed) return;

    setPromoting(supporter.id);
    try {
      const userRef = doc(firestore, 'users', supporter.id);
      await updateDoc(userRef, { 
        role: newRole,
        jurisdictionLevel: newRole === 'Member' ? 'City/Municipal' : 'National' 
      });

      // Audit Log
      await addDoc(collection(firestore, 'communication_audit'), {
        type: 'Official Promotion',
        message: `${userData?.fullName} promoted ${supporter.fullName} to ${newRole}.`,
        targetGroup: supporter.id,
        recipientCount: 1,
        status: 'Inducted',
        timestamp: serverTimestamp(),
        createdBy: userData?.uid || 'System'
      });

      toast({ 
        title: "Promotion Successful", 
        description: `${supporter.fullName} has been officially inducted as a ${newRole}.` 
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Promotion Failed", description: error.message });
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <ShieldCheck className="h-8 w-8" />
              Administrative Audit Center
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Verify sentiment, address concerns, and manage organizational talent.</p>
          </div>
        </div>

        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList className="bg-primary/5 border border-primary/10 h-12 p-1">
            <TabsTrigger value="feedback" className="px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              <MessageSquare className="h-3 w-3 mr-2" />
              Feedback Audit
            </TabsTrigger>
            <TabsTrigger value="promotion" className="px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-3 w-3 mr-2" />
              Promotion Queue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="space-y-6">
            <Card className="p-4 shadow-sm border-none bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Search Feedback</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 h-11" placeholder="Keyword..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Province</Label>
                  <Select onValueChange={setProvinceFilter} value={provinceFilter}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="All Provinces" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">City</Label>
                  <Select onValueChange={setCityFilter} value={cityFilter}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="All Cities" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {feedbackLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : filteredFeedback.length === 0 ? (
              <Card className="p-24 text-center border-dashed bg-muted/20">
                <p className="text-muted-foreground font-medium">No pending feedback matching your filters.</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredFeedback.map((item: any) => (
                  <Card key={item.id} className="shadow-lg border-l-4 border-l-amber-500 overflow-hidden">
                    <CardHeader className="bg-muted/10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-headline uppercase font-bold">{item.submittedBy}</CardTitle>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">{item.topic}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {item.location}</div>
                            <div>{item.timestamp ? format(item.timestamp.toDate(), 'PPp') : 'N/A'}</div>
                          </div>
                        </div>
                        <Badge className="bg-amber-500 uppercase text-[10px] font-black tracking-widest">PENDING</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="bg-muted/30 p-5 rounded-lg text-sm leading-relaxed border border-dashed italic">
                        "{item.message}"
                      </div>
                      <div className="space-y-4 pt-4 border-t border-primary/10">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <Send className="h-3 w-3" />
                          Officer Remarks
                        </Label>
                        <div className="space-y-3">
                          <Textarea 
                            placeholder="Provide official leadership response..."
                            className="min-h-[100px]"
                            value={replyText[item.id] || ""}
                            onChange={e => setReplyText({ ...replyText, [item.id]: e.target.value })}
                          />
                          <Button onClick={() => handleReply(item.id)} className="w-full font-black uppercase text-xs" disabled={saving === item.id}>
                            {saving === item.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Addressed</>}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="promotion" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-headline text-primary uppercase">Grassroots Promotion Queue</h2>
                <p className="text-xs text-muted-foreground font-medium">Identify and upgrade active supporters to official roles.</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary font-black uppercase text-[10px] h-8 px-4">
                {promotionQueue.length} Candidates
              </Badge>
            </div>

            <Card className="shadow-xl overflow-hidden border-none">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                    <TableHead className="text-[10px] font-black uppercase text-white pl-6">Candidate Info</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-white">Jurisdiction</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-white">Engagement</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-white">Upgrade Role</TableHead>
                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase text-white">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-24"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></TableCell></TableRow>
                  ) : promotionQueue.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic">No eligible supporters in the queue.</TableCell></TableRow>
                  ) : promotionQueue.map(supporter => (
                    <TableRow key={supporter.id} className="hover:bg-muted/30">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarImage src={supporter.photoURL} />
                            <AvatarFallback className="font-black text-xs">{supporter.fullName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-sm uppercase">{supporter.fullName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{supporter.phoneNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] font-bold uppercase">{supporter.city}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">{supporter.province}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-black">{supporter.recruitCount || 0} Recruits</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          onValueChange={(v) => setSelectedPromoRole({ ...selectedPromoRole, [supporter.id]: v })}
                          value={selectedPromoRole[supporter.id] || ""}
                        >
                          <SelectTrigger className="h-9 w-48 text-[10px] font-bold uppercase">
                            <SelectValue placeholder="Select New Rank..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Member" className="text-[10px] font-bold">Member (Unlimited)</SelectItem>
                            {vacantRoles.map(r => (
                              <SelectItem key={r} value={r} className="text-[10px] font-bold text-primary">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          size="sm" 
                          className="h-9 font-black uppercase text-[10px] tracking-widest"
                          disabled={!selectedPromoRole[supporter.id] || promoting === supporter.id || !hasExecutiveAccess}
                          onClick={() => handlePromote(supporter)}
                        >
                          {promoting === supporter.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <UserCheck className="h-3 w-3 mr-2" />}
                          Promote
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
