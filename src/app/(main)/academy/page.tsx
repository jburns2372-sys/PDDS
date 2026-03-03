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
 * @fileOverview Federalismo Academy Training Center.
 * Handles course delivery, progress tracking, and automated tier upgrades.
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
    // Explicitly type 'p' as any to satisfy strict compiler checks during production build
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

      // Award Points
      const userRef = doc(firestore, "users", user.uid);
      const updates: any = { meritPoints: increment(25) };

      // Automatic Tier Upgrade Logic
      // If this was the final course, upgrade to Silver
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
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Academy Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-emerald-600 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tight">Federalismo Academy</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] uppercase border-none">Officer Training</Badge>
                <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20">Jurisdiction: National</Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">{stats.percentage}%</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Completion</p>
            </div>
            {stats.percentage === 100 && (
              <Button 
                onClick={() => setShowCertificate(true)}
                className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] h-12 px-6 shadow-xl"
              >
                <Award className="mr-2 h-4 w-4" /> Issue Certificate
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Course Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Available Training Modules
              </h2>
            </div>

            <div className="grid gap-6">
              {courses.sort((a, b) => (a.order || 0) - (b.order || 0)).map((course: any) => {
                const isCompleted = stats.completedIds.includes(course.id);
                const isActive = activeCourse?.id === course.id;

                return (
                  <Card key={course.id} className={`shadow-lg border-l-4 overflow-hidden transition-all ${isCompleted ? 'border-l-emerald-500 bg-emerald-50/10' : isActive ? 'border-l-accent' : 'border-l-primary'}`}>
                    <CardHeader className="bg-muted/30 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase mb-2 border-emerald-600/20 text-emerald-700">{course.category}</Badge>
                          <CardTitle className="text-lg font-headline font-black text-primary uppercase leading-tight">{course.title}</CardTitle>
                        </div>
                        {isCompleted && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm text-foreground/70 leading-relaxed font-medium mb-6">
                        {course.description || "Foundational briefing for the PDDS leadership track."}
                      </p>
                      
                      {isActive ? (
                        <AcademyPlayer 
                          videoUrl={course.videoUrl} 
                          onComplete={() => handleComplete(course.id)} 
                        />
                      ) : (
                        <Button 
                          onClick={() => setActiveCourse(course)}
                          className="w-full h-12 font-black uppercase tracking-widest shadow-md"
                          variant={isCompleted ? "outline" : "default"}
                        >
                          <Play className="mr-2 h-4 w-4" /> 
                          {isCompleted ? "Review Module" : "Start Briefing"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {courses.length === 0 && (
                <Card className="p-24 text-center border-2 border-dashed bg-muted/20">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">No academy modules currently deployed.</p>
                </Card>
              )}
            </div>
          </div>

          {/* Advancement Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-2xl border-t-4 border-accent overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Advancement Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-emerald-700">1</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-primary">Foundational Knowledge</p>
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed mt-1">Complete all Leadership and Federalism core modules.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-emerald-700">2</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-primary">Tier Promotion</p>
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed mt-1">Automatic upgrade to Silver Mobilizer vetting level upon graduation.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-emerald-700">3</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-primary">Certificate Issuance</p>
                      <p className="text-[10px] font-medium text-muted-foreground leading-relaxed mt-1">Download your official credential for local chapter validation.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed">
                  <Card className="bg-primary text-white shadow-inner">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <h3 className="text-[10px] font-black uppercase tracking-tight">Executive Strategy</h3>
                      </div>
                      <p className="text-[10px] font-medium leading-relaxed italic opacity-80">
                        "Knowledge is the fuel of our movement. A member who masters the platform is a leader who masters the field."
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
