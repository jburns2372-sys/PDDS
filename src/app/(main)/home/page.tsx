"use client";

import { useUserData } from "@/context/user-data-context";
import { DigitalIdCard } from "@/components/digital-id-card";
import { DailyActionGrid } from "@/components/daily-action-grid";
import { CommandSwitchboard } from "@/components/command-switchboard";
import { DailyPulse } from "@/components/daily-pulse";
import { MissionBoard } from "@/components/mission-board";
import { MeritProgress } from "@/components/merit-progress";
import { SkillsProgress } from "@/components/skills-progress";
import { VipVerificationBanner } from "@/components/vip-verification-banner";
import { ImpactFeed } from "@/components/impact-feed";
import { CoordinatorLeaderboard } from "@/components/coordinator-leaderboard";

/**
 * @fileOverview PatriotLink Home Dashboard.
 * Consolidated tactical hub featuring Digital ID, Action Grid, and Pulse analytics.
 */
export default function HomePage() {
  const { userData } = useUserData();

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 px-2 lg:px-0">
      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-primary pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tighter italic leading-none">
            Command Center Online
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-3">
            National Strategy & Mobilization Hub • PDDS 2026
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase text-primary/60 tracking-widest">Registry Sync Active</span>
        </div>
      </div>

      <VipVerificationBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Identity & Stats (4/12) */}
        <div className="lg:col-span-4 space-y-8">
          <DigitalIdCard userData={userData} />
          <CommandSwitchboard />
          <MeritProgress meritPoints={userData?.meritPoints || 0} />
          <SkillsProgress />
        </div>

        {/* Right Col: Actions & Operations (8/12) */}
        <div className="lg:col-span-8 space-y-10">
          <DailyActionGrid />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-10">
              <DailyPulse />
              <ImpactFeed city={userData?.city} />
            </div>
            <div className="space-y-10">
              <MissionBoard />
              <CoordinatorLeaderboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
