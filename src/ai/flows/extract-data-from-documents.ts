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

const TransactionSchema = z.object({
  date: z.string().describe('The date of the transaction.'),
  description: z.string().describe('The description or label of the transaction.'),
  amount: z.number().describe('The amount of the transaction. Use positive for credits, negative for debits.'),
  vendor: z.string().optional().describe('The identified vendor.'),
  category: z.string().optional().describe('The suggested accounting category.'),
});

const ExtractDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The accounting document (invoice, receipt, bank statement, etc.) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentType: z.string().describe('The type of the accounting document (e.g., "invoice", "receipt", "bank statement").'),
});
export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ExtractDataOutputSchema = z.object({
  // Fields for single documents like invoices/receipts
  dates: z.array(z.string()).optional().describe('Dates found in the document (for invoices/receipts).'),
  amounts: z.array(z.number()).optional().describe('Amounts found in the document (for invoices/receipts).'),
  vendorNames: z.array(z.string()).optional().describe('Vendor names found in the document (for invoices/receipts).'),
  
  // Fields for multi-transaction documents like bank statements
  transactions: z.array(TransactionSchema).optional().describe('List of transactions extracted from the document (for bank statements).'),

  // Common fields
  category: z.string().optional().describe('The suggested accounting category for the expense (e.g., "Fournitures", "Transport", "Repas"). Not used for bank statements.'),
  otherInformation: z.string().optional().describe('Other relevant information extracted from the document.'),
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

Your behavior depends on the type of the document.

**IF the documentType is 'invoice', 'receipt', or 'other':**
You will extract key information from the single document.
- Dates: All dates present in the document.
- Amounts: All monetary amounts present in the document.
- Vendor Names: The names of the vendors or suppliers.
- Category: Based on the document content, suggest an accounting category. Examples: "Fournitures de bureau", "Transport", "Repas et divertissement", "Services informatiques", "Loyer", "Autre".
- Other Information: Any other relevant information in the document.
- The 'transactions' field should be empty.

**IF the documentType is 'bank statement':**
You will extract all individual transactions from the statement.
- The 'transactions' array should be populated with every single transaction line.
- For each transaction, extract the date, description, and amount (use negative numbers for debits).
- For each transaction, try to identify a clean vendor name (e.g., "Prlv Free" -> "Free").
- For each transaction, suggest a relevant accounting category based on the vendor/description.
- The top-level 'dates', 'amounts', 'vendorNames', and 'category' fields should be empty.

**FOR ALL DOCUMENT TYPES:**
- Anomalies: Act as a financial controller. Scrutinize the document for any potential red flags or anomalies. For example, check if amounts seem excessively high for the context, if dates are inconsistent, if the document quality is poor, or if anything seems out of the ordinary. If you find any, describe them in the anomalies array. If not, leave the array empty.

Document Type: {{{documentType}}}
Document: {{media url=documentDataUri}}

Return the extracted information in JSON format according to the rules above.
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
