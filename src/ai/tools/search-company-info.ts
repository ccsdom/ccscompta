'use server';
/**
 * @fileOverview A tool for searching official company data from the INSEE Sirene API.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import 'isomorphic-fetch';

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


// Helper function to get the access token from INSEE API
// Note: In a real production app, you'd want to cache this token until it expires.
async function getInseeApiToken() {
    const apiKey = process.env.INSEE_API_KEY;
    if (!apiKey) {
        console.error("INSEE_API_KEY is not set in .env file.");
        throw new Error("La clé API pour le service de recherche n'est pas configurée.");
    }

    const [key, secret] = apiKey.split(':');
    const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

    const response = await fetch('https://api.insee.fr/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        console.error("Failed to get INSEE API token:", response.status, await response.text());
        throw new Error("Impossible d'authentifier auprès du service de recherche d'entreprises.");
    }

    const data = await response.json();
    return data.access_token;
}

const searchBySiret = async (siret: string, token: string) => {
    const response = await fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    
    const etablissement = data.etablissement;
    const uniteLegale = etablissement.uniteLegale;
    
    const address = etablissement.adresseEtablissement;
    const fullAddress = `${address.numeroVoieEtablissement || ''} ${address.typeVoieEtablissement || ''} ${address.libelleVoieEtablissement || ''}, ${address.codePostalEtablissement} ${address.libelleCommuneEtablissement}`;
    
    return {
        name: uniteLegale.denominationUniteLegale || `${uniteLegale.nomUniteLegale} ${uniteLegale.prenom1UniteLegale}`,
        siret: etablissement.siret,
        address: fullAddress.trim(),
        // Le représentant légal n'est pas fourni de manière fiable par cette API.
        legalRepresentative: undefined, 
        fiscalYearEndDate: uniteLegale.moisClotureExerciceUniteLegale ? `31/${uniteLegale.moisClotureExerciceUniteLegale}` : undefined,
    };
}

const searchByName = async (name: string, token: string) => {
     const query = `denominationUniteLegale:"${name}" AND etatAdministratifUniteLegale:A`;
     const response = await fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siret?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
     if (!response.ok) return null;
     const data = await response.json();

     if (data.etablissements && data.etablissements.length > 0) {
        // Return the first active result
        return searchBySiret(data.etablissements[0].siret, token);
     }
     return null;
}


export const searchCompanyInfoTool = ai.defineTool(
    {
        name: 'searchCompanyInfo',
        description: "Searches the official French company database (INSEE Sirene) using a company's SIRET number or name.",
        inputSchema: SearchCompanyInfoInputSchema,
        outputSchema: SearchCompanyInfoOutputSchema,
    },
    async ({ searchTerm }) => {
        console.log(`[Tool] Searching for term in official database: ${searchTerm}`);
        try {
            const token = await getInseeApiToken();
            let companyData = null;

            // Check if the search term is a SIRET
            if (/^\d{14}$/.test(searchTerm)) {
                console.log("[Tool] Detected SIRET, searching by SIRET...");
                companyData = await searchBySiret(searchTerm, token);
            } else {
                console.log("[Tool] Detected name, searching by company name...");
                companyData = await searchByName(searchTerm, token);
            }
            
            if (companyData) {
                console.log(`[Tool] Found company data:`, companyData);
                return companyData;
            }
            
            console.log(`[Tool] No company found for term: ${searchTerm}`);
            return {}; // Return empty object if not found

        } catch (error) {
            console.error('[Tool] Error during company search:', error);
            // Return an empty object in case of API or auth failure to avoid breaking the flow.
            return {};
        }
    }
);
