"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, Wallet, ShieldAlert, Hexagon, Landmark, Search, HeartHandshake } from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview Daily Action Center Grid.
 * ACTIVATED: Full interactivity with hover feedback and active scaling.
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
      {actions.map((action) => (
        <Link key={action.label} href={action.href} className="block group">
          <Card className="hover:shadow-2xl transition-all duration-300 border-none overflow-hidden cursor-pointer bg-white rounded-[24px] active:scale-95">
            <CardContent className="p-0">
              <div className={`${action.color} p-6 flex justify-center items-center group-hover:scale-105 transition-transform duration-500`}>
                <action.icon className={`h-10 w-10 ${action.iconColor} group-hover:animate-pulse`} />
              </div>
              <div className="p-4 text-center">
                <p className="font-black text-base uppercase tracking-tight text-primary leading-none group-hover:text-accent transition-colors">{action.label}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1.5 tracking-[0.2em]">{action.desc}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
