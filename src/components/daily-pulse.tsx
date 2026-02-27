
"use client";

import { useCollection, useFirestore, useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { Loader2, Activity, CheckCircle2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type Poll = {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  votedBy: string[];
  isActive: boolean;
};

export function DailyPulse() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: polls, loading } = useCollection<Poll>('polls');
  const [isVoting, setIsVoting] = useState<string | null>(null);

  const activePolls = polls.filter(p => p.isActive);

  const handleVote = async (pollId: string, option: string) => {
    if (!user) return;
    setIsVoting(pollId);
    try {
      const pollRef = doc(firestore, 'polls', pollId);
      await updateDoc(pollRef, {
        [`votes.${option}`]: increment(1),
        votedBy: arrayUnion(user.uid)
      });
      toast({
        title: "Vote Recorded",
        description: "Your voice has been heard in the Daily Pulse."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setIsVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 border-2 border-dashed rounded-xl">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Syncing Daily Pulse...</p>
      </div>
    );
  }

  if (activePolls.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tight">Daily Pulse</h2>
      </div>

      <div className="grid gap-6">
        {activePolls.map((poll) => {
          const hasVoted = poll.votedBy?.includes(user?.uid || '');
          const totalVotes = Object.values(poll.votes || {}).reduce((a, b) => a + b, 0);

          return (
            <Card key={poll.id} className="shadow-lg border-primary/10 overflow-hidden bg-white">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg font-headline text-primary leading-tight">
                  {poll.question}
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  {hasVoted ? "Results" : "Select one to vote"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {!hasVoted ? (
                  <div className="flex flex-col gap-2">
                    {poll.options.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        className="h-12 justify-start font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all group"
                        disabled={!!isVoting}
                        onClick={() => handleVote(poll.id, option)}
                      >
                        <div className="h-4 w-4 rounded-full border-2 border-primary mr-3 group-hover:border-white shrink-0" />
                        <span className="truncate">{option}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {poll.options.map((option) => {
                      const count = poll.votes[option] || 0;
                      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      return (
                        <div key={option} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-foreground/80">{option}</span>
                            <span className="text-[10px] font-black text-primary">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2.5 bg-primary/10" />
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        You have voted
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {totalVotes.toLocaleString()} total votes
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
