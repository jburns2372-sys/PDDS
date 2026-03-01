
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Navigation, Phone, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

interface RescueMapProps {
  alerts: any[];
  onResolve: (id: string) => void;
  canResolve: boolean;
}

export function RescueMap({ alerts, onResolve, canResolve }: RescueMapProps) {
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

  if (!mounted || !L) {
    return <div className="h-[500px] w-full bg-muted animate-pulse rounded-3xl" />;
  }

  const center: [number, number] = [14.5995, 120.9842]; // Default Manila Center

  return (
    <Card className="shadow-2xl border-t-4 border-red-600 overflow-hidden bg-white">
      <CardHeader className="bg-red-50 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-headline font-black text-red-700 uppercase flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            National Rescue Map
          </CardTitle>
          <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-red-900/60">
            Encrypted Bayanihan Signal Monitor
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-red-600 text-white font-black text-[9px] uppercase border-none px-3">
            {alerts.filter(a => a.status === 'Active').length} ACTIVE Distractions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative h-[600px]">
        <MapContainer 
          center={center} 
          zoom={11} 
          scrollWheelZoom={true} 
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {alerts.map((alert: any) => {
            const isActive = alert.status === 'Active';
            
            return (
              <React.Fragment key={alert.id}>
                {isActive && (
                  <Circle 
                    center={[alert.location.lat, alert.location.lng]} 
                    radius={5000} 
                    pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} 
                  />
                )}
                <Marker position={[alert.location.lat, alert.location.lng]}>
                  <Popup className="font-sans">
                    <div className="p-3 min-w-[220px] space-y-4">
                      <div className="flex justify-between items-start border-b pb-2 border-dashed">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-primary leading-none">Member Distress</span>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Registry Signal Active</span>
                        </div>
                        <Badge className={`${isActive ? 'bg-red-600' : 'bg-green-600'} text-white font-black text-[8px] uppercase px-2 py-0.5`}>
                          {alert.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-primary uppercase text-sm leading-tight">{alert.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                          <Phone className="h-3 w-3 text-red-600" />
                          {alert.phoneNumber}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-2 rounded border-l-2 border-red-600 italic text-[10px] leading-relaxed">
                        "{alert.message}"
                      </div>

                      <div className="flex gap-2">
                        {canResolve && isActive && (
                          <button 
                            onClick={() => onResolve(alert.id)}
                            className="w-full h-10 bg-green-600 text-white font-black uppercase text-[9px] rounded-lg shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Render Aid & Resolve
                          </button>
                        )}
                        {!isActive && (
                          <div className="w-full h-10 bg-muted text-muted-foreground font-black uppercase text-[9px] rounded-lg flex items-center justify-center gap-2 italic">
                            <UserCheck className="h-3 w-3" /> Resolved by {alert.resolvedBy?.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-6 right-6 z-[1000] space-y-3">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-red-100 max-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-4 w-4 text-red-600" />
              <p className="text-[10px] font-black uppercase text-red-700 tracking-tight">Responder Protocol</p>
            </div>
            <p className="text-[10px] font-medium text-red-900 leading-snug italic">
              "Bayanihan response is mandatory for available Coordinators within 5KM. Ensure your secure radio is active before engagement."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
