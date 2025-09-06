'use server';
/**
 * @fileOverview A tool for searching official company data.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MOCK_COMPANY_DB: Record<string, any> = {
    '12345678901234': {
        name: 'Innovatech SAS',
        address: '10 Rue de l\'Innovation, 75015 Paris',
        legalRepresentative: 'Marie Dubois',
        phone: '0123456789',
        email: 'contact@innovatech.fr',
    },
    '98765432109876': {
        name: 'GastroNomie & Fils',
        address: '25 Place de la Bourse, 69002 Lyon',
        legalRepresentative: 'Paul Bocuse Jr.',
        phone: '0472102030',
        email: 'contact@gastronomie-fils.fr',
    }
}

const SearchCompanyInfoInputSchema = z.object({
      siret: z.string().describe('The 14-digit SIRET number of the company to search for.'),
});

const SearchCompanyInfoOutputSchema = z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    legalRepresentative: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
});


export const searchCompanyInfoTool = ai.defineTool(
    {
        name: 'searchCompanyInfo',
        description: 'Searches an official database for company information using its SIRET number.',
        inputSchema: SearchCompanyInfoInputSchema,
        outputSchema: SearchCompanyInfoOutputSchema,
    },
    async ({ siret }) => {
        console.log(`[Tool] Searching for SIRET: ${siret}`);
        // Simulate a network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const companyData = MOCK_COMPANY_DB[siret];
        
        if (companyData) {
            console.log(`[Tool] Found company data:`, companyData);
            return companyData;
        }
        
        console.log(`[Tool] No company found for SIRET: ${siret}`);
        return { name: undefined }; // Return an empty object if not found
    }
);
