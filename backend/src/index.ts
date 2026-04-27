
'use server';
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */


import * as logger from 'firebase-functions/logger';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onRequest, onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { processDocumentContent, calculateBillableLines } from './document-processor';
import { StripeService } from './stripe';
import { ExportFactory } from './export-factory';
import { format as formatFns } from 'date-fns';
import { generateWeeklyBriefing } from './proactive-ai';

// La dépendance pdf-parse a été retirée au profit de l'API native multimodale de Gemini.

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
      amountDue: z.number().optional().describe("Le montant total TTC à payer s'il est clairement indiqué."),
      taxAmount: z.number().optional().describe("Le montant total de la TVA s'il est clairement indiqué."),
      dueDate: z.string().optional().describe("La date d'échéance du paiement au format AAAA-MM-JJ, si elle est clairement indiquée."),
    })
    .optional(),
  accountingEntry: z.object({
    debitAccount: z.string().optional().describe("Le compte de classe 6 (ex: 606100, 626000, 606400)."),
    creditAccount: z.string().optional().describe("Le compte de classe 4 (ex: 401000 Fournisseurs)."),
    vatAccount: z.string().optional().describe("Le compte de TVA (ex: 445660 TVA déductible)."),
    confidenceScore: z.number().min(1).max(100).describe("Niveau de certitude de l'attribution (1 à 100).")
  }).optional().describe("Proposition d'imputation comptable automatique basée sur le PCG Français.")
});

type AnalyzeMailOutput = z.infer<typeof analyzeMailOutputSchema>;

