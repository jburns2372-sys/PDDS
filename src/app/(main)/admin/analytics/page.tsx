"use client";

import { useMemo, useState } from "react";
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
import { Map, TrendingUp, Users, Loader2, Sparkles, Trophy, Globe, CalendarDays, ShieldCheck, Package, Flag, Medal, Activity, BarChart3, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const NationalFundMap = dynamic(
  () => import('@/components/national-fund-map'),
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
 * REFACTORED: Fluid full-width 12-column grid.
 */
export default function AdminAnalyticsPage() {
  const { data: users, loading: usersLoading } = useCollection('users');
  const { data: logistics, loading: logisticsLoading } = useCollection('logistics_logs');
  const { data: polls, loading: pollsLoading } = useCollection('polls');

  const stats = useMemo(() => {
    if (!users.length) return { hotspots: [], total: 0, growth: 0, cityRankings: [], supporters: [], vettedCount: 0, shirts: 0, flags: 0 };

    const provinceMap: Record<string, number> = {};
    const cityRankingMap: Record<string, { total: number, verified: number }> = {};
    
    const sevenDaysAgo = subDays(new Date(), 7);
    let newRegistrations = 0;
    let verifiedOfficers = 0;
    const supporters = users.filter(u => u.role === 'Supporter');

    users.forEach(user => {
      const prov = user.province || "Unknown Region";
      provinceMap[prov] = (provinceMap[prov] || 0) + 1;

      const city = user.city || "Unknown City";
      if (!cityRankingMap[city]) cityRankingMap[city] = { total: 0, verified: 0 };
      cityRankingMap[city].total++;
      if (user.isVerified) cityRankingMap[city].verified++;

      if (user.createdAt) {
        const createdDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        if (isAfter(createdDate, sevenDaysAgo)) {
          newRegistrations++;
        }
      }

      if (user.isVerified === true && user.role !== 'Supporter') {
        verifiedOfficers++;
      }
    });

    let totalShirts = 0;
    let totalFlags = 0;
    logistics.forEach(log => {
      if (log.item === "Shirts") totalShirts += (log.quantity || 0);
      if (log.item === "Flags") totalFlags += (log.quantity || 0);
    });

    const sortedHotspots = Object.entries(provinceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const sortedRankings = Object.entries(cityRankingMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.verified - a.verified || b.total - a.total);

    return {
      hotspots: sortedHotspots,
      topStrongholds: sortedHotspots.slice(0, 10),
      cityRankings: sortedRankings,
      supporters,
      total: users.length,
      growth: newRegistrations,
      vettedCount: verifiedOfficers,
      shirts: totalShirts,
      flags: totalFlags
    };
  }, [users, logistics]);

  if (usersLoading || logisticsLoading || pollsLoading) {
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

  const activePolls = polls.filter(p => p.isActive);

  return (
    <div className="p-4 md:p-8 lg:p-10 bg-background min-h-screen pb-24">
      <div className="w-full space-y-8">
        
        {/* Executive Header - Full Width */}
        <div className="bg-primary p-8 md:p-12 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
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
                <h1 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter">
                  National Command Center
                </h1>
              </div>
              <p className="text-primary-foreground/70 font-medium italic md:text-lg">
                "Real-time telemetry for national mobilization and sentiment."
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-10">
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">National Base</p>
                <p className="text-3xl md:text-4xl font-black">{stats.total.toLocaleString()}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Vetted Officers</p>
                <p className="text-3xl md:text-4xl font-black text-accent">{stats.vettedCount}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Polls</p>
                <p className="text-3xl md:text-4xl font-black text-white">{activePolls.length}</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Growth (7D)</p>
                <p className="text-3xl md:text-4xl font-black text-green-400">+{stats.growth}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="geography" className="space-y-8">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 h-14 w-full md:w-auto justify-start">
            <TabsTrigger value="geography" className="px-10 h-full font-black uppercase text-[10px] tracking-widest">
              <Map className="h-4 w-4 mr-2" /> Supporter Pulse
            </TabsTrigger>
            <TabsTrigger value="finance" className="px-10 h-full font-black uppercase text-[10px] tracking-widest text-accent">
              <Landmark className="h-4 w-4 mr-2" /> Fund Footprint
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geography" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-l-4 border-l-accent overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-accent/10 rounded-2xl">
                    <ShieldCheck className="h-10 w-10 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Officer Readiness</p>
                    <p className="text-4xl font-black text-primary">{stats.vettedCount}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Verified Officer Corps</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-l-4 border-l-primary overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-primary/5 rounded-2xl">
                    <Package className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Field Uniforms</p>
                    <p className="text-4xl font-black text-primary">{stats.shirts.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Dispatched nationwide</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-l-4 border-l-red-600 overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                  <div className="p-4 bg-red-50 rounded-2xl">
                    <Flag className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Branding Strength</p>
                    <p className="text-4xl font-black text-red-600">{stats.flags.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Active Flags & Banners</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Map className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Geographic Supporter Pulse</h2>
                </div>
                <NationalFootprintMap supporters={stats.supporters} />
            </section>
          </TabsContent>

          <TabsContent value="finance" className="space-y-8 animate-in fade-in duration-500">
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Regional Resource Allocation</h2>
                </div>
                <NationalFundMap />
            </section>
          </TabsContent>
        </Tabs>

        {/* REFACTORED: Grid Split (7/12 & 5/12) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* REGIONAL PERFORMANCE LEADERBOARD (7/12) */}
          <Card className="lg:col-span-7 shadow-xl border-t-4 border-accent overflow-hidden bg-white">
            <CardHeader className="bg-accent/5 border-b">
              <CardTitle className="text-xl font-headline uppercase font-bold flex items-center gap-3 text-primary">
                <Trophy className="h-6 w-6 text-accent" />
                Regional Performance Leaderboard
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Ranked by Secretary General's verification logs (Verified Base Priority)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-20 pl-8 text-[10px] font-black uppercase py-5">Rank</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Region / City</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Total Members</TableHead>
                    <TableHead className="text-right pr-8 text-[10px] font-black uppercase text-green-600">Verified Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.cityRankings.slice(0, 15).map((region, index) => (
                    <TableRow key={region.name} className={index < 3 ? "bg-accent/5" : ""}>
                      <TableCell className="pl-8 font-black text-sm">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </TableCell>
                      <TableCell className="font-bold text-sm uppercase tracking-tighter py-4">{region.name}</TableCell>
                      <TableCell className="text-sm font-medium">{region.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8 font-black text-base text-green-600">
                        {region.verified.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* TOP STRONGHOLDS CHART (5/12) */}
          <Card className="lg:col-span-5 shadow-xl border-t-4 border-primary bg-white">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-headline uppercase font-bold flex items-center gap-3">
                <Medal className="h-6 w-6 text-accent" />
                Stronghold Concentration
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Province-level recruitment volume hubs</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] pt-8">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={stats.topStrongholds} layout="vertical" margin={{ left: 60, right: 40, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 'bold', fill: 'hsl(var(--primary))' }}
                    className="uppercase tracking-tighter"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={35}>
                    {stats.topStrongholds.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "hsl(var(--accent))" : `hsla(var(--primary), ${1 - index * 0.08})`} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* FULL REGIONAL HEAT GRID - Responsive */}
        <div className="space-y-4 pt-10">
            <div className="flex items-center gap-2 px-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Regional Distribution Index</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.hotspots.map((spot) => {
                    const percentage = Math.round((spot.count / stats.total) * 100);
                    const intensity = spot.count / (stats.hotspots[0]?.count || 1);
                    
                    return (
                        <Card key={spot.name} className="shadow-sm hover:shadow-md transition-all group overflow-hidden border-none bg-white">
                            <div 
                                className="h-1.5 w-full bg-accent transition-all duration-1000" 
                                style={{ opacity: Math.max(intensity, 0.1), width: '100%' }}
                            />
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-[10px] font-black uppercase tracking-tight text-primary group-hover:text-accent transition-colors truncate max-w-[75%]">
                                        {spot.name}
                                    </h3>
                                    <Badge className="bg-primary/5 text-primary border-none text-[9px] font-black">
                                        {spot.count}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span>Weight</span>
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