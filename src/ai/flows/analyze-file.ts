'use server';

/**
 * @fileOverview AI flow for analyzing a file to understand its 'why' and audience connection.
 *
 * - analyzeFile - Analyzes the uploaded file and returns insights about its audience connection.
 * - AnalyzeFileInput - The input type for the analyzeFile function.
 * - AnalyzeFileOutput - The return type for the analyzeFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFileInput = z.infer<typeof AnalyzeFileInputSchema>;

const AnalyzeFileOutputSchema = z.object({
  analysis: z.string().describe('Insights into the file and its connection with the audience.'),
});
export type AnalyzeFileOutput = z.infer<typeof AnalyzeFileOutputSchema>;

export async function analyzeFile(input: AnalyzeFileInput): Promise<AnalyzeFileOutput> {
  return analyzeFileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFilePrompt',
  input: {schema: AnalyzeFileInputSchema},
  output: {schema: AnalyzeFileOutputSchema},
  prompt: `You are an expert in analyzing files to determine their \"why\" - what makes the media connect with its audience.

  Analyze the provided file and provide insights into its potential impact, what audience segments it will resonate with, and what makes it connect with its audience.

  File: {{media url=fileDataUri}}`,
});

const analyzeFileFlow = ai.defineFlow(
  {
    name: 'analyzeFileFlow',
    inputSchema: AnalyzeFileInputSchema,
    outputSchema: AnalyzeFileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
