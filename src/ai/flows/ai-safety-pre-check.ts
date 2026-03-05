'use server';
/**
 * @fileOverview This file defines a Genkit flow for performing an AI safety pre-check on user input.
 *
 * - aiSafetyPreCheck - A function that performs safety and validity checks on a text prompt and an image.
 * - AiSafetyPreCheckInput - The input type for the aiSafetyPreCheck function.
 * - AiSafetyPreCheckOutput - The return type for the aiSafetyPreCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const AiSafetyPreCheckInputSchema = z.object({
  textPrompt: z.string().describe("The user's text prompt for image analysis."),
  imageDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AiSafetyPreCheckInput = z.infer<typeof AiSafetyPreCheckInputSchema>;

const AiSafetyPreCheckOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the text prompt and image are deemed safe and valid.'),
  message: z.string().describe('A message explaining the safety check result, especially if not safe.'),
});
export type AiSafetyPreCheckOutput = z.infer<typeof AiSafetyPreCheckOutputSchema>;

export async function aiSafetyPreCheck(
  input: AiSafetyPreCheckInput
): Promise<AiSafetyPreCheckOutput> {
  return aiSafetyPreCheckFlow(input);
}

const safetyPrompt = ai.definePrompt({
  name: 'aiSafetyPreCheckPrompt',
  input: {schema: AiSafetyPreCheckInputSchema},
  output: {schema: AiSafetyPreCheckOutputSchema},
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
  prompt: `You are an AI safety and content validity checker. Your task is to analyze the provided text prompt and image for any unsafe, inappropriate, or invalid content.

Specifically, check for:
- Racist speech, racial slurs, or any content promoting racial discrimination, bias, or hatred (Strictly Prohibited).
- Hate speech of any kind targeting protected groups.
- Harassment or bullying.
- Sexually explicit or pornographic content (Strictly Prohibited).
- Child sexual abuse material (CSAM) or any content involving minors in a sexual context (Strictly Prohibited and Illegal).
- Dangerous content or instructions for harmful activities.
- Any other content that could be considered invalid or inappropriate for a professional AI application.

Based on your analysis, determine if the combined text prompt and image are safe and valid.

Return your decision as a JSON object with two fields: 'isSafe' (boolean) and 'message' (string).
If 'isSafe' is false, provide a concise explanation in the 'message' field detailing why the content is unsafe or invalid (e.g., "The prompt contains racist language" or "The image contains prohibited explicit content"). If 'isSafe' is true, the message can be "Content is safe and valid.".

Text Prompt: {{{textPrompt}}}
Image: {{media url=imageDataUri}}`,
});

const aiSafetyPreCheckFlow = ai.defineFlow(
  {
    name: 'aiSafetyPreCheckFlow',
    inputSchema: AiSafetyPreCheckInputSchema,
    outputSchema: AiSafetyPreCheckOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      prompt: safetyPrompt,
      model: googleAI.model('gemini-1.5-flash'),
      input: {
        textPrompt: input.textPrompt,
        imageDataUri: input.imageDataUri,
      },
    });
    return output!;
  }
);
