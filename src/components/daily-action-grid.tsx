"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, Wallet, ShieldAlert, Hexagon, Landmark, Search, HeartHandshake } from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview Daily Action Center Grid.
 * REFACTORED: Fluid 4-column layout on desktop with enlarged tap targets.
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action) => (
        <Card key={action.label} className="group hover:shadow-2xl transition-all border-none overflow-hidden cursor-pointer bg-white rounded-[32px]">
          <Link href={action.href}>
            <CardContent className="p-0">
              <div className={`${action.color} p-10 flex justify-center items-center group-hover:scale-105 transition-transform duration-500`}>
                <action.icon className={`h-14 w-14 ${action.iconColor} group-hover:animate-pulse`} />
              </div>
              <div className="p-6 text-center">
                <p className="font-black text-xl uppercase tracking-tight text-primary leading-none">{action.label}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-[0.2em]">{action.desc}</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
