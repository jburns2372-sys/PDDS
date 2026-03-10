
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, Gavel, HeartHandshake, Landmark, Scale, Shield, type LucideIcon } from "lucide-react";
import type { Agenda } from "@/lib/data";

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Gavel,
  Landmark,
  Scale,
  Shield,
  HeartHandshake,
};

export function PillarHoverCard({ pillar }: { pillar: Agenda }) {
  const Icon = iconMap[pillar.icon];

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="group flex h-full cursor-pointer flex-col items-center justify-center text-center transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-2xl border-2 border-primary/5 active:scale-95">
            <CardHeader className="pb-2">
              <div className="mx-auto rounded-2xl bg-primary/5 p-4 group-hover:bg-white/10 transition-colors">
                {Icon && <Icon className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-black font-headline uppercase tracking-tighter leading-tight">
                {pillar.title}
              </CardTitle>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="w-80 bg-primary text-primary-foreground p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,35,102,0.3)] border-none"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-2">
              {Icon && <Icon className="h-5 w-5 text-accent" />}
              <h4 className="font-black uppercase text-xs tracking-widest">{pillar.title} BRIEFING</h4>
            </div>
            <ul className="space-y-2">
              {pillar.details.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-[11px] leading-relaxed font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <p className="text-[8px] font-black uppercase text-accent tracking-[0.2em] opacity-60">Strategic Pillar Node</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
