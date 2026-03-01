'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Button } from './ui/button';
import { Mail, Navigation } from 'lucide-react';

/**
 * @fileOverview Tactical Command Map Component.
 * Features: Administrative Heat Map, Rally Radius Filtering, and Proximity Dispatch.
 * Fixed: Heatmap implementation now uses leaflet.heat directly to avoid React 18 peer dependency issues.
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
  const [rallyCenter, setRallyCenter] = useState<[number, number]>([14.5995, 120.9842]); // Default: Manila
  const [radiusKm, setRadiusKm] = useState(5); // Default: 5km Tactical Radius

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
      const coords = cityCoords[cityKey] || [14.5995 + (Math.random() * 0.5), 120.9842 + (Math.random() * 0.5)];
      return { ...s, lat: coords[0], lng: coords[1] };
    });
  }, [supporters]);

  const localSupporters = useMemo(() => {
    return processedSupporters.filter(s => getDistance(s.lat, s.lng, rallyCenter[0], rallyCenter[1]) <= radiusKm);
  }, [processedSupporters, rallyCenter, radiusKm]);

  const handleDispatch = (email: string, name: string) => {
    const subject = encodeURIComponent("TACTICAL ALERT: Regional Mobilization");
    const body = encodeURIComponent(`Greetings ${name},\n\nThis is an urgent mobilization alert for your local sector. Please report to the designated coordinate for further instruction.\n\nRespectfully,\nPDDS Tactical Command`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-muted/20">
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-primary/10 max-w-[200px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
            <Navigation className="h-3 w-3 text-accent" />
            Tactical Command
          </p>
          <p className="text-lg font-black text-primary leading-tight">
            {localSupporters.length} <span className="text-xs font-bold text-muted-foreground uppercase">Nearby</span>
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Radius: {radiusKm}KM</p>
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

                <Button 
                  onClick={() => handleDispatch(user.email, user.fullName)}
                  className="w-full h-9 font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90"
                >
                  <Mail className="mr-2 h-3 w-3" /> Dispatch Member
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
