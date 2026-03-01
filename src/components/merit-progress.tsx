
"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Trophy, Medal } from "lucide-react";
import { useMemo } from "react";

type MeritProgressProps = {
  meritPoints: number;
};

export function MeritProgress({ meritPoints = 0 }: MeritProgressProps) {
  const stats = useMemo(() => {
    let tier = "Bronze";
    let icon = Star;
    let nextTierPoints = 100;
    let progress = (meritPoints / 100) * 100;
    let color = "bg-amber-700";

    if (meritPoints > 500) {
      tier = "Gold Patriot";
      icon = Trophy;
      nextTierPoints = 1000; // Stretch goal
      progress = 100;
      color = "bg-yellow-500";
    } else if (meritPoints > 100) {
      tier = "Silver Mobilizer";
      icon = Shield;
      nextTierPoints = 500;
      progress = ((meritPoints - 100) / 400) * 100;
      color = "bg-slate-400";
    }

    return { tier, icon, nextTierPoints, progress, color };
  }, [meritPoints]);

  const Icon = stats.icon;

  return (
    <div className="space-y-4 p-4 bg-white rounded-2xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${stats.color} text-white shadow-lg`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Current Merit Tier</p>
            <h3 className="text-lg font-black uppercase text-primary font-headline tracking-tight">{stats.tier}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary leading-none">{meritPoints}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Merit Points</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-primary/60">
          <span>Progress to Next Tier</span>
          <span>{meritPoints} / {stats.nextTierPoints}</span>
        </div>
        <div className="h-3 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/10">
          <div 
            className={`h-full ${stats.color} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(stats.progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[8px] font-black uppercase py-0.5">
          <Medal className="h-2.5 w-2.5 mr-1" />
          Patriot Growth Active
        </Badge>
        <p className="text-[9px] font-bold text-muted-foreground italic leading-none">
          "Your service to the nation is tracked and rewarded."
        </p>
      </div>
    </div>
  );
}
