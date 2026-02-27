
"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2, Send, FileText, Globe, Users } from "lucide-react";
import { jurisdictionLevels } from "@/lib/data";

export default function AdminBroadcastPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("All Supporters");
  const [documentLink, setDocumentLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out title and message." });
      return;
    }

    setLoading(true);
    const broadcastData = {
      title: title.trim(),
      message: message.trim(),
      targetGroup,
      documentLink: documentLink.trim() || null,
      timestamp: serverTimestamp(),
      createdBy: user?.uid || 'Unknown Officer',
    };

    try {
      await addDoc(collection(firestore, "announcements"), broadcastData);
      
      toast({ 
        title: "Broadcast Sent Successfully!", 
        description: "Your update is now live in the supporter news feed." 
      });
      
      setTitle("");
      setMessage("");
      setDocumentLink("");
      setTargetGroup("All Supporters");
    } catch (error: any) {
      console.error("Broadcast failed:", error);
      toast({ variant: "destructive", title: "Broadcast Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline uppercase tracking-tight">
              Party Broadcast System
            </h1>
            <p className="text-muted-foreground">Issue official announcements and push alerts to the movement.</p>
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-primary">
          <form onSubmit={handleBroadcast}>
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Draft Announcement
              </CardTitle>
              <CardDescription>Target specific jurisdictions or the entire national supporter base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-primary">Announcement Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. IMPORTANT: NEW POLICY UPDATE" 
                  className="font-bold uppercase"
                  value={title}
                  onChange={e => setTitle(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                    <Users className="h-3 w-3" /> Target Group
                  </Label>
                  <Select onValueChange={setTargetGroup} value={targetGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Supporters">All Supporters (National)</SelectItem>
                      {jurisdictionLevels.map(l => (
                        <SelectItem key={l} value={l}>{l} Level Only</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Document Link (Optional)
                  </Label>
                  <Input 
                    placeholder="https://..." 
                    value={documentLink}
                    onChange={e => setDocumentLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-primary">Full Message Content</Label>
                <Textarea 
                  id="message" 
                  placeholder="Detail the announcement here..." 
                  className="min-h-[180px]"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t pt-6">
              <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-lg" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Distributing...</> : <><Globe className="mr-2 h-5 w-5" /> Execute Broadcast</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="bg-primary/5 p-4 rounded-lg border border-dashed border-primary/20">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Officer Note:</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sending a broadcast instantly notifies all registered supporters. Please verify your links and content before execution as broadcasts are archived for official party auditing.
          </p>
        </div>
      </div>
    </div>
  );
}
