"use client";

import { useCollection, useFirestore, useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { updateDoc, doc, arrayUnion } from "firebase/firestore";
import { Loader2, CheckCircle2, Megaphone, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Petition = {
  id: string;
  title: string;
  description: string;
  targetSignatures: number;
  signedBy: string[];
};

export function ActionCenter() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: actions, loading } = useCollection<Petition>('campaign_actions');

  const handleSign = async (actionId: string) => {
    if (!user) return;
    try {
      const actionRef = doc(firestore, 'campaign_actions', actionId);
      await updateDoc(actionRef, {
        signedBy: arrayUnion(user.uid)
      });
      toast({
        title: "Petition Signed",
        description: "Your signature has been added to the campaign."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse font-bold uppercase tracking-widest">Loading Campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold font-headline text-primary">Supporter Action Center</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {actions.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed bg-muted/20">
            <div className="flex flex-col items-center gap-3">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-medium">No active petitions at the moment.</p>
                <p className="text-xs">Check back soon for new community initiatives.</p>
            </div>
          </Card>
        ) : (
          actions.map((action) => {
            const hasSigned = action.signedBy?.includes(user?.uid || '');
            const currentSignatures = action.signedBy?.length || 0;
            const progress = Math.min((currentSignatures / action.targetSignatures) * 100, 100);
            
            return (
              <Card key={action.id} className="flex flex-col shadow-lg border-primary/5 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <CardTitle className="font-headline text-lg text-primary">{action.title}</CardTitle>
                  <CardDescription className="line-clamp-3 text-xs leading-relaxed">{action.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>{currentSignatures.toLocaleString()} signatures</span>
                      <span>Goal: {action.targetSignatures.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-primary/10" />
                  </div>
                  
                  <Button 
                    className="w-full font-bold h-11" 
                    variant={hasSigned ? "secondary" : "default"}
                    disabled={hasSigned}
                    onClick={() => handleSign(action.id)}
                  >
                    {hasSigned ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Signed & Verified</>
                    ) : (
                        "Sign Petition"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}