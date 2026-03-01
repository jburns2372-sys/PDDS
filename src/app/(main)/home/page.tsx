
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
import { VipVerificationBanner } from "@/components/vip-verification-banner";
import { MeritProgress } from "@/components/merit-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Sparkles, Bell, Loader2, Megaphone, Trophy, MapPin, Mail, UserCheck, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMessaging, useFirestore, useCollection } from "@/firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";

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
  const [lastSeenAnnouncement, setLastSeenAnnouncement] = useState<string | null>(null);

  // Fetch real announcements
  const { data: allAnnouncements, loading: announcementsLoading } = useCollection('announcements');

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
      const saved = localStorage.getItem('last_seen_announcement');
      setLastSeenAnnouncement(saved);
    }
  }, []);

  // Filter announcements by targetGroup
  const filteredAnnouncements = useMemo(() => {
    if (!userData) return [];
    return allAnnouncements.filter(item => {
      const target = item.targetGroup || "National";
      return target === "National" || target === userData.city;
    }).sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [allAnnouncements, userData]);

  // Show Success Toast on Induction Completion
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
        toast({
            title: "Induction Complete!",
            description: "Success! You are now officially registered in the National Registry.",
        });
        window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!userLoading && userData?.passwordIsTemporary) {
      router.push('/change-password');
    }
  }, [userData, userLoading, router]);

  const handleEnableNotifications = async () => {
    if (!messaging || !userData) return;
    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, { vapidKey: "BInW6L_yM-m4x6N3L-O-I-U-S-E-R-K-E-Y" }); 
        if (token) {
          await updateDoc(doc(firestore, "users", userData.uid), { fcmToken: token });
          toast({ title: "Notifications Active", description: "You will now receive real-time party alerts." });
        }
      } else {
        toast({ variant: "destructive", title: "Permission Denied", description: "Please enable notifications in your browser settings." });
      }
    } catch (error: any) {
      console.error("FCM error:", error);
      toast({ variant: "destructive", title: "Setup Failed", description: "Could not enable push notifications." });
    } finally {
      setNotifLoading(false);
    }
  };

  const markAnnouncementsSeen = () => {
    if (filteredAnnouncements.length > 0) {
      const newestId = filteredAnnouncements[0].id;
      localStorage.setItem('last_seen_announcement', newestId);
      setLastSeenAnnouncement(newestId);
    }
  };

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

  const isSupporter = userData?.role === 'Supporter';
  const isMember = userData?.role === 'Member';
  const referralLink = `${domain}/join?ref=${userData?.uid}`;
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Share this to earn 50 Merit Points per recruit!" });
  };

  const hasNewAnnouncements = filteredAnnouncements.length > 0 && filteredAnnouncements[0].id !== lastSeenAnnouncement;

  return (
    <div className="flex flex-col min-h-screen">
      <UserHeader userData={userData} />
      <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full">
        
        <VipVerificationBanner />

        <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-4 flex flex-col gap-8">
                <DigitalIdCard userData={userData} />
                
                <MeritProgress meritPoints={userData?.meritPoints || 0} />

                {(isSupporter || isMember) && <LocalChapterSection userData={userData} />}

                <Card className="shadow-lg border-t-4 border-red-600 bg-red-50/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-red-700">
                      <Share2 className="h-4 w-4" />
                      Growth Command
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase">Earn 50 Merit Points per successful induction.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-primary">{userData?.referralCount || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Recruits Dispatched</p>
                      </div>
                      <Trophy className="h-8 w-8 text-accent opacity-20" />
                    </div>
                    <div className="pt-4 border-t space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Your Tactical Referral Link</Label>
                      <div className="flex gap-2">
                        <Input value={referralLink} readOnly className="text-xs bg-muted font-mono h-10" />
                        <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0 h-10 w-10 border-primary/20"><Copy className="h-4 w-4 text-primary" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-t-4 border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Bell className="h-3 w-3 text-primary" />
                      Alert Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData?.fcmToken ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase">Push Alerts Enabled</span>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] font-black uppercase tracking-widest border-primary/20"
                        onClick={handleEnableNotifications}
                        disabled={notifLoading}
                      >
                        {notifLoading ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Bell className="h-3 w-3 mr-2 text-primary" />}
                        Enable Party Alerts
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <DailyPulse />
            </div>
            <div className="lg:col-span-8 space-y-12">
                <section id="announcements" onMouseEnter={markAnnouncementsSeen}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-3">
                            <Megaphone className="h-6 w-6" />
                            National Bulletin
                            {hasNewAnnouncements && (
                                <Badge variant="destructive" className="animate-pulse font-black text-[9px] uppercase tracking-widest px-2">New</Badge>
                            )}
                        </h2>
                    </div>
                    <div className="space-y-6">
                        {announcementsLoading ? (
                            <Skeleton className="h-48 w-full" />
                        ) : filteredAnnouncements.length === 0 ? (
                            <Card className="p-12 text-center border-dashed bg-muted/20">
                                <p className="text-muted-foreground font-medium">No official updates at this moment.</p>
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
                
                <RecruitmentLeaderboard />
                <ActionCenter />
                <CommunityFeedback />
            </div>
        </div>
      </div>
    </div>
  );
}
