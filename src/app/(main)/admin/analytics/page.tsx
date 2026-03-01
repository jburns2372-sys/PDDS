
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
import { Map, TrendingUp, Users, Loader2, Sparkles, Trophy, Globe, CalendarDays, ShieldCheck, Package, Flag, Medal, Activity, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { data: polls, loading: pollsLoading } = useCollection('polls');

  // Logic to process Membership Density, Growth, and Executive Metrics
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
      topStrongholds: sortedHotspots.slice(0, 5),
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
                "Real-time telemetry for national mobilization and sentiment."
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
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Active Polls</p>
                <p className="text-2xl font-black text-white">{activePolls.length}</p>
              </div>
              <div className="text-center md:text-right px-4">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Growth (7D)</p>
                <p className="text-2xl font-black text-green-400">+{stats.growth}</p>
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

        {/* 📊 National Sentiment Pulse */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">National Sentiment Monitor</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activePolls.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed bg-muted/20 col-span-full">
                <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium uppercase text-xs">No active referendums to monitor.</p>
              </Card>
            ) : (
              activePolls.map((poll: any) => {
                const chartData = poll.options.map((opt: string) => ({
                  name: opt,
                  votes: poll.votes[opt] || 0
                }));
                const totalVotes = Object.values(poll.votes || {}).reduce((a: any, b: any) => a + b, 0);

                return (
                  <Card key={poll.id} className="shadow-xl border-t-4 border-accent overflow-hidden flex flex-col">
                    <CardHeader className="bg-primary/5 pb-4 border-b">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-black uppercase text-primary font-headline leading-snug max-w-[80%]">
                          {poll.question}
                        </CardTitle>
                        <Badge className="bg-accent text-accent-foreground text-[8px] font-black">LIVE</Badge>
                      </div>
                      <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Target: {poll.targetGroup} • Tier: {poll.targetRole}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-primary text-white p-2 rounded-lg shadow-xl text-[10px] font-bold uppercase">
                                    {payload[0].payload.name}: {payload[0].value} votes
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 pt-4 border-t border-dashed flex justify-between items-center text-[9px] font-black uppercase text-primary/60">
                        <span>Total Participation: {totalVotes}</span>
                        <Badge variant="outline" className="text-[8px] opacity-50">REF: {poll.id.substring(0,6)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* 🗺️ Tactical Deployment Map */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Geographic Supporter Pulse</h2>
            </div>
            <NationalFootprintMap supporters={stats.supporters} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* REGIONAL PERFORMANCE LEADERBOARD */}
          <Card className="lg:col-span-7 shadow-xl border-t-4 border-accent overflow-hidden">
            <CardHeader className="bg-accent/5 border-b">
              <CardTitle className="text-lg font-headline uppercase font-bold flex items-center gap-2 text-primary">
                <Trophy className="h-5 w-5 text-accent" />
                Regional Performance Leaderboard
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Ranked by Secretary General's verification logs (Verified Base Priority)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-16 pl-6 text-[10px] font-black uppercase">Rank</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Region / City</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Total Members</TableHead>
                    <TableHead className="text-right pr-6 text-[10px] font-black uppercase text-green-600">Verified Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.cityRankings.slice(0, 10).map((region, index) => (
                    <TableRow key={region.name} className={index < 3 ? "bg-accent/5" : ""}>
                      <TableCell className="pl-6 font-black text-xs">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </TableCell>
                      <TableCell className="font-bold text-xs uppercase tracking-tighter">{region.name}</TableCell>
                      <TableCell className="text-xs font-medium">{region.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-sm text-green-600">
                        {region.verified.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {stats.cityRankings.length === 0 && (
                <div className="py-12 text-center text-muted-foreground italic text-xs">No city data available.</div>
              )}
            </CardContent>
          </Card>

          {/* TOP STRONGHOLDS CHART */}
          <Card className="lg:col-span-5 shadow-xl border-t-4 border-primary">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-headline uppercase font-bold flex items-center gap-2">
                <Medal className="h-5 w-5 text-accent" />
                Stronghold Concentration
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Province-level recruitment volume hubs</CardDescription>
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
