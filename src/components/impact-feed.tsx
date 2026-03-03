"use client";

import { useCollection } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, Loader2, PartyPopper, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * @fileOverview Localized Impact Feed.
 * Surfaces resolved community issues to provide positive reinforcement to members.
 */
export function ImpactFeed({ city }: { city?: string }) {
  const { data: reports, loading } = useCollection('civic_reports', {
    queries: [
      { attribute: 'status', operator: '==', value: 'Resolved' }
    ]
  });

  const localWins = useMemo(() => {
    if (!city) return reports.slice(0, 5);
    return reports
      .filter(r => r.city === city)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [reports, city]);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary opacity-20" /></div>;
  }

  if (localWins.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed border-2 bg-muted/20">
        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest leading-relaxed">
          No resolutions documented in **{city || 'your area'}** yet. <br />
          Keep documenting local issues to drive accountability!
        </p>
        <Link href="/bantay-bayan">
          <Button variant="link" className="mt-4 text-primary font-black uppercase text-[10px] tracking-widest">
            Report an issue <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-2xl flex items-center justify-between overflow-hidden relative group">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <PartyPopper className="h-32 w-32" />
        </div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase font-headline leading-none">Power of Registry</h3>
          <p className="text-xs font-bold uppercase opacity-80 mt-2 tracking-widest">Your localized signals are being resolved.</p>
        </div>
        <div className="relative z-10 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30">
          <p className="text-2xl font-black">{localWins.length}</p>
          <p className="text-[8px] font-black uppercase">Resolutions</p>
        </div>
      </div>

      <div className="space-y-4">
        {localWins.map((win: any) => (
          <Card key={win.id} className="shadow-lg border-l-4 border-l-emerald-500 overflow-hidden bg-white group hover:shadow-xl transition-all">
            <CardContent className="p-5 flex items-center gap-5">
              <div className="h-16 w-16 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[8px] font-black uppercase">
                    {win.category}
                  </Badge>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    {win.createdAt ? formatDistanceToNow(win.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                  </span>
                </div>
                <h4 className="font-black text-sm uppercase text-primary leading-tight">{win.title}</h4>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
                    <MapPin className="h-3 w-3 text-red-600" />
                    {win.city}, {win.province}
                  </div>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Resolved
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
