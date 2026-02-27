
"use client";

import { useState } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Send, History, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const TOPICS = [
  "Local Infrastructure",
  "Social Services",
  "Community Concerns",
  "Security",
  "Others"
];

export function CommunityFeedback() {
  const { user, userData } = useUser() as any;
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Use useCollection with queries for user-specific history
  const { data: history, loading: loadingHistory } = useCollection('community_feedback', {
    queries: user ? [{ attribute: 'submitterUid', operator: '==', value: user.uid }] : []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    if (!topic || !message) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please select a topic and enter your message." });
      return;
    }

    setLoading(true);
    const feedbackData = {
      topic,
      message,
      status: "Received",
      submittedBy: userData.fullName || "Anonymous Member",
      submitterUid: user.uid,
      location: `${userData.city || 'National'}, ${userData.barangay || ''}`,
      timestamp: serverTimestamp(),
      officialReply: ""
    };

    try {
      await addDoc(collection(firestore, 'community_feedback'), feedbackData);
      toast({ title: "Feedback Received", description: "Thank you for sharing your concerns with the party." });
      setTopic("");
      setMessage("");
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: 'community_feedback',
        operation: 'create',
        requestResourceData: feedbackData
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-t-4 border-primary">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-primary">
              <MessageSquare className="h-5 w-5" />
              Community Feedback & Sentiment
            </CardTitle>
            <CardDescription>Share your thoughts, suggestions, or concerns with the party leadership.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Topic</Label>
              <Select onValueChange={setTopic} value={topic}>
                <SelectTrigger>
                  <SelectValue placeholder="What is this about?" />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your Message</Label>
              <Textarea 
                placeholder="Type your suggestion or concern here..." 
                className="min-h-[120px]"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Submit Feedback</>}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-bold font-headline text-primary flex items-center gap-2">
          <History className="h-5 w-5" />
          Submission History
        </h3>
        
        {loadingHistory ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed">No previous submissions found.</p>
        ) : (
          <div className="space-y-4">
            {history.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((item: any) => (
              <Card key={item.id} className="shadow-sm">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-bold text-[10px] uppercase">{item.topic}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {item.timestamp ? format(item.timestamp.toDate(), 'PPp') : 'Just now'}
                    </span>
                  </div>
                  <Badge 
                    variant={item.status === 'Addressed' ? 'default' : 'secondary'}
                    className={`text-[9px] font-black uppercase ${item.status === 'Addressed' ? 'bg-green-600' : ''}`}
                  >
                    {item.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {item.message}
                </CardContent>
                {item.officialReply && (
                  <CardFooter className="bg-primary/5 p-4 border-t border-primary/10 flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      <MessageCircle className="h-3 w-3" />
                      Official Response
                    </div>
                    <p className="text-sm text-foreground/80 italic leading-relaxed">"{item.officialReply}"</p>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
