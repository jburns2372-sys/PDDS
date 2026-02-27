
"use client";

import { useCollection } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Loader2, Crown, Award } from "lucide-react";
import { useMemo } from "react";

export function RecruitmentLeaderboard() {
  const { data: topSupporters, loading } = useCollection('users', {
    queries: [{ attribute: 'role', operator: '==', value: 'Supporter' }]
  });

  const leaders = useMemo(() => {
    return [...topSupporters]
      .sort((a: any, b: any) => (b.recruitCount || 0) - (a.recruitCount || 0))
      .slice(0, 10);
  }, [topSupporters]);

  const getRankBadge = (count: number, index: number) => {
    if (index === 0) return { label: "Lead Organizer", color: "bg-yellow-500", icon: Crown };
    if (count >= 21) return { label: "Gold (Senior Advocate)", color: "bg-yellow-600 text-white", icon: Award };
    if (count >= 6) return { label: "Silver (Active Mobilizer)", color: "bg-gray-400 text-white", icon: Trophy };
    return { label: "Bronze (Local Supporter)", color: "bg-amber-700 text-white", icon: Users };
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight">Top Organizers</h2>
      </div>

      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest">National Growth Leaderboard</CardTitle>
            <Trophy className="h-4 w-4 opacity-50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {leaders.map((leader: any, index) => {
              const badge = getRankBadge(leader.recruitCount || 0, index);
              const RankIcon = badge.icon;
              
              return (
                <div key={leader.uid} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full font-black text-xs ${
                      index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-300 text-gray-700' : 
                      index === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={leader.photoURL} />
                      <AvatarFallback className="font-bold text-xs">{leader.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-bold text-sm uppercase">{leader.fullName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{leader.city}</p>
                        <Badge className={`${badge.color} text-[8px] h-4 px-1.5 font-black uppercase border-none`}>
                          <RankIcon className="h-2 w-2 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">{leader.recruitCount || 0}</p>
                    <p className="text-[9px] font-black uppercase tracking-tighter opacity-40">Recruits</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
