'use server';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewMailUpload = void 0;
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */
const logger = __importStar(require("firebase-functions/logger"));
const storage_1 = require("firebase-functions/v2/storage");
const admin = __importStar(require("firebase-admin"));
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
// --- pdf-parse import compatible ---
let pdfExtractor = null;
// --- Wrapper PDF ---
async function parsePdfBuffer(buffer) {
    if (!pdfExtractor) {
        try {
            // Use dynamic import for ESM/CJS compatibility
            const pdfParseModule = await import('pdf-parse');
            pdfExtractor = pdfParseModule.default || pdfParseModule;
        }
        catch (error) {
            logger.error("pdf-parse n'a pas pu être chargé dynamiquement:", error);
            throw new Error("Le module d'extraction PDF n'est pas disponible.");
        }
    }
    try {
        const data = await pdfExtractor(buffer);
        return data.text || "";
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : "Erreur inconnue";
        logger.error("Erreur lors de l'analyse PDF:", msg);
        throw new Error(`Échec de l'extraction PDF: ${msg}`);
    }
}
// --- Configuration ---
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// --- Schéma Zod ---
const analyzeMailOutputSchema = genkit_1.z.object({
    sender: genkit_1.z.string().describe("L'expéditeur du document, par exemple 'EDF', 'Orange', 'Impots.gouv.fr'."),
    summary: genkit_1.z.string().describe("Un résumé concis en une phrase du contenu principal du document."),
    category: genkit_1.z.enum([
        "Facture",
        "Publicité",
        "Banque",
        "Juridique",
        "Personnel",
        "Autre",
    ]).describe("La catégorie la plus appropriée pour ce document."),
    actionRequired: genkit_1.z.boolean().describe("True si le document semble nécessiter une action (paiement, réponse, etc.), sinon False."),
    extractedData: genkit_1.z
        .object({
        amountDue: genkit_1.z.number().optional().describe("Le montant total à payer s'il est clairement indiqué."),
        dueDate: genkit_1.z.string().optional().describe("La date d'échéance du paiement au format AAAA-MM-JJ, si elle est clairement indiquée."),
    })
        .optional(),
});
// --- Fonction Cloud ---
exports.handleNewMailUpload = (0, storage_1.onObjectFinalized)({
    cpu: 2,
    memory: "1GiB",
    bucket: "ccs-compta.appspot.com",
    region: "europe-west9" // Specify region directly
}, async (event) => {
    var _a, _b;
    const filePath = (_a = event.data.name) !== null && _a !== void 0 ? _a : "";
    const contentType = (_b = event.data.contentType) !== null && _b !== void 0 ? _b : "";
    const fileBucket = event.bucket;
    if (!filePath || !contentType || !filePath.startsWith("mails/")) {
        logger.log(`Fichier ignoré (pas dans le dossier mails): ${filePath}`);
        return;
    }
    const pathParts = filePath.split("/");
    if (pathParts.length < 3) { // expecting mails/{uid}/{mailId}/...
        logger.error(`Format de chemin invalide pour un e-mail: ${filePath}`);
        return;
    }
    const clientUid = pathParts[1];
    const mailId = pathParts[2];
    const mailDocRef = db.collection("mails").doc(mailId);
    logger.log(`🟢 Début du traitement : mailId=${mailId}, clientUid=${clientUid}, filePath=${filePath}`);
    try {
        // --- Initialisation Genkit au runtime ---
        const ai = (0, genkit_1.genkit)({
            plugins: [(0, google_genai_1.googleAI)({ apiKey: process.env.GEMINI_API_KEY })],
        });
        // --- Lecture du fichier ---
        const bucket = admin.storage().bucket(fileBucket);
        const file = bucket.file(filePath);
        const [metadata] = await file.getMetadata();
        const fileSize = metadata.size ? parseInt(metadata.size, 10) : 0;
        const sizeInMB = fileSize / (1024 * 1024);
        if (sizeInMB > 10)
            throw new Error(`Fichier trop volumineux (${sizeInMB.toFixed(2)} Mo).`);
        const [fileBuffer] = await file.download();
        let extractedText = null;
        logger.log(`Étape 1 : Extraction du texte (${contentType})`);
        // --- PDF ---
        if (contentType === "application/pdf") {
            try {
                extractedText = await parsePdfBuffer(fileBuffer);
                if (!extractedText || !extractedText.trim()) {
                    logger.log("⚠️ PDF sans texte détecté, fallback vers OCR Gemini.");
                    extractedText = null;
                }
                else {
                    logger.log(`✅ Texte extrait via pdf-parse (${extractedText.length} caractères).`);
                }
            }
            catch (pdfError) {
                const msg = pdfError instanceof Error ? pdfError.message : "Erreur PDF inconnue";
                logger.log("Fallback OCR Gemini pour PDF:", msg);
                extractedText = null;
            }
        }
        // --- Image ou fallback PDF ---
        if (!extractedText) {
            const documentUri = `data:${contentType};base64,${fileBuffer.toString("base64")}`;
            const { output } = await ai.generate({
                model: google_genai_1.googleAI.model("gemini-1.5-flash"),
                prompt: [
                    { text: `Extrais tout le texte visible dans l'image ou le document fourni. Ne fournis que le texte brut.` },
                    { media: { url: documentUri, contentType } }
                ],
            });
            extractedText = output !== null && output !== void 0 ? output : "";
        }
        if (!extractedText || extractedText.trim().length < 5) {
            throw new Error("Extraction de texte vide ou incomplète.");
        }
        logger.log(`✅ Texte extrait (${extractedText.length} caractères)`);
        // --- Analyse IA ---
        logger.log("Étape 2 : Analyse du texte via Gemini.");
        const { output } = await ai.generate({
            model: google_genai_1.googleAI.model("gemini-1.5-flash"), // Utilisation du bon modèle
            prompt: `Tu es un expert en traitement de documents administratifs français. Analyse le texte suivant et extrais les informations clés. Respecte strictement le format JSON. Texte : --- ${extractedText} ---`,
            output: { schema: analyzeMailOutputSchema },
            config: {
                temperature: 0.2, responseMimeType: "application/json"
            },
        });
        if (!output)
            throw new Error("L'analyse IA a retourné une sortie vide.");
        const validation = analyzeMailOutputSchema.safeParse(output);
        if (!validation.success) {
            logger.error("Résultat IA invalide :", validation.error.issues);
            throw new Error("Le JSON retourné par Gemini ne respecte pas le schéma attendu.");
        }
        const analysisResult = validation.data;
        logger.log("✅ Analyse IA réussie :", analysisResult);
        // --- Firestore ---
        await mailDocRef.set({
            analysis: analysisResult,
            status: analysisResult.actionRequired ? "Urgent" : "Nouveau",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        logger.log(`📄 Firestore mis à jour : mailId=${mailId}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue pendant le traitement.";
        logger.error(`❌ Échec traitement mailId=${mailId} : ${errorMessage}`);
        await mailDocRef.set({
            status: "Erreur d'analyse",
            analysis: { error: errorMessage },
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
});
//# sourceMappingURL=index.js.map