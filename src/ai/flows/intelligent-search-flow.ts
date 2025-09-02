'use server';
/**
 * @fileOverview An AI agent that understands natural language queries to search for documents.
 *
 * - intelligentSearch - A function that handles the intelligent search process.
 * - IntelligentSearchInput - The input type for the intelligentSearch function.
 * - IntelligentSearchOutput - The return type for the intelligentSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentSearchInputSchema = z.object({
  query: z.string().describe('The natural language search query.'),
  currentDate: z.string().describe('The current date in ISO format, to help resolve relative dates like "last month".'),
});
export type IntelligentSearchInput = z.infer<typeof IntelligentSearchInputSchema>;

const IntelligentSearchOutputSchema = z.object({
  documentTypes: z.array(z.string()).optional().describe('The types of documents to search for (e.g., invoice, receipt).'),
  startDate: z.string().optional().describe('The start date for the search range in YYYY-MM-DD format.'),
  endDate: z.string().optional().describe('The end date for the search range in YYYY-MM-DD format.'),
  minAmount: z.number().optional().describe('The minimum amount for the document.'),
  maxAmount: z.number().optional().describe('The maximum amount for the document.'),
  vendor: z.string().optional().describe('A specific vendor to search for.'),
  keywords: z.array(z.string()).optional().describe('Any other keywords from the query to use for a general text search.'),
  originalQuery: z.string().describe('The original search query for fallback text matching.'),
});
export type IntelligentSearchOutput = z.infer<typeof IntelligentSearchOutputSchema>;

export async function intelligentSearch(
  input: IntelligentSearchInput
): Promise<IntelligentSearchOutput> {
  return intelligentSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSearchPrompt',
  input: {schema: IntelligentSearchInputSchema},
  output: {schema: IntelligentSearchOutputSchema},
  prompt: `You are an expert search query interpreter for an accounting document management system.
Your task is to parse a user's natural language query and convert it into a structured JSON object for searching.

Today's date is {{currentDate}}. Use this to resolve relative date queries (e.g., "last month", "this year").

Analyze the user's query: "{{query}}"

Extract the following information:
- **documentTypes**: Identify if the user is asking for specific document types like "invoices", "receipts", or "bank statements".
- **date ranges**: Determine any date ranges. This could be a specific month ("in March", "April 2024"), a year ("in 2023"), or relative ranges ("last month", "this week"). Convert them to a startDate and endDate in YYYY-MM-DD format.
- **amounts**: Look for monetary values, like "over 100€", "less than 50", "between 50 and 200". Use minAmount and maxAmount.
- **vendor**: Check for specific company or vendor names.
- **keywords**: Any other significant nouns or terms that could be used for a general text search.
- **originalQuery**: Always return the original user query in this field.

Examples:
- "find all invoices from march 2024" -> { documentTypes: ["invoice"], startDate: "2024-03-01", endDate: "2024-03-31", originalQuery: "..." }
- "receipts over 100€ from Apple" -> { documentTypes: ["receipt"], minAmount: 100, vendor: "Apple", originalQuery: "..." }
- "documents from last month" -> (assuming today is 2024-07-15) { startDate: "2024-06-01", endDate: "2024-06-30", originalQuery: "..." }
- "Apple invoices" -> { documentTypes: ["invoice"], vendor: "Apple", originalQuery: "..." }
- "My big travel expense" -> { keywords: ["big", "travel", "expense"], originalQuery: "..." }

If a value is not present in the query, omit the corresponding key from the JSON output. Always return the originalQuery.`,
});

const intelligentSearchFlow = ai.defineFlow(
  {
    name: 'intelligentSearchFlow',
    inputSchema: IntelligentSearchInputSchema,
    outputSchema: IntelligentSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