// --- Fonction Cloud ---
export const handleNewMailUpload = onObjectFinalized(
  { 
    cpu: 2, 
    memory: "1GiB",
    region: "europe-west9"
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

      logger.log(`Étape 1 : Analyse multimodale structurée (One-Shot) via Gemini (${contentType})`);
      
      const documentUri = `data:${contentType};base64,${fileBuffer.toString("base64")}`;

      const { output } = await ai.generate({
        model: googleAI.model("gemini-1.5-flash"),
        prompt: [
          { text: `Tu es un Expert-Comptable Français implacable. Analyse la facture ou le reçu en pièce jointe.
1. Extraie les informations clés : Expéditeur, résumé, montants TTC et montants de TVA.
2. Effectue une auto-imputation comptable en te basant stricto-sensu sur le Plan Comptable Général (PCG) :
   - Au CRÉDIT : 401000 (Fournisseurs).
   - Au DÉBIT (TVA) : 445660 (TVA Déductible sur autres biens et services).
   - Au DÉBIT (Charge) : Choisis le compte le plus approprié parmi la liste suivante selon la nature de l'achat :
     * 606100 : Fournitures non stockables (Eau, Énergie, EDF, Engie...)
     * 606400 : Fournitures de bureau (Papeterie, Cartouches d'encre...)
     * 613200 : Locations immobilières (Loyer)
     * 615000 : Entretien et réparations
     * 616000 : Primes d'assurances
     * 622600 : Honoraires (Avocat, Expert-comptable, Conseil, Freelance...)
     * 623000 : Publicité, publications, relations publiques (Google Ads, Facebook Ads)
     * 625100 : Voyages et déplacements (SNCF, Billet d'avion, Uber...)
     * 625600 : Missions et réceptions (Restaurant, Repas d'affaires...)
     * 626000 : Frais postaux et télécommunications (Orange, Free, SFR, Bouygues, La Poste...)
     * 627800 : Frais bancaires (Abonnements, Commissions...)
     (Si aucun ne correspond parfaitement, choisis le plus proche et baisse ton Score de Confiance).
Respecte rigoureusement le format JSON de sortie et ne renvoie aucune phrase autre que le JSON.` },
          { media: { url: documentUri, contentType } }
        ],
        output: { schema: analyzeMailOutputSchema },
        config: {
          temperature: 0.1, responseMimeType: "application/json"
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
        status: analysisResult.actionRequired ? "Urgent" : "Nouveau",
        analysis: analysisResult,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        clientId: clientUid,
      }, { merge: true });

      // --- New : Unified Workflow ---
      // Si c'est une facture, on l'ajoute automatiquement à la file d'attente comptable
      if (analysisResult.category === "Facture") {
          const docId = db.collection("documents").doc().id;
          await db.collection("documents").doc(docId).set({
              clientId: clientUid,
              name: `Mail: ${analysisResult.sender}`,
              status: "pending",
              storagePath: filePath, // Réutilisation du fichier uploadé
              uploadDate: new Date().toISOString(),
              source: "email",
              mailRef: mailId,
              auditTrail: [{
                  action: "Import automatique depuis la boîte mail (Mail-to-Box)",
                  date: new Date().toISOString(),
                  user: "Système Mail"
              }]
          });
          logger.log(`🚀 [Unified Workflow] Document créé pour la comptabilité : docId=${docId}`);
      }

      logger.log(`📄 Firestore mis à jour (Mails) : mailId=${mailId}`);

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

// --- 🎯 PHASE 2.2 : WEBHOOK MAIL-TO-BOX (Ingestion via E-mail) --- //
// Service d'ingestion recommandé : Postmark Inbound Webhook (JSON pur, pas de mutipart/form-data complexe)

const postmarkInboundSchema = z.object({
  From: z.string(),
  To: z.string(),
  Subject: z.string().optional(),
  Attachments: z.array(z.object({
    Name: z.string(),
    Content: z.string(), // Base64 encodé
    ContentType: z.string()
  })).optional()
}).passthrough(); // Tolérer les autres champs envoyés par Postmark

export const inboundEmailWebhook = onRequest(
  { region: "europe-west9", memory: "256MiB", maxInstances: 10 },
  async (req: any, res: any) => {
    // 1. Authentification très stricte du Webhook
    // (Dans la vraie vie, ce secret est sauvé dans Firebase Secret Manager)
    const token = req.headers['x-ccscompta-token'];
    if (token !== "SECURE_MAIL_TOKEN_123") {
         logger.warn(`Tentative de webhook non autorisée depuis ${req.ip}`);
         res.status(401).send("Unauthorized");
         return;
    }

    try {
        const payload = postmarkInboundSchema.parse(req.body);
        logger.log(`📥 [Mail-to-Box] E-mail reçu de: ${payload.From} à ${payload.To}`);

        if (!payload.Attachments || payload.Attachments.length === 0) {
            logger.log("Aucune pièce jointe trouvée. E-mail ignoré.");
            res.status(200).send("No attachments, skipped.");
            return;
        }

        // 2. Extraction du Client ID via l'adresse destinataire
        // Format attendu (Routing Subaddressing) : upload+UID@ccscompta.inbound.postmarkapp.com
        const toMatch = payload.To.match(/upload\+(.+)@/i);
        if (!toMatch) {
             logger.error("Destination introuvable ou mauvais format: " + payload.To);
             res.status(400).send("Invalid recipient format. Must contain client UID.");
             return;
        }

        const clientUid = toMatch[1];
        const bucket = admin.storage().bucket("ccs-compta.appspot.com");
        const mailId = admin.firestore().collection("mails").doc().id;

        logger.log(`UID Client identifié : ${clientUid}. Traitement de ${payload.Attachments.length} pièce(s) jointe(s).`);

        // 3. Boucle sur les pièces jointes et auto-upload vers le Cloud Storage
        let uploadedCount = 0;
        for (const attachment of payload.Attachments) {
            // Sécurité & Filtrage : On n'accepte que les PDFs et les Images factures
            if (!attachment.ContentType.includes("pdf") && !attachment.ContentType.includes("image")) {
                 logger.log(`Type ignoré : ${attachment.ContentType} (${attachment.Name})`);
                 continue;
            }

            const buffer = Buffer.from(attachment.Content, "base64");
            // Sécurisation du nom de fichier
            const sanitizedName = attachment.Name.replace(/[^a-zA-Z0-9_\-\.]/g, '');
            // Ce chemin exact déclenchera la fonction handleNewMailUpload instantanément !
            const filePath = `mails/${clientUid}/${mailId}/${sanitizedName}`;
            
            const file = bucket.file(filePath);
            await file.save(buffer, {
                metadata: {
                    contentType: attachment.ContentType,
                    metadata: {
                        source: 'inbound-email',
                        sender: payload.From,
                        subject: payload.Subject || 'Sans Sujet'
                    }
                }
            });
            logger.log(`✅ [Mail-to-Box] Injection réussie : ${filePath}`);
            uploadedCount++;
        }

        res.status(200).send(`Success: uploaded ${uploadedCount} documents.`);
    } catch(err: any) {
        logger.error("Erreur Webhook Mail-to-Box : " + err);
        res.status(500).send("Internal Webhook Error");
    }
  }
);


// --- 🎯 ADMINISTRATION : Gestion des Rôles & Utilisateurs (v2) --- //

/**
 * Définit l'utilisateur actuel comme administrateur (setup initial).
 * Version robuste : crée le profil s'il n'existe pas et vérifie l'email.
 */
export const syncAdminRole = onCall(
  { region: "europe-west9", memory: "256MiB" },
  async (request: CallableRequest<any>) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const { uid, token } = request.auth;
    const email = token.email as string;
    const ADMIN_EMAILS = ['app.ccs94@gmail.com']; 

    if (!ADMIN_EMAILS.includes(email)) {
        throw new HttpsError('permission-denied', 'Email non autorisé.');
    }

    try {
        console.log(`Phase 1: Custom Claims pour ${email}...`);
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
        
        console.log(`Phase 2: Firestore pour ${uid}...`);
        await admin.firestore().collection('clients').doc(uid).set({
            role: 'admin',
            lastSync: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Succès total pour ${email}`);
        return { success: true, message: "Super Admin activé." };
    } catch (error: any) {
        console.error("❌ Erreur de synchro:", error);
        throw new HttpsError('internal', error.message);
    }
  }
);

export const createUserWithRole = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callingUserRole = request.auth.token.role;
    if (!['admin', 'accountant', 'secretary'].includes(callingUserRole)) {
      throw new HttpsError('permission-denied', 'Action non autorisée pour votre rôle.');
    }

    const { email, password, ...profileData } = request.data;
    if (!email) {
      throw new HttpsError('invalid-argument', 'Email requis.');
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password: password || 'password',
        displayName: profileData.name,
        emailVerified: true
      });

      const uid = userRecord.uid;
      const role = profileData.role || 'client';

      await admin.auth().setCustomUserClaims(uid, { role });

      await db.collection('clients').doc(uid).set({
        ...profileData,
        email,
        role,
        newDocuments: 0,
        lastActivity: new Date().toISOString(),
        status: 'onboarding',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Utilisateur ${uid} créé avec le rôle : ${role}`);
      return { success: true, uid, message: 'Utilisateur créé avec succès.' };
    } catch (error: any) {
      logger.error('Erreur lors de la création de l\'utilisateur:', error);
      throw new HttpsError('internal', "Erreur lors de la création du compte.", error.message);
    }
  }
);

/**
 * Finalise l'onboarding d'un cabinet invité.
 */
export const setupInvitedCabinet = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    const { cabinetId, password, email, name } = request.data;
    
    if (!cabinetId || !password || !email) {
      throw new HttpsError('invalid-argument', 'Paramètres manquants.');
    }

    try {
      // 1. Vérifier que le cabinet existe et est en attente
      const cabinetRef = db.collection('cabinets').doc(cabinetId);
      const cabinetSnap = await cabinetRef.get();

      if (!cabinetSnap.exists) {
        throw new HttpsError('not-found', 'Cabinet introuvable.');
      }

      const cabinetData = cabinetSnap.data();
      if (cabinetData?.invitationStatus === 'accepted') {
        throw new HttpsError('already-exists', 'Ce cabinet est déjà configuré.');
      }

      // 2. Créer ou récupérer l'utilisateur Auth
      let uid: string;
      try {
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
          emailVerified: true
        });
        uid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          const existingUser = await admin.auth().getUserByEmail(email);
          uid = existingUser.uid;
          // On met à jour son mdp pour correspondre à celui choisi pendant l'onboarding
          await admin.auth().updateUser(uid, { password });
        } else {
          throw error;
        }
      }
      const role = 'accountant'; // Par défaut, le créateur est le premier comptable admin

      // 3. Custom Claims
      await admin.auth().setCustomUserClaims(uid, { role, cabinetId });

      // 4. Mettre à jour le cabinet
      await cabinetRef.update({
        invitationStatus: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        adminUid: uid,
        status: 'active'
      });

      // 5. Créer le profil "client" (qui sert de base utilisateur)
      await db.collection('clients').doc(uid).set({
        name,
        email,
        role,
        cabinetId,
        isCabinetAdmin: true,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Cabinet ${cabinetId} activé par ${uid}`);
      return { success: true };
    } catch (error: any) {
      logger.error('Setup cabinet error:', error);
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Cet email possède déjà un compte.');
      }
      throw new HttpsError('internal', error.message);
    }
  }
);

/**
 * Trigger centralisé pour le traitement IA des documents.
 * Se déclenche dès qu'un document est créé ou mis à jour avec le statut 'pending'.
 */
export const onDocumentPending = onDocumentWritten(
  { 
    document: "documents/{docId}",
    region: "europe-west9",
    memory: "1GiB",
    timeoutSeconds: 300
  },
  async (event) => {
    const data = event.data?.after.data();
    const previousData = event.data?.before.data();
    
    // On ne traite que si le statut est 'pending' et qu'il ne l'était pas déjà (ou si c'est une création)
    if (!data || data.status !== 'pending' || (previousData && previousData.status === 'pending')) {
        return;
    }

    const docId = event.params.docId;
    const storagePath = data.storagePath;
    const documentType = data.type || 'invoice'; // Par défaut invoice si non spécifié

    logger.log(`🤖 [Processor] Début du traitement IA pour le document : ${docId} (Type: ${documentType})`);

    try {
        // 1. Marquer comme en cours de traitement pour éviter les doubles déclenchements
        await event.data?.after.ref.update({ status: 'processing' });

        // 2. Télécharger le contenu depuis Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);
        
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || 'application/pdf';
        const [buffer] = await file.download();

        // 3. Appel du processeur IA (Gemini multimodal)
        const extractedData = await processDocumentContent(buffer, contentType, documentType);
        
        // 4. Détection intelligente de doublons (Vendor + Date + Amount)
        let isDuplicate = false;
        let existingId = null;
        
        const vendor = extractedData.vendorNames?.[0];
        const date = extractedData.dates?.[0];
        const amount = extractedData.amounts?.[0];

        if (vendor && date && amount) {
            // Un seul array-contains autorisé par requête Firestore
            const duplicates = await db.collection("documents")
                .where("clientId", "==", data.clientId)
                .where("extractedData.amounts", "array-contains", amount) // Le montant est souvent plus discriminant
                .where("status", "in", ["approved", "reviewing", "exported"])
                .get();
            
            for (const otherDoc of duplicates.docs) {
                const otherData = otherDoc.data().extractedData;
                if (otherDoc.id !== docId && 
                    otherData?.vendorNames?.includes(vendor) && 
                    otherData?.dates?.includes(date)) {
                    isDuplicate = true;
                    existingId = otherDoc.id;
                    break;
                }
            }
        }

        // 5. Calcul de la monétisation (billable lines)
        const billableLines = calculateBillableLines(extractedData, documentType);

        // 6. Mise à jour finale du document
        const updateData: any = {
            extractedData,
            billableLines,
            type: extractedData.documentType || documentType,
            status: isDuplicate ? 'duplicate' : 'reviewing',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            'auditTrail': admin.firestore.FieldValue.arrayUnion({
                action: isDuplicate ? `Doublon détecté (ID: ${existingId})` : 'Analyse IA automatique terminée',
                date: new Date().toISOString(),
                user: 'Système AI'
            })
        };

        if (isDuplicate) {
            updateData.anomalies = admin.firestore.FieldValue.arrayUnion("Doublon potentiel détecté : une facture identique existe déjà.");
        }

        await event.data?.after.ref.update(updateData);

        logger.log(`✅ [Processor] Succès pour ${docId} : ${billableLines} lignes détectées. ${isDuplicate ? '(DOUBLON)' : ''}`);
        
        // 7. Report usage to Stripe & Update Cabinet Quotas if NOT a duplicate
        if (!isDuplicate) {
            try {
                // Récupérer le cabinet lié au client
                const clientDoc = await db.collection("clients").doc(data.clientId).get();
                const clientData = clientDoc.data();
                const cabinetId = clientData?.cabinetId;

                if (cabinetId) {
                    const cabinetRef = db.collection("cabinets").doc(cabinetId);
                    
                    // Mise à jour du quota interne (Firestore)
                    await cabinetRef.update({
                        'quotas.usedDocumentsMonth': admin.firestore.FieldValue.increment(1),
                        'quotas.totalBillableLines': admin.firestore.FieldValue.increment(billableLines)
                    });

                    // Report à Stripe si configuré
                    const cabinetSnap = await cabinetRef.get();
                    const cabinetData = cabinetSnap.data();
                    
                    if (cabinetData?.stripeSubscriptionItemId) {
                        logger.log(`💳 [Stripe] Reporting usage for cabinet ${cabinetId} : ${billableLines} lines`);
                        await StripeService.reportUsage(cabinetData.stripeSubscriptionItemId, billableLines);
                    }
                }
            } catch (billingError) {
                logger.error(`⚠️ [Billing] Erreur lors du report de consommation pour ${docId}:`, billingError);
            }
        }

    } catch (error: any) {
        logger.error(`❌ [Processor] Échec pour ${docId} :`, error);
        await event.data?.after.ref.update({
            status: 'error',
            'auditTrail': admin.firestore.FieldValue.arrayUnion({
                action: `Erreur d'analyse IA : ${error.message}`,
                date: new Date().toISOString(),
                user: 'Système AI'
            })
        });
    }
  }
);

