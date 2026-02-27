
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, MapPin, Send, CheckCircle2, Filter } from "lucide-react";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminAuditPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: feedback, loading } = useCollection('community_feedback');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Extract unique locations
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
      if (item.status === 'Addressed') return false; // Clear from pending view

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

  const handleReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) {
      toast({ variant: "destructive", title: "Missing Remarks", description: "Please enter officer remarks before saving." });
      return;
    }

    setSaving(id);
    try {
      const docRef = doc(firestore, 'community_feedback', id);
      await updateDoc(docRef, {
        officialReply: text,
        status: "Addressed"
      });
      toast({ title: "Response Saved", description: "Submission marked as addressed." });
      setReplyText(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: `community_feedback/${id}`,
        operation: 'update',
        requestResourceData: { officialReply: text, status: 'Addressed' }
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2 uppercase tracking-tight">
            Admin Audit Center
          </h1>
          <p className="text-muted-foreground mt-2">Monitor regional sentiment and address community concerns.</p>
        </div>

        <Card className="p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Keyword..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">Province</Label>
              <Select onValueChange={setProvinceFilter} value={provinceFilter}>
                <SelectTrigger><SelectValue placeholder="All Provinces" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest">City</Label>
              <Select onValueChange={setCityFilter} value={cityFilter}>
                <SelectTrigger><SelectValue placeholder="All Cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : filteredFeedback.length === 0 ? (
          <Card className="p-24 text-center border-dashed bg-muted/20">
            <p className="text-muted-foreground font-medium">No pending feedback matching your filters.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredFeedback.map((item: any) => (
              <Card key={item.id} className="shadow-lg border-l-4 border-l-amber-500">
                <CardHeader>
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
                <CardContent className="space-y-6">
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
      </div>
    </div>
  );
}
