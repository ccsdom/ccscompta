
'use server';
/**
 * @fileOverview A tool for searching official company data.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MOCK_COMPANY_DB: Record<string, any> = {
    '12345678901234': {
        name: 'Innovatech SAS',
        siret: '12345678901234',
        address: '10 Rue de l\'Innovation, 75015 Paris',
        legalRepresentative: 'Marie Dubois',
        phone: '0123456789',
        email: 'contact@innovatech.fr',
    },
    '98765432109876': {
        name: 'GastroNomie & Fils',
        siret: '98765432109876',
        address: '25 Place de la Bourse, 69002 Lyon',
        legalRepresentative: 'Paul Bocuse Jr.',
        phone: '0472102030',
        email: 'contact@gastronomie-fils.fr',
    }
};

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
        return { name: undefined }; // Return an empty object if not found
    }
);
