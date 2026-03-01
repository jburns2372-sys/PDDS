
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useCollection } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Users, Navigation, Info, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

export function LocalMeetupMap() {
  const { userData } = useUserData();
  const { data: meetups, loading } = useCollection('meeting_requests', {
    queries: [{ attribute: 'status', operator: '==', value: 'Approved' }]
  });

  const [mounted, setIsMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then(mod => {
      setL(mod.default);
      // Fix marker icons
      delete (mod.default.Icon.Default.prototype as any)._getIconUrl;
      mod.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  // Filter approved meetups by current user's city/province for "Local" feel
  const localMeetups = useMemo(() => {
    if (!userData) return [];
    return meetups.filter(m => m.city === userData.city || m.province === userData.province);
  }, [meetups, userData]);

  if (!mounted || !L || loading) {
    return (
      <div className="h-[400px] w-full rounded-2xl bg-muted/20 animate-pulse flex flex-col items-center justify-center gap-4 border-2 border-dashed">
        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
        <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Triangulating Local Mobilization...</p>
      </div>
    );
  }

  // Centering logic (Default to Manila if no coords)
  const center: [number, number] = [14.5995, 120.9842];

  return (
    <Card className="shadow-2xl border-t-4 border-primary overflow-hidden bg-white">
      <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-headline font-black text-primary uppercase flex items-center gap-2">
            <Navigation className="h-5 w-5 text-accent animate-pulse" />
            Local Mobilizer Map
          </CardTitle>
          <CardDescription className="text-[9px] font-bold uppercase tracking-widest">
            Showing approved supporter-led gatherings in your jurisdiction.
          </CardDescription>
        </div>
        <Badge variant="outline" className="bg-white text-primary border-primary/20 font-black text-[9px]">
          {localMeetups.length} ACTIVE POINTS
        </Badge>
      </CardHeader>
      <CardContent className="p-0 relative h-[500px]">
        <MapContainer 
          center={center} 
          zoom={12} 
          scrollWheelZoom={false} 
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Circle 
            center={center} 
            radius={10000} 
            pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--primary))', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} 
          />

          {localMeetups.map((m: any) => (
            <Marker key={m.id} position={[m.locationCoords.lat, m.locationCoords.lng]}>
              <Popup>
                <div className="p-3 min-w-[200px] space-y-3 font-sans">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-primary text-white text-[8px] font-black uppercase py-0 px-1.5">{m.meetingType}</Badge>
                    <div className="flex items-center gap-1 text-green-600">
                      <ShieldCheck className="h-3 w-3" />
                      <span className="text-[8px] font-black uppercase">Approved</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-black text-primary uppercase text-sm leading-tight">{m.title}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {m.locationAddress}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-dashed flex items-center justify-between text-[9px] font-black uppercase text-primary/60">
                    <span>{format(new Date(m.dateTime), 'MMM dd, p')}</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      Host: {m.hostName?.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-4 left-4 z-[1000] max-w-[250px]">
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-primary/10 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3 text-primary" />
              <p className="text-[9px] font-black uppercase text-primary tracking-tight">Mobilization Directive</p>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-snug italic">
              "Pins represent approved community-led assemblies. Tap a pin to view gathering details."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
