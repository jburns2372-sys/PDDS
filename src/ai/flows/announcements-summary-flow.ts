'use server';
/**
 * @fileOverview This file implements a Genkit flow for summarizing party announcements or policy documents.
 *
 * - getAnnouncementsSummary - A function that handles the summarization process.
 * - AnnouncementsSummaryInput - The input type for the getAnnouncementsSummary function.
 * - AnnouncementsSummaryOutput - The return type for the getAnnouncementsSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnnouncementsSummaryInputSchema = z.object({
  text: z.string().describe('The full text of the party announcement or policy document to summarize.'),
});
export type AnnouncementsSummaryInput = z.infer<typeof AnnouncementsSummaryInputSchema>;

const AnnouncementsSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided text.'),
});
export type AnnouncementsSummaryOutput = z.infer<typeof AnnouncementsSummaryOutputSchema>;

export async function getAnnouncementsSummary(input: AnnouncementsSummaryInput): Promise<AnnouncementsSummaryOutput> {
  return announcementsSummaryFlow(input);
}

const announcementsSummaryPrompt = ai.definePrompt({
  name: 'announcementsSummaryPrompt',
  input: {schema: AnnouncementsSummaryInputSchema},
  output: {schema: AnnouncementsSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing long party announcements and policy documents for party members.
Your goal is to provide a concise, easy-to-understand briefing that highlights the key takeaways, allowing members to quickly grasp the essential information without reading the full text.

Summarize the following document:

Document:
{{text}}

Provide a summary in plain text.`,
});

const announcementsSummaryFlow = ai.defineFlow(
  {
    name: 'announcementsSummaryFlow',
    inputSchema: AnnouncementsSummaryInputSchema,
    outputSchema: AnnouncementsSummaryOutputSchema,
  },
  async input => {
    try {
      const {output} = await announcementsSummaryPrompt(input);
      if (!output) {
        return { summary: "The AI model did not return a summary. This could be due to content safety filters or other issues." };
      }
      return output;
    } catch (error) {
        console.error("Error in announcementsSummaryFlow:", error);
        // Return a structured error that matches the output schema
        return {
            summary: "The summary could not be generated at this time due to an API configuration issue."
        };
    }
  }
);
