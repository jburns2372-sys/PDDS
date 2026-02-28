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
import { Megaphone, Loader2, Send, Users, MessageSquare, AlertCircle, Globe, CheckCircle2, UserCheck, Calculator } from "lucide-react";

const BATCH_SIZE = 100; // Smaller batches for personalized payloads

export default function AdminBroadcastPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { data: allUsers } = useCollection('users');
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastScope, setBroadcastScope] = useState("National");
  const [scopeValue, setScopeValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [previewUser, setPreviewUser] = useState<any>(null);

  // Filter logic for provinces and cities
  const provinces = useMemo(() => {
    const p = new Set<string>();
    allUsers.forEach(u => u.province && p.add(u.province));
    return Array.from(p).sort();
  }, [allUsers]);

  const cities = useMemo(() => {
    const c = new Set<string>();
    allUsers.forEach(u => u.city && c.add(u.city));
    return Array.from(c).sort();
  }, [allUsers]);

  // Target users based on scope
  const targetUsers = useMemo(() => {
    let filtered = allUsers.filter(u => u.role === 'Supporter' && u.phoneNumber);
    if (broadcastScope === "Province" && scopeValue) {
      filtered = filtered.filter(u => u.province === scopeValue);
    } else if (broadcastScope === "City" && scopeValue) {
      filtered = filtered.filter(u => u.city === scopeValue);
    }
    return filtered;
  }, [allUsers, broadcastScope, scopeValue]);

  // Pick a random user for the preview whenever target list changes
  useEffect(() => {
    if (targetUsers.length > 0) {
      const random = targetUsers[Math.floor(Math.random() * targetUsers.length)];
      setPreviewUser(random);
    } else {
      setPreviewUser(null);
    }
  }, [targetUsers]);

  // Personalization Logic
  const personalize = (text: string, userData: any) => {
    if (!userData) return text;
    const firstName = (userData.fullName || "Member").split(' ')[0];
    return text
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{fullName}}/g, userData.fullName || "Member")
      .replace(/{{province}}/g, userData.province || "your region")
      .replace(/{{city}}/g, userData.city || "your city")
      .replace(/{{barangay}}/g, userData.barangay || "your barangay");
  };

  const previewMessage = useMemo(() => personalize(message, previewUser), [message, previewUser]);
  const charCount = previewMessage.length;
  const segments = Math.ceil(charCount / 160) || 1;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Title and message are required." });
      return;
    }

    if (targetUsers.length === 0) {
      toast({ variant: "destructive", title: "No Recipients", description: "No verified supporters found in this scope." });
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusMessage("Preparing personalized payloads...");

    try {
      // 1. Generate all personalized messages
      const tasks = targetUsers.map(u => ({
        phoneNumber: u.phoneNumber,
        personalizedMsg: `${title}: ${personalize(message, u)}`
      }));

      // 2. Batching logic for unique messages
      const batches = [];
      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        batches.push(tasks.slice(i, i + BATCH_SIZE));
      }

      // 3. Sequential distribution
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setStatusMessage(`Dispatching Batch ${i + 1} of ${batches.length}...`);
        
        const response = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isPersonalized: true,
            tasks: batch
          })
        });

        if (!response.ok) {
          console.error("Batch failure:", await response.text());
        }

        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      // 4. Audit Trail
      await addDoc(collection(firestore, "announcements"), {
        title: title.trim(),
        message: message.trim(),
        isPersonalized: true,
        targetGroup: `${broadcastScope}: ${scopeValue || 'National'}`,
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'System',
      });

      await addDoc(collection(firestore, "communication_audit"), {
        type: "Personalized SMS Broadcast",
        message: message.trim(),
        targetGroup: broadcastScope,
        scopeValue: scopeValue || "All",
        recipientCount: targetUsers.length,
        segmentsPerUser: segments,
        status: "Completed",
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'System',
      });

      toast({ 
        title: "Personalized Mobilization Complete", 
        description: `Broadcast successfully dispatched to ${targetUsers.length} supporters.` 
      });
      
      setTitle("");
      setMessage("");
      setProgress(0);
      setStatusMessage("");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Broadcast Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-inner">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline uppercase tracking-tight">
              Personalized SMS Mobilizer
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Use data placeholders to increase supporter response rates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-t-4 border-primary">
              <form onSubmit={handleBroadcast}>
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Draft Personalized Alert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Broadcast Scope</Label>
                      <Select onValueChange={(v) => { setBroadcastScope(v); setScopeValue(""); }} value={broadcastScope}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="National">National (All Supporters)</SelectItem>
                          <SelectItem value="Province">By Province / Region</SelectItem>
                          <SelectItem value="City">By City / Municipality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {broadcastScope !== "National" && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {broadcastScope === "Province" ? "Select Province" : "Select City"}
                        </Label>
                        <Select onValueChange={setScopeValue} value={scopeValue}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={`Select specific ${broadcastScope}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {(broadcastScope === "Province" ? provinces : cities).map(val => (
                              <SelectItem key={val} value={val}>{val}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Alert Title</Label>
                    <Input 
                      placeholder="e.g. URGENT: ASSEMBLY" 
                      className="font-bold uppercase h-11"
                      value={title}
                      onChange={e => setTitle(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Message Template</Label>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${charCount > 160 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {charCount} Chars
                        </span>
                        <Badge variant="outline" className="text-[9px] font-black border-primary/20">
                          {segments} Segment{segments > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <Textarea 
                      placeholder="Hello {{firstName}}, we need you at the {{city}} event..." 
                      className="min-h-[150px] text-sm leading-relaxed"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['firstName', 'fullName', 'province', 'city', 'barangay'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setMessage(prev => prev + `{{${tag}}}`)}
                          className="text-[9px] font-black uppercase px-2 py-1 bg-muted hover:bg-primary hover:text-white rounded border transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading && (
                    <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                        <span>{statusMessage}</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-primary/10" />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t pt-6">
                  <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest" disabled={loading || targetUsers.length === 0}>
                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Distributing Payloads...</> : <><Globe className="mr-2 h-5 w-5" /> Execute Personalized Broadcast</>}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-accent overflow-hidden">
              <CardHeader className="bg-accent/5 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-accent" />
                  Live Preview
                </CardTitle>
                <CardDescription className="text-[10px]">Sample based on a random recipient in your selected scope.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-white p-4 rounded-xl border-2 border-dashed border-accent/20 min-h-[120px] flex flex-col justify-between">
                  <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                    {message ? (
                      `"${title}: ${previewMessage}"`
                    ) : (
                      <span className="text-muted-foreground opacity-50">Start typing to see a personalized preview...</span>
                    )}
                  </p>
                  {previewUser && (
                    <div className="mt-4 pt-4 border-t border-dashed flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent-foreground">
                        {previewUser.fullName?.charAt(0)}
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Target: {previewUser.fullName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Mobilization Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Target Audience</span>
                  <span className="text-sm font-black">{targetUsers.length} Supporters</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Total SMS Segments</span>
                  <span className="text-sm font-black text-primary">{(targetUsers.length * segments).toLocaleString()}</span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                  * Based on {segments} segment{segments > 1 ? 's' : ''} per user. Personalized messages vary in length; preview uses the longest possible estimation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
