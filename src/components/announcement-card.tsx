"use client";

import { getAnnouncementsSummary } from "@/ai/flows/announcements-summary-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

type AnnouncementCardProps = {
  title: string;
  date: string;
  fullText: string;
};

export function AnnouncementCard({ title, date, fullText }: AnnouncementCardProps) {
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
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-headline text-lg">{title}</CardTitle>
            <CardDescription>{date}</CardDescription>
          </div>
          <FileText className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSummary ? (
          <Button 
            onClick={handleSummarize} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating AI Summary...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                Summarize with AI
              </>
            )}
          </Button>
        ) : (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              AI Summary
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
          </div>
        )}

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-sm text-primary hover:no-underline py-2">
              Read Full Announcement
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground bg-muted/30 p-4 rounded-md">
                {fullText}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
