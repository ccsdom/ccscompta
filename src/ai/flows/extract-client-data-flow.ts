
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
import { searchCompany } from './search-company-flow';

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


const extractClientDataFlow = ai.defineFlow(
  {
    name: 'extractClientDataFlow',
    inputSchema: ExtractClientDataInputSchema,
    outputSchema: ExtractClientDataOutputSchema,
  },
  async ({searchTerm}) => {
    console.log(`[Flow] Searching for company with term: ${searchTerm}`);
    
    // Use the direct search flow instead of the Genkit tool
    const searchResult = await searchCompany({ query: searchTerm });

    if (searchResult.results.length > 0) {
      const bestMatch = searchResult.results[0];
      console.log(`[Flow] Found company:`, bestMatch);
      // The output schema is compatible, so we can return it directly.
      return {
        name: bestMatch.name,
        siret: bestMatch.siret,
        address: bestMatch.address,
        legalRepresentative: bestMatch.legalRepresentative,
        // The searchCompany flow does not return these, so we leave them empty
        email: null,
        phone: null,
        fiscalYearEndDate: null, 
      };
    }

    console.log(`[Flow] No company found for term: ${searchTerm}`);
    return {
        name: null,
        siret: null,
        address: null,
        legalRepresentative: null,
        email: null,
        phone: null,
        fiscalYearEndDate: null,
    };
  }
);

    