
"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2, Send, FileText, Globe, Users, MessageSquare, AlertCircle } from "lucide-react";
import { jurisdictionLevels } from "@/lib/data";

export default function AdminBroadcastPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("All Supporters");
  const [documentLink, setDocumentLink] = useState("");
  const [sendSms, setSendSms] = useState(false);
  const [loading, setLoading] = useState(false);

  const charLimit = 160;
  const charCount = message.length;
  const isOverLimit = charCount > charLimit;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out title and message." });
      return;
    }

    setLoading(true);
    
    try {
      let recipientCount = 0;
      let smsNumbers: string[] = [];

      // If SMS is requested, fetch matching phone numbers
      if (sendSms) {
        let userQuery = query(collection(firestore, "users"), where("role", "==", "Supporter"));
        
        if (targetGroup !== "All Supporters") {
          userQuery = query(userQuery, where("jurisdictionLevel", "==", targetGroup));
        }

        const snapshot = await getDocs(userQuery);
        smsNumbers = snapshot.docs
          .map(doc => doc.data().phoneNumber)
          .filter(num => !!num);
        recipientCount = smsNumbers.length;

        if (smsNumbers.length > 0) {
          // Trigger the SMS API route
          const smsResponse = await fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `${title}: ${message}`,
              numbers: smsNumbers
            })
          });

          if (!smsResponse.ok) {
            console.error("SMS Gateway Error:", await smsResponse.text());
          }
        }
      }

      // 1. Save to Announcements (News Feed)
      const broadcastData = {
        title: title.trim(),
        message: message.trim(),
        targetGroup,
        documentLink: documentLink.trim() || null,
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'Unknown Officer',
      };
      await addDoc(collection(firestore, "announcements"), broadcastData);

      // 2. Log to Audit (History)
      await addDoc(collection(firestore, "communication_audit"), {
        type: sendSms ? "Dual (Push + SMS)" : "Push Only",
        message: message.trim(),
        targetGroup,
        recipientCount: sendSms ? recipientCount : 0,
        status: "Completed",
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'Unknown Officer',
      });
      
      toast({ 
        title: "Broadcast Successful", 
        description: sendSms 
          ? `Update sent to news feed and ${recipientCount} recipients via SMS.`
          : "Update is now live in the supporter news feed." 
      });
      
      setTitle("");
      setMessage("");
      setDocumentLink("");
      setTargetGroup("All Supporters");
      setSendSms(false);
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
          <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-inner">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline uppercase tracking-tight">
              Party Broadcast System
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Issue official alerts and SMS mobilizers to the movement.</p>
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-primary overflow-hidden">
          <form onSubmit={handleBroadcast}>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Draft Multi-Channel Announcement
              </CardTitle>
              <CardDescription>Messages are archived for official party auditing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-primary">Announcement Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. IMPORTANT: NEW POLICY UPDATE" 
                  className="font-bold uppercase h-11"
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
                    <SelectTrigger className="h-11">
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
                    className="h-11"
                    value={documentLink}
                    onChange={e => setDocumentLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-primary">Full Message Content</Label>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isOverLimit ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                    {charCount} / {charLimit} Characters
                  </span>
                </div>
                <Textarea 
                  id="message" 
                  placeholder="Detail the announcement here..." 
                  className="min-h-[180px] text-sm leading-relaxed"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                {isOverLimit && sendSms && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/5 text-destructive text-[10px] font-bold rounded border border-destructive/20 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    WARNING: MESSAGE EXCEEDS 160 CHARACTERS. SMS MAY BE SPLIT OR INCUR EXTRA CREDITS.
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-dashed">
                <Checkbox 
                  id="sendSms" 
                  checked={sendSms} 
                  onCheckedChange={(checked) => setSendSms(checked === true)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="sendSms" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Also send via SMS Mobilizer
                  </label>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Broadcasts directly to matching supporter mobile numbers.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t pt-6">
              <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-lg" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Distributing...</> : <><Globe className="mr-2 h-5 w-5" /> Execute Multi-Channel Broadcast</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="bg-primary/5 p-4 rounded-lg border border-dashed border-primary/20">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Officer Mobilization Note:
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            Multi-channel broadcasts are high-impact. SMS mobilization is restricted to verified Supporter numbers. Always verify your links and character counts before executing, as SMS broadcasts cannot be retracted once issued.
          </p>
        </div>
      </div>
    </div>
  );
}
