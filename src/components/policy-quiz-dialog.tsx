
"use client";

import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { useUserData } from "@/context/user-data-context";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, CheckCircle2, Loader2, Sparkles, Trophy } from "lucide-react";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
};

type PolicyQuizDialogProps = {
  policyId: string;
  policyTitle: string;
  quiz: QuizQuestion[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
};

export function PolicyQuizDialog({ policyId, policyTitle, quiz, isOpen, onOpenChange, onComplete }: PolicyQuizDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleNext = () => {
    if (currentStep < quiz.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!user) return;
    
    const correctCount = answers.reduce((acc, ans, idx) => acc + (ans === quiz[idx].correctAnswerIndex ? 1 : 0), 0);
    const passed = correctCount === quiz.length;

    if (!passed) {
      toast({ variant: "destructive", title: "Review Required", description: "You missed some questions. Review the manifesto and try again!" });
      setShowResult(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Record completion to prevent duplicate rewards
      const engagementRef = doc(firestore, "users", user.uid, "policy_engagement", policyId);
      await setDoc(engagementRef, {
        completedAt: serverTimestamp(),
        score: correctCount,
        maxScore: quiz.length
      });

      // 2. Award Merit Points
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        meritPoints: increment(10)
      });

      toast({ title: "Manifesto Mastered!", description: "You've earned 10 Merit Points for your platform knowledge." });
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reward Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers([]);
    setShowResult(false);
  };

  const currentQuestion = quiz && quiz.length > 0 ? quiz[currentStep] : null;

  // Guard for empty quiz to prevent crash
  if (isOpen && (!quiz || quiz.length === 0)) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase text-primary">No Quiz Available</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase">
              This policy manifesto does not currently have an associated proficiency quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center italic text-muted-foreground text-sm">
            "Knowledge is power, but this briefing is currently in development."
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full font-black uppercase tracking-widest">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if(!o) resetQuiz(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline uppercase text-primary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent" />
            Platform Proficiency: {policyTitle}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase">
            Answer all correctly to earn 10 Merit Points.
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-primary/40">Question {currentStep + 1} of {quiz.length}</span>
                <div className="h-1 flex-1 bg-muted mx-4 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${((currentStep + 1) / quiz.length) * 100}%` }} />
                </div>
              </div>
              <p className="font-bold text-lg leading-snug">{currentQuestion?.question}</p>
            </div>

            <RadioGroup 
              value={answers[currentStep]?.toString()} 
              onValueChange={(v) => {
                const newAns = [...answers];
                newAns[currentStep] = parseInt(v);
                setAnswers(newAns);
              }}
              className="space-y-3"
            >
              {currentQuestion?.options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer border-muted">
                  <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} />
                  <Label htmlFor={`opt-${idx}`} className="flex-1 font-medium cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="py-12 text-center space-y-6">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 italic text-sm">
              "Understanding our core ideology is essential for every member."
            </div>
            <p className="font-bold">You didn't pass this briefing. Review the document and try again to earn your merit points.</p>
            <Button onClick={resetQuiz} className="w-full h-12 font-black uppercase tracking-widest">Retry Briefing</Button>
          </div>
        )}

        {!showResult && (
          <DialogFooter>
            <Button 
              className="w-full h-14 font-black uppercase tracking-widest shadow-xl" 
              onClick={handleNext}
              disabled={answers[currentStep] === undefined || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : currentStep === quiz.length - 1 ? "Complete Briefing" : "Next Question"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
