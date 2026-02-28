
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
import { Search, Loader2, MapPin, Send, CheckCircle2, UserPlus, MessageSquare, TrendingUp, ShieldCheck, UserCheck, Phone } from "lucide-react";
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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [selectedPromoRole, setSelectedPromoRole] = useState<Record<string, string>>({});

  const hasExecutiveAccess = userData?.role === 'President' || userData?.role === 'Admin' || userData?.isSuperAdmin;

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

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />
              Audit Center
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage sentiment and organizational growth.</p>
          </div>
        </div>

        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList className="bg-primary/5 border border-primary/10 h-14 p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="feedback" className="px-6 font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
              <MessageSquare className="h-3 w-3 mr-2" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="promotion" className="px-6 font-black uppercase text-[10px] tracking-widest flex-1 md:flex-none">
              <TrendingUp className="h-3 w-3 mr-2" /> Promotion
            </TabsTrigger>
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

          <TabsContent value="promotion" className="space-y-6">
            {/* Desktop View */}
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

            {/* Mobile Card View */}
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
        </Tabs>
      </div>
    </div>
  );
}
