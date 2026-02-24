import { getAnnouncementsSummary } from "@/ai/flows/announcements-summary-flow";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

type AnnouncementCardProps = {
  title: string;
  date: string;
  fullText: string;
};

export async function AnnouncementCard({ title, date, fullText }: AnnouncementCardProps) {
  const { summary } = await getAnnouncementsSummary({ text: fullText });

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
        <p className="mb-4 text-sm text-foreground/80">{summary}</p>
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
