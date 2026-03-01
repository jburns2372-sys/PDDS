
"use client";

import { useState, useMemo } from "react";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Search, 
  Download, 
  Share2, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Trophy,
  BookOpen,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import { policyCategories } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { PolicyQuizDialog } from "@/components/policy-quiz-dialog";

export default function PolicyLibraryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: policies, loading } = useCollection('policies');
  const { data: userEngagements } = useCollection(`users/${user?.uid}/policy_engagement`);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Quiz State
  const [quizPolicy, setQuizPolicy] = useState<any>(null);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [policies, searchTerm, activeCategory]);

  const handleShare = async (policyId: string, title: string) => {
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

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Manifesto Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen pb-32">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col border-b-4 border-primary pb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-primary font-headline uppercase tracking-tight">National Policy & Manifesto Library</h1>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Official Party Stand & Ideological Foundations</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
              <p className="text-xs font-bold text-primary uppercase">Earn Merit for Mastery: Complete the briefing quiz after reading each manifesto.</p>
            </div>
            <Badge className="bg-accent text-accent-foreground font-black text-[10px]">10 POINTS PER POLICY</Badge>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              className="h-14 pl-12 rounded-xl bg-white border-2 text-base font-medium shadow-sm" 
              placeholder="Search manifestos, infographics, or keywords..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-white p-1 rounded-xl border-2 shadow-sm overflow-x-auto h-14 items-center">
            <Button 
              variant={activeCategory === "All" ? "default" : "ghost"} 
              onClick={() => setActiveCategory("All")}
              className="h-full rounded-lg font-black uppercase text-[10px] tracking-widest px-6"
            >
              All Pillars
            </Button>
            {policyCategories.map(cat => (
              <Button 
                key={cat.name}
                variant={activeCategory === cat.name ? "default" : "ghost"} 
                onClick={() => setActiveCategory(cat.name)}
                className="h-full rounded-lg font-black uppercase text-[10px] tracking-widest px-6"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filteredPolicies.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium uppercase text-sm tracking-widest">No manifestos found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPolicies.map((p: any) => {
              const categoryData = policyCategories.find(c => c.name === p.category);
              const CategoryIcon = categoryData?.icon || FileText;
              const isCompleted = userEngagements.some(e => e.id === p.id);
              const isInfographic = p.fileType === 'INFOGRAPHIC';

              return (
                <Card key={p.id} className="group shadow-lg border-t-4 border-t-primary hover:shadow-2xl transition-all flex flex-col relative">
                  {isCompleted && (
                    <div className="absolute -top-3 -right-3 bg-green-600 text-white p-1.5 rounded-full shadow-lg z-10 animate-in zoom-in">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-primary/10">
                        {isInfographic ? <ImageIcon className="h-6 w-6 text-primary" /> : <CategoryIcon className="h-6 w-6 text-primary" />}
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-white">
                        {p.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-headline uppercase font-black text-primary leading-tight group-hover:text-accent transition-colors">
                      {p.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 flex-1">
                    <div className="bg-primary/5 p-4 rounded-xl border border-dashed border-primary/10 mb-4">
                      <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
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
                      <Badge variant="secondary" className="text-[8px] font-black uppercase">{p.fileType || 'PDF'}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10 border-t pt-4 grid grid-cols-2 gap-3 p-4">
                    <Button 
                      variant="outline" 
                      className="h-12 border-2 font-black uppercase text-[10px] tracking-widest"
                      asChild
                    >
                      <a href={p.documentUrl} target="_blank" rel="noopener noreferrer">
                        {isInfographic ? <ExternalLink className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />} 
                        {isInfographic ? 'View Image' : 'Download PDF'}
                      </a>
                    </Button>
                    <Button 
                      className="h-12 font-black uppercase text-[10px] tracking-widest"
                      onClick={() => handleShare(p.id, p.title)}
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Spread Voice
                    </Button>
                    <Button 
                      className={`col-span-2 h-14 font-black uppercase tracking-widest shadow-xl mt-2 ${isCompleted ? 'bg-muted text-muted-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
                      disabled={isCompleted}
                      onClick={() => setQuizPolicy(p)}
                    >
                      {isCompleted ? (
                        <><CheckCircle2 className="mr-2 h-5 w-5" /> Manifesto Mastered</>
                      ) : (
                        <><GraduationCap className="mr-2 h-5 w-5" /> Start Proficiency Quiz</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <PolicyQuizDialog 
          policyId={quizPolicy?.id}
          policyTitle={quizPolicy?.title}
          quiz={quizPolicy?.quiz || []}
          isOpen={!!quizPolicy}
          onOpenChange={(o) => !o && setQuizPolicy(null)}
          onComplete={() => {}}
        />

      </div>
    </div>
  );
}
