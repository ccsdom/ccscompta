
'use server';
/**
 * @fileOverview A tool for searching official company data.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MOCK_CLIENTS } from '@/data/mock-data';

// Build the mock database from MOCK_CLIENTS to ensure consistency
const MOCK_COMPANY_DB: Record<string, any> = {};
MOCK_CLIENTS.forEach(client => {
    // The tool returns a subset of fields, so we map them here.
    MOCK_COMPANY_DB[client.siret] = {
        name: client.name,
        siret: client.siret,
        address: client.address,
        legalRepresentative: client.legalRepresentative,
        phone: client.phone,
        email: client.email,
        fiscalYearEndDate: client.fiscalYearEndDate,
    };
});


const findCompanyByName = (name: string) => {
    const lowercasedName = name.toLowerCase();
    return Object.values(MOCK_COMPANY_DB).find(company => company.name.toLowerCase().includes(lowercasedName));
}

const SearchCompanyInfoInputSchema = z.object({
      searchTerm: z.string().describe('The company name or 14-digit SIRET number to search for.'),
});

const SearchCompanyInfoOutputSchema = z.object({
    name: z.string().optional(),
    siret: z.string().optional(),
    address: z.string().optional(),
    legalRepresentative: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    fiscalYearEndDate: z.string().optional(),
});


export const searchCompanyInfoTool = ai.defineTool(
    {
        name: 'searchCompanyInfo',
        description: 'Searches an official database for company information using its SIRET number or name.',
        inputSchema: SearchCompanyInfoInputSchema,
        outputSchema: SearchCompanyInfoOutputSchema,
    },
    async ({ searchTerm }) => {
        console.log(`[Tool] Searching for term: ${searchTerm}`);
        // Simulate a network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if the search term is a SIRET
        if (/^\d{14}$/.test(searchTerm)) {
            const companyData = MOCK_COMPANY_DB[searchTerm];
            if (companyData) {
                console.log(`[Tool] Found company data by SIRET:`, companyData);
                return companyData;
            }
        }

        // Otherwise, search by name
        const companyDataByName = findCompanyByName(searchTerm);
        if (companyDataByName) {
            console.log(`[Tool] Found company data by Name:`, companyDataByName);
            return companyDataByName;
        }
        
        console.log(`[Tool] No company found for term: ${searchTerm}`);
        return {}; // Return an empty object if not found
    }
);
