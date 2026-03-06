"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard } from "@/components/announcement-card";
import { useUserData } from "@/context/user-data-context";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalIdCard } from "@/components/digital-id-card";
import { DailyActionGrid } from "@/components/daily-action-grid";
import { MissionBoard } from "@/components/mission-board";
import { ImpactFeed } from "@/components/impact-feed";
import { MeritProgress } from "@/components/merit-progress";
import { SkillsProgress } from "@/components/skills-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Sparkles, Bell, Loader2, Megaphone, Trophy, MapPin, Share2, Hexagon, Newspaper, Target, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/firebase";
import PddsLogo from "@/components/icons/pdds-logo";
import Link from "next/link";

function UserHeader({userData}: {userData: any}) {
  return (
    <div className="bg-card p-6 md:p-8 border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <PddsLogo className="h-16 w-auto" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight leading-none">
              Mabuhay, {userData?.fullName?.split(' ')[0] || 'Patriot'}!
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary font-black uppercase text-[9px] border-none">{userData?.role}</Badge>
              <Badge className="bg-accent/20 text-accent-foreground font-black uppercase text-[9px] border-none">{userData?.city || 'National'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Induction Status</p>
              <p className="text-sm font-bold text-green-600 uppercase">Registry Verified</p>
           </div>
           <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-2 relative">
              <Bell className="h-5 w-5 text-primary" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full border-2 border-white" />
           </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const { userData, loading: userLoading } = useUserData();
  const { toast } = useToast();
  
  const [domain, setDomain] = useState("");
  const [activeTab, setActiveTab] = useState("newsfeed");

  const { data: allAnnouncements, loading: announcementsLoading } = useCollection('announcements');

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
    }
  }, []);

  const filteredAnnouncements = useMemo(() => {
    if (!userData) return [];
    return allAnnouncements.filter(item => {
      const target = item.targetGroup || "National";
      return target === "National" || target === userData.city;
    }).sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [allAnnouncements, userData]);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
        toast({ title: "Induction Complete!", description: "Success! You are now registered in the National Registry." });
        window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  if (userLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 bg-slate-50/50">
      <UserHeader userData={userData} />
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Launch Special Banner */}
        {!userData?.isVerified && (
          <Card className="bg-gradient-to-r from-primary to-blue-900 text-white border-none shadow-2xl overflow-hidden relative group mb-8 rounded-3xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="h-32 w-32" />
            </div>
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="bg-accent p-4 rounded-2xl shadow-2xl animate-bounce">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black uppercase font-headline tracking-tighter leading-tight">
                    Launch Special: <span className="text-accent">First 1,000 Push</span>
                  </h3>
                  <p className="text-sm font-medium opacity-80 mt-1 max-w-lg leading-relaxed">
                    Complete your ID verification now to secure the exclusive **"Founding Patriot"** Digital Badge and a permanent **+100 Merit Point** headstart!
                  </p>
                </div>
              </div>
              <Button asChild className="h-14 px-10 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-xl rounded-xl shrink-0">
                <Link href="/profile">Claim Badge Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* LEFT COLUMN: Patriot Progress & Profile */}
            <div className="lg:col-span-4 space-y-8 order-last lg:order-first">
                <section id="patriot-progress" className="space-y-4">
                  <h2 className="text-lg font-black uppercase text-primary tracking-tight flex items-center gap-2 px-1">
                    <Trophy className="h-5 w-5 text-accent" />
                    Patriot Progress
                  </h2>
                  <DigitalIdCard userData={userData} />
                  <MeritProgress meritPoints={userData?.meritPoints || 0} />
                  <SkillsProgress />
                </section>

                <Card className="shadow-lg border-t-4 border-primary overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-accent" />
                      Growth Directive
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-center py-2">
                      <p className="text-3xl font-black text-primary">{userData?.referralCount || 0}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Recruits Inducted</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-primary/60">Your Referral Link</Label>
                      <div className="flex gap-2">
                        <Input value={`${domain}/join?ref=${userData?.uid}`} readOnly className="text-[10px] bg-muted h-10 font-mono" />
                        <Button size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={() => {
                          navigator.clipboard.writeText(`${domain}/join?ref=${userData?.uid}`);
                          toast({ title: "Copied!", description: "Earn 50 Merit Points per recruit!" });
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: Daily Actions & Mission Feed */}
            <div className="lg:col-span-8 space-y-10">
                
                {/* Daily Action Center */}
                <section id="action-center" className="space-y-4">
                  <h2 className="text-xl font-black uppercase text-primary tracking-tight flex items-center gap-2 px-1">
                    <Target className="h-6 w-6 text-red-600" />
                    Daily Action Center
                  </h2>
                  <DailyActionGrid />
                </section>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full justify-start overflow-x-auto gap-2">
                    <TabsTrigger value="newsfeed" className="px-8 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Newspaper className="h-4 w-4 mr-2" /> Bulletin
                    </TabsTrigger>
                    <TabsTrigger value="missions" className="px-8 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Trophy className="h-4 w-4 mr-2" /> Missions
                    </TabsTrigger>
                    <TabsTrigger value="impact" className="px-8 h-full font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Sparkles className="h-4 w-4 mr-2" /> Local Impact
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="newsfeed" className="pt-6 space-y-6 animate-in fade-in duration-500">
                    {announcementsLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-48 w-full" />
                          <Skeleton className="h-48 w-full" />
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <Card className="p-12 text-center border-dashed border-2 bg-muted/20">
                            <Megaphone className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">No national directives broadcasted yet.</p>
                        </Card>
                    ) : (
                        filteredAnnouncements.map((item: any) => (
                            <AnnouncementCard 
                                key={item.id}
                                title={item.title}
                                date={item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                                fullText={item.message}
                                link={item.documentLink}
                            />
                        ))
                    )}
                  </TabsContent>

                  <TabsContent value="missions" className="pt-6 animate-in fade-in duration-500">
                    <MissionBoard />
                  </TabsContent>

                  <TabsContent value="impact" className="pt-6 animate-in fade-in duration-500">
                    <ImpactFeed city={userData?.city} />
                  </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>
  );
}
