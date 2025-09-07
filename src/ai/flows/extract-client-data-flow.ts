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
  searchTerm: z.string().describe('A company name or SIRET number.'),
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
Your task is to parse the user's input, which can be a company name or a SIRET number, and find official company data.

User input: "{{searchTerm}}"

**Your workflow:**

1.  **Analyze Input**: Determine if the input is a 14-digit SIRET number or a company name.
2.  **Tool Usage**:
    *   You **MUST** use the \`searchCompanyInfo\` tool to find the company data. Pass the searchTerm to the tool's \`searchTerm\` parameter.
    *   Use the data returned by the tool to populate the output fields (\`name\`, \`siret\`, \`address\`, \`legalRepresentative\`, \`phone\`, and \`email\`).
3.  **Extraction from Text (Fallback & Complement)**:
    *   If the tool returns no data, try to extract information from the original text if it contains more than just the search term (e.g., "ajoute Innovatech SAS, clôture au 31/12").
    *   Always check the original text for information the tool might not provide, like \`fiscalYearEndDate\`.

**Important rules:**
- A SIRET number must be exactly 14 digits. If you extract one, ensure it is a plain string of numbers.
- A fiscal year end date (\`fiscalYearEndDate\`) MUST be in DD/MM format. For example, "clôture au 31 décembre" should be "31/12".
- Do not invent or infer any information. If a piece of information is not available from the tool or the text, omit its key from the output.

**Example 1 (SIRET input):**
- User input: "12345678901234"
- Your action: Call \`searchCompanyInfo\` with searchTerm '12345678901234'.
- Your output: { "name": "Innovatech SAS", "siret": "12345678901234", "address": "...", "legalRepresentative": "Marie Dubois", ... }

**Example 2 (Name input):**
- User input: "GastroNomie & Fils"
- Your action: Call \`searchCompanyInfo\` with searchTerm 'GastroNomie & Fils'.
- Your output: { "name": "GastroNomie & Fils", "siret": "98765432109876", ... }
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
