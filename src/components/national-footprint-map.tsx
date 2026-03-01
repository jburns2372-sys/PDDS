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
 * Features: Administrative Heat Map, Rally Radius Filtering, and Radius Broadcast Dispatch.
 */

// Fix for default Leaflet marker icon issues
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

// 🗺️ Internal component to handle the Leaflet Heat Layer manually to avoid peer dep conflicts
function HeatLayer({ points }: { points: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const heatPoints = points.map(p => [p.lat, p.lng, 1]);
    
    // @ts-ignore - heatLayer is added to L by the import 'leaflet.heat'
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 30,
      max: 1,
      minOpacity: 0.2
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

interface NationalFootprintMapProps {
  supporters: any[];
}

export default function NationalFootprintMap({ supporters }: NationalFootprintMapProps) {
  const { toast } = useToast();
  const [rallyCenter, setRallyCenter] = useState<[number, number]>([14.5995, 120.9842]); // Default: Manila
  const [radiusKm, setRadiusKm] = useState(5); // Default: 5km Tactical Radius
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  // 📐 Haversine Formula: Checks if a supporter is within the Radius
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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

  const handleDispatch = (email: string, name: string) => {
    const subject = encodeURIComponent("TACTICAL ALERT: Regional Mobilization");
    const body = encodeURIComponent(`Greetings ${name},\n\nThis is an urgent mobilization alert for your local sector. Please report to the designated coordinate for further instruction.\n\nRespectfully,\nPDDS Tactical Command`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleRadiusBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({ variant: "destructive", title: "Message Required", description: "Please enter a directive for the broadcast." });
      return;
    }

    const confirmSend = window.confirm(
      `URGENT: Distribute this mobilization alert to ${localSupporters.length} supporters within the ${radiusKm}km tactical radius?`
    );

    if (!confirmSend) return;

    setIsSending(true);
    try {
      const targetNumbers = localSupporters
        .filter(s => s.phoneNumber)
        .map(s => s.phoneNumber);

      if (targetNumbers.length === 0) {
        throw new Error("No valid contact numbers found in the selected radius.");
      }

      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `TACTICAL ALERT: ${broadcastMessage}`, 
          numbers: targetNumbers,
          isUrgent: true 
        })
      });

      if (!response.ok) throw new Error("SMS Gateway communication failed.");

      toast({ 
        title: "Broadcast Dispatched", 
        description: `Alert sent to ${targetNumbers.length} supporters in the tactical zone.` 
      });
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
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
              <Navigation className="h-3 w-3 text-accent" />
              Tactical Command
            </p>
            <p className="text-xl font-black text-primary leading-tight">
              {localSupporters.length} <span className="text-xs font-bold text-muted-foreground uppercase">Nearby</span>
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Radius: {radiusKm}KM</span>
              <div className="flex gap-1">
                {[2, 5, 10].map(r => (
                  <button 
                    key={r} 
                    onClick={() => setRadiusKm(r)}
                    className={`text-[8px] px-2 py-0.5 rounded font-black transition-colors ${radiusKm === r ? 'bg-primary text-white' : 'bg-muted hover:bg-muted-foreground/20'}`}
                  >
                    {r}K
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <MapContainer 
          center={rallyCenter} 
          zoom={12} 
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 🔥 Layer 1: Administrative Heat Map (Privacy-First) */}
          <HeatLayer points={processedSupporters} />

          {/* ⭕ Layer 2: Tactical Radius Zone */}
          <Circle 
            center={rallyCenter} 
            pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--primary))', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }} 
            radius={radiusKm * 1000} 
          />

          {/* 📍 Layer 3: Proximity Markers (Dispatchable) */}
          {localSupporters.map((user) => (
            <Marker key={user.id || user.uid} position={[user.lat, user.lng]}>
              <Popup className="font-sans">
                <div className="p-2 space-y-3 min-w-[180px]">
                  <div className="space-y-1">
                    <p className="font-black text-primary uppercase text-sm leading-none">{user.fullName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{user.city || 'National'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 py-1 border-y border-dashed">
                    <span className={`h-2 w-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                        {user.isVerified ? 'Verified Citizen' : 'Pending Audit'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleDispatch(user.email, user.fullName)}
                      className="flex-1 h-8 font-black uppercase text-[9px] tracking-widest bg-primary hover:bg-primary/90"
                    >
                      <Mail className="mr-1 h-3 w-3" /> Email
                    </Button>
                    {user.phoneNumber && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href=`sms:${user.phoneNumber}`}
                        className="flex-1 h-8 font-black uppercase text-[9px] tracking-widest border-primary text-primary"
                      >
                        <Smartphone className="mr-1 h-3 w-3" /> SMS
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 🚀 Radius Broadcast Control Panel */}
      <Card className="shadow-xl border-t-4 border-primary bg-white overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-primary">
              <Megaphone className="h-5 w-5 text-accent animate-pulse" />
              Radius Dispatch Control
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Targeting:</span>
              <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
                {localSupporters.length} PEOPLE
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Tactical Directive Message</Label>
            <Textarea 
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Emergency Assembly at QC Circle: Mobilize immediately with official PDDS credentials. 🇵🇭"
              className="min-h-[100px] text-sm font-medium leading-relaxed bg-muted/30 focus:bg-white transition-colors"
            />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 pt-2">
            <div className="flex-1 flex items-center gap-3 p-3 bg-accent/10 rounded-xl border border-accent/20">
              <div className="bg-accent p-2 rounded-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] font-bold text-accent-foreground leading-tight uppercase">
                Currently targeting supporters within <span className="font-black underline">{radiusKm}km</span> of the command center.
              </p>
            </div>
            
            <Button 
              onClick={handleRadiusBroadcast}
              disabled={isSending || localSupporters.length === 0}
              className="w-full md:w-auto h-14 px-10 font-black uppercase tracking-[0.15em] text-sm shadow-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> DISPATCHING...</>
              ) : (
                <><Send className="mr-2 h-5 w-5" /> Execute Radius Broadcast</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
