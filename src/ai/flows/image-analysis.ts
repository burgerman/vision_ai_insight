'use server';
/**
 * @fileOverview An AI agent for analyzing images based on user prompts and returning insights in HTML format.
 * Now includes integrated AI safety checks for both text prompt and image content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { checkPromptSafety, checkImageSafety } from './ai-safety-pre-check';

const ImageAnalysisInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo or image, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  promptText: z.string().describe('The user\'s instruction for image analysis.'),
});
export type ImageAnalysisInput = z.infer<typeof ImageAnalysisInputSchema>;

const ImageAnalysisOutputSchema = z.object({
  html: z.string().describe('The detailed image analysis formatted as an HTML string.'),
  isSafe: z.boolean().optional().describe('Whether the content was deemed safe.'),
  safetyMessage: z.string().optional().describe('Message if safety check failed.'),
});
export type ImageAnalysisOutput = z.infer<typeof ImageAnalysisOutputSchema>;

const analyzeImagePrompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: { schema: ImageAnalysisInputSchema },
  output: { schema: ImageAnalysisOutputSchema },
  prompt: [
    {
      text: `You are an expert image analysis AI. Analyze the provided image according to the user's instructions and generate a detailed report in HTML format.

Make sure the HTML:
1. Is well-structured (use <h1>, <h2>, <p>, <ul>, <table> if appropriate).
2. Contains NO <html>, <head>, or <body> tags.
3. Is safe and professional.

User's Instruction: {{promptText}}

Image to analyze:`,
    },
    { media: { url: '{{imageDataUri}}' } },
  ],
});

/**
 * Performs image analysis with integrated safety checks.
 * Calls a dedicated local backend agent for the actual analysis.
 * @param input The image data and user prompt.
 * @returns The HTML analysis or a safety intervention message.
 */
export async function analyzeImage(input: ImageAnalysisInput): Promise<ImageAnalysisOutput> {
  // 1. Clear & Separate Safety Check: Prompt
  const promptSafety = await checkPromptSafety(input.promptText);
  if (!promptSafety.isSafe) {
    return {
      html: `<div class="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
              <h2 class="text-lg font-bold">Safety Intervention: Prompt</h2>
              <p>${promptSafety.message}</p>
            </div>`,
      isSafe: false,
      safetyMessage: promptSafety.message,
    };
  }

  // 2. Clear & Separate Safety Check: Image Content
  const imageSafety = await checkImageSafety(input.imageDataUri);
  if (!imageSafety.isSafe) {
    return {
      html: `<div class="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
              <h2 class="text-lg font-bold">Safety Intervention: Image</h2>
              <p>${imageSafety.message}</p>
            </div>`,
      isSafe: false,
      safetyMessage: imageSafety.message,
    };
  }

  // 3. Main Analysis via External Robot Helper API
  try {
    // Convert Data URI back to Blob for multipart/form-data transmission
    const res = await fetch(input.imageDataUri);
    const imageBlob = await res.blob();

    const formData = new FormData();
    formData.append('prompt', input.promptText);
    formData.append('image', imageBlob, 'technical_image.png');

    const backendResponse = await fetch('http://localhost:8000/robot-helper', {
      method: 'POST',
      body: formData,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.statusText}`);
    }

    // Assuming the backend returns the HTML directly or a JSON with { html: string }
    const contentType = backendResponse.headers.get('content-type');
    let analysisHtml = '';
    
    if (contentType?.includes('application/json')) {
      const data = await backendResponse.json();
      analysisHtml = data.html || JSON.stringify(data);
    } else {
      analysisHtml = await backendResponse.text();
    }

    return {
      html: analysisHtml,
      isSafe: true,
    };
  } catch (error: any) {
    console.error('External API Error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}
