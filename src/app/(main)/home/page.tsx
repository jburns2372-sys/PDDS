"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockStats, mockAnnouncement } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard } from "@/components/announcement-card";
import { useUserData } from "@/context/user-data-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalIdCard } from "@/components/digital-id-card";
import { ActionCenter } from "@/components/action-center";

function UserHeader({userData}: {userData: any}) {
  return (
    <div className="bg-card p-6 md:p-8 border-b">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
          Welcome, {userData?.fullName?.split(' ')[0] || 'Member'}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">{userData?.role}</Badge>
          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground font-bold">{userData?.jurisdictionLevel || 'National'}</Badge>
        </div>
      </div>
    </div>
  );
}

function StatCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {mockStats.map((stat) => (
        <Card key={stat.title} className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { userData, loading } = useUserData();

  useEffect(() => {
    if (!loading && userData?.passwordIsTemporary) {
      router.push('/change-password');
    }
  }, [userData, loading, router]);
  
  if (loading || userData?.passwordIsTemporary) {
    return (
      <>
        <div className="bg-card p-6 md:p-8 border-b">
            <div className="max-w-7xl mx-auto">
                <Skeleton className="h-10 w-1/3" />
                <div className="mt-4 flex items-center gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-24" />
                </div>
            </div>
        </div>
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            <section>
                <h2 className="text-xl font-semibold mb-4 font-headline">Quick Stats</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-4 font-headline">Recent Announcements</h2>
                  <Skeleton className="h-64 w-full" />
            </section>
        </div>
      </>
    )
  }

  const isSupporter = userData?.role === 'Supporter';

  return (
    <div className="flex flex-col">
      <UserHeader userData={userData} />
      <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto w-full">
        
        {isSupporter && (
            <div className="grid gap-8 lg:grid-cols-12 items-start">
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <h2 className="text-xl font-bold font-headline text-primary">Member ID</h2>
                    <DigitalIdCard userData={userData} />
                    <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                        <p className="text-[10px] font-black uppercase text-accent-foreground tracking-widest mb-1">Status Note</p>
                        <p className="text-xs text-accent-foreground/80 leading-tight">Your digital ID is your official credential for LEADCON and local party events. Ensure your profile photo is up to date.</p>
                    </div>
                </div>
                <div className="lg:col-span-8">
                    <ActionCenter />
                </div>
            </div>
        )}

        {!isSupporter && (
            <section>
                <h2 className="text-xl font-semibold mb-4 font-headline">Quick Stats</h2>
                <StatCards />
            </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold font-headline text-primary">Recent Announcements</h2>
          </div>
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