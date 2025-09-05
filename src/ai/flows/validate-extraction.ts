
'use server';
/**
 * @fileOverview An AI agent that validates extracted data against a document.
 *
 * - validateExtraction - A function that validates the extracted data.
 * - ValidateExtractionInput - The input type for the validateExtraction function.
 * - ValidateExtractionOutput - The return type for the validateExtraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  date: z.string().describe('The date of the transaction.'),
  description: z.string().describe('The description or label of the transaction.'),
  amount: z.number().describe('The amount of the transaction. Use positive for credits, negative for debits.'),
  vendor: z.string().optional().describe('The identified vendor.'),
  category: z.string().optional().describe('The suggested accounting category.'),
});

const ValidateExtractionInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The accounting document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  extractedData: z.object({
      dates: z.array(z.string().nullable()).optional().describe('Dates found in the document.'),
      amounts: z.array(z.number().nullable()).optional().describe('Amounts found in the document.'),
      vendorNames: z.array(z.string().nullable()).optional().describe('Vendor names found in the document.'),
      vatAmount: z.number().nullable().optional().describe('The VAT amount.'),
      vatRate: z.number().nullable().optional().describe('The VAT rate.'),
      category: z.string().nullable().optional().describe('The suggested accounting category.'),
      otherInformation: z.string().optional().describe('Other relevant information extracted.'),
      anomalies: z.array(z.string()).optional().describe('Potential anomalies detected.'),
      transactions: z.array(TransactionSchema).optional().describe('List of transactions for bank statements.')
  }),
});
type ValidateExtractionInput = z.infer<typeof ValidateExtractionInputSchema>;


const ValidateExtractionOutputSchema = z.object({
    isConfident: z.boolean().describe("True if the AI is highly confident that the extracted data perfectly matches the document."),
    confidenceScore: z.number().min(0).max(1).describe("A confidence score from 0 to 1 on how well the extracted data matches the document."),
    mismatchReason: z.string().optional().describe("A brief explanation if a mismatch or low confidence is found. Empty if confident."),
});
type ValidateExtractionOutput = z.infer<typeof ValidateExtractionOutputSchema>;


export async function validateExtraction(
  input: ValidateExtractionInput
): Promise<ValidateExtractionOutput> {
  return validateExtractionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateExtractionPrompt',
  input: {schema: ValidateExtractionInputSchema},
  output: {schema: ValidateExtractionOutputSchema},
  prompt: `You are an expert financial auditor AI. Your job is to double-check the work of another AI that extracted data from a document.

You will be given the document and the JSON data that was extracted.
Your task is to meticulously compare the extracted JSON data with the provided document image.

1.  **Verify Every Field**: Check if the extracted vendor names, dates, amounts, VAT, etc. (or individual transactions for a bank statement) are clearly and accurately present in the document image.
2.  **Check for Hallucinations**: Ensure no data has been imagined or incorrectly inferred.
3.  **Assess Confidence**: Based on your verification, determine a confidence score (from 0.0 to 1.0) of the extraction's accuracy. A score of 1.0 means you are 100% certain every piece of data is correct and visible in the document. A score below 0.9 suggests potential issues.
4.  **Set Flag**: If your confidence score is 0.95 or higher and there are no anomalies, set \`isConfident\` to true. Otherwise, set it to false.
5.  **Explain Issues**: If confidence is low or you find a mismatch, provide a concise reason in the \`mismatchReason\` field. For example: "The amount 45.10€ is not visible in the document" or "The vendor 'Rapid-Service' is written as 'Rapid Service' in the document". If you are confident, leave this field empty.

**Extracted Data for Review:**
\`\`\`json
{{{json stringify=extractedData}}}
\`\`\`

**Document for Verification:**
{{media url=documentDataUri}}

Perform the audit and return your findings in the specified JSON format.`,
});

const validateExtractionFlow = ai.defineFlow(
  {
    name: 'validateExtractionFlow',
    inputSchema: ValidateExtractionInputSchema,
    outputSchema: ValidateExtractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
