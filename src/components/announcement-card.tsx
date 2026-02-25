"use client";

import { getAnnouncementsSummary } from "@/ai/flows/announcements-summary-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

type AnnouncementCardProps = {
  title: string;
  date: string;
  fullText: string;
};

export function AnnouncementCard({ title, date, fullText }: AnnouncementCardProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const result = await getAnnouncementsSummary({ text: fullText });
        setSummary(result.summary);
      } catch (error) {
        console.error("Failed to get announcement summary:", error);
        setSummary("Could not load summary at this time.");
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [fullText]);

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
      <CardContent>
        {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        ) : (
            <p className="mb-4 text-sm text-foreground/80">{summary}</p>
        )}
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm text-primary hover:no-underline">
              Read Full Announcement
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
                {fullText}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
