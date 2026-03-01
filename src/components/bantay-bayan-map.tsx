
"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertTriangle, TrendingUp, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export function BantayBayanMap({ reports }: { reports: any[] }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setIsMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then(mod => {
      setL(mod.default);
      delete (mod.default.Icon.Default.prototype as any)._getIconUrl;
      mod.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const handleUpvote = async (reportId: string, hasVoted: boolean) => {
    if (!user) return;
    try {
      const reportRef = doc(firestore, "civic_reports", reportId);
      await updateDoc(reportRef, {
        upvotes: hasVoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      toast({ title: hasVoted ? "Vote Withdrawn" : "Verification Logged", description: hasVoted ? "" : "Your upvote helps escalate this concern." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    }
  };

  if (!mounted || !L) {
    return <div className="h-[600px] w-full bg-muted/20 animate-pulse rounded-3xl border-2 border-dashed flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
    </div>;
  }

  const center: [number, number] = [14.5995, 120.9842]; // Manila Center

  return (
    <Card className="shadow-2xl border-t-4 border-red-700 overflow-hidden bg-white">
      <CardHeader className="bg-red-50/50 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-headline font-black text-red-800 uppercase flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 animate-pulse" />
            Civic Oversight Heat Map
          </CardTitle>
          <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-red-900/60">
            Documented issues within the National Accountability Ledger.
          </CardDescription>
        </div>
        <Badge variant="outline" className="bg-white text-red-700 border-red-200 font-black text-[9px]">
          {reports.length} ACTIVE SIGNALS
        </Badge>
      </CardHeader>
      <CardContent className="p-0 relative h-[600px]">
        <MapContainer center={center} zoom={11} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {reports.map((report: any) => {
            const hasVoted = report.upvotes?.includes(user?.uid);
            return (
              <Marker key={report.id} position={[report.location.lat, report.location.lng]}>
                <Popup className="font-sans">
                  <div className="p-3 min-w-[240px] space-y-4">
                    <div className="flex justify-between items-start border-b pb-2 border-dashed">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-red-700 leading-none">{report.category}</span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Registry Entry</span>
                      </div>
                      <Badge className="bg-red-600 text-white font-black text-[8px] uppercase px-2 py-0.5">
                        {report.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-black text-primary uppercase text-sm leading-tight">{report.title}</h4>
                      <div className="aspect-video w-full rounded-lg bg-muted overflow-hidden border shadow-inner">
                        <img src={report.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] leading-relaxed text-foreground/80 italic line-clamp-3">"{report.description}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dashed">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Upvotes</span>
                        <span className="text-xs font-black text-primary">{report.upvotes?.length || 0} Citizens</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant={hasVoted ? "secondary" : "default"}
                        className={`h-8 px-4 font-black uppercase text-[9px] ${!hasVoted ? 'bg-red-700 hover:bg-red-800' : ''}`}
                        onClick={() => handleUpvote(report.id, !!hasVoted)}
                      >
                        {hasVoted ? "Verified" : "Upvote"}
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
