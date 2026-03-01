
"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

interface AcademyPlayerProps {
  videoUrl: string;
  onComplete: () => void;
}

/**
 * @fileOverview academy video player with progress tracking.
 * Simulates a high-fidelity learning experience.
 */
export function AcademyPlayer({ videoUrl, onComplete }: AcademyPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simulation logic for learning progress
  useEffect(() => {
    let timer: any;
    if (!loading && progress < 100) {
      timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            setIsFinished(true);
            clearInterval(timer);
            return 100;
          }
          return next;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [loading, progress]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white ring-4 ring-emerald-100">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mb-4" />
            <p className="text-[10px] font-black uppercase text-emerald-200 tracking-widest">Buffering Briefing...</p>
            <Button 
              variant="outline" 
              className="mt-6 border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 h-8 text-[10px] font-black uppercase"
              onClick={() => setLoading(false)}
            >
              Start Module
            </Button>
          </div>
        ) : (
          <iframe 
            src={videoUrl} 
            className="w-full h-full" 
            allow="autoplay; fullscreen" 
            onLoad={() => setLoading(false)}
          />
        )}
        
        {!loading && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-emerald-600/90 text-white font-black text-[8px] uppercase tracking-widest backdrop-blur-md">
              <ShieldCheck className="h-2.5 w-2.5 mr-1" />
              Verified Stream
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-700">
          <span>Operational Briefing Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-emerald-100" />
      </div>

      {isFinished && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl animate-in zoom-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-xs font-black uppercase text-emerald-800">Module Mastered</p>
                <p className="text-[9px] font-bold text-emerald-600 uppercase">Registry update available</p>
              </div>
            </div>
            <Button 
              onClick={onComplete}
              className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] px-6 h-10 shadow-lg"
            >
              Update Credentials
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}
