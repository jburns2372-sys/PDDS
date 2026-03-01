
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard } from "@/components/announcement-card";
import { useUserData } from "@/context/user-data-context";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalIdCard } from "@/components/digital-id-card";
import { ActionCenter } from "@/components/action-center";
import { DailyPulse } from "@/components/daily-pulse";
import { CommunityFeedback } from "@/components/community-feedback";
import { RecruitmentLeaderboard } from "@/components/recruitment-leaderboard";
import { CoordinatorLeaderboard } from "@/components/coordinator-leaderboard";
import { VipVerificationBanner } from "@/components/vip-verification-banner";
import { MeritProgress } from "@/components/merit-progress";
import { CommandSwitchboard } from "@/components/command-switchboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat-interface";
import { Copy, Sparkles, Bell, Loader2, Megaphone, Trophy, MapPin, Mail, UserCheck, Share2, MessageCircle, BarChart3, Newspaper, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMessaging, useFirestore, useCollection } from "@/firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { HostMeetingDialog } from "@/components/host-meeting-dialog";
import { LocalMeetupMap } from "@/components/local-meetup-map";

function UserHeader({userData}: {userData: any}) {
  return (
    <div className="bg-card p-6 md:p-8 border-b shadow-sm">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase tracking-tight">
          Welcome, {userData?.fullName?.split(' ')[0] || 'MEMBER'}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px]">{userData?.role}</Badge>
          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground font-black uppercase tracking-widest text-[10px]">{userData?.jurisdictionLevel || 'National'}</Badge>
        </div>
      </div>
    </div>
  );
}

