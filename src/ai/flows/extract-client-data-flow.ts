
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
    name: z.string().optional().nullable().describe("The company's name (Raison Sociale)."),
    siret: z.string().optional().nullable().describe("The 14-digit SIRET number."),
    email: z.string().optional().nullable().describe("The client's contact email."),
    phone: z.string().optional().nullable().describe("The client's phone number."),
    legalRepresentative: z.string().optional().nullable().describe("The name of the company's legal representative."),
    address: z.string().optional().nullable().describe("The full address of the company's headquarters."),
    fiscalYearEndDate: z.string().optional().nullable().describe("The end date of the fiscal year in JJ/MM format."),
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
  prompt: `You are an agent whose only purpose is to use the 'searchCompanyInfo' tool.
You MUST call the 'searchCompanyInfo' tool with the user's input.
Pass the user's input directly to the tool's 'searchTerm' parameter.

User input: "{{searchTerm}}"

Use the data returned by the tool to populate the output fields.
If the tool returns no data for a field, you can either omit that field or set it to null. Do not make up or infer any information.
For example, if the tool returns a 'name' and 'siret' but no 'address', your output should only contain 'name' and 'siret'.
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
