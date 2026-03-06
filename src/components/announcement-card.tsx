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
    <Card className="shadow-lg border-l-8 border-l-primary overflow-hidden">
      <CardHeader className="bg-muted/30 p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="font-headline text-2xl md:text-3xl text-primary font-black uppercase tracking-tight leading-tight">{title}</CardTitle>
            <CardDescription className="text-xs font-black uppercase tracking-widest text-muted-foreground">{date}</CardDescription>
          </div>
          <FileText className="h-10 w-10 flex-shrink-0 text-primary/20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8 pt-0">
        {!hasSummary ? (
          <Button 
            onClick={handleSummarize} 
            variant="outline" 
            size="lg" 
            disabled={loading}
            className="flex items-center gap-3 border-primary/20 text-primary font-black uppercase text-xs tracking-widest h-12"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-accent" />
                Briefing Mode (AI)
              </>
            )}
          </Button>
        ) : (
          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Executive AI Summary
            </h4>
            <p className="text-lg text-foreground font-medium italic leading-relaxed">"{summary}"</p>
          </div>
        )}

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-sm font-black uppercase tracking-widest text-primary/60 hover:no-underline py-4 bg-muted/20 px-4 rounded-lg">
              Review Full Directive
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="prose prose-lg max-w-none whitespace-pre-line text-foreground/80 bg-white p-8 rounded-xl border border-dashed border-primary/10 leading-relaxed font-medium">
                {fullText}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      {link && (
        <CardFooter className="bg-primary/5 border-t border-primary/10 py-4 px-6 md:px-8">
          <Button variant="link" size="lg" asChild className="p-0 text-primary font-black uppercase text-xs tracking-widest h-auto">
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Access Official Document
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}