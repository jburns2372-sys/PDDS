
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, Wallet, ShieldAlert, Hexagon, Landmark, Search, HeartHandshake } from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview Daily Action Center Grid.
 * Vibrant, mobile-first quick access to core party functions.
 */
export function DailyActionGrid() {
  const actions = [
    { 
      label: "Speak Up", 
      desc: "PatriotHub Node", 
      icon: Hexagon, 
      href: "/chat", 
      color: "bg-primary", 
      iconColor: "text-accent" 
    },
    { 
      label: "Report", 
      desc: "Bantay Bayan", 
      icon: Eye, 
      href: "/bantay-bayan", 
      color: "bg-red-700", 
      iconColor: "text-white" 
    },
    { 
      label: "Contribute", 
      desc: "PatriotPondo", 
      icon: Landmark, 
      href: "/patriot-pondo", 
      color: "bg-emerald-600", 
      iconColor: "text-white" 
    },
    { 
      label: "SOS", 
      desc: "Bayanihan Help", 
      icon: HeartHandshake, 
      href: "/bayanihan", 
      color: "bg-red-600", 
      iconColor: "text-white" 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Card key={action.label} className="group hover:shadow-xl transition-all border-none overflow-hidden cursor-pointer bg-white">
          <Link href={action.href}>
            <CardContent className="p-0">
              <div className={`${action.color} p-4 flex justify-center items-center group-hover:scale-105 transition-transform duration-500`}>
                <action.icon className={`h-8 w-8 ${action.iconColor} group-hover:animate-pulse`} />
              </div>
              <div className="p-3 text-center">
                <p className="font-black text-xs uppercase tracking-tight text-primary leading-none">{action.label}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{action.desc}</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
