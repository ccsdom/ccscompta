
'use server';
/**
 * @fileOverview An AI agent that extracts structured client data from natural language text.
 *
 * - extractClientData - A function that handles the extraction process.
 * - ExtractClientDataInput - The input type for the extractClientData function.
 * - ExtractClientDataOutput - The return type for the extractClientData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  prompt: `You are an expert data extraction agent for an accounting firm.
Your task is to meticulously parse the user's natural language text and extract the information needed to create a new client file.

Analyze the user's text: "{{description}}"

Extract the following information:
- **name**: The company's legal name (Raison Sociale).
- **siret**: The 14-digit SIRET number. It should only contain numbers.
- **email**: The primary contact email address.
- **phone**: The primary phone number.
- **legalRepresentative**: The full name of the person who legally represents the company.
- **address**: The full postal address of the company's headquarters.
- **fiscalYearEndDate**: The closing date of the fiscal year. It MUST be in DD/MM format. For example, "clôture au 31 décembre" should be "31/12".

Important rules:
- Do not invent or infer any information that is not explicitly present in the text.
- If a piece of information is not present, omit the corresponding key from the JSON output.
- The SIRET number must be a string of 14 digits without spaces or any other characters.

Example:
- User text: "Ajoute le client 'Innovatech SAS', SIRET 12345678901234, représenté par Marie Dubois au 10 Rue de l'Innovation, 75015 Paris. Email: contact@innovatech.fr, Tél: 0123456789. Clôture fiscale le 31/12."
- Your output should be a JSON object like:
{
  "name": "Innovatech SAS",
  "siret": "12345678901234",
  "legalRepresentative": "Marie Dubois",
  "address": "10 Rue de l'Innovation, 75015 Paris",
  "email": "contact@innovatech.fr",
  "phone": "0123456789",
  "fiscalYearEndDate": "31/12"
}
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