function LocalChapterSection({ userData }: { userData: any }) {
  const { data: users, loading } = useCollection('users');
  
  const localCoordinator = useMemo(() => {
    if (!userData || !users.length) return null;
    return users.find(u => 
      u.role === 'Coordinator' && 
      (u.city === userData.city || u.province === userData.province)
    );
  }, [userData, users]);

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card className="shadow-lg border-t-4 border-primary bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
          <MapPin className="h-4 w-4 text-accent" />
          Your Local Chapter
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase">
          {userData?.city || 'National'} Jurisdiction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {localCoordinator ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 shadow-sm">
                {localCoordinator.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black uppercase text-primary leading-tight">{localCoordinator.fullName}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Regional Coordinator</p>
              </div>
            </div>
            <Button 
              className="w-full h-11 font-black uppercase tracking-widest text-xs shadow-md"
              onClick={() => window.open(`mailto:${localCoordinator.email}?subject=PDDS Member Inquiry - ${userData.fullName}`, '_blank')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Coordinator
            </Button>
          </div>
        ) : (
          <div className="py-4 text-center border-2 border-dashed rounded-xl bg-white/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed px-4">
              Finding an active coordinator for {userData?.city || 'your area'}...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, loading: userLoading } = useUserData();
  const { toast } = useToast();
  const messaging = useMessaging();
  const firestore = useFirestore();
  
  const [domain, setDomain] = useState("");
  const [notifLoading, setNotifLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("newsfeed");
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [lastSeenChatTime, setLastSeenChatTime] = useState<number>(Date.now());

  const { data: allAnnouncements, loading: announcementsLoading } = useCollection('announcements');

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
      const savedTime = localStorage.getItem('last_chat_view_time');
      if (savedTime) setLastSeenChatTime(parseInt(savedTime));
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
    if (!userData?.city || !firestore) return;

    const roomName = userData.city;
    const messagesRef = collection(firestore, "chat_rooms", roomName, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const latestMsg = snapshot.docs[0].data();
      const msgTime = latestMsg.timestamp?.toMillis() || Date.now();

      if (activeTab !== 'chat' && msgTime > lastSeenChatTime) {
        setHasUnreadChat(true);
      }
    });

    return () => unsubscribe();
  }, [userData?.city, firestore, activeTab, lastSeenChatTime]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'chat') {
      setHasUnreadChat(false);
      const now = Date.now();
      setLastSeenChatTime(now);
      localStorage.setItem('last_chat_view_time', now.toString());
    }
  };

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
        toast({
            title: "Induction Complete!",
            description: "Success! You are now registered in the National Registry.",
        });
        window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!userLoading && userData?.passwordIsTemporary) {
      router.push('/change-password');
    }
  }, [userData, userLoading, router]);

  if (userLoading || userData?.passwordIsTemporary) {
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

  const referralLink = `${domain}/join?ref=${userData?.uid}`;
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Earn 50 Merit Points per recruit!" });
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      <UserHeader userData={userData} />
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        <VipVerificationBanner />

        <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Sidebar Assets */}
            <div className="lg:col-span-4 flex flex-col gap-8 order-last lg:order-first">
                <CommandSwitchboard />
                <DigitalIdCard userData={userData} />
                <MeritProgress meritPoints={userData?.meritPoints || 0} />
                <LocalChapterSection userData={userData} />

                <Card className="shadow-lg border-t-4 border-red-600 bg-red-50/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-red-700">
                      <Share2 className="h-4 w-4" />
                      Growth Command
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-primary">{userData?.referralCount || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Recruits</p>
                      </div>
                      <Trophy className="h-8 w-8 text-accent opacity-20" />
                    </div>
                    <div className="pt-4 border-t space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Referral Link</Label>
                      <div className="flex gap-2">
                        <Input value={referralLink} readOnly className="text-xs bg-muted font-mono h-10" />
                        <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0 h-10 w-10 border-primary/20"><Copy className="h-4 w-4 text-primary" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Dynamic Content Tabs */}
            <div className="lg:col-span-8 space-y-10">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full justify-start overflow-x-auto gap-2">
                    <TabsTrigger value="newsfeed" className="px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Newspaper className="h-3.5 w-3.5 mr-2" /> Newsfeed
                    </TabsTrigger>
                    <TabsTrigger value="mobilize" className="px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <Users className="h-3.5 w-3.5 mr-2" /> Mobilize
                    </TabsTrigger>
                    <TabsTrigger value="polls" className="px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                      <BarChart3 className="h-3.5 w-3.5 mr-2" /> Leaderboard
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="px-6 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white relative">
                      <MessageCircle className="h-3.5 w-3.5 mr-2" /> Town Square
                      {hasUnreadChat && (
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-600 rounded-full animate-pulse border border-white" />
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="newsfeed" className="space-y-10 animate-in fade-in duration-500 pt-6">
                    <section id="announcements">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
                                <Megaphone className="h-6 w-6" />
                                National Bulletin
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {announcementsLoading ? (
                                <div className="space-y-4">
                                  <Skeleton className="h-48 w-full" />
                                  <Skeleton className="h-48 w-full" />
                                </div>
                            ) : filteredAnnouncements.length === 0 ? (
                                <Card className="p-12 text-center border-dashed bg-muted/20">
                                    <p className="text-muted-foreground font-medium">No official updates available.</p>
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
                        </div>
                    </section>
                    <ActionCenter />
                    <CommunityFeedback />
                  </TabsContent>

                  <TabsContent value="mobilize" className="space-y-8 animate-in fade-in duration-500 pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
                          <Users className="h-6 w-6" />
                          Supporter-Led Mobilization
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">Host a local gathering or join an approved community meetup.</p>
                      </div>
                      <HostMeetingDialog />
                    </div>
                    
                    <LocalMeetupMap />
                  </TabsContent>

                  <TabsContent value="polls" className="space-y-10 animate-in fade-in duration-500 pt-6">
                    <DailyPulse />
                    <CoordinatorLeaderboard />
                    <RecruitmentLeaderboard />
                  </TabsContent>

                  <TabsContent value="chat" className="h-[600px] animate-in fade-in duration-500 pt-6 border rounded-2xl overflow-hidden shadow-2xl bg-white">
                    <div className="h-full flex flex-col">
                      <div className="bg-primary/5 p-4 border-b flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-black uppercase text-primary tracking-tight">{userData?.city || 'National'} Mobilization Room</h3>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">End-to-End Encrypted</p>
                        </div>
                        <Badge className="bg-green-600 font-black text-[8px] uppercase">Live Signal</Badge>
                      </div>
                      <div className="flex-1 min-h-0">
                        <ChatInterface roomName={userData?.city || 'National'} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>
  );
}
