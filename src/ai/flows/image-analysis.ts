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

    // Assuming the backend returns the HTML directly or a JSON with { html: string, image?: string }
    const contentType = backendResponse.headers.get('content-type');
    let analysisHtml = '';
    let extractedImage = '';
    
    if (contentType?.includes('application/json')) {
      const data = await backendResponse.json();
      analysisHtml = data.html || JSON.stringify(data);
      extractedImage = data.image || '';
    } else {
      analysisHtml = await backendResponse.text();
    }

    // REFINEMENT: Extract image and data from full HTML documents (like the Point Visualization sample)
    if (analysisHtml.includes('<!DOCTYPE html>') || analysisHtml.includes('<html')) {
      // 1. Try to extract the base64 image from the script tag
      const imageMatch = analysisHtml.match(/img\.src\s*=\s*"(data:image\/[^;]+;base64,[^"]+)"/);
      if (imageMatch && !extractedImage) {
        extractedImage = imageMatch[1];
      }

      // 2. Try to extract pointsData if it's an interactive visualization
      const pointsMatch = analysisHtml.match(/const pointsData = (\[[\s\S]*?\]);/);
      let annotationsHtml = '';
      let points: any[] = [];
      
      if (pointsMatch) {
        try {
          // Clean up potential trailing commas or minor syntax issues for JSON.parse
          const jsonString = pointsMatch[1]
            .replace(/,\s*\]/, ']')
            .replace(/,\s*\}/, '}');
          points = JSON.parse(jsonString);
          
          if (Array.isArray(points) && points.length > 0) {
            annotationsHtml = `
              <div class="mt-8 bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                  <span class="flex h-3 w-3 rounded-full bg-primary animate-pulse"></span>
                  AI Detected Annotations
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  ${points.map((p: any) => `
                    <div class="bg-card p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                      <div class="font-bold text-foreground text-lg">${p.label || 'Detected Item'}</div>
                      <div class="text-sm text-muted-foreground mt-1 font-mono">
                        Location: [${p.point ? p.point.join(', ') : 'N/A'}]
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }
        } catch (e) {
          console.error('Points extraction failed:', e);
        }
      }

      // 3. Reconstruct the HTML with a CSS-only labeling overlay
      let reconstructedHtml = '';
      if (extractedImage) {
        let overlayHtml = '';
        if (Array.isArray(points) && points.length > 0) {
          overlayHtml = points.map((p: any) => {
            const [y, x] = p.point || [0, 0];
            const left = (x / 1000) * 100;
            const top = (y / 1000) * 100;
            return `
              <div class="analysis-point" style="left: ${left}%; top: ${top}%;">
                <div class="analysis-marker"></div>
                <div class="analysis-label">${p.label || 'Detected'}</div>
              </div>
            `;
          }).join('');
        }

        reconstructedHtml += `
          <div class="relative w-full mb-10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-black group">
            <img src="${extractedImage}" alt="Annotated Analysis" class="w-full h-auto block opacity-90 group-hover:opacity-100 transition-opacity" />
            <div class="absolute inset-0 pointer-events-none">
              ${overlayHtml}
            </div>
          </div>
        `;
      }
      
      // Add text details below if any
      const bodyMatch = analysisHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let textContent = '';
      if (bodyMatch) {
        textContent = bodyMatch[1]
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<canvas[\s\S]*?<\/canvas>/gi, '')
          .replace(/<div id="container"[\s\S]*?<\/div>/gi, '') // Remove the original container
          .trim();
      }
      
      if (textContent) {
        reconstructedHtml += `<div class="mt-8 prose-container">${textContent}</div>`;
      } else if (Array.isArray(points) && points.length > 0) {
        // Fallback to a nice list if no body text was found
        reconstructedHtml += `
          <div class="mt-8 bg-muted/30 rounded-xl p-6 border">
            <h3 class="text-lg font-bold mb-4">Detection Details</h3>
            <ul class="space-y-2">
              ${points.map((p: any) => `<li><strong>${p.label}:</strong> Technical coordinates [${p.point?.join(', ')}]</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      analysisHtml = reconstructedHtml || analysisHtml;
    } else if (extractedImage) {
      // Standard JSON response with separate image field
      const imageSrc = extractedImage.startsWith('data:') ? extractedImage : `data:image/png;base64,${extractedImage}`;
      analysisHtml = `
        <div class="mb-10 rounded-2xl overflow-hidden border shadow-xl">
          <img src="${imageSrc}" alt="AI Analyzed Content" class="w-full h-auto" />
        </div>
        ${analysisHtml}
      `;
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
