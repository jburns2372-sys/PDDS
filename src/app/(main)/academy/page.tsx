"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, 
  Play, 
  CheckCircle2, 
  Lock, 
  Loader2, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  Download, 
  Sparkles,
  Search,
  Share2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  BookMarked
} from "lucide-react";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AcademyPlayer } from "@/components/academy-player";
import { CertificateDialog } from "@/components/certificate-dialog";
import { PolicyQuizDialog } from "@/components/policy-quiz-dialog";
import { policyCategories } from "@/lib/data";

/**
 * @fileOverview PDDS ACADEMY Training & Manifesto Hub.
 * Unified center for Leadership Track and Ideological Foundations.
 */
export default function AcademyPage() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();

  // --- Academy Track Data ---
  const { data: courses, loading: coursesLoading } = useCollection('courses');
  const { data: courseProgress, loading: progressLoading } = useCollection(`users/${user?.uid}/course_progress`);

  // --- Policy/Manifesto Data ---
  const { data: policies, loading: policiesLoading } = useCollection('policies');
  const { data: userEngagements } = useCollection(`users/${user?.uid}/policy_engagement`);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState("leadership");
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [quizPolicy, setQuizPolicy] = useState<any>(null);

  const stats = useMemo(() => {
    const completedIds = courseProgress.filter((p: any) => p.status === 'Completed').map((p: any) => p.id);
    const total = courses.length;
    const completed = completedIds.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completedIds, total, completed, percentage };
  }, [courses, courseProgress]);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [policies, searchTerm, activeCategory]);

  const handleCompleteCourse = async (courseId: string) => {
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

  const handleSharePolicy = async (policyId: string, title: string) => {
    try {
      const policyRef = doc(firestore, "policies", policyId);
      await updateDoc(policyRef, { shareCount: increment(1) });
      
      if (navigator.share) {
        await navigator.share({
          title: `PDDS Manifesto: ${title}`,
          text: `Read the official stand of Pederalismo ng Dugong Dakilang Samahan on ${title}.`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied", description: "Share this manifesto with your fellow citizens!" });
      }
    } catch (e) {}
  };

  if (coursesLoading || progressLoading || policiesLoading) {
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
            <h1 className="text-5xl md:text-7xl font-black text-primary font-headline uppercase tracking-tighter leading-none">PDDS ACADEMY</h1>
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-emerald-100 text-emerald-700 font-black text-sm uppercase px-4 py-1.5 border-none">Officer Training Hub</Badge>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-emerald-50 p-2 border-2 border-emerald-100 h-20 w-full md:w-auto justify-start gap-4 rounded-3xl">
          <TabsTrigger value="leadership" className="px-12 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-2xl">
            <ShieldCheck className="h-5 w-5 mr-3" /> Leadership Track
          </TabsTrigger>
          <TabsTrigger value="ideology" className="px-12 h-full font-black uppercase text-xs tracking-widest data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-2xl">
            <BookMarked className="h-5 w-5 mr-3" /> Ideology & Manifestos
          </TabsTrigger>
        </TabsList>

        {/* LEADERSHIP TRACK CONTENT */}
        <TabsContent value="leadership" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
            {courses.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((course: any) => {
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
                            <button className="text-white text-xl font-black uppercase tracking-widest flex items-center gap-2" onClick={() => setActiveCourse(null)}>CLOSE BRIEFING <X className="h-6 w-6" /></button>
                          </div>
                          <AcademyPlayer 
                            videoUrl={course.videoUrl} 
                            onComplete={() => { handleCompleteCourse(course.id); setActiveCourse(null); }} 
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
                <p className="text-2xl text-muted-foreground font-black uppercase tracking-widest">No leadership modules currently deployed.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* IDEOLOGY & MANIFESTOS CONTENT */}
        <TabsContent value="ideology" className="animate-in fade-in duration-500 space-y-10">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                className="h-16 pl-12 rounded-2xl bg-white border-2 text-lg font-medium shadow-sm" 
                placeholder="Search manifestos or keywords..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-white p-1 rounded-2xl border-2 shadow-sm overflow-x-auto h-16 items-center w-full md:w-auto">
              <Button 
                variant={activeCategory === "All" ? "default" : "ghost"} 
                onClick={() => setActiveCategory("All")}
                className="h-full rounded-xl font-black uppercase text-[10px] tracking-widest px-8"
              >
                All Pillars
              </Button>
              {policyCategories.map(cat => (
                <Button 
                  key={cat.name}
                  variant={activeCategory === cat.name ? "default" : "ghost"} 
                  onClick={() => setActiveCategory(cat.name)}
                  className="h-full rounded-xl font-black uppercase text-[10px] tracking-widest px-8"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPolicies.map((p: any) => {
              const categoryData = policyCategories.find(c => c.name === p.category);
              const CategoryIcon = categoryData?.icon || FileText;
              const isCompleted = userEngagements.some(e => e.id === p.id);
              const isInfographic = p.fileType === 'INFOGRAPHIC';

              return (
                <Card key={p.id} className="group shadow-lg border-t-4 border-t-emerald-600 hover:shadow-2xl transition-all flex flex-col relative rounded-[32px] overflow-hidden">
                  {isCompleted && (
                    <div className="absolute top-4 right-4 bg-emerald-600 text-white p-1.5 rounded-full shadow-lg z-10">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <CardHeader className="bg-muted/30 pb-6 pt-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-600/10">
                        {isInfographic ? <ImageIcon className="h-6 w-6 text-emerald-600" /> : <CategoryIcon className="h-6 w-6 text-emerald-600" />}
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white border-emerald-600/20 text-emerald-700">
                        {p.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-headline uppercase font-black text-primary leading-tight group-hover:text-emerald-600 transition-colors">
                      {p.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 flex-1">
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-dashed border-emerald-600/10 mb-6">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        Executive Summary
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">
                        "{p.summary}"
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase">
                        <Share2 className="h-3 w-3" /> {p.shareCount || 0} Citizens Reached
                      </div>
                      <Badge variant="secondary" className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700">{p.fileType || 'PDF'}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 border-t pt-6 grid grid-cols-2 gap-4 p-6">
                    <Button variant="outline" className="h-14 border-2 font-black uppercase text-[10px] tracking-widest rounded-xl" asChild>
                      <a href={p.documentUrl} target="_blank" rel="noopener noreferrer">
                        {isInfographic ? <ExternalLink className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />} 
                        {isInfographic ? 'View' : 'PDF'}
                      </a>
                    </Button>
                    <Button className="h-14 font-black uppercase text-[10px] tracking-widest rounded-xl" onClick={() => handleSharePolicy(p.id, p.title)}>
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    <Button 
                      className={`col-span-2 h-16 font-black uppercase tracking-widest shadow-xl mt-2 rounded-xl ${isCompleted ? 'bg-muted text-muted-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
                      disabled={isCompleted}
                      onClick={() => setQuizPolicy(p)}
                    >
                      {isCompleted ? (
                        <><CheckCircle2 className="mr-2 h-5 w-5" /> Manifesto Mastered</>
                      ) : (
                        <><GraduationCap className="mr-2 h-5 w-5" /> Mastery Quiz</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <CertificateDialog 
        isOpen={showCertificate} 
        onOpenChange={setShowCertificate} 
        userName={userData?.fullName}
        completionDate={new Date().toLocaleDateString()}
      />

      <PolicyQuizDialog 
        policyId={quizPolicy?.id}
        policyTitle={quizPolicy?.title}
        quiz={quizPolicy?.quiz || []}
        isOpen={!!quizPolicy}
        onOpenChange={(o) => !o && setQuizPolicy(null)}
        onComplete={() => {}}
      />
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
