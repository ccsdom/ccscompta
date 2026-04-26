"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyBriefing = void 0;
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
// admin déchargé car non utilisé ici
const ai = (0, genkit_1.genkit)({
    plugins: [(0, google_genai_1.googleAI)()],
    model: 'googleai/gemini-1.5-flash',
});
const FinancialBriefingOutput = genkit_1.z.object({
    summary: genkit_1.z.string(),
    kpis: genkit_1.z.object({
        totalAmount: genkit_1.z.number(),
        vatSaved: genkit_1.z.number(),
        documentsCount: genkit_1.z.number(),
    }),
    smartTip: genkit_1.z.string(),
    urgencyLevel: genkit_1.z.enum(['low', 'medium', 'high']),
});
/**
 * Génère un briefing financier hebdomadaire personnalisé via IA.
 */
exports.generateWeeklyBriefing = ai.defineFlow({
    name: 'generateWeeklyBriefing',
    inputSchema: genkit_1.z.object({
        clientId: genkit_1.z.string(),
        docs: genkit_1.z.array(genkit_1.z.any()),
    }),
    outputSchema: FinancialBriefingOutput,
}, async (input) => {
    const { docs } = input;
    const prompt = `
            Tu es un expert comptable spécialisé dans le conseil stratégique.
            Analyse les données suivantes des 7 derniers jours pour ce client :
            ${JSON.stringify(docs.map(d => {
        var _a, _b, _c, _d, _e;
        return ({
            vendor: (_b = (_a = d.extractedData) === null || _a === void 0 ? void 0 : _a.vendorNames) === null || _b === void 0 ? void 0 : _b[0],
            amount: (_d = (_c = d.extractedData) === null || _c === void 0 ? void 0 : _c.amounts) === null || _d === void 0 ? void 0 : _d[0],
            category: (_e = d.extractedData) === null || _e === void 0 ? void 0 : _e.category,
            date: d.uploadDate
        });
    }))}

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
});
//# sourceMappingURL=proactive-ai.js.map