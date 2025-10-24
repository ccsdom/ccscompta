
'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */


import * as logger from 'firebase-functions/logger';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// --- pdf-parse import compatible ---
let pdfExtractor: ((buffer: Buffer) => Promise<PdfParseResult>) | null = null;

interface PdfParseResult {
  text: string;
  numpages: number;
  info: any;
  metadata: any;
}

// --- Wrapper PDF ---
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  if (!pdfExtractor) {
    try {
      // Use dynamic import for ESM/CJS compatibility
      const pdfParseModule = await import('pdf-parse');
      pdfExtractor = pdfParseModule.default || pdfParseModule;
    } catch (error) {
      logger.error("pdf-parse n'a pas pu être chargé dynamiquement:", error);
      throw new Error("Le module d'extraction PDF n'est pas disponible.");
    }
  }
  try {
    const data: PdfParseResult = await pdfExtractor(buffer);
    return data.text || "";
  } catch (error: unknown) {
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
const analyzeMailOutputSchema = z.object({
  sender: z.string().describe("L'expéditeur du document, par exemple 'EDF', 'Orange', 'Impots.gouv.fr'."),
  summary: z.string().describe("Un résumé concis en une phrase du contenu principal du document."),
  category: z.enum([
    "Facture",
    "Publicité",
    "Banque",
    "Juridique",
    "Personnel",
    "Autre",
  ]).describe("La catégorie la plus appropriée pour ce document."),
  actionRequired: z.boolean().describe("True si le document semble nécessiter une action (paiement, réponse, etc.), sinon False."),
  extractedData: z
    .object({
      amountDue: z.number().optional().describe("Le montant total à payer s'il est clairement indiqué."),
      dueDate: z.string().optional().describe("La date d'échéance du paiement au format AAAA-MM-JJ, si elle est clairement indiquée."),
    })
    .optional(),
});

type AnalyzeMailOutput = z.infer<typeof analyzeMailOutputSchema>;

// --- Fonction Cloud ---
export const handleNewMailUpload = onObjectFinalized(
  { 
    cpu: 2, 
    memory: "1GiB", 
    bucket: "ccs-compta.appspot.com",
    region: "europe-west9" // Specify region directly
  },
  async (event) => {
    const filePath = event.data.name ?? "";
    const contentType = event.data.contentType ?? "";
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
      const ai = genkit({
        plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
      });
      
      // --- Lecture du fichier ---
      const bucket = admin.storage().bucket(fileBucket);
      const file = bucket.file(filePath);

      const [metadata] = await file.getMetadata();
      const fileSize = metadata.size ? parseInt(metadata.size as string, 10) : 0;
      const sizeInMB = fileSize / (1024 * 1024);
      if (sizeInMB > 10) throw new Error(`Fichier trop volumineux (${sizeInMB.toFixed(2)} Mo).`);

      const [fileBuffer] = await file.download();
      let extractedText: string | null = null;

      logger.log(`Étape 1 : Extraction du texte (${contentType})`);

      // --- PDF ---
      if (contentType === "application/pdf") {
         try {
          extractedText = await parsePdfBuffer(fileBuffer);
          if (!extractedText || !extractedText.trim()) {
            logger.log("⚠️ PDF sans texte détecté, fallback vers OCR Gemini.");
            extractedText = null;
          } else {
            logger.log(`✅ Texte extrait via pdf-parse (${extractedText.length} caractères).`);
          }
        } catch (pdfError: unknown) {
          const msg = pdfError instanceof Error ? pdfError.message : "Erreur PDF inconnue";
          logger.log("Fallback OCR Gemini pour PDF:", msg);
          extractedText = null;
        }
      }

      // --- Image ou fallback PDF ---
      if (!extractedText) {
        const documentUri = `data:${contentType};base64,${fileBuffer.toString("base64")}`;
        const { output } = await ai.generate({ 
          model: googleAI.model("gemini-1.5-flash"), 
          prompt: [
            { text: `Extrais tout le texte visible dans l'image ou le document fourni. Ne fournis que le texte brut.` },
            { media: { url: documentUri, contentType } }
          ],
        });
        extractedText = output ?? "";
      }

      if (!extractedText || extractedText.trim().length < 5) {
        throw new Error("Extraction de texte vide ou incomplète.");
      }

      logger.log(`✅ Texte extrait (${extractedText.length} caractères)`);

      // --- Analyse IA ---
      logger.log("Étape 2 : Analyse du texte via Gemini.");
      const { output } = await ai.generate({
        model: googleAI.model("gemini-1.5-flash"), // Utilisation du bon modèle
        prompt: `Tu es un expert en traitement de documents administratifs français. Analyse le texte suivant et extrais les informations clés. Respecte strictement le format JSON. Texte : --- ${extractedText} ---`,
        output: { schema: analyzeMailOutputSchema },
        config: {
          temperature: 0.2, responseMimeType: "application/json"
        },
      });
      
      if (!output) throw new Error("L'analyse IA a retourné une sortie vide.");

      const validation = analyzeMailOutputSchema.safeParse(output);
      if (!validation.success) {
        logger.error("Résultat IA invalide :", validation.error.issues);
        throw new Error("Le JSON retourné par Gemini ne respecte pas le schéma attendu.");
      }

      const analysisResult: AnalyzeMailOutput = validation.data;
      logger.log("✅ Analyse IA réussie :", analysisResult);

      // --- Firestore ---
      await mailDocRef.set({
        analysis: analysisResult,
        status: analysisResult.actionRequired ? "Urgent" : "Nouveau",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      logger.log(`📄 Firestore mis à jour : mailId=${mailId}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue pendant le traitement.";
      logger.error(`❌ Échec traitement mailId=${mailId} : ${errorMessage}`);

      await mailDocRef.set({
        status: "Erreur d'analyse",
        analysis: { error: errorMessage },
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
);
