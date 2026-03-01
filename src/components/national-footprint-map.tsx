'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * @fileOverview National Footprint Map Component.
 * Visualizes supporter density across the Philippines with interactive markers.
 */

// Fix for default Leaflet marker icon issues in Next.js/Webpack
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

interface NationalFootprintMapProps {
  supporters: any[];
}

export default function NationalFootprintMap({ supporters }: NationalFootprintMapProps) {
  // Ensure icons are correctly rendered on mount
  useEffect(() => {
    // Resetting prototype just in case of race conditions
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-muted/20">
      <MapContainer 
        center={[12.8797, 121.7740]} 
        zoom={6} 
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {supporters.map((user) => {
          const cityKey = (user.city || "").toUpperCase();
          // Use lookup or fall back to slightly jittered Manila coords if unknown to prevent overlap
          const position = cityCoords[cityKey] || [14.5995 + (Math.random() * 0.1), 120.9842 + (Math.random() * 0.1)];

          return (
            <Marker key={user.id || user.uid} position={position}>
              <Popup className="font-sans">
                <div className="p-1 space-y-1">
                  <p className="font-black text-primary uppercase text-xs leading-none">{user.fullName}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{user.city || 'National'}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className={`h-2 w-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                        {user.isVerified ? 'Verified Citizen' : 'Pending Audit'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
