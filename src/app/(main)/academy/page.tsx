"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Play, CheckCircle2, Lock, Loader2, Award, BookOpen, ShieldCheck, Download, Sparkles } from "lucide-react";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AcademyPlayer } from "@/components/academy-player";
import { CertificateDialog } from "@/components/certificate-dialog";

/**
 * @fileOverview Pederalismo Academy Training Center.
 * REFACTORED: 4-column fluid layout for maximum desktop utilization.
 */
export default function AcademyPage() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  const { data: courses, loading: coursesLoading } = useCollection('courses');
  const { data: progress, loading: progressLoading } = useCollection(`users/${user?.uid}/course_progress`);

  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const stats = useMemo(() => {
    const completedIds = progress.filter((p: any) => p.status === 'Completed').map((p: any) => p.id);
    const total = courses.length;
    const completed = completedIds.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completedIds, total, completed, percentage };
  }, [courses, progress]);

  const handleComplete = async (courseId: string) => {
    if (!user || stats.completedIds.includes(courseId)) return;

    try {
      const progressRef = doc(firestore, `users/${user.uid}/course_progress`, courseId);
      await setDoc(progressRef, {
        status: "Completed",
        completedAt: serverTimestamp()
      });

      const userRef = doc(firestore, "users", user.uid);
      const updates: any = { meritPoints: increment(25) };

      if (stats.completed + 1 === stats.total) {
        updates.vettingLevel = "Silver";
        updates.achievements = ["Academy Graduate"];
        toast({
          title: "Tier Upgrade Authorized!",
          description: "You have been promoted to Silver Mobilizer tier.",
          variant: "default"
        });
      }

      await updateDoc(userRef, updates);
      toast({ title: "Module Mastered", description: "+25 Merit Points awarded." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: error.message });
    }
  };

  if (coursesLoading || progressLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Academy Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      
      {/* Header - Maximized */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b-8 border-emerald-600 pb-12">
        <div className="flex items-center gap-8">
          <div className="p-6 bg-emerald-600 text-white rounded-3xl shadow-2xl">
            <GraduationCap className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-5xl md:text-7xl font-black text-primary font-headline uppercase tracking-tighter">Pederalismo Academy</h1>
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-emerald-100 text-emerald-700 font-black text-sm uppercase px-4 py-1.5 border-none">Officer Training</Badge>
              <Badge variant="outline" className="text-sm font-black uppercase border-primary/20 px-4 py-1.5">Jurisdiction: National</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-8 items-center bg-slate-50 p-8 rounded-3xl border-2 border-emerald-100">
          <div className="text-right">
            <p className="text-5xl font-black text-emerald-600">{stats.percentage}%</p>
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Mastery Complete</p>
          </div>
          {stats.percentage === 100 && (
            <Button 
              onClick={() => setShowCertificate(true)}
              className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-sm h-16 px-10 shadow-2xl rounded-2xl"
            >
              <Award className="mr-3 h-6 w-6" /> Issue Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid - Refactored to 4-column desktop logic */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {courses.sort((a, b) => (a.order || 0) - (b.order || 0)).map((course: any) => {
          const isCompleted = stats.completedIds.includes(course.id);
          const isActive = activeCourse?.id === course.id;

          return (
            <Card key={course.id} className={`shadow-xl border-t-8 flex flex-col overflow-hidden transition-all hover:translate-y-[-8px] rounded-[32px] ${isCompleted ? 'border-t-emerald-500 bg-emerald-50/10' : isActive ? 'border-t-accent' : 'border-t-primary'}`}>
              <CardHeader className="bg-muted/30 pb-6 pt-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-600/20 text-emerald-700 px-3">{course.category}</Badge>
                  {isCompleted && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
                </div>
                <CardTitle className="text-2xl font-headline font-black text-primary uppercase leading-tight">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 flex-1 flex flex-col">
                <p className="text-lg text-foreground/70 leading-relaxed font-medium mb-8 flex-1">
                  {course.description || "Foundational briefing for the PDDS leadership track."}
                </p>
                
                {isActive ? (
                  <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-12">
                    <div className="w-full max-w-6xl">
                      <div className="flex justify-end mb-4">
                        <Button variant="ghost" className="text-white text-xl font-black" onClick={() => setActiveCourse(null)}>CLOSE BRIEFING [X]</Button>
                      </div>
                      <AcademyPlayer 
                        videoUrl={course.videoUrl} 
                        onComplete={() => { handleComplete(course.id); setActiveCourse(null); }} 
                      />
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setActiveCourse(course)}
                    className="w-full h-16 font-black uppercase tracking-widest shadow-xl rounded-2xl text-lg"
                    variant={isCompleted ? "outline" : "default"}
                  >
                    <Play className="mr-3 h-6 w-6" /> 
                    {isCompleted ? "Review Module" : "Start Briefing"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {courses.length === 0 && (
          <Card className="col-span-full p-32 text-center border-4 border-dashed bg-muted/20 rounded-[40px]">
            <BookOpen className="h-24 w-24 text-muted-foreground/30 mx-auto mb-8" />
            <p className="text-2xl text-muted-foreground font-black uppercase tracking-widest">No academy modules currently deployed.</p>
          </Card>
        )}
      </div>

      <CertificateDialog 
        isOpen={showCertificate} 
        onOpenChange={setShowCertificate} 
        userName={userData?.fullName}
        completionDate={new Date().toLocaleDateString()}
      />
    </div>
  );
}
