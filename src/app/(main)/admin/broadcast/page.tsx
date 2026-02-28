"use client";

import { useState, useMemo } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2, Send, Users, MessageSquare, AlertCircle, Globe, MapPin, CheckCircle2 } from "lucide-react";

const BATCH_SIZE = 300;

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

  // Logic to extract unique locations for filters
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

  const charLimit = 160;
  const isOverLimit = message.length > charLimit;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Title and message are required." });
      return;
    }

    setLoading(true);
    setProgress(0);
    setStatusMessage("Identifying target recipients...");

    try {
      // 1. Fetch matching recipients
      let targetUsers = allUsers.filter(u => u.role === 'Supporter' && u.phoneNumber);
      
      if (broadcastScope === "Province" && scopeValue) {
        targetUsers = targetUsers.filter(u => u.province === scopeValue);
      } else if (broadcastScope === "City" && scopeValue) {
        targetUsers = targetUsers.filter(u => u.city === scopeValue);
      }

      const phoneNumbers = targetUsers.map(u => u.phoneNumber).filter(n => n && n.length > 5);
      const totalRecipients = phoneNumbers.length;

      if (totalRecipients === 0) {
        throw new Error("No verified phone numbers found for the selected scope.");
      }

      // 2. Batching logic
      const batches = [];
      for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
        batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
      }

      setStatusMessage(`Starting distribution to ${totalRecipients} supporters...`);

      // 3. Sequential distribution
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setStatusMessage(`Sending batch ${i + 1} of ${batches.length}...`);
        
        const response = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `${title}: ${message}`,
            numbers: batch
          })
        });

        if (!response.ok) {
          console.error("Batch failure:", await response.text());
        }

        setProgress(Math.round(((i + 1) / batches.length) * 100));
      }

      // 4. Finalize Audit Logs
      await addDoc(collection(firestore, "announcements"), {
        title: title.trim(),
        message: message.trim(),
        targetGroup: `${broadcastScope}: ${scopeValue || 'National'}`,
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'System',
      });

      await addDoc(collection(firestore, "communication_audit"), {
        type: "SMS Broadcast",
        message: message.trim(),
        targetGroup: broadcastScope,
        scopeValue: scopeValue || "All",
        recipientCount: totalRecipients,
        status: "Completed",
        timestamp: serverTimestamp(),
        createdBy: user?.uid || 'System',
      });

      toast({ 
        title: "Mobilization Successful", 
        description: `Broadcast complete. Sent to ${totalRecipients} supporters.` 
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-lg shadow-inner">
            <Megaphone className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline uppercase tracking-tight">
              SMS Mobilizer
            </h1>
            <p className="text-muted-foreground text-sm font-medium">Rapid response alerts for the PDDS supporter network.</p>
          </div>
        </div>

        <Card className="shadow-xl border-t-4 border-primary">
          <form onSubmit={handleBroadcast}>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Draft SMS Broadcast
              </CardTitle>
              <CardDescription>Target supporters by region for localized mobilization.</CardDescription>
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
                  placeholder="e.g. URGENT: REGIONAL MEETING" 
                  className="font-bold uppercase h-11"
                  value={title}
                  onChange={e => setTitle(e.target.value.toUpperCase())}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Message Content</Label>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isOverLimit ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                    {message.length} / {charLimit}
                  </span>
                </div>
                <Textarea 
                  placeholder="Keep it concise for rapid reading..." 
                  className="min-h-[120px] text-sm leading-relaxed"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                {isOverLimit && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Exceeds 160 characters. Message will incur multiple SMS credits.
                  </p>
                )}
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
              <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Batches...</> : <><Globe className="mr-2 h-5 w-5" /> Execute Broadcast</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="bg-amber-50 p-4 rounded-lg border border-dashed border-amber-200">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Safety Notice:
          </h3>
          <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
            Broadcasts are restricted to 300 numbers per batch to ensure delivery stability across Philippine telco networks. Always test your links and character counts before executing, as SMS mobilizations cannot be retracted.
          </p>
        </div>
      </div>
    </div>
  );
}
