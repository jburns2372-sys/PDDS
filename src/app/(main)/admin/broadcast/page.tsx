
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2, Send, Globe, UserCheck, Calculator } from "lucide-react";
import { pddsLeadershipRoles } from "@/lib/data";

const BATCH_SIZE = 100;

export default function AdminBroadcastPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: allUsers } = useCollection('users');
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastScope, setBroadcastScope] = useState("National");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [previewUser, setPreviewUser] = useState<any>(null);

  const targetUsers = useMemo(() => {
    let filtered = allUsers.filter(u => u.phoneNumber);
    
    if (broadcastScope === "Leadership") {
      filtered = filtered.filter(u => 
        pddsLeadershipRoles.includes(u.role) || 
        ['Admin', 'Officer'].includes(u.role) ||
        u.isSuperAdmin === true
      );
    } else if (broadcastScope === "Supporters") {
      filtered = filtered.filter(u => u.role === 'Supporter');
    } else if (broadcastScope === "National") {
      filtered = filtered.filter(u => u.role !== 'Supporter' && u.role !== 'Guest');
    }
    
    return filtered;
  }, [allUsers, broadcastScope]);

  useEffect(() => {
    if (targetUsers.length > 0) {
      setPreviewUser(targetUsers[Math.floor(Math.random() * targetUsers.length)]);
    } else {
      setPreviewUser(null);
    }
  }, [targetUsers]);

  const personalize = (text: string, userData: any) => {
    if (!userData) return text;
    const firstName = (userData.fullName || "Member").split(' ')[0];
    return text
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{fullName}}/g, userData.fullName || "Member")
      .replace(/{{city}}/g, userData.city || "your city");
  };

  const previewMessage = useMemo(() => personalize(message, previewUser), [message, previewUser]);
  const charCount = previewMessage.length;
  const segments = Math.ceil(charCount / 160) || 1;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || targetUsers.length === 0) return;

    setLoading(true);
    setProgress(0);
    setStatusMessage("Preparing payloads...");

    try {
      const tasks = targetUsers.map(u => ({
        phoneNumber: u.phoneNumber,
        personalizedMsg: `${title}: ${personalize(message, u)}`
      }));

      const batches = [];
      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        batches.push(tasks.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        setStatusMessage(`Dispatching Batch ${i + 1}...`);
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPersonalized: true, tasks: batches[i] })
        });
        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      if (broadcastScope === "National") {
        await addDoc(collection(firestore, "announcements"), {
          title: title.trim(),
          message: message.trim(),
          targetGroup: "National",
          timestamp: serverTimestamp(),
          createdBy: user?.uid || 'System',
        });
      }

      await addDoc(collection(firestore, "communication_audit"), {
        type: "Personalized SMS Broadcast",
        message: message.trim(),
        targetGroup: broadcastScope,
        recipientCount: targetUsers.length,
        status: "Completed",
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'System',
      });

      toast({ title: "Mobilization Dispatched", description: `Sent to ${targetUsers.length} members.` });
      setTitle(""); setMessage(""); setProgress(0);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-inner">
            <Megaphone className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline uppercase tracking-tight">Mobilization Broadcast</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">Distribute personalized alerts nationwide.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-t-4 border-primary">
              <form onSubmit={handleBroadcast}>
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-lg font-headline flex items-center gap-2"><Send className="h-5 w-5" /> Draft Organizational Alert</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Scope</Label>
                    <Select onValueChange={setBroadcastScope} value={broadcastScope}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Leadership">Leadership Core</SelectItem>
                        <SelectItem value="National">National (Members Only)</SelectItem>
                        <SelectItem value="Supporters">All Supporters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Alert Title</Label>
                    <Input placeholder="EMERGENCY ALERT" className="font-bold uppercase h-12" value={title} onChange={e => setTitle(e.target.value.toUpperCase())} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Template</Label>
                      <Badge variant="outline" className="text-[9px] font-black">{charCount} Chars • {segments} Segments</Badge>
                    </div>
                    <Textarea placeholder="Hello {{firstName}}..." className="min-h-[150px] text-sm md:text-base" value={message} onChange={e => setMessage(e.target.value)} />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['firstName', 'fullName', 'city'].map(tag => (
                        <button key={tag} type="button" onClick={() => setMessage(prev => prev + `{{${tag}}}`)} className="text-[9px] font-black uppercase px-2 py-1 bg-muted rounded border hover:bg-primary hover:text-white transition-colors">+ {tag}</button>
                      ))}
                    </div>
                  </div>

                  {loading && (
                    <div className="space-y-3 p-4 bg-primary/5 rounded-lg border">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest"><span>{statusMessage}</span><span>{progress}%</span></div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t pt-6">
                  <Button type="submit" className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl" disabled={loading || targetUsers.length === 0}>
                    {loading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Distributing...</> : <><Globe className="mr-2 h-6 w-6" /> Execute Broadcast</>}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-accent">
              <CardHeader className="bg-accent/5 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><UserCheck className="h-4 w-4" /> Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 italic text-sm text-foreground/80 leading-relaxed border-2 border-dashed m-4 rounded-xl">
                {message ? `"${title}: ${previewMessage}"` : "Draft a message to see preview..."}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Calculator className="h-4 w-4" /> Logistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex justify-between py-2 border-b text-[10px] font-bold uppercase"><span>Target</span><span className="text-sm font-black">{targetUsers.length}</span></div>
                <div className="flex justify-between py-2 border-b text-[10px] font-bold uppercase"><span>SMS Units</span><span className="text-sm font-black text-primary">{(targetUsers.length * segments).toLocaleString()}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
