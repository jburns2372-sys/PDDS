
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Filter, MessageSquare, MapPin, Send, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminAuditPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: feedback, loading } = useCollection('community_feedback');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const filteredFeedback = useMemo(() => {
    return feedback.filter(item => {
      const matchesSearch = 
        (item.submittedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTopic = topicFilter === "all" || item.topic === topicFilter;
      
      return matchesSearch && matchesTopic;
    }).sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [feedback, searchTerm, topicFilter]);

  const handleReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) {
      toast({ variant: "destructive", title: "Missing Reply", description: "Please enter a response before saving." });
      return;
    }

    setSaving(id);
    try {
      const docRef = doc(firestore, 'community_feedback', id);
      await updateDoc(docRef, {
        officialReply: text,
        status: "Addressed"
      });
      toast({ title: "Response Saved", description: "The supporter has been notified of your reply." });
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
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2 uppercase">
            <MessageSquare className="h-8 w-8" />
            Feedback Audit Center
          </h1>
          <p className="text-muted-foreground mt-2">Monitor community sentiment and provide official leadership responses.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex-1 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Search Submissions</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10" 
                placeholder="Name, location, or message content..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-64 space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Filter by Topic</Label>
            <Select onValueChange={setTopicFilter} value={topicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="Local Infrastructure">Local Infrastructure</SelectItem>
                <SelectItem value="Social Services">Social Services</SelectItem>
                <SelectItem value="Community Concerns">Community Concerns</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : filteredFeedback.length === 0 ? (
          <Card className="p-24 text-center border-dashed bg-muted/20">
            <p className="text-muted-foreground font-medium">No feedback submissions found matching your criteria.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredFeedback.map((item: any) => (
              <Card key={item.id} className={`shadow-lg border-l-4 ${item.status === 'Addressed' ? 'border-l-green-600' : 'border-l-amber-500'}`}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-headline uppercase">{item.submittedBy}</CardTitle>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase">{item.topic}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</div>
                        <div>{item.timestamp ? format(item.timestamp.toDate(), 'PPp') : 'N/A'}</div>
                      </div>
                    </div>
                    <Badge className={`uppercase text-[10px] font-black ${item.status === 'Addressed' ? 'bg-green-600' : 'bg-amber-500'}`}>
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed border italic">
                    "{item.message}"
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Send className="h-3 w-3" />
                      {item.officialReply ? 'Official Leadership Response' : 'Write Official Response'}
                    </Label>
                    
                    {item.officialReply ? (
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 text-sm font-medium">
                        {item.officialReply}
                        <div className="mt-2 flex justify-end">
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 uppercase font-black text-primary" onClick={() => setReplyText({ ...replyText, [item.id]: item.officialReply })}>
                                Edit Response
                            </Button>
                        </div>
                      </div>
                    ) : null}

                    {(!item.officialReply || replyText[item.id]) && (
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="Address the concern professionally..."
                          value={replyText[item.id] || ""}
                          onChange={e => setReplyText({ ...replyText, [item.id]: e.target.value })}
                        />
                        <Button 
                          onClick={() => handleReply(item.id)} 
                          className="w-full md:w-auto font-bold"
                          disabled={saving === item.id}
                        >
                          {saving === item.id ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Save & Send Response</>}
                        </Button>
                      </div>
                    )}
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
