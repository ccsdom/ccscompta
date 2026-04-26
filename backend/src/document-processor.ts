import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Re-defining the output schema for the backend processor
const TransactionSchema = z.object({
  date: z.string().describe('The date of the transaction.'),
  description: z.string().describe('The description or label of the transaction.'),
  amount: z.number().describe('The amount of the transaction. Use positive for credits, negative for debits.'),
  vendor: z.string().optional().describe('The identified vendor.'),
  category: z.string().optional().describe('The suggested accounting category.'),
  matchingDocumentId: z.string().optional().describe("The ID of the invoice/receipt document that matches this transaction."),
});

export const ExtractDataOutputSchema = z.object({
  documentType: z.string().optional().describe('Detected document type (invoice, bank statement, etc.)'),
  dates: z.array(z.string()).optional(),
  amounts: z.array(z.number()).optional(),
  vendorNames: z.array(z.string()).optional(),
  vatAmount: z.number().nullable().optional(),
  vatRate: z.number().nullable().optional(),
  transactions: z.array(TransactionSchema).optional(),
  category: z.string().nullable().optional(),
  otherInformation: z.string().optional(),
  anomalies: z.array(z.string()).optional(),
  accountingEntry: z.object({
    debitAccount: z.string().optional(),
    creditAccount: z.string().optional(),
    vatAccount: z.string().optional(),
    confidenceScore: z.number().optional()
  }).optional()
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

const bankStatementPrompt = `
You are an expert at extracting transactions from a French bank statement.
Your primary goal is to populate the 'transactions' array with every single transaction line.
For each transaction, you must extract:
- The date.
- The full description.
- The amount (use negative numbers for debits, positive for credits).
- A clean, simple vendor name (e.g., "Prlv Free Mobile" -> "Free Mobile").
- A suggested accounting category based on the vendor/description.
`;

const singleDocumentPrompt = `
You are an expert at extracting key information from a single French accounting document like an invoice or receipt.
Your goal is to extract:
- Dates: All dates present.
- Amounts: All total monetary amounts (TTC).
- Vendor Names: Suppliers.
- VAT: Total VAT amount (TVA) and rate (e.g., 20).
- Category: Suggested accounting category.
- Accounting Intelligence (PCG Français): Suggest technical accounts (debit starts with 6, credit 401000, vat 445660).
`;

const controllerPrompt = `
You are also a vigilant financial controller. Scrutinize the document for any red flags or anomalies.
Check for:
1. Future dates (relative to today).
2. Mathematical inconsistency between HT, TVA and TTC.
3. Suspicious or missing vendor information (no SIRET mention when required).
4. Handwritten modifications on a printed invoice.
5. Incoherent period (e.g. 2023 dates on a 2025 document).
Describe them clearly in French in the 'anomalies' array.
`;

const recognitionPrompt = `
You are an expert accounting document classifier.
Identify the type of the document:
- 'purchase invoice'
- 'sales invoice'
- 'receipt'
- 'bank statement'
- 'other'
Also, decide if this should be treated as a 'bank statement' (isBankStatement: true) or a single document like an invoice (isBankStatement: false).
`;

/**
 * Initializes Genkit with API Key
 */
function getAi() {
    return genkit({
        plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    });
}

/**
 * Core extraction function
 */
export async function processDocumentContent(
  buffer: Buffer,
  mimeType: string,
  providedDocumentType?: string
): Promise<ExtractDataOutput> {
  const ai = getAi();
  
  // 1. Détection automatique du type si non fourni ou si générique
  let documentType = providedDocumentType;
  let isBankStatement = providedDocumentType === 'bank statement';

  if (!documentType || documentType === 'invoice' || documentType === 'other') {
      const { output: recognition } = await ai.generate({
          model: 'googleai/gemini-1.5-flash',
          prompt: [
              { text: recognitionPrompt },
              { media: { url: `data:${mimeType};base64,${buffer.toString('base64')}`, contentType: mimeType } }
          ],
          output: {
              schema: z.object({
                  documentType: z.string(),
                  isBankStatement: z.boolean()
              })
          }
      });
      if (recognition) {
          documentType = recognition.documentType;
          isBankStatement = recognition.isBankStatement;
      }
  }

  // 2. Extraction des données
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: [
        { text: `
            You are an expert and vigilant accounting data extraction specialist.
            ${isBankStatement ? bankStatementPrompt : singleDocumentPrompt}
            ${controllerPrompt}
            
            Return the extracted information in JSON format.
        ` },
        { media: { url: `data:${mimeType};base64,${buffer.toString('base64')}`, contentType: mimeType } }
    ],
    output: { schema: ExtractDataOutputSchema }
  });

  if (!output) {
      throw new Error("Gemini returned no output.");
  }

  return { 
      ...output, 
      documentType: documentType || output.category || 'invoice' 
  };
}

/**
 * Calculates billable lines for monetization
 */
export function calculateBillableLines(data: ExtractDataOutput, documentType: string): number {
    if (documentType === 'bank statement') {
        // For bank statements, each transaction line + bank account line = 2 lines per transaction
        return (data.transactions?.length || 0) * 2;
    } else {
        // For invoices/receipts: Charge + VAT + Supplier = 3 lines
        // Even if VAT is zero, we usually have 3 lines in the accounting entry
        return 3;
    }
}
