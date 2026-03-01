
"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Send, Globe, Loader2, Sparkles, ShieldCheck } from "lucide-react";

/**
 * @fileOverview PRO Official Broadcast Center.
 * Handles the publication of official party announcements to the National Bulletin.
 */
export default function ProBulletinPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { userData } = useUserData();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("National");
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Incomplete Fields", description: "Please provide a headline and body content." });
      return;
    }

    setIsPublishing(true);
    const announcementData = {
      title: title.trim(),
      message: message.trim(),
      targetGroup: targetGroup,
      status: "published",
      authorName: userData?.fullName || "PRO Office",
      authorRole: userData?.role || "PRO",
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, "announcements"), announcementData);
      
      toast({ 
        title: "Update Published!", 
        description: `Your announcement is now live for: ${targetGroup}` 
      });
      
      setTitle("");
      setMessage("");
      setTargetGroup("National");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Publication Failed", description: error.message });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-background min-h-screen pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
          <div className="p-3 bg-red-700 text-white rounded-lg shadow-xl">
            <Megaphone className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline uppercase tracking-tight">Broadcast Center</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">Publish official directives to the National Bulletin.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-xl border-t-4 border-red-700 overflow-hidden">
            <form onSubmit={handlePublish}>
              <CardHeader className="bg-red-50/50 border-b">
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-red-800">
                  <ShieldCheck className="h-5 w-5" />
                  Official Press Release
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">
                  Content will be pushed to members' home feeds instantly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Target Audience</Label>
                  <Select value={targetGroup} onValueChange={setTargetGroup}>
                    <SelectTrigger className="h-12 border-2">
                      <SelectValue placeholder="Select Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National" className="font-bold uppercase text-[10px]">National (All Members)</SelectItem>
                      <SelectItem value="Quezon City" className="font-bold uppercase text-[10px]">Quezon City Hub</SelectItem>
                      <SelectItem value="Manila" className="font-bold uppercase text-[10px]">Manila Hub</SelectItem>
                      <SelectItem value="Cebu" className="font-bold uppercase text-[10px]">Cebu Hub</SelectItem>
                      <SelectItem value="Davao" className="font-bold uppercase text-[10px]">Davao Hub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Headline</Label>
                  <Input 
                    placeholder="e.g. NEW FEDERALISM ROADMAP RELEASED" 
                    className="h-12 font-bold text-lg border-2"
                    value={title}
                    onChange={e => setTitle(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Body Content</Label>
                  <Textarea 
                    placeholder="Detailed party update or mobilization instruction..." 
                    className="min-h-[200px] text-base font-medium leading-relaxed border-2"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-2xl bg-red-700 hover:bg-red-800"
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Distributing...</>
                  ) : (
                    <><Send className="mr-2 h-6 w-6" /> Publish Official Update</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-accent bg-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  PRO Strategy Note
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 italic text-sm text-muted-foreground leading-relaxed">
                "Announcements published here are automatically processed by our AI Briefing system for members. Keep headlines punchy and use the Body Content for strategic depth."
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Live Feed Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex justify-between py-2 border-b text-[10px] font-bold uppercase">
                  <span>Scope</span>
                  <Badge variant="outline" className="text-[9px] font-black text-primary border-primary/20">{targetGroup}</Badge>
                </div>
                <div className="flex justify-between py-2 text-[10px] font-bold uppercase">
                  <span>Visibility</span>
                  <span className="text-green-600">Public (Authorized)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
