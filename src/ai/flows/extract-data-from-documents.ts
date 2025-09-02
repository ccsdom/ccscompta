'use server';
/**
 * @fileOverview Data extraction from accounting documents using OCR and AI.
 *
 * - extractData - A function that extracts data from documents.
 * - ExtractDataInput - The input type for the extractData function.
 * - ExtractDataOutput - The return type for the extractData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The accounting document (invoice, receipt, bank statement, etc.) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.string().describe('The type of the accounting document.'),
});
export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ExtractDataOutputSchema = z.object({
  dates: z.array(z.string()).describe('Dates found in the document.'),
  amounts: z.array(z.number()).describe('Amounts found in the document.'),
  vendorNames: z.array(z.string()).describe('Vendor names found in the document.'),
  category: z.string().optional().describe('The suggested accounting category for the expense (e.g., "Fournitures", "Transport", "Repas").'),
  otherInformation: z.string().describe('Other relevant information extracted from the document.'),
  anomalies: z.array(z.string()).optional().describe('Potential anomalies or red flags detected in the document (e.g., "Unusually high amount", "Suspicious date").'),
});
export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: {schema: ExtractDataInputSchema},
  output: {schema: ExtractDataOutputSchema},
  prompt: `You are an expert and vigilant accounting data extraction specialist.

You will extract key information from accounting documents like invoices, receipts, and bank statements.

Specifically, you will identify and extract:
- Dates: All dates present in the document.
- Amounts: All monetary amounts present in the document.
- Vendor Names: The names of the vendors or suppliers.
- Category: Based on the document content, suggest an accounting category. Examples: "Fournitures de bureau", "Transport", "Repas et divertissement", "Services informatiques", "Loyer", "Autre".
- Other Information: Any other relevant information in the document.
- Anomalies: Act as a financial controller. Scrutinize the document for any potential red flags or anomalies. For example, check if amounts seem excessively high for the context, if dates are inconsistent, if the document quality is poor, or if anything seems out of the ordinary. If you find any, describe them in the anomalies array. If not, leave the array empty.

Document Type: {{{documentType}}}
Document: {{media url=documentDataUri}}

Return the extracted information in JSON format.
`,  
});

const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