/**
 * Génère un lien vers le Portail Client Stripe.
 */
export const createPortalSession = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Vous devez être connecté.');
        }

        const uid = request.auth.uid;
        const clientDoc = await db.collection("clients").doc(uid).get();
        const clientData = clientDoc.data();

        if (!clientData?.stripeCustomerId) {
            throw new HttpsError('failed-precondition', "Aucun compte client Stripe n'est configuré.");
        }

        try {
            const returnUrl = request.data.returnUrl || 'https://ccscompta.web.app/dashboard/settings';
            const session = await StripeService.createPortalSession(clientData.stripeCustomerId, returnUrl);
            return { url: session.url };
        } catch (error: any) {
            logger.error('Erreur Portail Stripe:', error);
            throw new HttpsError('internal', error.message);
        }
    }
);

/**
 * Exporte une sélection de documents au format comptable (FEC ou CSV).
 */
export const exportDocuments = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Vous devez être connecté.');
        }

        const { documentIds, format: exportFormat } = request.data;
        if (!documentIds || !Array.isArray(documentIds)) {
            throw new HttpsError('invalid-argument', 'Les documentIds doivent être fournis sous forme de tableau.');
        }

        try {
            // 1. Récupérer les documents
            const docsToExport = [];
            for (const id of documentIds) {
                const doc = await db.collection("documents").doc(id).get();
                if (doc.exists) {
                    docsToExport.push({ ...doc.data(), id: doc.id });
                }
            }

            if (docsToExport.length === 0) {
                throw new HttpsError('not-found', 'Aucun document trouvé pour l\'export.');
            }

            // 2. Générer le fichier
            let fileContent = '';
            let fileName = '';
            const timestamp = formatFns(new Date(), 'yyyyMMdd_HHmm');

            if (exportFormat === 'FEC') {
                fileContent = ExportFactory.generateFEC(docsToExport);
                fileName = `export_compta_FEC_${timestamp}.txt`;
            } else {
                fileContent = ExportFactory.generateCSV(docsToExport);
                fileName = `export_compta_${timestamp}.csv`;
            }

            // 3. Marquer comme exportés
            const batch = db.batch();
            const exportId = `export_${timestamp}`;
            
            for (const doc of docsToExport) {
                const ref = db.collection("documents").doc(doc.id);
                batch.update(ref, {
                    isExported: true,
                    exportDate: new Date().toISOString(),
                    exportId
                });
            }
            await batch.commit();

            return { 
                fileContent, 
                fileName,
                count: docsToExport.length 
            };
        } catch (error: any) {
            logger.error('Erreur Export:', error);
            throw new HttpsError('internal', error.message);
        }
    }
);
/**
 * Trigger de notification pour les nouveaux commentaires.
 * Informe le client quand le cabinet commente, et inversement.
 */
