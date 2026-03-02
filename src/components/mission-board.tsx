
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Users, Share2, ShieldCheck, CheckCircle2, ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { useUserData } from "@/context/user-data-context";

/**
 * @fileOverview gamified Mission Board for Merit Points.
 * Encourages high-value organizational behavior.
 */
export function MissionBoard() {
  const { userData } = useUserData();

  const missions = [
    { 
      id: "referral",
      title: "Induct 1 New Patriot", 
      points: 50, 
      icon: Users, 
      status: "Active", 
      href: "/home",
      desc: "Grow the movement by bringing in a fellow citizen."
    },
    { 
      id: "share",
      title: "Share Policy of the Day", 
      points: 10, 
      icon: Share2, 
      status: "Active", 
      href: "/policies",
      desc: "Spread the roadmap for Federalism on your social media."
    },
    { 
      id: "vetting",
      title: "Verify Induction (Silver Tier)", 
      points: 100, 
      icon: ShieldCheck, 
      status: userData?.vettingLevel !== "Bronze" ? "Completed" : "Active", 
      href: "/profile",
      desc: "Upload your ID to become a fully vetted Mobilizer."
    },
    { 
      id: "reporting",
      title: "Audit a Local Concern", 
      points: 25, 
      icon: Target, 
      status: "Active", 
      href: "/bantay-bayan",
      desc: "Document 1 civic issue in your community."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border-2 border-dashed border-accent/30 p-6 rounded-2xl flex items-start gap-4">
        <div className="bg-accent p-3 rounded-xl shadow-lg">
          <Star className="h-6 w-6 text-primary fill-current" />
        </div>
        <div>
          <h3 className="font-black text-primary uppercase text-sm">Strategic Directives</h3>
          <p className="text-xs text-primary/70 mt-1 leading-relaxed">
            Complete the missions below to earn **Merit Points** and advance through the organizational tiers. Higher tiers unlock exclusive tactical assets and command privileges.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {missions.map((mission) => (
          <Card key={mission.id} className={`shadow-md border-l-4 transition-all hover:translate-x-1 ${mission.status === 'Completed' ? 'border-l-emerald-500 bg-emerald-50/10 opacity-70' : 'border-l-primary bg-white'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${mission.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/5 text-primary'}`}>
                  <mission.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase text-primary leading-tight">{mission.title}</h4>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1">{mission.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-sm font-black ${mission.status === 'Completed' ? 'text-emerald-600' : 'text-accent'}`}>+{mission.points} PTS</p>
                  {mission.status === 'Completed' && (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                      <span className="text-[8px] font-black uppercase text-emerald-600">AWARDED</span>
                    </div>
                  )}
                </div>
                {mission.status !== 'Completed' && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={mission.href}>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
