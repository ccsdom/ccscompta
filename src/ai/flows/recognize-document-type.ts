'use server';
/**
 * @fileOverview An AI agent that recognizes the type of an uploaded accounting document.
 *
 * - recognizeDocumentType - A function that handles the document type recognition process.
 * - RecognizeDocumentTypeInput - The input type for the recognizeDocumentType function.
 * - RecognizeDocumentTypeOutput - The return type for the recognizeDocumentType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeDocumentTypeInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The accounting document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeDocumentTypeInput = z.infer<typeof RecognizeDocumentTypeInputSchema>;

const RecognizeDocumentTypeOutputSchema = z.object({
  documentType: z
    .string()
    .describe('The type of the document (invoice, receipt, bank statement, etc.).'),
  confidence: z
    .number()
    .describe('The confidence level of the document type recognition (0-1).'),
});
export type RecognizeDocumentTypeOutput = z.infer<typeof RecognizeDocumentTypeOutputSchema>;

export async function recognizeDocumentType(
  input: RecognizeDocumentTypeInput
): Promise<RecognizeDocumentTypeOutput> {
  return recognizeDocumentTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeDocumentTypePrompt',
  input: {schema: RecognizeDocumentTypeInputSchema},
  output: {schema: RecognizeDocumentTypeOutputSchema},
  prompt: `You are an expert accounting document classifier.

You will be provided with a document image. You need to identify the type of the document. Possible document types are: invoice, receipt, bank statement, or other.  If you cannot determine the document type set the documentType to 'other'.

Analyze the document and provide your best assessment of its type.  Also, provide a confidence score between 0 and 1 of your determination.

Document: {{media url=documentDataUri}}

Ensure that the output is valid JSON.  Include a "confidence" field which is your confidence level (0-1).`,
});

const recognizeDocumentTypeFlow = ai.defineFlow(
  {
    name: 'recognizeDocumentTypeFlow',
    inputSchema: RecognizeDocumentTypeInputSchema,
    outputSchema: RecognizeDocumentTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);











