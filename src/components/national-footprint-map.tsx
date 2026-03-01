'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Button } from './ui/button';
import { Mail, Navigation, Megaphone, Loader2, Send, Smartphone, MapPin } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

/**
 * @fileOverview Tactical Command Map Component.
 * Optimized for workstation stability and SSR compatibility.
 */

const cityCoords: Record<string, [number, number]> = {
  "QUEZON CITY": [14.6760, 121.0437],
  "CITY OF MANILA": [14.5995, 120.9842],
  "METRO MANILA (NCR)": [14.5995, 120.9842],
  "CEBU CITY": [10.3157, 123.8854],
  "DAVAO CITY": [7.1907, 125.4553],
  "ILOILO CITY": [10.7202, 122.5621],
  "BACOLOD CITY": [10.6765, 122.9509],
  "CAGAYAN DE ORO": [8.4542, 124.6319],
  "ZAMBOANGA CITY": [6.9214, 122.0790],
  "BAGUIO": [16.4023, 120.5960],
  "TAGUIG CITY": [14.5176, 121.0509],
  "PASIG CITY": [14.5764, 121.0851],
  "MAKATI CITY": [14.5547, 121.0244],
  "ANTIPOLO CITY": [14.5845, 121.1754],
  "CALOOCAN CITY": [14.6416, 120.9762],
  "MANILA": [14.5995, 120.9842],
};

function HeatLayer({ points }: { points: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;
    const heatPoints = points.map(p => [p.lat, p.lng, 1]);
    
    // @ts-ignore
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 30,
      max: 1,
      minOpacity: 0.2
    }).addTo(map);

    return () => { map.removeLayer(heatLayer); };
  }, [map, points]);

  return null;
}

interface NationalFootprintMapProps {
  supporters: any[];
}

export default function NationalFootprintMap({ supporters }: NationalFootprintMapProps) {
  const { toast } = useToast();
  const [rallyCenter, setRallyCenter] = useState<[number, number]>([14.5995, 120.9842]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Set default icon inside effect to prevent SSR errors
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const processedSupporters = useMemo(() => {
    return supporters.map(s => {
      const cityKey = (s.city || "").toUpperCase();
      const coords = cityCoords[cityKey] || [14.5995 + (Math.random() * 0.1), 120.9842 + (Math.random() * 0.1)];
      return { ...s, lat: coords[0], lng: coords[1] };
    });
  }, [supporters]);

  const localSupporters = useMemo(() => {
    return processedSupporters.filter(s => getDistance(s.lat, s.lng, rallyCenter[0], rallyCenter[1]) <= radiusKm);
  }, [processedSupporters, rallyCenter, radiusKm]);

  const handleRadiusBroadcast = async () => {
    if (!broadcastMessage.trim()) return toast({ variant: "destructive", title: "Message Required" });
    if (!window.confirm(`Distribute alert to ${localSupporters.length} supporters?`)) return;

    setIsSending(true);
    try {
      const targetNumbers = localSupporters.filter(s => s.phoneNumber).map(s => s.phoneNumber);
      if (targetNumbers.length === 0) throw new Error("No contact numbers in radius.");

      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `ALERT: ${broadcastMessage}`, numbers: targetNumbers, isUrgent: true })
      });

      toast({ title: "Broadcast Dispatched" });
      setBroadcastMessage("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Broadcast Failed", description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-muted/20">
        <div className="absolute top-4 left-4 z-[1000] space-y-2">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-primary/10 min-w-[200px]">
            <p className="text-[10px] font-black uppercase text-primary mb-1 flex items-center gap-2"><Navigation className="h-3 w-3 text-accent" />Tactical Command</p>
            <p className="text-xl font-black text-primary leading-tight">{localSupporters.length} <span className="text-xs font-bold text-muted-foreground uppercase">Nearby</span></p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Radius: {radiusKm}KM</span>
              <div className="flex gap-1">{[2, 5, 10].map(r => (<button key={r} onClick={() => setRadiusKm(r)} className={`text-[8px] px-2 py-0.5 rounded font-black transition-colors ${radiusKm === r ? 'bg-primary text-white' : 'bg-muted hover:bg-muted-foreground/20'}`}>{r}K</button>))}</div>
            </div>
          </div>
        </div>

        <MapContainer center={rallyCenter} zoom={12} scrollWheelZoom={false} className="w-full h-full">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <HeatLayer points={processedSupporters} />
          <Circle center={rallyCenter} pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--primary))', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }} radius={radiusKm * 1000} />
          {localSupporters.map((user) => (
            <Marker key={user.id || user.uid} position={[user.lat, user.lng]}>
              <Popup className="font-sans">
                <div className="p-2 space-y-3 min-w-[180px]">
                  <p className="font-black text-primary uppercase text-sm leading-none">{user.fullName}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{user.city || 'National'}</p>
                  <div className="flex gap-2 border-t pt-2">
                    <Button size="sm" onClick={() => window.open(`mailto:${user.email}`, '_blank')} className="flex-1 h-8 font-black uppercase text-[9px]"><Mail className="mr-1 h-3 w-3" /> Email</Button>
                    {user.phoneNumber && <Button size="sm" variant="outline" onClick={() => window.location.href=`sms:${user.phoneNumber}`} className="flex-1 h-8 font-black uppercase text-[9px]"><Smartphone className="mr-1 h-3 w-3" /> SMS</Button>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <Card className="shadow-xl border-t-4 border-primary bg-white">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-primary"><Megaphone className="h-5 w-5 text-accent animate-pulse" />Radius Dispatch Control</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-primary/60">Tactical Directive Message</Label>
            <Textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="e.g. Emergency Assembly at QC Circle: Mobilize immediately with official PDDS credentials. 🇵🇭" className="min-h-[100px] text-sm font-medium leading-relaxed bg-muted/30 focus:bg-white transition-colors" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
            <div className="flex-1 flex items-center gap-3 p-3 bg-accent/10 rounded-xl border border-accent/20">
              <div className="bg-accent p-2 rounded-lg"><MapPin className="h-4 w-4 text-white" /></div>
              <p className="text-[10px] font-bold text-accent-foreground leading-tight uppercase">Targeting <span className="font-black underline">{radiusKm}km</span> zone.</p>
            </div>
            <Button onClick={handleRadiusBroadcast} disabled={isSending || localSupporters.length === 0} className="w-full md:w-auto h-14 px-10 font-black uppercase tracking-[0.15em] text-sm shadow-2xl bg-primary hover:bg-primary/90">
              {isSending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> DISPATCHING...</> : <><Send className="mr-2 h-5 w-5" /> Execute Radius Broadcast</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
