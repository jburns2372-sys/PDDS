
"use client";

import { useMemo } from "react";
import { useCollection } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell,
  Tooltip
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Map, TrendingUp, Users, Loader2, Sparkles, Trophy, Globe, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { subDays, isAfter } from "date-fns";
import dynamic from 'next/dynamic';

const NationalFootprintMap = dynamic(
  () => import('@/components/national-footprint-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-muted/20 rounded-2xl animate-pulse flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
      </div>
    )
  }
);

export default function AdminAnalyticsPage() {
  const { data: users, loading } = useCollection('users');

  // Logic to process Membership Density and Growth
  const stats = useMemo(() => {
    if (!users.length) return { hotspots: [], total: 0, growth: 0, cityStats: [], supporters: [] };

    const provinceMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    
    const sevenDaysAgo = subDays(new Date(), 7);
    let newRegistrations = 0;
    const supporters = users.filter(u => u.role === 'Supporter');

    users.forEach(user => {
      // 1. Group by Province
      const prov = user.province || "Unknown Region";
      provinceMap[prov] = (provinceMap[prov] || 0) + 1;

      // 2. Group by City
      const city = user.city || "Unknown City";
      cityMap[city] = (cityMap[city] || 0) + 1;

      // 3. Calculate Growth (New this week)
      if (user.createdAt) {
        const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        if (isAfter(createdDate, sevenDaysAgo)) {
          newRegistrations++;
        }
      }
    });

    // Sort Strongholds (Provinces)
    const sortedHotspots = Object.entries(provinceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Sort Top Cities
    const sortedCities = Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      hotspots: sortedHotspots,
      topStrongholds: sortedHotspots.slice(0, 5),
      cityStats: sortedCities,
      supporters,
      total: users.length,
      growth: newRegistrations
    };
  }, [users]);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Generating National Heat Map...
          </p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Members",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & National Metrics */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <Globe className="h-8 w-8" />
              National Mobilization Heat Map
            </h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Command Center: Visualizing the surge of the Federalismo movement.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Card className="shadow-lg border-l-4 border-l-primary bg-white px-6 py-3 flex items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-full text-primary">
                    <Users className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">National Base</p>
                    <p className="text-2xl font-black text-primary leading-none">{stats.total.toLocaleString()}</p>
                </div>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-green-600 bg-white px-6 py-3 flex items-center gap-4">
                <div className="p-2 bg-green-50 rounded-full text-green-600">
                    <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Growth (7D)</p>
                    <p className="text-2xl font-black text-green-600 leading-none">+{stats.growth.toLocaleString()}</p>
                </div>
            </Card>
          </div>
        </div>

        {/* 🗺️ National Footprint Map */}
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Geographic Supporter Pulse</h2>
            </div>
            <NationalFootprintMap supporters={stats.supporters} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TOP STRONGHOLDS CHART */}
          <Card className="lg:col-span-2 shadow-xl border-t-4 border-primary">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-headline uppercase font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Regional Strongholds
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Identifying key recruitment hubs nationwide</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-6">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={stats.topStrongholds} layout="vertical" margin={{ left: 40, right: 40, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--primary))' }}
                    className="uppercase tracking-tighter"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                    {stats.topStrongholds.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "hsl(var(--accent))" : `hsla(var(--primary), ${1 - index * 0.15})`} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* GROWTH PULSE & NOTES */}
          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-accent overflow-hidden">
                <CardHeader className="bg-accent/5 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        Campaign Note
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 italic text-sm text-muted-foreground leading-relaxed">
                    "High density in the heat map indicates areas primed for major LEADCON events. Cross-reference these strongholds with recruitment counts to identify your top Regional Organizers."
                </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-accent">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-accent" />
                        Top Hub Cities
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {stats.cityStats.map((city, idx) => (
                        <div key={city.name} className="flex justify-between items-center py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-primary/30">0{idx+1}</span>
                                <span className="text-xs font-bold uppercase">{city.name}</span>
                            </div>
                            <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold">
                                {city.count}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
          </div>
        </div>

        {/* FULL REGIONAL HEAT GRID */}
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Full Regional Distribution</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.hotspots.map((spot) => {
                    const percentage = Math.round((spot.count / stats.total) * 100);
                    const intensity = spot.count / stats.hotspots[0].count;
                    
                    return (
                        <Card key={spot.name} className="shadow-sm hover:shadow-md transition-all group overflow-hidden border-none bg-white">
                            <div 
                                className="h-1.5 w-full bg-accent transition-all duration-1000" 
                                style={{ opacity: intensity, width: '100%' }}
                            />
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xs font-black uppercase tracking-tight text-primary group-hover:text-accent transition-colors truncate max-w-[70%]">
                                        {spot.name}
                                    </h3>
                                    <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black">
                                        {spot.count}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span>Contribution</span>
                                        <span>{percentage}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
}
