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
    <div className="bg-white p-8 md:p-12 border-b-4 border-primary/5 shadow-sm mb-10 rounded-3xl">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <PddsLogo className="h-24 w-auto" />
          <div>
            <h1 className="text-5xl md:text-7xl font-black font-headline text-primary uppercase tracking-tighter leading-none mb-4">
              Mabuhay, {userData?.fullName?.split(' ')[0] || 'Patriot'}!
            </h1>
            <div className="flex items-center gap-4">
              <Badge className="bg-primary/10 text-primary font-black uppercase text-sm px-4 py-1.5 border-none">{userData?.role}</Badge>
              <Badge className="bg-accent/20 text-accent-foreground font-black uppercase text-sm px-4 py-1.5 border-none">{userData?.city || 'National'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right hidden md:block">
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-1">Induction Status</p>
              <p className="text-xl font-black text-green-600 uppercase">Registry Verified</p>
           </div>
           <Button variant="outline" size="icon" className="rounded-2xl h-20 w-20 border-4 relative active:scale-95 transition-all">
              <Bell className="h-8 w-8 text-primary" />
              <span className="absolute top-3 right-3 h-4 w-4 bg-red-600 rounded-full border-4 border-white" />
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
    <div className="flex flex-col min-h-screen pb-24">
      <UserHeader userData={userData} />
      
      <div className="w-full space-y-12">
        {/* Launch Special Banner - Fluid 100% Width */}
        <Card className="bg-gradient-to-r from-primary to-blue-900 text-white border-none shadow-2xl overflow-hidden relative group rounded-[40px]">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Sparkles className="h-64 w-64" />
          </div>
          <CardContent className="p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="flex items-center gap-10">
              <div className="bg-accent p-8 rounded-3xl shadow-2xl animate-bounce shrink-0">
                <ShieldCheck className="h-16 w-16 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-4xl md:text-6xl font-black uppercase font-headline tracking-tighter leading-tight">
                  Launch Special: <span className="text-accent">First 1,000 Push</span>
                </h3>
                <p className="text-xl md:text-2xl font-medium opacity-90 mt-4 max-w-4xl leading-relaxed">
                  Complete your ID verification now to secure the exclusive **"Founding Patriot"** Digital Badge and a permanent **+100 Merit Point** headstart!
                </p>
              </div>
            </div>
            <Button 
              asChild={!userData?.isVerified} 
              className="h-20 md:h-24 px-16 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-xl rounded-2xl shrink-0 active:scale-95 transition-all text-2xl"
            >
              {userData?.isVerified ? (
                <span>Badge Secured</span>
              ) : (
                <Link href="/profile">Claim Badge Now</Link>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 12-Column Fluid Grid with 4-column desktop logic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* LEFT SIDEBAR: Patriot Progress (4/12) */}
            <div className="lg:col-span-4 space-y-12 order-last lg:order-first">
                <section id="patriot-progress" className="space-y-8">
                  <h2 className="text-3xl font-black uppercase text-primary tracking-tight flex items-center gap-4 px-2">
                    <Trophy className="h-8 w-8 text-accent" />
                    Patriot Progress
                  </h2>
                  <DigitalIdCard userData={userData} />
                  <MeritProgress meritPoints={userData?.meritPoints || 0} />
                  <SkillsProgress />
                </section>

                <Card className="shadow-2xl border-t-8 border-primary overflow-hidden rounded-[32px]">
                  <CardHeader className="bg-primary/5 pb-6">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-3">
                      <Share2 className="h-6 w-6 text-accent" />
                      Growth Directive
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-8 text-center">
                    <div className="py-4">
                      <p className="text-7xl font-black text-primary">{userData?.referralCount || 0}</p>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Recruits Inducted</p>
                    </div>
                    <div className="space-y-4 text-left px-4">
                      <Label className="text-xs font-black uppercase text-primary/60 tracking-widest">Your Referral Link</Label>
                      <div className="flex gap-3">
                        <Input value={`${domain}/join?ref=${userData?.uid}`} readOnly className="text-sm bg-muted h-14 font-mono font-bold" />
                        <Button size="icon" variant="outline" className="h-14 w-14 shrink-0 border-2 active:scale-95 transition-all" onClick={() => {
                          navigator.clipboard.writeText(`${domain}/join?ref=${userData?.uid}`);
                          toast({ title: "Copied!", description: "Earn 50 Merit Points per recruit!" });
                        }}>
                          <CapitalCopy className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* MAIN CONTENT: Daily Actions & Feed (8/12) */}
            <div className="lg:col-span-8 space-y-12">
                
                {/* Daily Action Center - Full Width */}
                <section id="action-center" className="space-y-8">
                  <h2 className="text-3xl font-black uppercase text-primary tracking-tight flex items-center gap-4 px-2">
                    <Target className="h-10 w-10 text-red-600" />
                    Daily Action Center
                  </h2>
                  <DailyActionGrid />
                </section>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-primary/5 p-2 border-2 border-primary/10 h-20 w-full justify-start overflow-x-auto gap-4 rounded-3xl">
                    <TabsTrigger value="newsfeed" className="px-12 h-full font-black uppercase text-sm tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-2xl">
                      <Newspaper className="h-6 w-6 mr-3" /> Bulletin
                    </TabsTrigger>
                    <TabsTrigger value="missions" className="px-12 h-full font-black uppercase text-sm tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-2xl">
                      <Trophy className="h-6 w-6 mr-3" /> Missions
                    </TabsTrigger>
                    <TabsTrigger value="impact" className="px-12 h-full font-black uppercase text-sm tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white rounded-2xl">
                      <Sparkles className="h-6 w-6 mr-3" /> Local Impact
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="newsfeed" className="pt-10 space-y-10 animate-in fade-in duration-500">
                    {announcementsLoading ? (
                        <div className="space-y-8">
                          <Skeleton className="h-80 w-full rounded-3xl" />
                          <Skeleton className="h-80 w-full rounded-3xl" />
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <Card className="p-32 text-center border-dashed border-4 bg-muted/20 rounded-[40px]">
                            <Megaphone className="h-24 w-24 text-muted-foreground/20 mx-auto mb-8" />
                            <p className="text-xl font-bold text-muted-foreground uppercase tracking-[0.2em]">No national directives broadcasted yet.</p>
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

                  <TabsContent value="missions" className="pt-10 animate-in fade-in duration-500">
                    <MissionBoard />
                  </TabsContent>

                  <TabsContent value="impact" className="pt-10 animate-in fade-in duration-500">
                    <ImpactFeed city={userData?.city} />
                  </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>
  );
}

function CapitalCopy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  );
}
