
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCollection } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, Users, Navigation, Info, ShieldCheck, Loader2, TrendingUp, Wallet } from "lucide-react";
import { cityCoords } from '@/lib/data';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

/**
 * @fileOverview National Fund Map & Heatmap visualization.
 * Strategic asset for leadership to visualize financial strength vs member density.
 */
export default function NationalFundMap() {
  const { data: stats, loading } = useCollection('regional_stats');
  const [metric, setMetric] = useState<'funds' | 'density'>('funds');
  const [mounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const maxValue = useMemo(() => {
    if (!stats.length) return 1;
    return Math.max(...stats.map(s => metric === 'funds' ? s.totalFunds : s.donorCount));
  }, [stats, metric]);

  const getColor = (value: number) => {
    const ratio = value / maxValue;
    // Primary Blue to Gold gradient logic
    if (ratio > 0.8) return '#D4AF37'; // High intensity (Gold)
    if (ratio > 0.5) return '#3b82f6'; // Medium (Blue)
    return '#1e3a8a'; // Low (Dark Blue)
  };

  const getRadius = (value: number) => {
    const ratio = value / maxValue;
    return 15 + (ratio * 35); // Scale radius from 15 to 50
  };

  if (!mounted || loading) {
    return (
      <div className="h-[500px] w-full rounded-3xl bg-muted/20 animate-pulse flex flex-col items-center justify-center gap-4 border-2 border-dashed">
        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
        <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Aggregating National Ledger Stats...</p>
      </div>
    );
  }

  const center: [number, number] = [12.8797, 121.7740]; // Center of PH

  return (
    <Card className="shadow-2xl border-t-4 border-primary overflow-hidden bg-white">
      <CardHeader className="bg-primary/5 border-b space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-headline font-black text-primary uppercase flex items-center gap-2">
              <Landmark className="h-5 w-5 text-accent animate-pulse" />
              National Fund Strength Map
            </CardTitle>
            <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
              Visualizing the movement's financial footprint across the archipelago.
            </CardDescription>
          </div>
          <Tabs value={metric} onValueChange={(v: any) => setMetric(v)} className="w-full md:w-auto">
            <TabsList className="bg-white border border-primary/10 h-10 w-full md:w-auto">
              <TabsTrigger value="funds" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                <Wallet className="h-3 w-3 mr-1.5" /> Total Funds
              </TabsTrigger>
              <TabsTrigger value="density" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="h-3 w-3 mr-1.5" /> Donor Density
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative h-[600px]">
        <MapContainer 
          center={center} 
          zoom={6} 
          scrollWheelZoom={false} 
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {stats.map((s: any) => {
            const coords = cityCoords[s.regionName?.toUpperCase()] || [14.5995, 120.9842];
            const currentVal = metric === 'funds' ? s.totalFunds : s.donorCount;
            const avgDonation = s.totalFunds / (s.donorCount || 1);

            return (
              <CircleMarker 
                key={s.id}
                center={[coords[0], coords[1]]}
                radius={getRadius(currentVal)}
                pathOptions={{
                  fillColor: getColor(currentVal),
                  color: '#fff',
                  weight: 2,
                  fillOpacity: 0.7
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[220px] space-y-4 font-sans">
                    <div className="flex justify-between items-start border-b pb-2 border-dashed">
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary leading-none">{s.regionName}</span>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Regional Tactical Hub</p>
                      </div>
                      <Badge className="bg-accent text-accent-foreground font-black text-[8px] uppercase">
                        RANK: TOP 5
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Total Pondo</p>
                        <p className="text-sm font-black text-primary">₱{s.totalFunds.toLocaleString()}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Patriots</p>
                        <p className="text-sm font-black text-primary">{s.donorCount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/10">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold uppercase text-primary/60">Avg Contribution</span>
                        <span className="text-[10px] font-black text-primary">₱{Math.round(avgDonation).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[8px] font-black uppercase text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      Momentum: {metric === 'funds' ? 'High Capital' : 'High Density'}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-6 left-6 z-[1000] max-w-[280px]">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-primary/10 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-black uppercase text-primary tracking-tight">Executive Summary</p>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-snug italic">
              "Intensity markers represent {metric === 'funds' ? 'total capital generated' : 'individual patriot count'} per region. Larger, gold markers indicate a primary stronghold."
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-dashed">
              <div className="h-2 w-2 rounded-full bg-primary" /> <span className="text-[8px] font-bold uppercase">Emerging</span>
              <div className="h-2 w-2 rounded-full bg-accent" /> <span className="text-[8px] font-bold uppercase">Dominant</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
