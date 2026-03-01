
"use client";

import { useCollection } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, ShieldCheck, MapPin, Loader2, Star, TrendingUp } from "lucide-react";
import { useMemo } from "react";

/**
 * @fileOverview Regional Command Leaderboard.
 * Ranks Regional Coordinators based on the total Verified Member count in their city.
 */
export function CoordinatorLeaderboard() {
  const { data: allUsers, loading } = useCollection('users');

  const coordinatorRankings = useMemo(() => {
    if (!allUsers.length) return [];

    // 1. Group Verified Members by City
    const cityVerifiedCount: Record<string, number> = {};
    allUsers.forEach(u => {
      if (u.isVerified && u.city) {
        cityVerifiedCount[u.city] = (cityVerifiedCount[u.city] || 0) + 1;
      }
    });

    // 2. Identify Coordinators and map their City's verified count
    const coordinators = allUsers.filter(u => u.role === 'Coordinator');
    
    return coordinators.map(coord => ({
      id: coord.id,
      fullName: coord.fullName,
      photoURL: coord.photoURL,
      city: coord.city,
      verifiedBase: cityVerifiedCount[coord.city] || 0
    }))
    .sort((a, b) => b.verifiedBase - a.verifiedBase)
    .slice(0, 5); // Show top 5 commanders
  }, [allUsers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 bg-muted/10 rounded-2xl border-2 border-dashed">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Regional Command...</p>
      </div>
    );
  }

  if (coordinatorRankings.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-bold font-headline text-primary uppercase tracking-tight">Regional Command Rankings</h2>
        </div>
        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">Mobilization Strength</Badge>
      </div>

      <Card className="shadow-2xl border-t-4 border-primary overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 pb-4 border-b">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Top Performing Coordinators
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground">
            Ranked by total verified citizens in their jurisdiction.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {coordinatorRankings.map((coord, index) => (
              <div key={coord.id} className="flex items-center justify-between p-5 hover:bg-primary/5 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`flex items-center justify-center h-10 w-10 rounded-full font-black text-sm shadow-inner ${
                    index === 0 ? 'bg-yellow-500 text-white ring-4 ring-yellow-100' : 
                    index === 1 ? 'bg-slate-300 text-slate-700' : 
                    index === 2 ? 'bg-orange-400 text-white' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <Avatar className="h-12 w-12 border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                    <AvatarImage src={coord.photoURL} />
                    <AvatarFallback className="font-black text-sm">{coord.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-black text-sm uppercase text-primary leading-none mb-1">{coord.fullName}</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-white text-[8px] font-black uppercase px-1.5 py-0">
                        <MapPin className="h-2 w-2 mr-1" />
                        {coord.city} Chapter
                      </Badge>
                      {index === 0 && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-[8px] font-black uppercase">National Lead</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-2xl font-black text-primary leading-none">{coord.verifiedBase}</p>
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground mt-1">Verified Base</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
