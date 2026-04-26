
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
// admin déchargé car non utilisé ici

const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-1.5-flash',
});

const FinancialBriefingOutput = z.object({
    summary: z.string(),
    kpis: z.object({
        totalAmount: z.number(),
        vatSaved: z.number(),
        documentsCount: z.number(),
    }),
    smartTip: z.string(),
    urgencyLevel: z.enum(['low', 'medium', 'high']),
});

/**
 * Génère un briefing financier hebdomadaire personnalisé via IA.
 */
export const generateWeeklyBriefing = ai.defineFlow(
    {
        name: 'generateWeeklyBriefing',
        inputSchema: z.object({
            clientId: z.string(),
            docs: z.array(z.any()),
        }),
        outputSchema: FinancialBriefingOutput,
    },
    async (input) => {
        const { docs } = input;
        
        const prompt = `
            Tu es un expert comptable spécialisé dans le conseil stratégique.
            Analyse les données suivantes des 7 derniers jours pour ce client :
            ${JSON.stringify(docs.map(d => ({ 
                vendor: d.extractedData?.vendorNames?.[0], 
                amount: d.extractedData?.amounts?.[0],
                category: d.extractedData?.category,
                date: d.uploadDate 
            })))}

            Génère un briefing hebdomadaire percutant et rassurant en français.
            Inclus :
            1. Un résumé d'une phrase de l'activité.
            2. Le montant total des dépenses HT et la TVA récupérée cette semaine.
            3. Un "Smart Tip" (conseil malin) pour optimiser sa gestion ou ses coûts.
            4. Un niveau d'urgence si des documents manquent ou sont suspects.

            Format de réponse : JSON strict.
        `;

        const response = await ai.generate({
            prompt,
            output: { schema: FinancialBriefingOutput },
        });

        if (!response.output) {
            throw new Error("L'IA n'a pas pu générer de réponse valide.");
        }
        return response.output;
    }
);
