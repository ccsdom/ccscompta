
'use server';
/**
 * @fileOverview A flow to search for french companies using the public government API.
 * 
 * - searchCompany - A function to search for companies by name or SIRET.
 * - CompanySearchInput - The input type for the searchCompany function.
 * - CompanySearchOutput - The return type for the searchCompany function.
 * - CompanySearchResult - The type for a single company result.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import 'isomorphic-fetch';

const CompanySearchInputSchema = z.object({
    query: z.string().describe('The company name or SIRET number to search for.'),
});
export type CompanySearchInput = z.infer<typeof CompanySearchInputSchema>;

export const CompanySearchResultSchema = z.object({
    name: z.string().describe("The company's official name (raison sociale)."),
    siret: z.string().describe("The 14-digit SIRET number."),
    address: z.string().describe("The full address of the company's headquarters."),
    legalRepresentative: z.string().describe("The name of the company's main legal representative."),
});
export type CompanySearchResult = z.infer<typeof CompanySearchResultSchema>;

const CompanySearchOutputSchema = z.object({
    results: z.array(CompanySearchResultSchema).describe('A list of matching companies.'),
});
export type CompanySearchOutput = z.infer<typeof CompanySearchOutputSchema>;

export async function searchCompany(input: CompanySearchInput): Promise<CompanySearchOutput> {
    const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(input.query)}&per_page=5`);
    
    if (!response.ok) {
        console.error(`API Error: ${response.status} ${await response.text()}`);
        return { results: [] };
    }
    
    const data = await response.json();
    
    const results = (data.results || []).map((res: any): CompanySearchResult | null => {
        const siege = res.siege;
        if (!siege) return null;
        
        let representative = 'N/A';
        if (res.dirigeants && res.dirigeants.length > 0) {
            const mainDirigeant = res.dirigeants[0];
            representative = `${mainDirigeant.prenoms || ''} ${mainDirigeant.nom || ''}`.trim();
        }

        return {
            name: res.nom_raison_sociale || res.nom_complet,
            siret: siege.siret,
            address: siege.adresse,
            legalRepresentative: representative,
        };
    }).filter((r): r is CompanySearchResult => r !== null);
    
    return { results };
}
