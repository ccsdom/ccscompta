
'use server';
/**
 * @fileOverview An AI agent that extracts structured client data from natural language text,
 * potentially enriching it with an external tool.
 *
 * - extractClientData - A function that handles the extraction process.
 * - ExtractClientDataInput - The input type for the extractClientData function.
 * - ExtractClientDataOutput - The return type for the extractClientData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { searchCompanyInfoTool } from '../tools/search-company-info';

const ExtractClientDataInputSchema = z.object({
  description: z.string().describe('A natural language description of the client to add.'),
});
export type ExtractClientDataInput = z.infer<typeof ExtractClientDataInputSchema>;

const ExtractClientDataOutputSchema = z.object({
    name: z.string().optional().describe("The company's name (Raison Sociale)."),
    siret: z.string().optional().describe("The 14-digit SIRET number."),
    email: z.string().optional().describe("The client's contact email."),
    phone: z.string().optional().describe("The client's phone number."),
    legalRepresentative: z.string().optional().describe("The name of the company's legal representative."),
    address: z.string().optional().describe("The full address of the company's headquarters."),
    fiscalYearEndDate: z.string().optional().describe("The end date of the fiscal year in JJ/MM format."),
});
export type ExtractClientDataOutput = z.infer<typeof ExtractClientDataOutputSchema>;

export async function extractClientData(
  input: ExtractClientDataInput
): Promise<ExtractClientDataOutput> {
  return extractClientDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractClientDataPrompt',
  input: {schema: ExtractClientDataInputSchema},
  output: {schema: ExtractClientDataOutputSchema},
  tools: [searchCompanyInfoTool],
  prompt: `You are an expert data extraction agent for an accounting firm.
Your task is to meticulously parse the user's natural language text and extract information to create a new client file.

Analyze the user's text: "{{description}}"

**Your workflow:**

1.  **SIRET Detection**: First, look for a 14-digit SIRET number in the user's text.
2.  **Tool Usage**:
    *   If you find a SIRET number, you **MUST** use the \`searchCompanyInfo\` tool to fetch official data for that company. This is the preferred source of information. Use the data returned by the tool to populate the \`name\`, \`address\`, \`legalRepresentative\`, \`phone\`, and \`email\` fields.
    *   If the tool returns no data, or if no SIRET is provided, then (and only then) fall back to extracting information directly from the user's text.
3.  **Final Extraction**: Extract any remaining information from the text that the tool did not provide (like \`fiscalYearEndDate\`).

**Important rules:**
- The SIRET number must be a string of 14 digits without spaces or any other characters.
- The closing date of the fiscal year (\`fiscalYearEndDate\`) MUST be in DD/MM format. For example, "clôture au 31 décembre" should be "31/12".
- Do not invent or infer any information. If a piece of information is not available from the tool or the text, omit its key from the output.

**Example 1 (Tool usage):**
- User text: "Ajoute le client SIRET 12345678901234, clôture au 30/06."
- Your action: Call \`searchCompanyInfo\` with SIRET '12345678901234'. Tool returns { name: 'Innovatech SAS', address: '...', ... }.
- Your output: { "name": "Innovatech SAS", "siret": "12345678901234", "address": "...", "fiscalYearEndDate": "30/06", ... }

**Example 2 (Text extraction only):**
- User text: "Nouveau client 'Pâtisserie Belle', la gérante est Mme. Belle, email factures@belle.fr."
- Your action: No SIRET found, extract from text.
- Your output: { "name": "Pâtisserie Belle", "legalRepresentative": "Mme. Belle", "email": "factures@belle.fr" }
`,
});

const extractClientDataFlow = ai.defineFlow(
  {
    name: 'extractClientDataFlow',
    inputSchema: ExtractClientDataInputSchema,
    outputSchema: ExtractClientDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
