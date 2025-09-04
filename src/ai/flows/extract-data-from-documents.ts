
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
import { findMatchingDocumentTool } from '../tools/find-matching-document';
import type { Document } from '@/lib/types';
import { getDocuments } from '@/ai/flows/document-actions';


const DocumentSchemaForTool = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
    extractedData: z.object({
        amounts: z.array(z.number()).optional(),
        vendorNames: z.array(z.string()).optional(),
        dates: z.array(z.string()).optional(),
    }).optional(),
});


const TransactionSchema = z.object({
  date: z.string().describe('The date of the transaction.'),
  description: z.string().describe('The description or label of the transaction.'),
  amount: z.number().describe('The amount of the transaction. Use positive for credits, negative for debits.'),
  vendor: z.string().optional().describe('The identified vendor.'),
  category: z.string().optional().describe('The suggested accounting category.'),
  matchingDocumentId: z.string().optional().describe("The ID of the invoice/receipt document that matches this transaction, if found by the tool."),
});

const ExtractDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The accounting document (invoice, receipt, bank statement, etc.) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  documentType: z.string().describe('The type of the accounting document (e.g., "invoice", "receipt", "bank statement").'),
  clientId: z.string().describe("The ID of the client to whom the document belongs."),
});
export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ExtractDataOutputSchema = z.object({
  // Fields for single documents like invoices/receipts
  dates: z.array(z.string()).optional().describe('Dates found in the document (for invoices/receipts).'),
  amounts: z.array(z.number()).optional().describe('Total amounts (TTC) found in the document (for invoices/receipts).'),
  vendorNames: z.array(z.string()).optional().describe('Vendor names found in the document (for invoices/receipts).'),
  vatAmount: z.number().optional().describe('The total VAT amount found in the document. If multiple VAT rates are present, sum them up.'),
  vatRate: z.number().optional().describe('The VAT rate found in the document (e.g., 20, 5.5). If multiple, provide the most prominent one.'),
  
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

const bankStatementPrompt = `
You are an expert at extracting transactions from a French bank statement.
Your primary goal is to populate the 'transactions' array with every single transaction line.
For each transaction, you must extract:
- The date.
- The full description.
- The amount (use negative numbers for debits, positive for credits).
- A clean, simple vendor name (e.g., "Prlv Free Mobile" -> "Free Mobile").
- A suggested accounting category based on the vendor/description.

Your secondary goal is to act as a reconciliation agent. For each debit transaction, you MUST use the 'findMatchingDocument' tool to search for a corresponding invoice or receipt in the client's other documents.
- Pass the transaction amount, cleaned-up vendor name, and date to the tool.
- If the tool returns a document ID, you MUST populate the 'matchingDocumentId' field for that transaction. Otherwise, leave it empty.

The top-level fields (dates, amounts, vendorNames, category, vatAmount, vatRate) should be empty.
`;

const singleDocumentPrompt = `
You are an expert at extracting key information from a single French accounting document like an invoice or receipt.
Your goal is to extract the following fields and populate them at the top level:
- Dates: Find all dates present in the document.
- Amounts: Find all total monetary amounts (TTC) present.
- Vendor Names: Identify the names of the vendors or suppliers.
- VAT: Meticulously find the total VAT amount (TVA) and the VAT rate (Taux TVA). The rate should be a number (e.g., 20 for 20%). If not explicitly present, do not calculate or infer it; leave the fields empty.
- Category: Based on the document content, suggest an accounting category. Examples: "Fournitures de bureau", "Transport", "Repas et divertissement", "Services informatiques", "Loyer", "Autre".
- Other Information: Extract any other relevant information.
- The 'transactions' field must be empty.
`;

const controllerPrompt = `
You are also a vigilant financial controller. For ALL document types, you must scrutinize the document for any potential red flags or anomalies.
- Do amounts seem excessively high for the context?
- Are dates inconsistent?
- Is the document quality poor?
- Does anything seem out of the ordinary?
- If you find any such issues, describe them in the 'anomalies' array. If not, leave the array empty.
`;

const prompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: {schema: z.object({
      documentDataUri: z.string(),
      documentType: z.string(),
      allClientDocuments: z.array(DocumentSchemaForTool).optional(),
      isBankStatement: z.boolean(),
  })},
  output: {schema: ExtractDataOutputSchema},
  tools: [findMatchingDocumentTool],
  prompt: `You are an expert and vigilant accounting data extraction specialist. Your behavior depends on the documentType.

{{#if isBankStatement}}
${bankStatementPrompt}
{{else}}
${singleDocumentPrompt}
{{/if}}

${controllerPrompt}

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
  async (input) => {
    
    let allClientDocsForAI: Document[] = [];
    if (input.documentType === 'bank statement') {
        allClientDocsForAI = (await getDocuments(input.clientId)).filter(
            doc => doc.type === 'invoice' || doc.type === 'receipt'
        );
    }
    
    const {output} = await prompt({
        documentDataUri: input.documentDataUri,
        documentType: input.documentType,
        isBankStatement: input.documentType === 'bank statement',
        allClientDocuments: allClientDocsForAI.length > 0 ? allClientDocsForAI.map(({ id, name, type, extractedData }) => ({ id, name, type, extractedData })) : undefined
    });

    return output!;
  }
);
