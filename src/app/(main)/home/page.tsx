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
    <div className="bg-card p-6 md:p-10 lg:px-12 border-b shadow-sm">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <PddsLogo className="h-20 w-auto" />
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-headline text-primary uppercase tracking-tight leading-none">
              Mabuhay, {userData?.fullName?.split(' ')[0] || 'Patriot'}!
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary font-black uppercase text-xs px-3 py-1 border-none">{userData?.role}</Badge>
              <Badge className="bg-accent/20 text-accent-foreground font-black uppercase text-xs px-3 py-1 border-none">{userData?.city || 'National'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right hidden md:block">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Induction Status</p>
              <p className="text-base font-black text-green-600 uppercase">Registry Verified</p>
           </div>
           <Button variant="outline" size="icon" className="rounded-full h-14 w-14 border-2 relative active:scale-95 transition-all">
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
      
      <div className="p-4 md:p-10 lg:p-12 w-full">
        {/* Launch Special Banner - Fluid Full Width */}
        <Card className="bg-gradient-to-r from-primary to-blue-900 text-white border-none shadow-2xl overflow-hidden relative group mb-10 rounded-3xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="h-40 w-40" />
          </div>
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-8">
              <div className="bg-accent p-5 rounded-2xl shadow-2xl animate-bounce shrink-0">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-black uppercase font-headline tracking-tighter leading-tight">
                  Launch Special: <span className="text-accent">First 1,000 Push</span>
                </h3>
                <p className="text-base md:text-lg font-medium opacity-90 mt-2 max-w-3xl leading-relaxed">
                  Complete your ID verification now to secure the exclusive **"Founding Patriot"** Digital Badge and a permanent **+100 Merit Point** headstart!
                </p>
              </div>
            </div>
            <Button 
              asChild={!userData?.isVerified} 
              className="h-16 md:h-20 px-14 bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest shadow-xl rounded-xl shrink-0 active:scale-95 transition-all text-lg"
            >
              {userData?.isVerified ? (
                <span>Badge Secured</span>
              ) : (
                <Link href="/profile">Claim Badge Now</Link>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 12-Column Fluid Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT COLUMN: Patriot Progress & Profile (4/12) */}
            <div className="lg:col-span-4 space-y-10 order-last lg:order-first">
                <section id="patriot-progress" className="space-y-6">
                  <h2 className="text-2xl font-black uppercase text-primary tracking-tight flex items-center gap-3 px-1">
                    <Trophy className="h-6 w-6 text-accent" />
                    Patriot Progress
                  </h2>
                  <DigitalIdCard userData={userData} />
                  <MeritProgress meritPoints={userData?.meritPoints || 0} />
                  <SkillsProgress />
                </section>

                <Card className="shadow-lg border-t-4 border-primary overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-accent" />
                      Growth Directive
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6 text-center">
                    <div className="py-2">
                      <p className="text-5xl font-black text-primary">{userData?.referralCount || 0}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Recruits Inducted</p>
                    </div>
                    <div className="space-y-3 text-left">
                      <Label className="text-xs font-black uppercase text-primary/60">Your Referral Link</Label>
                      <div className="flex gap-2">
                        <Input value={`${domain}/join?ref=${userData?.uid}`} readOnly className="text-xs bg-muted h-12 font-mono" />
                        <Button size="icon" variant="outline" className="h-12 w-12 shrink-0 active:scale-95 transition-all" onClick={() => {
                          navigator.clipboard.writeText(`${domain}/join?ref=${userData?.uid}`);
                          toast({ title: "Copied!", description: "Earn 50 Merit Points per recruit!" });
                        }}>
                          <CapitalCopy className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: Daily Actions & Mission Feed (8/12) */}
            <div className="lg:col-span-8 space-y-12">
                
                {/* Daily Action Center */}
                <section id="action-center" className="space-y-6">
                  <h2 className="text-2xl font-black uppercase text-primary tracking-tight flex items-center gap-3 px-1">
                    <Target className="h-8 w-8 text-red-600" />
                    Daily Action Center
                  </h2>
                  <DailyActionGrid />
                </section>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-primary/5 p-1 border border-primary/10 h-16 w-full justify-start overflow-x-auto gap-3">
                    <TabsTrigger value="newsfeed" className="px-10 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Newspaper className="h-5 w-5 mr-2" /> Bulletin
                    </TabsTrigger>
                    <TabsTrigger value="missions" className="px-10 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Trophy className="h-5 w-5 mr-2" /> Missions
                    </TabsTrigger>
                    <TabsTrigger value="impact" className="px-10 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Sparkles className="h-5 w-5 mr-2" /> Local Impact
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="newsfeed" className="pt-8 space-y-8 animate-in fade-in duration-500">
                    {announcementsLoading ? (
                        <div className="space-y-6">
                          <Skeleton className="h-64 w-full" />
                          <Skeleton className="h-64 w-full" />
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <Card className="p-20 text-center border-dashed border-2 bg-muted/20">
                            <Megaphone className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
                            <p className="text-sm font-bold text-muted-foreground uppercase text-xs tracking-[0.2em]">No national directives broadcasted yet.</p>
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

function CapitalCopy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  );
}