'use server';
/**
 * @fileOverview An AI agent for analyzing images based on user prompts and returning insights in HTML format.
 *
 * - analyzeImage - A function that handles the image analysis process.
 * - ImageAnalysisInput - The input type for the analyzeImage function.
 * - ImageAnalysisOutput - The return type for the analyzeImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ImageAnalysisInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo or image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  promptText: z.string().describe('The user\'s instruction for image analysis.'),
});
export type ImageAnalysisInput = z.infer<typeof ImageAnalysisInputSchema>;

const ImageAnalysisOutputSchema = z.object({
  html: z.string().describe('The detailed image analysis formatted as an HTML string.'),
});
export type ImageAnalysisOutput = z.infer<typeof ImageAnalysisOutputSchema>;

export async function analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisOutput> {
  return imageAnalysisFlow(input);
}

const analyzeImagePrompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: { schema: ImageAnalysisInputSchema },
  output: { schema: ImageAnalysisOutputSchema },
  model: googleAI.model('gemini-2.5-flash-image'),
  prompt: [
    {
      media: { url: '{{{imageDataUri}}}' },
    },
    {
      text: `You are an expert image analysis AI. Your goal is to analyze the provided image according to the user's instructions and generate a detailed report in HTML format. Make sure the HTML is well-structured, easy to read, and includes relevant information based on the prompt.

User's Instruction: {{{promptText}}}

Please provide your analysis below, formatted as a single HTML string.`,
    },
  ],
  config: {
    responseModalities: ['TEXT'],
  },
});

const imageAnalysisFlow = ai.defineFlow(
  {
    name: 'imageAnalysisFlow',
    inputSchema: ImageAnalysisInputSchema,
    outputSchema: ImageAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeImagePrompt(input);
    return output!;
  }
);
