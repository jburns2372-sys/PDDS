
"use client";

import { getAnnouncementsSummary } from "@/ai/flows/announcements-summary-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";

type AnnouncementCardProps = {
  title: string;
  date: string;
  fullText: string;
  link?: string | null;
};

export function AnnouncementCard({ title, date, fullText, link }: AnnouncementCardProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSummary, setHasSummary] = useState(false);

  const handleSummarize = async () => {
    try {
      setLoading(true);
      const result = await getAnnouncementsSummary({ text: fullText });
      setSummary(result.summary);
      setHasSummary(true);
    } catch (error) {
      console.error("Failed to get announcement summary:", error);
      setSummary("Could not load summary at this time.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-l-4 border-l-primary overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-headline text-xl text-primary font-black uppercase tracking-tight">{title}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{date}</CardDescription>
          </div>
          <FileText className="h-6 w-6 flex-shrink-0 text-primary/40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!hasSummary ? (
          <Button 
            onClick={handleSummarize} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="flex items-center gap-2 border-primary/20 text-primary font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Briefing Mode (AI)
              </>
            )}
          </Button>
        ) : (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              Executive AI Summary
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">"{summary}"</p>
          </div>
        )}

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-xs font-black uppercase tracking-widest text-primary/60 hover:no-underline py-2">
              Review Full Directive
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground bg-muted/30 p-5 rounded-md border border-dashed border-primary/10 leading-relaxed">
                {fullText}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      {link && (
        <CardFooter className="bg-primary/5 border-t border-primary/10 py-3">
          <Button variant="link" size="sm" asChild className="p-0 text-primary font-black uppercase text-[10px] tracking-widest h-auto">
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-2" />
              Access Official Document
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
