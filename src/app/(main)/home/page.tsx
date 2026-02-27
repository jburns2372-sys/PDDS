
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockStats, mockAnnouncement } from "@/lib/data";
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
import { Button } from "@/components/ui/button";
import { Copy, Share2, Trophy, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { userData, loading } = useUserData();
  const { toast } = useToast();
  const [domain, setDomain] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!loading && userData?.passwordIsTemporary) {
      router.push('/change-password');
    }
  }, [userData, loading, router]);
  
  if (loading || userData?.passwordIsTemporary) {
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
    toast({ title: "Link Copied", description: "Share this link to recruit new supporters!" });
  };

  const getRank = (count: number) => {
    if (count >= 21) return { label: "Gold", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (count >= 6) return { label: "Silver", color: "text-gray-400", bg: "bg-gray-400/10" };
    return { label: "Bronze", color: "text-orange-600", bg: "bg-orange-600/10" };
  };

  const rank = getRank(userData?.recruitCount || 0);

  return (
    <div className="flex flex-col">
      <UserHeader userData={userData} />
      <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full">
        
        {isSupporter && (
            <div className="grid gap-8 lg:grid-cols-12 items-start">
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <DigitalIdCard userData={userData} />
                    
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
                          <Badge className={`${rank.bg} ${rank.color} border-none font-black text-xs px-3 py-1`}>
                            {rank.label} Rank
                          </Badge>
                        </div>
                        <div className="pt-4 border-t space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Your Referral Link</Label>
                          <div className="flex gap-2">
                            <Input value={referralLink} readOnly className="text-xs bg-muted font-mono" />
                            <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0"><Copy className="h-4 w-4" /></Button>
                          </div>
                          <p className="text-[9px] italic text-muted-foreground">Share this link to increase your rank and move up the leaderboard.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <DailyPulse />
                </div>
                <div className="lg:col-span-8 space-y-12">
                    <RecruitmentLeaderboard />
                    <ActionCenter />
                    <CommunityFeedback />
                </div>
            </div>
        )}

        {!isSupporter && (
            <section>
                <div className="grid gap-4 md:grid-cols-3">
                  {mockStats.map((stat) => (
                    <Card key={stat.title} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">{stat.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">{stat.value}</div>
                        <p className="text-xs font-bold text-green-600 mt-1">{stat.change}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
            </section>
        )}

        <section>
          <h2 className="text-xl font-semibold font-headline text-primary uppercase tracking-tight mb-6">Recent Announcements</h2>
          <AnnouncementCard 
            title="LEADCON 2024 Highlights"
            date="October 28, 2024"
            fullText={mockAnnouncement}
          />
        </section>
      </div>
    </div>
  );
}
