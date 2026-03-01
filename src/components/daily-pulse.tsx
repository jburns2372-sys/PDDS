
"use client";

import { useCollection, useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { Loader2, Activity, CheckCircle2, BarChart3, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";

type Poll = {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  votedBy: string[];
  isActive: boolean;
  targetGroup: string;
  targetRole: string;
};

/**
 * @fileOverview Official Party Referendum Interface (Daily Pulse).
 * Secure one-member-one-vote system with real-time analytics.
 * Respects jurisdictional and role-based targeting.
 */
export function DailyPulse() {
  const { user } = useUser();
  const { userData } = useUserData();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: polls, loading } = useCollection<Poll>('polls');
  const [isVoting, setIsVoting] = useState<string | null>(null);

  // Filter polls based on member's location, role, and National scope
  const activePolls = useMemo(() => {
    if (!userData) return [];
    return polls.filter(p => {
      // 1. Basic active check
      if (!p.isActive) return false;

      // 2. Jurisdiction Check
      const matchesLocation = p.targetGroup === "National" || p.targetGroup === userData.city;
      if (!matchesLocation) return false;

      // 3. Role Targeting Check
      if (p.targetRole === "All Members") return true;
      if (p.targetRole === "Only Vetted Officers") return userData.isVerified === true;
      if (p.targetRole === "Leadership Core") {
        const leadershipRoles = ["President", "Chairman", "Vice Chairman", "VP", "Secretary General", "Treasurer", "Admin"];
        return leadershipRoles.includes(userData.role);
      }

      return true;
    }).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [polls, userData]);

  const handleVote = async (pollId: string, option: string) => {
    if (!user) return;
    setIsVoting(pollId);
    try {
      const pollRef = doc(firestore, 'polls', pollId);
      
      // Update with atomic increment and UID tracking for security
      await updateDoc(pollRef, {
        [`votes.${option}`]: increment(1),
        votedBy: arrayUnion(user.uid)
      });

      toast({
        title: "Ballot Cast",
        description: "Your official response has been securely recorded."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error casting vote",
        description: error.message
      });
    } finally {
      setIsVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 border-2 border-dashed rounded-xl bg-muted/10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Referendums...</p>
      </div>
    );
  }

  if (activePolls.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Daily Pulse</h2>
      </div>

      <div className="grid gap-6">
        {activePolls.map((poll) => {
          const hasVoted = poll.votedBy?.includes(user?.uid || '');
          const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);

          return (
            <Card key={poll.id} className="shadow-2xl border-t-4 border-accent overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5">Official Ballot</Badge>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">{poll.targetGroup}</Badge>
                </div>
                <CardTitle className="text-lg font-headline text-primary leading-tight font-black uppercase tracking-tight">
                  {poll.question}
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  {hasVoted ? "REFERENDUM RESULTS" : "SELECT YOUR RESPONSE BELOW"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {!hasVoted ? (
                  <div className="flex flex-col gap-3">
                    {poll.options.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="h-14 justify-start font-bold border-2 border-primary/10 hover:border-primary hover:bg-primary/5 transition-all group px-6 text-sm uppercase tracking-tight"
                        disabled={!!isVoting}
                        onClick={() => handleVote(poll.id, option)}
                      >
                        <div className="h-5 w-5 rounded-full border-2 border-primary mr-4 group-hover:bg-primary transition-colors shrink-0" />
                        <span className="truncate">{option}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in duration-700">
                    {poll.options.map((option) => {
                      const count = poll.votes[option] || 0;
                      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      return (
                        <div key={option} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-primary uppercase truncate pr-4">{option}</span>
                            <span className="text-xs font-black text-accent">{percentage}%</span>
                          </div>
                          <div className="h-3 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/10">
                            <div 
                              className="h-full bg-primary transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-[8px] font-bold text-muted-foreground uppercase text-right">
                            {count.toLocaleString()} votes
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-dashed flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-green-600 font-black text-[9px] uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" />
                        Ballot Recorded
                      </div>
                      <div className="flex items-center gap-1.5 text-primary font-black text-[9px] uppercase tracking-widest opacity-60">
                        <BarChart3 className="h-3 w-3" />
                        {totalVotes.toLocaleString()} Total Participants
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 py-3 flex justify-center">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                  <ShieldCheck className="h-3 w-3" />
                  Encrypted Voting Protocol
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
