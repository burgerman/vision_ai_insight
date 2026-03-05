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
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
  prompt: `You are an AI safety and content validity checker. Your task is to analyze the provided text prompt and image for any unsafe, inappropriate, or invalid content.\nSpecifically, check for:\n- Hate speech\n- Harassment\n- Sexually explicit content\n- Dangerous content\n- Any other content that could be considered invalid or inappropriate for a general-purpose AI application.\n\nBased on your analysis, determine if the combined text prompt and image are safe and valid.\n\nReturn your decision as a JSON object with two fields: 'isSafe' (boolean) and 'message' (string).\nIf 'isSafe' is false, provide a concise explanation in the 'message' field detailing why the content is unsafe or invalid. If 'isSafe' is true, the message can be "Content is safe and valid.".\n\nText Prompt: {{{textPrompt}}}\nImage: {{media url=imageDataUri}}`,
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
      model: googleAI.model('gemini-pro-vision'),
      input: {
        textPrompt: input.textPrompt,
        imageDataUri: input.imageDataUri,
      },
    });
    return output!;
  }
);