export const onCommentAdded = onDocumentWritten(
    { 
        document: "documents/{docId}",
        region: "europe-west9"
    },
    async (event) => {
        const data = event.data?.after.data();
        const previousData = event.data?.before.data();
        
        if (!data || !previousData) return;

        const comments = data.comments || [];
        const prevComments = previousData.comments || [];

        // Si la taille du tableau de commentaires a augmenté
        if (comments.length > prevComments.length) {
            const newComment = comments[comments.length - 1];
            const clientId = data.clientId;
            const docName = data.name || "Document sans nom";

            logger.log(`💬 Nouveau commentaire sur ${docName} par ${newComment.user}`);

            // Création de la notification dans Firestore
            const notificationId = db.collection("notifications").doc().id;
            await db.collection("notifications").doc(notificationId).set({
                id: notificationId,
                documentId: event.params.docId,
                documentName: docName,
                message: `${newComment.user} a ajouté un commentaire : "${newComment.text.substring(0, 50)}${newComment.text.length > 50 ? '...' : ''}"`,
                date: new Date().toISOString(),
                isRead: false,
                clientId: clientId, // Pour filtrer les notifications par client
                type: 'comment'
            });

            // Incrémenter le compteur de nouveaux documents/notifications pour le badge UI
            await db.collection('clients').doc(clientId).update({
                newDocuments: admin.firestore.FieldValue.increment(1)
            });
        }
    }
);

/**
 * Génère manuellement (ou via scheduler) le briefing hebdomadaire.
 */
export const requestWeeklySummary = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisé');
        
        const clientId = request.data.clientId || request.auth.uid;
        
        // 1. Récupérer les 7 derniers jours de documents
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const docsSnapshot = await db.collection("documents")
            .where("clientId", "==", clientId)
            .where("uploadDate", ">=", sevenDaysAgo.toISOString())
            .get();
        
        const docs = docsSnapshot.docs.map(d => d.data());
        
        if (docs.length === 0) {
            return { message: "Pas assez de données pour cette semaine." };
        }

        // 2. Générer via IA
        const briefing = await generateWeeklyBriefing({ clientId, docs });

        // 3. Sauvegarder comme notification spéciale
        const notifId = db.collection("notifications").doc().id;
        await db.collection("notifications").doc(notifId).set({
            id: notifId,
            clientId,
            type: 'weekly_briefing',
            message: briefing.summary,
            date: new Date().toISOString(),
            isRead: false,
            documentName: "Briefing Hebdomadaire",
            extraData: briefing
        });

        return { success: true, briefing };
    }
);
