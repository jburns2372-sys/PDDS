
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
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Map, TrendingUp, Users, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminAnalyticsPage() {
  const { data: feedback, loading } = useCollection('community_feedback');

  // Logic to process "Heat Map" and Sentiment data
  const stats = useMemo(() => {
    if (!feedback.length) return { hotspots: [], topics: [], total: 0 };

    const locationMap: Record<string, number> = {};
    const topicMap: Record<string, number> = {};

    feedback.forEach(item => {
      // Group by Location (City/Barangay)
      const loc = item.location || "Unknown";
      locationMap[loc] = (locationMap[loc] || 0) + 1;

      // Group by Topic
      const topic = item.topic || "Others";
      topicMap[topic] = (topicMap[topic] || 0) + 1;
    });

    // Sort hotspots by volume
    const sortedHotspots = Object.entries(locationMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Format topics for Chart
    const topicData = Object.entries(topicMap).map(([name, count]) => ({
      name,
      count,
      fill: `var(--color-${name.toLowerCase().replace(/\s+/g, '-')})`
    }));

    return {
      hotspots: sortedHotspots,
      topics: topicData,
      total: feedback.length
    };
  }, [feedback]);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Analyzing Voter Sentiment...
          </p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Submissions",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="p-6 bg-background min-h-screen pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-3 uppercase tracking-tight">
              <Map className="h-8 w-8" />
              Regional Sentiment Heat Map
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Identify mobilization hotspots and community needs in real-time.</p>
          </div>
          <div className="flex items-center gap-4 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none">Total Feedback</p>
              <p className="text-2xl font-black text-primary">{stats.total}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top 5 Hotspots */}
          <Card className="lg:col-span-1 shadow-xl border-t-4 border-accent h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-headline uppercase font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Active Hubs
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Top 5 Most Engaged Areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stats.hotspots.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-sm">No data available.</div>
              ) : (
                stats.hotspots.map((spot, index) => (
                  <div key={spot.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary/40">0{index + 1}</span>
                        <span className="text-sm font-bold uppercase truncate max-w-[180px]">{spot.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-black text-[10px]">
                        {spot.count} Hits
                      </Badge>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${(spot.count / stats.hotspots[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sentiment Distribution Chart */}
          <Card className="lg:col-span-2 shadow-xl border-t-4 border-primary">
            <CardHeader>
              <CardTitle className="text-lg font-headline uppercase font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Topic Distribution
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Community Issue Priority Weighting</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={stats.topics} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 'bold', textAnchor: 'end' }}
                    interval={0}
                    angle={-45}
                    className="uppercase tracking-tighter"
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                    {stats.topics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-primary/5 p-6 rounded-2xl border border-dashed border-primary/20 flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">Mobilization Note</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                High density in the heat map indicates areas primed for LEADCON events or local recruitment drives. Cross-reference these hotspots with recruitment counts to identify your most effective regional leaders.
              </p>
            </div>
          </div>
          
          <div className="bg-accent/5 p-6 rounded-2xl border border-dashed border-accent/20 flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-accent/10">
              <AlertCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xs font-black text-accent-foreground uppercase tracking-[0.2em] mb-1">Issue Tracking</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Topics with unusually high volume (e.g., Security or Infrastructure) should be flagged for official party policy statements. Use the Broadcast Center to address these specific regional concerns at scale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
