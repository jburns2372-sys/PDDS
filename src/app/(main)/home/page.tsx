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
    <div className="bg-white p-6 md:p-8 border-b-4 border-primary/5 shadow-sm mb-6 rounded-3xl relative z-10">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <PddsLogo className="h-16 md:h-20 w-auto" />
          <div>
            <h1 className="text-3xl md:text-5xl font-black font-headline text-primary uppercase tracking-tighter leading-none mb-2">
              Mabuhay, {userData?.fullName?.split(' ')[0] || 'Patriot'}!
            </h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary font-black uppercase text-xs px-3 py-1 border-none">{userData?.role}</Badge>
              <Badge className="bg-accent/20 text-accent-foreground font-black uppercase text-xs px-3 py-1 border-none">{userData?.city || 'National'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Induction Status</p>
              <p className="text-lg font-black text-green-600 uppercase">Registry Verified</p>
           </div>
           <Button variant="outline" size="icon" className="rounded-2xl h-14 w-14 border-2 relative active:scale-95 transition-all shadow-sm">
              <Bell className="h-6 w-6 text-primary" />
              <span className="absolute top-2 right-2 h-3 w-3 bg-red-600 rounded-full border-2 border-white" />
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

  if (userLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-20 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 relative overflow-hidden">
      <UserHeader userData={userData} />
      
      <div className="w-full space-y-8 relative z-10 px-2 md:px-0">
        {/* Launch Special Banner - Fluid 100% Width */}
        <Card className="bg-gradient-to-r from-primary to-blue-900 text-white border-none shadow-2xl overflow-hidden relative group rounded-[32px]">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="h-48 w-48" />
          </div>
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-8">
              <div className="bg-accent p-6 rounded-2xl shadow-2xl animate-bounce shrink-0">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-black uppercase font-headline tracking-tighter leading-tight">
                  Launch Special: <span className="text-accent">First 1,000 Push</span>
                </h3>
                <p className="text-lg md:text-xl font-medium opacity-90 mt-2 max-w-3xl leading-relaxed">
                  Complete your ID verification now to secure the exclusive **"Founding Patriot"** Digital Badge and a permanent **+100 Merit Point** headstart!
                </p>
              </div>
            </div>
            {userData?.isVerified ? (
              <Button 
                className="h-16 px-12 bg-white/10 text-white font-black uppercase tracking-widest shadow-xl rounded-xl shrink-0 border-2 border-white/20"
                disabled
              >
                Badge Secured
              </Button>
            ) : (
              <Button 
                asChild
                className="h-16 px-12 bg-accent hover:bg-white text-primary font-black uppercase tracking-widest shadow-xl rounded-xl shrink-0 active:scale-95 transition-all text-xl"
              >
                <Link href="/profile">Claim Badge Now</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 12-Column Fluid Grid with 4-column desktop logic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDEBAR: Patriot Progress (4/12) */}
            <div className="lg:col-span-4 space-y-8 order-last lg:order-first">
                <section id="patriot-progress" className="space-y-6">
                  <h2 className="text-2xl font-black uppercase text-primary tracking-tight flex items-center gap-3 px-2">
                    <Trophy className="h-6 w-6 text-accent" />
                    Patriot Progress
                  </h2>
                  <DigitalIdCard userData={userData} />
                  <MeritProgress meritPoints={userData?.meritPoints || 0} />
                  <SkillsProgress />
                </section>

                <Card className="shadow-2xl border-t-8 border-primary overflow-hidden rounded-[24px] bg-white">
                  <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-accent" />
                      Growth Directive
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6 text-center">
                    <div className="py-2">
                      <p className="text-5xl font-black text-primary">{userData?.referralCount || 0}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Recruits Inducted</p>
                    </div>
                    <div className="space-y-3 text-left px-4">
                      <Label className="text-[9px] font-black uppercase text-primary/60 tracking-widest">Your Referral Link</Label>
                      <div className="flex gap-2">
                        <Input value={`${domain}/join?ref=${userData?.uid}`} readOnly className="text-xs bg-muted h-11 font-mono font-bold border-2" />
                        <Button size="icon" variant="outline" className="h-11 w-11 shrink-0 border-2 active:scale-95 transition-all hover:bg-primary hover:text-white" onClick={() => {
                          navigator.clipboard.writeText(`${domain}/join?ref=${userData?.uid}`);
                          toast({ title: "Link Copied!", description: "Earn 50 Merit Points per recruit!" });
                        }}>
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* MAIN CONTENT: Daily Actions & Feed (8/12) */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Daily Action Center - Full Width */}
                <section id="action-center" className="space-y-6">
                  <h2 className="text-2xl font-black uppercase text-primary tracking-tight flex items-center gap-3 px-2">
                    <Target className="h-8 w-8 text-red-600" />
                    Daily Action Center
                  </h2>
                  <DailyActionGrid />
                </section>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-primary/5 p-1 border-2 border-primary/10 h-16 w-full justify-start overflow-x-auto gap-2 rounded-2xl">
                    <TabsTrigger value="newsfeed" className="px-8 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                      <Newspaper className="h-5 w-5 mr-2" /> Bulletin
                    </TabsTrigger>
                    <TabsTrigger value="missions" className="px-8 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                      <Trophy className="h-5 w-5 mr-2" /> Missions
                    </TabsTrigger>
                    <TabsTrigger value="impact" className="px-8 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl transition-all">
                      <Sparkles className="h-5 w-5 mr-2" /> Local Impact
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="newsfeed" className="pt-8 space-y-8 animate-in fade-in duration-500">
                    {announcementsLoading ? (
                        <div className="space-y-6">
                          <Skeleton className="h-64 w-full rounded-2xl" />
                          <Skeleton className="h-64 w-full rounded-2xl" />
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <Card className="p-24 text-center border-dashed border-4 bg-muted/20 rounded-[32px]">
                            <Megaphone className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                            <p className="text-lg font-bold text-muted-foreground uppercase tracking-[0.2em]">No national directives broadcasted yet.</p>
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

                  <TabsContent value="missions" className="pt-8 animate-in fade-in duration-500">
                    <MissionBoard />
                  </TabsContent>

                  <TabsContent value="impact" className="pt-8 animate-in fade-in duration-500">
                    <ImpactFeed city={userData?.city} />
                  </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>
  );
}
