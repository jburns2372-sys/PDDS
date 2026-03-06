"use client";

import { useCollection } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Trophy, ShieldCheck, BookOpen, Medal } from "lucide-react";
import { useMemo } from "react";

/**
 * @fileOverview Skills & Educational Progress component.
 * Displays the member's academy completion and achievement status.
 */
export function SkillsProgress() {
  const { user, userData } = useUserData();
  const { data: allCourses } = useCollection('courses');
  const { data: userProgress } = useCollection(`users/${user?.uid}/course_progress`);

  const stats = useMemo(() => {
    if (!allCourses.length) return { percentage: 0, completed: 0, total: 0 };
    const completedCount = userProgress.filter(p => p.status === 'Completed').length;
    const percentage = Math.round((completedCount / allCourses.length) * 100);
    return { percentage, completed: completedCount, total: allCourses.length };
  }, [allCourses, userProgress]);

  const hasGraduated = stats.percentage === 100 && stats.total > 0;

  return (
    <Card className="shadow-lg border-t-4 border-emerald-600 bg-white overflow-hidden mb-8">
      <CardHeader className="bg-emerald-50/50 pb-4 border-b">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Pederalismo Academy
            </CardTitle>
            <CardDescription className="text-[9px] font-bold uppercase">
              Operational Readiness & Ideology
            </CardDescription>
          </div>
          {hasGraduated && (
            <Badge className="bg-emerald-600 text-white animate-bounce border-none text-[8px] font-black uppercase">
              <Medal className="h-2.5 w-2.5 mr-1" /> GRADUATE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-700">
            <span>Leadership Modules</span>
            <span>{stats.completed} / {stats.total}</span>
          </div>
          <div className="h-2.5 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 transition-all duration-1000 ease-in-out" 
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-dashed">
            <BookOpen className="h-3 w-3 text-primary opacity-40" />
            <span className="text-[8px] font-black uppercase text-muted-foreground">Mastery: {stats.percentage}%</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-dashed">
            <ShieldCheck className="h-3 w-3 text-primary opacity-40" />
            <span className="text-[8px] font-black uppercase text-muted-foreground">Tier: {userData?.vettingLevel || 'Bronze'}</span>
          </div>
        </div>

        {hasGraduated && (
          <div className="pt-2 flex items-center gap-2 text-emerald-700 font-bold text-[9px] uppercase tracking-tighter italic">
            <Trophy className="h-3 w-3" />
            Vetting Level: Silver Mobilizer Authorized
          </div>
        )}
      </CardContent>
    </Card>
  );
}
