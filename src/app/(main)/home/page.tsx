"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard } from "@/components/announcement-card";
import { useUserData } from "@/context/user-data-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalIdCard } from "@/components/digital-id-card";
import { ActionCenter } from "@/components/action-center";
import { DailyPulse } from "@/components/daily-pulse";
import { CommunityFeedback } from "@/components/community-feedback";
import { RecruitmentLeaderboard } from "@/components/recruitment-leaderboard";
import { VipVerificationBanner } from "@/components/vip-verification-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Sparkles, Bell, Loader2, Megaphone, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMessaging, useFirestore, useCollection } from "@/firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";

function UserHeader({userData}: {userData: any}) {
  return (
    <div className="bg-card p-6 md:p-8 border-b">
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

export default function HomePage() {
  const router = useRouter();
  const { userData, loading: userLoading } = useUserData();
  const { toast } = useToast();
  const messaging = useMessaging();
  const firestore = useFirestore();
  const [domain, setDomain] = useState("");
  const [notifLoading, setNotifLoading] = useState(false);
  const [lastSeenAnnouncement, setLastSeenAnnouncement] = useState<string | null>(null);

  // Fetch real announcements
  const { data: announcements, loading: announcementsLoading } = useCollection('announcements');

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
      const saved = localStorage.getItem('last_seen_announcement');
      setLastSeenAnnouncement(saved);
    }
  }, []);

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
    if (announcements.length > 0) {
      const newestId = announcements[0].id;
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
  const referralLink = `${domain}/join?ref=${userData?.uid}`;
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copies", description: "Share this link to recruit new supporters!" });
  };

  const hasNewAnnouncements = announcements.length > 0 && announcements[0].id !== lastSeenAnnouncement;

  return (
    <div className="flex flex-col">
      <UserHeader userData={userData} />
      <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full">
        
        <VipVerificationBanner />

        {isSupporter && (
            <div className="grid gap-8 lg:grid-cols-12 items-start">
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <DigitalIdCard userData={userData} />
                    
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
                            <Sparkles className="h-4 w-4" />
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

                    <Card className="shadow-lg border-t-4 border-accent">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-accent" />
                          Recruitment Power
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold text-primary">{userData?.recruitCount || 0}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Supporters Recruited</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Your Referral Link</Label>
                          <div className="flex gap-2">
                            <Input value={referralLink} readOnly className="text-xs bg-muted font-mono" />
                            <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0"><Copy className="h-4 w-4" /></Button>
                          </div>
                        </div>
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
                            ) : announcements.length === 0 ? (
                                <Card className="p-12 text-center border-dashed bg-muted/20">
                                    <p className="text-muted-foreground font-medium">No official updates at this moment.</p>
                                </Card>
                            ) : (
                                announcements.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((item: any) => (
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
        )}

        {!isSupporter && (
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Megaphone className="h-6 w-6" />
                        National Bulletin
                    </h2>
                    <div className="space-y-6">
                        {announcementsLoading ? (
                            <Skeleton className="h-48 w-full" />
                        ) : announcements.length === 0 ? (
                            <Card className="p-12 text-center border-dashed bg-muted/20">
                                <p className="text-muted-foreground font-medium">No official updates at this moment.</p>
                            </Card>
                        ) : (
                            announcements.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((item: any) => (
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
            </div>
        )}
      </div>
    </div>
  );
}
