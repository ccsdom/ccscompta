'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { defineSecret } from 'firebase-functions/params';

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

// --- Secret Firebase ---
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// --- Configuration globale ---
setGlobalOptions({
  region: "europe-west9",
  secrets: [GEMINI_API_KEY],
  maxInstances: 5,
});

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
  { cpu: 2, memory: "1GiB", bucket: "ccs-compta.appspot.com" },
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
        plugins: [googleAI({ apiKey: GEMINI_API_KEY.value() })],
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
          model: googleAI.model("gemini-1.5-flash"), // Utilisation du bon modèle
          prompt: `Extrais tout le texte visible dans l'image ou le document fourni. Ne fournis que le texte brut.`,
          input: { documentUri },
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
        prompt: `Tu es un expert en traitement de documents administratifs français. Analyse le texte suivant et extrais les informations clés. Respecte strictement le format JSON. Texte : --- {{{documentText}}} ---`,
        input: { documentText: extractedText },
        output: { schema: analyzeMailOutputSchema },
        config: { temperature: 0.2, responseMimeType: "application/json" },
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


/**
 * Function to set current authenticated user as admin.
 * This is a Callable Function.
 */
export const setAdminRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté pour effectuer cette action.');
  }

  const uid = request.auth.uid;

  try {
    await getAuth().setCustomUserClaims(uid, { role: 'admin' });
    const userDocRef = db.collection('clients').doc(uid);
    await userDocRef.update({ role: 'admin' });

    logger.info(`Successfully set user ${uid} as admin`);
    return {
      success: true,
      message: "Rôle admin défini avec succès. Veuillez vous déconnecter et vous reconnecter.",
    };
  } catch (error: any) {
    logger.error('Error setting admin role:', error);
    throw new HttpsError('internal', "Une erreur est survenue lors de l'assignation du rôle admin.", error.message);
  }
});


/**
 * Function to create a new user with a specific role.
 * This is a Callable Function.
 */
export const createUserWithRole = onCall(async (request) => {
    // 1. Verify admin from the ID token
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Jeton d\'authentification manquant.');
    }
    const callingUserRole = request.auth.token.role;
    if (callingUserRole !== 'admin' && callingUserRole !== 'accountant' && callingUserRole !== 'secretary') {
        throw new HttpsError('permission-denied', 'Action non autorisée.');
    }
    
    // 2. Get payload from request body.
    const { email, password, ...profileData } = request.data;
    if (!email) {
       throw new HttpsError('invalid-argument', 'Email requis pour la création.');
    }

    const auth = getAuth();
    try {
        // 3. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password: password || 'password', // Default password if not provided
            emailVerified: true,
            disabled: false,
            displayName: profileData.name,
        });

        const uid = userRecord.uid;
        const role = profileData.role || 'client';

        // 4. Set custom claim
        await auth.setCustomUserClaims(uid, { role });

        // 5. Create Firestore document
        await db.collection('clients').doc(uid).set({
            ...profileData,
            email,
            role,
            newDocuments: 0,
            lastActivity: new Date().toISOString(),
            status: 'onboarding',
        });

        logger.info(`Successfully created user ${uid} with role ${role}`);
        return { success: true, uid, message: 'Utilisateur créé avec succès.' };
    } catch (error: any) {
        logger.error('Error creating new user:', error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', "Un compte avec cette adresse email existe déjà.");
        }
        if (error.code === 'auth/invalid-password') {
            throw new HttpsError('invalid-argument', "Le mot de passe doit comporter au moins 6 caractères.");
        }
        throw new HttpsError('internal', "Une erreur est survenue lors de la création de l'utilisateur.", error.message);
    }
});
