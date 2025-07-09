'use server';

import { analyzeFile } from '@/ai/flows/analyze-file';

export async function analyzeFileAction(fileDataUri: string) {
  if (!fileDataUri) {
    return { success: false, error: 'File data is missing.' };
  }

  try {
    const result = await analyzeFile({ fileDataUri });
    if (result.analysis) {
        return { success: true, data: result.analysis };
    } else {
        return { success: false, error: 'Analysis returned no result.' };
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `An error occurred during analysis: ${errorMessage}` };
  }
}
