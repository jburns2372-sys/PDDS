
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
import { Map, TrendingUp, Users, Loader2, Sparkles, Trophy, Globe, CalendarDays, ShieldCheck, Package, Flag } from "lucide-react";
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

/**
 * @fileOverview National Command & Analytics Center.
 * Aggregates Registry Health, Vetting Tiers, and Logistics Dispatches for the Executive Committee.
 */
export default function AdminAnalyticsPage() {
  const { data: users, loading: usersLoading } = useCollection('users');
  const { data: logistics, loading: logisticsLoading } = useCollection('logistics_logs');

  // Logic to process Membership Density, Growth, and Executive Metrics
  const stats = useMemo(() => {
    if (!users.length) return { hotspots: [], total: 0, growth: 0, cityStats: [], supporters: [], vettedCount: 0, shirts: 0, flags: 0 };

    const provinceMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    
    const sevenDaysAgo = subDays(new Date(), 7);
    let newRegistrations = 0;
    let verifiedOfficers = 0;
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

      // 4. Executive Metric: Vetted Officer Corps
      if (user.isVerified === true && user.role !== 'Supporter') {
        verifiedOfficers++;
      }
    });

    // 5. Logistics Aggregation (Treasurer Data)
    let totalShirts = 0;
    let totalFlags = 0;
    logistics.forEach(log => {
      if (log.item === "Shirts") totalShirts += (log.quantity || 0);
      if (log.item === "Flags") totalFlags += (log.quantity || 0);
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
      growth: newRegistrations,
      vettedCount: verifiedOfficers,
      shirts: totalShirts,
      flags: totalFlags
    };
  }, [users, logistics]);

  if (usersLoading || logisticsLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Synchronizing National Executive Metrics...
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
        
        {/* Executive Header */}
        <div className="bg-primary p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <pattern id="exec-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#exec-grid)" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-accent p-2 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter">
                  National Command Center
                </h1>
              </div>
              <p className="text-primary-foreground/70 font-medium italic">
                "In Pederalismo, we trust the people, but we track the progress."
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center md:text-right px-4 border-r border-white/10 last:border-0">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">National Base</p>
                <p className="text-2xl font-black">{stats.total.toLocaleString()}</p>
              </div>
              <div className="text-center md:text-right px-4 border-r border-white/10 last:border-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-accent">Vetted Officers</p>
                <p className="text-2xl font-black text-accent">{stats.vettedCount}</p>
              </div>
              <div className="text-center md:text-right px-4 border-r border-white/10 last:border-0">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Growth (7D)</p>
                <p className="text-2xl font-black text-green-400">+{stats.growth}</p>
              </div>
              <div className="text-center md:text-right px-4">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Resources</p>
                <p className="text-2xl font-black">{(stats.shirts + stats.flags).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-l-4 border-l-accent overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-2xl">
                <ShieldCheck className="h-8 w-8 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Officer Readiness</p>
                <p className="text-3xl font-black text-primary">{stats.vettedCount}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Verified Officer Corps</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-primary overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/5 rounded-2xl">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Field Uniforms</p>
                <p className="text-3xl font-black text-primary">{stats.shirts.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Dispatched nationwide</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-red-600 overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Flag className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Branding Strength</p>
                <p className="text-3xl font-black text-red-600">{stats.flags.toLocaleString()}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Active Flags & Banners</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🗺️ Tactical Deployment Map */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
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

          {/* HUB CITIES & CAMPAIGN NOTES */}
          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-accent overflow-hidden">
                <CardHeader className="bg-accent/5 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        Campaign Insight
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 italic text-sm text-muted-foreground leading-relaxed">
                    "High uniform density in strongholds indicates mobilization readiness. Focus banner dispatches to areas with emerging growth but low physical visibility."
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
            <div className="flex items-center gap-2 px-2">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Regional Distribution Index</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.hotspots.map((spot) => {
                    const percentage = Math.round((spot.count / stats.total) * 100);
                    const intensity = spot.count / (stats.hotspots[0]?.count || 1);
                    
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
