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
exports.onDocumentApproved = exports.inviteClient = exports.disposeAsset = exports.generateFECExport = exports.validateAccountingEntry = exports.generateDepreciationODs = exports.generateAssetSchedule = exports.autoMatchBankTransactions = exports.requestWeeklySummary = exports.onCommentAdded = exports.exportDocuments = exports.stripeWebhook = exports.generateCabinetCheckout = exports.createPortalSession = exports.onDocumentPending = exports.setupInvitedCabinet = exports.verifyCabinetInvitation = exports.sendCabinetInvitation = exports.createCabinetWithInvitation = exports.prepareCabinetInvitation = exports.sendUserSetupEmail = exports.createUserWithRole = exports.syncAdminRole = exports.inboundEmailWebhook = exports.handleNewMailUpload = exports.supportChat = exports.runGhostHunter = exports.saveBankReconciliation = exports.runBankReconciliation = exports.intelligentSearch = exports.createInvoiceForDocument = exports.syncBankTransactions = exports.finalizeBankConnection = exports.getBankAuthLink = exports.extractClientData = exports.searchCompany = void 0;
/**
 * @fileOverview Cloud Functions for Firebase.
 * Backend logic for assigning user roles, creating users and processing documents.
 */
const logger = __importStar(require("firebase-functions/logger"));
const storage_1 = require("firebase-functions/v2/storage");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
// import { format as formatFns } from 'date-fns';
// import { generateWeeklyBriefing } from './proactive-ai';
// La dÃ©pendance pdf-parse a Ã©tÃ© retirÃ©e au profit de l'API native multimodale de Gemini.
// --- Configuration ---
if (!admin.apps.length) {
    admin.initializeApp();
}
function getDb() {
    return admin.firestore();
}
const DEFAULT_APP_BASE_URL = 'https://ccscompta.fr';
function getCallerRole(auth) {
    return typeof auth.token.role === 'string' ? auth.token.role : 'client';
}
function getCallerCabinetId(auth) {
    return typeof auth.token.cabinetId === 'string' ? auth.token.cabinetId : undefined;
}
function generateTemporaryPassword() {
    return `${(0, crypto_1.randomBytes)(24).toString('base64url')}aA1!`;
}
function generateInvitationToken() {
    return (0, crypto_1.randomBytes)(32).toString('base64url');
}
function hashInvitationToken(token) {
    return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
}
function getAccountSetupUrl() {
    return process.env.ACCOUNT_SETUP_CONTINUE_URL ||
        `${getAppBaseUrl()}/connexion`;
}
function getAppBaseUrl() {
    return (process.env.APP_BASE_URL || DEFAULT_APP_BASE_URL).replace(/\/$/, '');
}
function buildCabinetOnboardingUrl(cabinetId, token) {
    return `${getAppBaseUrl()}/onboarding?cabinetId=${encodeURIComponent(cabinetId)}&token=${encodeURIComponent(token)}`;
}
function buildCabinetInvitationMailPayload(cabinet) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #111827;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Bienvenue sur CCS Compta</h1>
      <p style="font-size: 15px; line-height: 1.6;">
        Votre espace cabinet <strong>${cabinet.name}</strong> est pret. Cliquez sur le bouton ci-dessous pour definir votre mot de passe et activer votre compte comptable.
      </p>
      <p style="font-size: 14px; line-height: 1.6;">
        Identifiant de connexion: <strong>${cabinet.email}</strong>
      </p>
      <p style="margin: 28px 0;">
        <a href="${cabinet.invitationUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 22px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          Activer mon espace cabinet
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
        Ce lien est personnel et expire automatiquement. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br/>
        ${cabinet.invitationUrl}
      </p>
    </div>
  `;
    return {
        to: cabinet.email,
        message: {
            subject: `[CCS Compta] Activez votre espace cabinet - ${cabinet.name}`,
            html,
        },
        metadata: {
            cabinetId: cabinet.id,
            type: 'cabinet-invitation',
            secured: true,
        },
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
}
async function queueCabinetInvitationEmail(cabinet) {
    const payload = buildCabinetInvitationMailPayload(cabinet);
    await getDb().collection('mail').add(payload);
}
function getRoleLabel(role) {
    const labels = {
        admin: 'administrateur',
        accountant: 'comptable',
        secretary: 'secretaire',
        client: 'client',
    };
    return labels[role] || 'utilisateur';
}
function buildUserSetupMailPayload(user) {
    const displayName = user.name || user.email;
    const roleLabel = getRoleLabel(user.role);
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #111827;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Bienvenue sur CCS Compta</h1>
      <p style="font-size: 15px; line-height: 1.6;">
        Bonjour <strong>${displayName}</strong>, votre espace ${roleLabel} est pret.
      </p>
      <p style="font-size: 15px; line-height: 1.6;">
        Cliquez sur le bouton ci-dessous pour definir votre mot de passe et activer votre acces securise.
      </p>
      <p style="font-size: 14px; line-height: 1.6;">
        Identifiant de connexion: <strong>${user.email}</strong>
      </p>
      <p style="margin: 28px 0;">
        <a href="${user.setupLink}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 22px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          Activer mon acces
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
        Ce lien est personnel. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br/>
        ${user.setupLink}
      </p>
    </div>
  `;
    return {
        to: user.email,
        message: {
            subject: '[CCS Compta] Activez votre espace',
            html,
        },
        metadata: {
            uid: user.uid,
            cabinetId: user.cabinetId || null,
            role: user.role,
            type: 'user-setup',
            secured: true,
        },
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
}
async function queueUserSetupEmail(user) {
    const payload = buildUserSetupMailPayload(user);
    await getDb().collection('mail').add(payload);
}
async function getClientOrThrow(clientId) {
    const snap = await getDb().collection('clients').doc(clientId).get();
    if (!snap.exists) {
        throw new https_1.HttpsError('not-found', 'Client introuvable.');
    }
    return Object.assign({ id: snap.id }, (snap.data() || {}));
}
async function assertClientCabinetAccess(auth, clientId, allowedRoles = ['admin', 'accountant']) {
    const callerRole = getCallerRole(auth);
    if (!allowedRoles.includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Role non autorise pour cette operation.');
    }
    const targetClient = await getClientOrThrow(clientId);
    const targetCabinetId = targetClient.cabinetId;
    if (callerRole === 'admin') {
        return { callerRole, targetClient, targetCabinetId };
    }
    const callerCabinetId = getCallerCabinetId(auth);
    if (!callerCabinetId || callerCabinetId !== targetCabinetId) {
        throw new https_1.HttpsError('permission-denied', 'Acces interdit a ce cabinet.');
    }
    return { callerRole, targetClient, targetCabinetId };
}
function throwCallableError(error, context) {
    logger.error(context, error);
    if (error instanceof https_1.HttpsError) {
        throw error;
    }
    const message = error instanceof Error ? error.message : 'Erreur interne.';
    throw new https_1.HttpsError('internal', message);
}
const SUPPORT_CHAT_DOCUMENTATION = `
Documentation CCS Compta

CCS Compta est une plateforme de gestion comptable collaborative pour les clients, les comptables et les administrateurs.

Espace client:
- La page Mes Documents permet de televerser des documents comptables et de suivre leur statut.
- Les formats acceptes sont PDF, JPG et PNG.
- Les statuts principaux sont: en attente, en traitement, en examen, approuve et erreur.
- Le scanner permet d'utiliser l'appareil photo d'un telephone ou d'un ordinateur pour numeriser une facture ou un recu papier.
- La page Mon Analyse affiche un apercu financier base sur les documents approuves: total des depenses, principaux fournisseurs et repartition par categorie.
- Les commentaires sur un document permettent au client et au comptable d'echanger au sujet d'une piece precise.

Espace comptable:
- Le tableau de bord donne une vue d'ensemble de l'activite des clients, des documents en attente et des validations recentes.
- La gestion des clients permet de creer, modifier ou importer des dossiers clients via CSV.
- La page Documents du client permet de verifier les donnees extraites, corriger les champs, approuver le document et preparer l'integration comptable.
- Les comptables peuvent accompagner les clients qui ne sont pas a l'aise avec l'outil numerique.

Espace administrateur:
- L'administrateur gere les cabinets, les utilisateurs, les roles et les droits d'acces.
- Les invitations permettent aux cabinets et utilisateurs de definir leur mot de passe et d'activer leur acces.

Securite et bonnes pratiques:
- Chaque utilisateur doit se connecter avec son propre compte.
- Les droits dependent du role et du cabinet rattache.
- Les liens d'activation sont personnels et doivent etre transmis par un canal securise.
`;
function normalizeCompanySearchQuery(value) {
    if (typeof value !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Le terme de recherche est obligatoire.');
    }
    const query = value.trim();
    if (query.length < 3 || query.length > 120) {
        throw new https_1.HttpsError('invalid-argument', 'Le terme de recherche doit contenir entre 3 et 120 caracteres.');
    }
    return query;
}
function normalizeIntelligentSearchQuery(value) {
    if (typeof value !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'La requete de recherche est obligatoire.');
    }
    const queryText = value.trim();
    if (queryText.length < 2 || queryText.length > 300) {
        throw new https_1.HttpsError('invalid-argument', 'La requete de recherche doit contenir entre 2 et 300 caracteres.');
    }
    return queryText;
}
function normalizeIsoDate(value) {
    if (typeof value !== 'string') {
        return new Date().toISOString();
    }
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return new Date().toISOString();
    }
    return parsedDate.toISOString();
}
function normalizeBankTransactions(value) {
    if (!Array.isArray(value)) {
        throw new https_1.HttpsError('invalid-argument', 'La liste des transactions est obligatoire.');
    }
    const transactions = value.slice(0, 500).map((transaction) => {
        const candidate = transaction;
        const date = typeof candidate.date === 'string' ? candidate.date.trim().slice(0, 80) : '';
        const description = typeof candidate.description === 'string' ? candidate.description.trim().slice(0, 500) : '';
        const amount = typeof candidate.amount === 'number'
            ? candidate.amount
            : typeof candidate.amount === 'string'
                ? Number(candidate.amount.replace(',', '.'))
                : Number.NaN;
        if (!date || !description || !Number.isFinite(amount)) {
            throw new https_1.HttpsError('invalid-argument', 'Une transaction bancaire est invalide.');
        }
        return { date, description, amount };
    });
    if (transactions.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'Aucune transaction bancaire valide.');
    }
    return transactions;
}
function normalizeDocumentId(value) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Document obligatoire.');
    }
    return value.trim();
}
function normalizeClientId(value) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Client obligatoire.');
    }
    return value.trim();
}
function normalizeOptionalCabinetId(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function normalizeRequisitionId(value) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Requisition bancaire obligatoire.');
    }
    return value.trim();
}
async function assertInvoiceCreationAccess(auth, clientId) {
    const callerRole = getCallerRole(auth);
    if (callerRole === 'client') {
        if (auth.uid !== clientId) {
            throw new https_1.HttpsError('permission-denied', 'Acces interdit a ce client.');
        }
        const targetClient = await getClientOrThrow(clientId);
        return {
            callerRole,
            targetClient,
            targetCabinetId: targetClient.cabinetId,
        };
    }
    return assertClientCabinetAccess(auth, clientId, ['admin', 'accountant', 'secretary']);
}
async function assertBankAccess(auth, clientId, expectedCabinetId) {
    const callerRole = getCallerRole(auth);
    if (callerRole === 'client') {
        if (auth.uid !== clientId) {
            throw new https_1.HttpsError('permission-denied', 'Acces interdit a ce client.');
        }
        const targetClient = await getClientOrThrow(clientId);
        const targetCabinetId = targetClient.cabinetId;
        if (expectedCabinetId && targetCabinetId && expectedCabinetId !== targetCabinetId) {
            throw new https_1.HttpsError('permission-denied', 'Acces interdit a ce cabinet.');
        }
        return { callerRole, targetClient, targetCabinetId };
    }
    const access = await assertClientCabinetAccess(auth, clientId, ['admin', 'accountant', 'secretary']);
    if (expectedCabinetId && access.targetCabinetId && expectedCabinetId !== access.targetCabinetId) {
        throw new https_1.HttpsError('permission-denied', 'Acces interdit a ce cabinet.');
    }
    return access;
}
async function searchFrenchCompanies(query) {
    const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=5`);
    if (!response.ok) {
        logger.error('French company API search failed', {
            status: response.status,
            statusText: response.statusText,
        });
        return [];
    }
    const data = await response.json();
    return (data.results || [])
        .map((result) => {
        var _a, _b, _c;
        const company = result;
        const name = typeof company.nom_raison_sociale === 'string'
            ? company.nom_raison_sociale
            : typeof company.nom_complet === 'string'
                ? company.nom_complet
                : '';
        const siret = typeof ((_a = company.siege) === null || _a === void 0 ? void 0 : _a.siret) === 'string' ? company.siege.siret : '';
        if (!name || !siret) {
            return null;
        }
        const mainRepresentative = (_b = company.dirigeants) === null || _b === void 0 ? void 0 : _b[0];
        const legalRepresentative = mainRepresentative
            ? `${typeof mainRepresentative.prenoms === 'string' ? mainRepresentative.prenoms : ''} ${typeof mainRepresentative.nom === 'string' ? mainRepresentative.nom : ''}`.trim()
            : '';
        return {
            name,
            siret,
            address: typeof ((_c = company.siege) === null || _c === void 0 ? void 0 : _c.adresse) === 'string' ? company.siege.adresse : '',
            legalRepresentative: legalRepresentative || 'N/A',
        };
    })
        .filter((result) => result !== null);
}
function normalizeSupportChatHistory(value) {
    if (!Array.isArray(value)) {
        throw new https_1.HttpsError('invalid-argument', 'Historique de conversation invalide.');
    }
    return value.slice(-20).map((message) => {
        var _a, _b;
        const candidate = message;
        const role = candidate.role === 'user' ? 'user' : 'model';
        const rawText = typeof candidate.text === 'string'
            ? candidate.text
            : typeof ((_b = (_a = candidate.content) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.text) === 'string'
                ? candidate.content[0].text
                : '';
        const text = rawText.trim().slice(0, 1500);
        if (!text) {
            throw new https_1.HttpsError('invalid-argument', 'Un message de conversation est vide.');
        }
        return { role, text };
    });
}
async function generateSupportChatAnswer(history, financialContext = '') {
    const { genkit } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    const ai = genkit({
        plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    });
    const conversation = history
        .map((message) => `${message.role === 'user' ? 'Utilisateur' : 'AI Copilot'}: ${message.text}`)
        .join('\n');
    const prompt = `Tu es AI Accountant Copilot, le directeur financier virtuel expert de CCS Compta.
Tu dois répondre en français, de façon professionnelle, claire, concise, et proactive.
Tu as accès aux données financières réelles du client via le Contexte Financier ci-dessous. 
Si on te pose une question sur les dépenses, la TVA, les fournisseurs ou l'état de la comptabilité, utilise ces données pour formuler une réponse personnalisée et chiffrée.
Pour toute question d'ordre technique sur la plateforme, réfère-toi à la Documentation Officielle.
Si tu ne peux vraiment pas répondre, dis que tu n'as pas l'information et propose de contacter le support.
Ne dis jamais explicitement "d'après le contexte financier qu'on m'a fourni", agis comme si tu savais ces choses naturellement.
Tu peux utiliser du markdown simple quand c'est utile.

Documentation officielle:
${SUPPORT_CHAT_DOCUMENTATION}

Contexte Financier du Client:
${financialContext || "Aucune donnée financière disponible pour ce client (ou aucun client sélectionné)."}

Conversation:
${conversation}

Réponse:`;
    const response = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt,
        config: {
            temperature: 0.2,
        },
    });
    return response.text || "Une erreur est survenue lors de la generation de la reponse.";
}
async function loadApprovedInvoicesForReconciliation(clientId, cabinetId) {
    const snapshot = await getDb()
        .collection('documents')
        .where('clientId', '==', clientId)
        .where('status', '==', 'approved')
        .get();
    return snapshot.docs
        .map((docSnap) => {
        const data = docSnap.data();
        if (cabinetId && data.cabinetId !== cabinetId) {
            return null;
        }
        const extracted = data.extractedData || {};
        const firstAmount = Array.isArray(extracted.amounts) ? extracted.amounts[0] : null;
        const firstDate = Array.isArray(extracted.dates) ? extracted.dates[0] : null;
        const firstVendor = Array.isArray(extracted.vendorNames) ? extracted.vendorNames[0] : null;
        if (typeof firstAmount !== 'number') {
            return null;
        }
        return {
            id: docSnap.id,
            date: typeof firstDate === 'string' ? firstDate : null,
            amount: firstAmount,
            vendorName: typeof firstVendor === 'string' ? firstVendor : null,
        };
    })
        .filter((invoice) => invoice !== null);
}
async function generateBankReconciliation(transactions, invoices) {
    const { genkit, z } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    const ai = genkit({
        plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    });
    const outputSchema = z.object({
        matches: z.array(z.object({
            transactionIndex: z.number().describe('Index base 0 de la transaction rapprochee.'),
            documentId: z.string().describe('Identifiant du document correspondant.'),
            confidenceScore: z.number().describe('Score de confiance entre 0 et 100.'),
        })).describe('Transactions rapprochees a une facture existante.'),
        anomalies: z.array(z.object({
            transactionIndex: z.number().describe('Index base 0 de la transaction anormale.'),
            reason: z.string().describe('Raison courte et professionnelle de l anomalie.'),
        })).describe('Transactions qui semblent orphelines ou suspectes.'),
    });
    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `Tu es un expert-comptable specialise en rapprochement bancaire.
Ta mission est de rapprocher des transactions bancaires avec des factures ou recus approuves.

Regles:
- Une transaction debit negative peut correspondre a une facture positive du meme montant.
- Tolere un ecart de quelques centimes si le fournisseur et la date concordent.
- Un paiement carte peut apparaitre 1 a 3 jours apres la facture.
- Si le rapprochement est evident, retourne un confidenceScore proche de 100.
- Ne rapproche jamais deux transactions avec la meme facture si ce n'est pas clairement justifie.
- Signale en anomalies les depenses orphelines ou suspectes avec une raison courte en francais.
- Les charges URSSAF, DGFIP ou salaires peuvent etre normales meme sans facture classique.

Transactions:
${JSON.stringify(transactions)}

Factures approuvees:
${JSON.stringify(invoices)}

Retourne uniquement le JSON structure demande.`,
        output: {
            schema: outputSchema,
        },
        config: {
            temperature: 0.1,
        },
    });
    return output || { matches: [], anomalies: [] };
}
async function createProcessingInvoiceForDocument(clientId, documentId, cabinetId) {
    const db = getDb();
    const documentSnap = await db.collection('documents').doc(documentId).get();
    if (!documentSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Document introuvable.');
    }
    const documentData = documentSnap.data() || {};
    if (documentData.clientId !== clientId) {
        throw new https_1.HttpsError('permission-denied', 'Le document ne correspond pas au client.');
    }
    if (cabinetId && documentData.cabinetId && documentData.cabinetId !== cabinetId) {
        throw new https_1.HttpsError('permission-denied', 'Acces interdit a ce document.');
    }
    const existingInvoiceSnap = await db
        .collection('invoices')
        .where('documentId', '==', documentId)
        .limit(1)
        .get();
    if (!existingInvoiceSnap.empty) {
        return existingInvoiceSnap.docs[0].id;
    }
    const clientSnap = await db.collection('clients').doc(clientId).get();
    if (!clientSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Client introuvable.');
    }
    const clientData = clientSnap.data() || {};
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const invoiceRef = await db.collection('invoices').add({
        clientId,
        clientName: typeof clientData.name === 'string' ? clientData.name : 'Client',
        cabinetId: cabinetId || clientData.cabinetId || documentData.cabinetId || null,
        documentId,
        number: `INV-${Date.now()}`,
        date: now.toISOString(),
        dueDate: dueDate.toISOString(),
        amount: 0.50,
        status: 'pending',
        createdAt: now.toISOString(),
        source: 'document-processing',
    });
    return invoiceRef.id;
}
function buildMockBankTransactions() {
    const baseDate = new Date();
    baseDate.setHours(12, 0, 0, 0);
    const rows = [
        { offset: 8, description: 'Amazon.fr Prime', amount: -14.99 },
        { offset: 7, description: 'Virement Client 4589', amount: 1250.00 },
        { offset: 6, description: 'Facture EDF Pro', amount: -245.50 },
        { offset: 5, description: 'Orange Communications', amount: -49.90 },
        { offset: 4, description: 'Station Service Total', amount: -75.00 },
        { offset: 3, description: 'URSSAF Cotisations', amount: -890.00 },
        { offset: 2, description: 'Adobe Systems Inc', amount: -65.99 },
        { offset: 1, description: 'Loyer Bureau', amount: -1500.00 },
        { offset: 0, description: 'Remboursement Assurance', amount: 45.00 },
    ];
    return rows.map((row) => {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() - row.offset);
        return {
            date: date.toISOString().slice(0, 10),
            description: row.description,
            amount: row.amount,
        };
    });
}
async function generateIntelligentSearchCriteria(queryText, currentDate) {
    const { genkit, z } = await import('genkit');
    const { googleAI } = await import('@genkit-ai/google-genai');
    const ai = genkit({
        plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    });
    const outputSchema = z.object({
        documentTypes: z.array(z.string()).optional().describe('Types de documents a rechercher: invoice, receipt, bank statement, etc.'),
        startDate: z.string().optional().describe('Date de debut au format YYYY-MM-DD.'),
        endDate: z.string().optional().describe('Date de fin au format YYYY-MM-DD.'),
        minAmount: z.number().optional().describe('Montant minimum.'),
        maxAmount: z.number().optional().describe('Montant maximum.'),
        vendor: z.string().optional().describe('Nom du fournisseur ou vendeur.'),
        keywords: z.array(z.string()).optional().describe('Mots cles utiles pour une recherche texte.'),
        originalQuery: z.string().describe('Requete utilisateur originale.'),
    });
    const { output } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash'),
        prompt: `Tu es un interpreteur expert de requetes de recherche pour une application de gestion de documents comptables.
Convertis la requete utilisateur en objet JSON structure.

Date du jour: ${currentDate}
Requete utilisateur: "${queryText}"

Regles:
- Identifie les types de documents: facture -> invoice, recu/ticket -> receipt, releve bancaire -> bank statement.
- Convertis les periodes relatives ou explicites en startDate/endDate au format YYYY-MM-DD.
- Detecte les montants: plus de, moins de, entre.
- Detecte un fournisseur ou vendeur si la requete en mentionne un.
- Place les autres termes utiles dans keywords.
- Retourne toujours originalQuery avec la requete originale.
- Omets les champs non presents.`,
        output: {
            schema: outputSchema,
        },
        config: {
            temperature: 0.1,
        },
    });
    return Object.assign(Object.assign({}, (output || {})), { originalQuery: (output === null || output === void 0 ? void 0 : output.originalQuery) || queryText });
}
exports.searchCompany = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const query = normalizeCompanySearchQuery((_a = request.data) === null || _a === void 0 ? void 0 : _a.query);
        const results = await searchFrenchCompanies(query);
        return { results };
    }
    catch (error) {
        throwCallableError(error, 'searchCompany failed');
    }
});
exports.extractClientData = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const searchTerm = normalizeCompanySearchQuery((_a = request.data) === null || _a === void 0 ? void 0 : _a.searchTerm);
        const [bestMatch] = await searchFrenchCompanies(searchTerm);
        if (!bestMatch) {
            return {
                name: null,
                siret: null,
                email: null,
                phone: null,
                legalRepresentative: null,
                address: null,
                fiscalYearEndDate: null,
            };
        }
        return {
            name: bestMatch.name,
            siret: bestMatch.siret,
            email: null,
            phone: null,
            legalRepresentative: bestMatch.legalRepresentative,
            address: bestMatch.address,
            fiscalYearEndDate: null,
        };
    }
    catch (error) {
        throwCallableError(error, 'extractClientData failed');
    }
});
exports.getBankAuthLink = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = normalizeClientId((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId);
        const cabinetId = normalizeOptionalCabinetId((_b = request.data) === null || _b === void 0 ? void 0 : _b.cabinetId);
        const { targetCabinetId } = await assertBankAccess(request.auth, clientId, cabinetId);
        const token = (0, crypto_1.randomBytes)(8).toString('base64url');
        const mockAuthUrl = `https://ob.nordigen.com/psd2/start/mock-auth-${token}`;
        logger.info('Mock bank auth link generated', {
            clientId,
            cabinetId: targetCabinetId || cabinetId || null,
            callerUid: request.auth.uid,
        });
        return { success: true, url: mockAuthUrl };
    }
    catch (error) {
        throwCallableError(error, 'getBankAuthLink failed');
    }
});
exports.finalizeBankConnection = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a, _b, _c;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = normalizeClientId((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId);
        const cabinetId = normalizeOptionalCabinetId((_b = request.data) === null || _b === void 0 ? void 0 : _b.cabinetId);
        const requisitionId = normalizeRequisitionId((_c = request.data) === null || _c === void 0 ? void 0 : _c.requisitionId);
        const { targetCabinetId } = await assertBankAccess(request.auth, clientId, cabinetId);
        const resolvedCabinetId = targetCabinetId || cabinetId || null;
        const db = getDb();
        const connectionRef = await db.collection('bank_connections').add({
            clientId,
            cabinetId: resolvedCabinetId,
            requisitionId,
            status: 'active',
            institutionId: 'SANDBOX_FINANCE',
            institutionName: 'Banque de Demonstration',
            lastSync: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: request.auth.uid,
        });
        await db.collection('clients').doc(clientId).update({
            hasBankConnected: true,
            lastBankConnectionId: connectionRef.id,
        });
        return { success: true, connectionId: connectionRef.id };
    }
    catch (error) {
        throwCallableError(error, 'finalizeBankConnection failed');
    }
});
exports.syncBankTransactions = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = normalizeClientId((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId);
        await assertBankAccess(request.auth, clientId);
        return {
            success: true,
            transactions: buildMockBankTransactions(),
        };
    }
    catch (error) {
        throwCallableError(error, 'syncBankTransactions failed');
    }
});
exports.createInvoiceForDocument = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = typeof ((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId) === 'string' ? request.data.clientId.trim() : '';
        if (!clientId) {
            throw new https_1.HttpsError('invalid-argument', 'Client obligatoire.');
        }
        const documentId = normalizeDocumentId((_b = request.data) === null || _b === void 0 ? void 0 : _b.documentId);
        const { targetCabinetId } = await assertInvoiceCreationAccess(request.auth, clientId);
        const invoiceId = await createProcessingInvoiceForDocument(clientId, documentId, targetCabinetId);
        return { success: true, id: invoiceId };
    }
    catch (error) {
        throwCallableError(error, 'createInvoiceForDocument failed');
    }
});
exports.intelligentSearch = (0, https_1.onCall)({ region: 'europe-west9', memory: '512MiB', timeoutSeconds: 60, secrets: ['GEMINI_API_KEY'] }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const queryText = normalizeIntelligentSearchQuery((_a = request.data) === null || _a === void 0 ? void 0 : _a.query);
        const currentDate = normalizeIsoDate((_b = request.data) === null || _b === void 0 ? void 0 : _b.currentDate);
        const criteria = await generateIntelligentSearchCriteria(queryText, currentDate);
        return criteria;
    }
    catch (error) {
        throwCallableError(error, 'intelligentSearch failed');
    }
});
exports.runBankReconciliation = (0, https_1.onCall)({ region: 'europe-west9', memory: '512MiB', timeoutSeconds: 120, secrets: ['GEMINI_API_KEY'] }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = typeof ((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId) === 'string' ? request.data.clientId.trim() : '';
        if (!clientId) {
            throw new https_1.HttpsError('invalid-argument', 'Client obligatoire.');
        }
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId, ['admin', 'accountant', 'secretary']);
        const transactions = normalizeBankTransactions((_b = request.data) === null || _b === void 0 ? void 0 : _b.transactions);
        const invoices = await loadApprovedInvoicesForReconciliation(clientId, targetCabinetId);
        const result = await generateBankReconciliation(transactions, invoices);
        return Object.assign({ success: true }, result);
    }
    catch (error) {
        throwCallableError(error, 'runBankReconciliation failed');
    }
});
exports.saveBankReconciliation = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = typeof ((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId) === 'string' ? request.data.clientId.trim() : '';
        if (!clientId) {
            throw new https_1.HttpsError('invalid-argument', 'Client obligatoire.');
        }
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId, ['admin', 'accountant', 'secretary']);
        const docRef = await getDb().collection('reconciliations').add({
            clientId,
            cabinetId: targetCabinetId || null,
            clientName: typeof ((_b = request.data) === null || _b === void 0 ? void 0 : _b.clientName) === 'string' ? request.data.clientName : '',
            summary: typeof ((_c = request.data) === null || _c === void 0 ? void 0 : _c.summary) === 'object' && request.data.summary !== null ? request.data.summary : {},
            matches: Array.isArray((_d = request.data) === null || _d === void 0 ? void 0 : _d.matches) ? request.data.matches.slice(0, 500) : [],
            anomalies: Array.isArray((_e = request.data) === null || _e === void 0 ? void 0 : _e.anomalies) ? request.data.anomalies.slice(0, 500) : [],
            createdAt: new Date().toISOString(),
            createdBy: request.auth.uid,
            status: 'completed',
        });
        return { success: true, id: docRef.id };
    }
    catch (error) {
        throwCallableError(error, 'saveBankReconciliation failed');
    }
});
exports.runGhostHunter = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const clientId = typeof ((_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId) === 'string' ? request.data.clientId.trim() : '';
        if (!clientId) {
            throw new https_1.HttpsError('invalid-argument', 'Client obligatoire.');
        }
        await assertClientCabinetAccess(request.auth, clientId, ['admin', 'accountant', 'secretary']);
        // 1. Récupération des transactions bancaires
        const transactions = buildMockBankTransactions();
        // 2. Lecture des rapprochements existants
        const reconciliationsSnap = await getDb().collection('reconciliations')
            .where('clientId', '==', clientId)
            .get();
        const reconciledIndices = new Set();
        reconciliationsSnap.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.matches)) {
                data.matches.forEach((m) => {
                    if (typeof m.transactionIndex === 'number') {
                        reconciledIndices.add(m.transactionIndex);
                    }
                });
            }
        });
        // 3. Détection des dépenses non rapprochées
        const missingDocuments = [];
        transactions.forEach((tx, index) => {
            // tx.amount est négatif pour les dépenses
            if (tx.amount < 0 && !reconciledIndices.has(index)) {
                // Filtre : exclure les virements internes
                if (!tx.description.toLowerCase().includes('virement interne')) {
                    missingDocuments.push(Object.assign(Object.assign({}, tx), { transactionIndex: index, status: 'missing', identifiedAt: new Date().toISOString() }));
                }
            }
        });
        // 4. Sauvegarde dans une collection dédiée pour le client
        await getDb().collection('missing_documents').doc(clientId).set({
            clientId,
            items: missingDocuments,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.log(`👻 [GhostHunter] ${missingDocuments.length} justificatifs manquants identifiés pour ${clientId}`);
        return { success: true, count: missingDocuments.length, items: missingDocuments };
    }
    catch (error) {
        throwCallableError(error, 'runGhostHunter failed');
    }
});
exports.supportChat = (0, https_1.onCall)({ region: 'europe-west9', memory: '512MiB', timeoutSeconds: 60, secrets: ['GEMINI_API_KEY'] }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    try {
        const history = normalizeSupportChatHistory((_a = request.data) === null || _a === void 0 ? void 0 : _a.history);
        let financialContext = '';
        if (typeof ((_b = request.data) === null || _b === void 0 ? void 0 : _b.clientId) === 'string' && request.data.clientId.trim() !== '') {
            const clientId = request.data.clientId.trim();
            const db = getDb();
            const snapshot = await db.collection('documents')
                .where('clientId', '==', clientId)
                .where('status', '==', 'approved')
                .get();
            let totalSpent = 0;
            let totalVat = 0;
            const vendors = {};
            const categories = {};
            const months = {};
            snapshot.docs.forEach(docSnap => {
                var _a, _b, _c, _d, _e;
                const data = docSnap.data();
                const amounts = ((_a = data.extractedData) === null || _a === void 0 ? void 0 : _a.amounts) || [];
                const vat = ((_b = data.extractedData) === null || _b === void 0 ? void 0 : _b.vatAmount) || 0;
                const vendor = (((_c = data.extractedData) === null || _c === void 0 ? void 0 : _c.vendorNames) || [])[0] || 'Inconnu';
                const category = ((_d = data.extractedData) === null || _d === void 0 ? void 0 : _d.category) || 'Autre';
                const rawDate = (((_e = data.extractedData) === null || _e === void 0 ? void 0 : _e.dates) || [])[0];
                const amount = amounts.reduce((a, b) => a + b, 0);
                totalSpent += amount;
                totalVat += vat;
                vendors[vendor] = (vendors[vendor] || 0) + amount;
                categories[category] = (categories[category] || 0) + amount;
                if (rawDate) {
                    const dateObj = new Date(rawDate);
                    if (!isNaN(dateObj.getTime())) {
                        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                        months[monthKey] = (months[monthKey] || 0) + amount;
                    }
                }
            });
            const topVendors = Object.entries(vendors)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, val]) => `${name} (${val.toFixed(2)} €)`);
            const categoryList = Object.entries(categories)
                .sort((a, b) => b[1] - a[1])
                .map(([name, val]) => `${name} (${val.toFixed(2)} €)`);
            const monthlyEvolution = Object.entries(months)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, val]) => `${name} : ${val.toFixed(2)} €`);
            financialContext = `
Nombre de documents approuvés: ${snapshot.docs.length}
Total des dépenses TTC: ${totalSpent.toFixed(2)} €
TVA Déductible totale: ${totalVat.toFixed(2)} €
Top Fournisseurs: ${topVendors.length > 0 ? topVendors.join(', ') : 'Aucun'}
Répartition par catégories:
${categoryList.length > 0 ? categoryList.join('\n') : 'Aucune'}
Évolution mensuelle des dépenses:
${monthlyEvolution.length > 0 ? monthlyEvolution.join('\n') : 'Aucune'}
`;
        }
        const response = await generateSupportChatAnswer(history, financialContext);
        return { response };
    }
    catch (error) {
        throwCallableError(error, 'supportChat failed');
    }
});
// type AnalyzeMailOutput = z.infer<typeof analyzeMailOutputSchema>;
// --- Fonction Cloud ---
exports.handleNewMailUpload = (0, storage_1.onObjectFinalized)({
    cpu: 2,
    memory: "1GiB",
    region: "europe-west9",
    secrets: ["GEMINI_API_KEY"]
}, async (event) => {
    var _a, _b, _c;
    const filePath = (_a = event.data.name) !== null && _a !== void 0 ? _a : "";
    const contentType = (_b = event.data.contentType) !== null && _b !== void 0 ? _b : "";
    const fileBucket = event.bucket;
    if (!filePath || !contentType || !filePath.startsWith("mails/")) {
        logger.log(`Fichier ignorÃ© (pas dans le dossier mails): ${filePath}`);
        return;
    }
    const pathParts = filePath.split("/");
    if (pathParts.length < 3) { // expecting mails/{uid}/{mailId}/...
        logger.error(`Format de chemin invalide pour un e-mail: ${filePath}`);
        return;
    }
    const clientUid = pathParts[1];
    const mailId = pathParts[2];
    const mailDocRef = getDb().collection("mails").doc(mailId);
    const clientSnap = await getDb().collection("clients").doc(clientUid).get();
    if (!clientSnap.exists) {
        logger.error(`Client introuvable pour l'import mail: ${clientUid}`);
        return;
    }
    const clientCabinetId = ((_c = clientSnap.data()) === null || _c === void 0 ? void 0 : _c.cabinetId) || "";
    logger.log(`ðŸŸ¢ DÃ©but du traitement : mailId=${mailId}, clientUid=${clientUid}, filePath=${filePath}`);
    try {
        // --- SchÃ©ma Zod ---
        const { z } = await import('genkit');
        const analyzeMailOutputSchema = z.object({
            sender: z.string().describe("L'expÃ©diteur du document, par exemple 'EDF', 'Orange', 'Impots.gouv.fr'."),
            summary: z.string().describe("Un rÃ©sumÃ© concis en une phrase du contenu principal du document."),
            category: z.enum([
                "Facture",
                "PublicitÃ©",
                "Banque",
                "Juridique",
                "Personnel",
                "Autre",
            ]).describe("La catÃ©gorie la plus appropriÃ©e pour ce document."),
            actionRequired: z.boolean().describe("True si le document semble nÃ©cessiter une action (paiement, rÃ©ponse, etc.), sinon False."),
            extractedData: z
                .object({
                amountDue: z.number().optional().describe("Le montant total TTC Ã  payer s'il est clairement indiquÃ©."),
                taxAmount: z.number().optional().describe("Le montant total de la TVA s'il est clairement indiquÃ©."),
                dueDate: z.string().optional().describe("La date d'Ã©chÃ©ance du paiement au format AAAA-MM-JJ, si elle est clairement indiquÃ©e."),
            })
                .optional(),
            accountingEntry: z.object({
                debitAccount: z.string().optional().describe("Le compte de classe 6 (ex: 606100, 626000, 606400)."),
                creditAccount: z.string().optional().describe("Le compte de classe 4 (ex: 401000 Fournisseurs)."),
                vatAccount: z.string().optional().describe("Le compte de TVA (ex: 445660 TVA dÃ©ductible)."),
                confidenceScore: z.number().min(1).max(100).describe("Niveau de certitude de l'attribution (1 Ã  100).")
            }).optional().describe("Proposition d'imputation comptable automatique basÃ©e sur le PCG FranÃ§ais.")
        });
        // --- Initialisation Genkit au runtime ---
        const { genkit } = await import('genkit');
        const { googleAI } = await import('@genkit-ai/google-genai');
        const ai = genkit({
            plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
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
        logger.log(`Ã‰tape 1 : Analyse multimodale structurÃ©e (One-Shot) via Gemini (${contentType})`);
        const documentUri = `data:${contentType};base64,${fileBuffer.toString("base64")}`;
        const { output } = await ai.generate({
            model: googleAI.model("gemini-2.5-flash"),
            prompt: [
                { text: `Tu es un Expert-Comptable FranÃ§ais implacable. Analyse la facture ou le reÃ§u en piÃ¨ce jointe.
1. Extraie les informations clÃ©s : ExpÃ©diteur, rÃ©sumÃ©, montants TTC et montants de TVA.
2. Effectue une auto-imputation comptable en te basant stricto-sensu sur le Plan Comptable GÃ©nÃ©ral (PCG) :
   - Au CRÃ‰DIT : 401000 (Fournisseurs).
   - Au DÃ‰BIT (TVA) : 445660 (TVA DÃ©ductible sur autres biens et services).
   - Au DÃ‰BIT (Charge) : Choisis le compte le plus appropriÃ© parmi la liste suivante selon la nature de l'achat :
     * 606100 : Fournitures non stockables (Eau, Ã‰nergie, EDF, Engie...)
     * 606400 : Fournitures de bureau (Papeterie, Cartouches d'encre...)
     * 613200 : Locations immobiliÃ¨res (Loyer)
     * 615000 : Entretien et rÃ©parations
     * 616000 : Primes d'assurances
     * 622600 : Honoraires (Avocat, Expert-comptable, Conseil, Freelance...)
     * 623000 : PublicitÃ©, publications, relations publiques (Google Ads, Facebook Ads)
     * 625100 : Voyages et dÃ©placements (SNCF, Billet d'avion, Uber...)
     * 625600 : Missions et rÃ©ceptions (Restaurant, Repas d'affaires...)
     * 626000 : Frais postaux et tÃ©lÃ©communications (Orange, Free, SFR, Bouygues, La Poste...)
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
        if (!output)
            throw new Error("L'analyse IA a retournÃ© une sortie vide.");
        const validation = analyzeMailOutputSchema.safeParse(output);
        if (!validation.success) {
            logger.error("RÃ©sultat IA invalide :", validation.error.issues);
            throw new Error("Le JSON retournÃ© par Gemini ne respecte pas le schÃ©ma attendu.");
        }
        const analysisResult = validation.data;
        logger.log("âœ… Analyse IA rÃ©ussie :", analysisResult);
        // --- Firestore ---
        await mailDocRef.set({
            status: analysisResult.actionRequired ? "Urgent" : "Nouveau",
            analysis: analysisResult,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            clientId: clientUid,
            cabinetId: clientCabinetId,
        }, { merge: true });
        // --- New : Unified Workflow ---
        // Si c'est une facture, on l'ajoute automatiquement Ã  la file d'attente comptable
        if (analysisResult.category === "Facture") {
            const docId = getDb().collection("documents").doc().id;
            await getDb().collection("documents").doc(docId).set({
                clientId: clientUid,
                name: `Mail: ${analysisResult.sender}`,
                status: "pending",
                cabinetId: clientCabinetId,
                storagePath: filePath, // RÃ©utilisation du fichier uploadÃ©
                uploadDate: new Date().toISOString(),
                source: "email",
                mailRef: mailId,
                auditTrail: [{
                        action: "Import automatique depuis la boÃ®te mail (Mail-to-Box)",
                        date: new Date().toISOString(),
                        user: "SystÃ¨me Mail"
                    }]
            });
            logger.log(`ðŸš€ [Unified Workflow] Document crÃ©Ã© pour la comptabilitÃ© : docId=${docId}`);
        }
        logger.log(`ðŸ“„ Firestore mis Ã  jour (Mails) : mailId=${mailId}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue pendant le traitement.";
        logger.error(`âŒ Ã‰chec traitement mailId=${mailId} : ${errorMessage}`);
        await mailDocRef.set({
            status: "Erreur d'analyse",
            analysis: { error: errorMessage },
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
});
// --- ðŸŽ¯ PHASE 2.2 : WEBHOOK MAIL-TO-BOX (Ingestion via E-mail) --- //
// Service d'ingestion recommandÃ© : Postmark Inbound Webhook (JSON pur, pas de mutipart/form-data complexe)
exports.inboundEmailWebhook = (0, https_1.onRequest)({ region: "europe-west9", memory: "256MiB", maxInstances: 10 }, async (req, res) => {
    // 1. Authentification trÃ¨s stricte du Webhook
    const expectedToken = process.env.INBOUND_EMAIL_TOKEN;
    const headerToken = req.headers['x-ccscompta-token'];
    const token = Array.isArray(headerToken) ? headerToken[0] : headerToken;
    if (!expectedToken) {
        logger.error("INBOUND_EMAIL_TOKEN non configure.");
        res.status(503).send("Webhook not configured");
        return;
    }
    const isAuthorized = typeof token === 'string'
        && token.length === expectedToken.length
        && (0, crypto_1.timingSafeEqual)(Buffer.from(token), Buffer.from(expectedToken));
    if (!isAuthorized) {
        logger.warn(`Tentative de webhook non autorisÃ©e depuis ${req.ip}`);
        res.status(401).send("Unauthorized");
        return;
    }
    try {
        const { z } = await import('genkit');
        const postmarkInboundSchema = z.object({
            From: z.string(),
            To: z.string(),
            Subject: z.string().optional(),
            Attachments: z.array(z.object({
                Name: z.string(),
                Content: z.string(), // Base64 encodÃ©
                ContentType: z.string()
            })).optional()
        }).passthrough();
        const payload = postmarkInboundSchema.parse(req.body);
        logger.log(`ðŸ“¥ [Mail-to-Box] E-mail reÃ§u de: ${payload.From} Ã  ${payload.To}`);
        if (!payload.Attachments || payload.Attachments.length === 0) {
            logger.log("Aucune piÃ¨ce jointe trouvÃ©e. E-mail ignorÃ©.");
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
        const bucket = admin.storage().bucket();
        const mailId = admin.firestore().collection("mails").doc().id;
        logger.log(`UID Client identifiÃ© : ${clientUid}. Traitement de ${payload.Attachments.length} piÃ¨ce(s) jointe(s).`);
        // 3. Boucle sur les piÃ¨ces jointes et auto-upload vers le Cloud Storage
        let uploadedCount = 0;
        for (const attachment of payload.Attachments) {
            // SÃ©curitÃ© & Filtrage : On n'accepte que les PDFs et les Images factures
            if (!attachment.ContentType.includes("pdf") && !attachment.ContentType.includes("image")) {
                logger.log(`Type ignorÃ© : ${attachment.ContentType} (${attachment.Name})`);
                continue;
            }
            const buffer = Buffer.from(attachment.Content, "base64");
            // SÃ©curisation du nom de fichier
            const sanitizedName = attachment.Name.replace(/[^a-zA-Z0-9_\-\.]/g, '');
            // Ce chemin exact dÃ©clenchera la fonction handleNewMailUpload instantanÃ©ment !
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
            logger.log(`âœ… [Mail-to-Box] Injection rÃ©ussie : ${filePath}`);
            uploadedCount++;
        }
        res.status(200).send(`Success: uploaded ${uploadedCount} documents.`);
    }
    catch (err) {
        logger.error("Erreur Webhook Mail-to-Box : " + err);
        res.status(500).send("Internal Webhook Error");
    }
});
// --- ðŸŽ¯ ADMINISTRATION : Gestion des RÃ´les & Utilisateurs (v2) --- //
/**
 * DÃ©finit l'utilisateur actuel comme administrateur (setup initial).
 * Version robuste : crÃ©e le profil s'il n'existe pas et vÃ©rifie l'email.
 */
exports.syncAdminRole = (0, https_1.onCall)({ region: "europe-west9", memory: "256MiB" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const { uid, token } = request.auth;
    const email = token.email;
    const ADMIN_EMAILS = ['app.ccs94@gmail.com'];
    if (!ADMIN_EMAILS.includes(email)) {
        throw new https_1.HttpsError('permission-denied', 'Email non autorisÃ©.');
    }
    try {
        console.log(`Phase 1: Custom Claims pour ${email}...`);
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
        console.log(`Phase 2: Firestore pour ${uid}...`);
        await admin.firestore().collection('clients').doc(uid).set({
            role: 'admin',
            lastSync: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`âœ… SuccÃ¨s total pour ${email}`);
        return { success: true, message: "Super Admin activÃ©." };
    }
    catch (error) {
        console.error("âŒ Erreur de synchro:", error);
        throw new https_1.HttpsError('internal', error.message);
    }
});
exports.createUserWithRole = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const auth = request.auth;
    const callingUserRole = getCallerRole(auth);
    const targetRole = request.data.role || 'client';
    if (!['admin', 'accountant', 'secretary', 'client'].includes(targetRole)) {
        throw new https_1.HttpsError('invalid-argument', 'Role cible invalide.');
    }
    // Hierarchie de securite: seules les custom claims font autorite.
    if (!['admin', 'accountant', 'secretary'].includes(callingUserRole)) {
        throw new https_1.HttpsError('permission-denied', 'Role non autorise pour creer un compte.');
    }
    if (callingUserRole === 'secretary' && targetRole !== 'client') {
        throw new https_1.HttpsError('permission-denied', 'Un secrÃ©taire ne peut crÃ©er que des comptes clients.');
    }
    if (callingUserRole === 'accountant' && !['accountant', 'secretary', 'client'].includes(targetRole)) {
        throw new https_1.HttpsError('permission-denied', 'Un comptable ne peut pas crÃ©er d\'administrateur systÃ¨me.');
    }
    const { email } = request.data;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'Email requis.');
    }
    try {
        const profileDataClean = Object.assign({}, request.data);
        delete profileDataClean.email;
        delete profileDataClean.password;
        delete profileDataClean.role;
        let targetCabinetId = typeof profileDataClean.cabinetId === 'string'
            ? profileDataClean.cabinetId
            : undefined;
        if (targetRole === 'admin') {
            if (callingUserRole !== 'admin') {
                throw new https_1.HttpsError('permission-denied', 'Seul un administrateur systeme peut creer un administrateur.');
            }
            delete profileDataClean.cabinetId;
            delete profileDataClean.isCabinetAdmin;
            targetCabinetId = undefined;
        }
        else if (callingUserRole !== 'admin') {
            const callerCabinetId = getCallerCabinetId(auth);
            if (!callerCabinetId) {
                throw new https_1.HttpsError('failed-precondition', 'Votre compte n est rattache a aucun cabinet.');
            }
            if (targetCabinetId && targetCabinetId !== callerCabinetId) {
                throw new https_1.HttpsError('permission-denied', 'Creation interdite hors de votre cabinet.');
            }
            targetCabinetId = callerCabinetId;
            profileDataClean.cabinetId = callerCabinetId;
            delete profileDataClean.isCabinetAdmin;
        }
        else if (!targetCabinetId) {
            throw new https_1.HttpsError('invalid-argument', 'cabinetId requis pour un compte cabinet ou client.');
        }
        const temporaryPassword = generateTemporaryPassword();
        const userRecord = await admin.auth().createUser({
            email,
            password: temporaryPassword,
            displayName: profileDataClean.name,
            emailVerified: false
        });
        const uid = userRecord.uid;
        const role = targetRole;
        const claims = { role };
        if (targetCabinetId) {
            claims.cabinetId = targetCabinetId;
        }
        await admin.auth().setCustomUserClaims(uid, claims);
        await getDb().collection('clients').doc(uid).set(Object.assign(Object.assign({}, profileDataClean), { email,
            role, newDocuments: 0, lastActivity: new Date().toISOString(), status: 'onboarding', createdBy: auth.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        let setupLink;
        let emailQueued = false;
        try {
            setupLink = await admin.auth().generatePasswordResetLink(email, {
                url: getAccountSetupUrl(),
                handleCodeInApp: false,
            });
        }
        catch (linkError) {
            logger.error(`Impossible de generer le lien d activation pour ${email}`, linkError);
        }
        if (setupLink) {
            try {
                await queueUserSetupEmail({
                    uid,
                    name: profileDataClean.name,
                    email,
                    role,
                    cabinetId: targetCabinetId,
                    setupLink,
                });
                emailQueued = true;
            }
            catch (mailError) {
                logger.error(`Impossible de mettre en file l email d activation pour ${email}`, mailError);
            }
        }
        logger.info(`Utilisateur ${uid} crÃ©Ã© avec le rÃ´le : ${role}`);
        return {
            success: true,
            uid,
            setupLink,
            emailQueued,
            message: setupLink
                ? (emailQueued ? 'Utilisateur cree. Email d activation envoye.' : 'Utilisateur cree. Lien d activation genere mais email non envoye.')
                : 'Utilisateur cree. Le lien d activation devra etre regenere.',
        };
    }
    catch (error) {
        logger.error('Erreur lors de la crÃ©ation de l\'utilisateur:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        if (error.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'Cet email est dÃ©jÃ  utilisÃ© par un autre compte.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new https_1.HttpsError('invalid-argument', 'L\'adresse email fournie est invalide.');
        }
        if (error.code === 'auth/weak-password') {
            throw new https_1.HttpsError('invalid-argument', 'Le mot de passe fourni est trop faible. Il doit contenir au moins 6 caractÃ¨res.');
        }
        throw new https_1.HttpsError('internal', "Erreur lors de la crÃ©ation du compte : " + error.message, error.message);
    }
});
exports.sendUserSetupEmail = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const clientId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.clientId;
    if (typeof clientId !== 'string' || !clientId.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'clientId requis.');
    }
    try {
        const { targetClient, targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId, ['admin', 'accountant', 'secretary']);
        if (targetClient.role !== 'client') {
            throw new https_1.HttpsError('failed-precondition', 'Le renvoi d acces est reserve aux comptes clients.');
        }
        const email = String(targetClient.email || '').trim().toLowerCase();
        if (!email) {
            throw new https_1.HttpsError('failed-precondition', 'Ce client n a pas d email de connexion.');
        }
        await admin.auth().getUser(clientId);
        const setupLink = await admin.auth().generatePasswordResetLink(email, {
            url: getAccountSetupUrl(),
            handleCodeInApp: false,
        });
        await queueUserSetupEmail({
            uid: clientId,
            name: targetClient.name,
            email,
            role: 'client',
            cabinetId: targetCabinetId,
            setupLink,
        });
        await getDb().collection('clients').doc(clientId).set({
            setupEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: targetClient.status === 'inactive' ? targetClient.status : 'onboarding',
        }, { merge: true });
        logger.info(`Email d activation client ${clientId} mis en file pour ${email}`);
        return {
            success: true,
            setupLink,
            emailQueued: true,
        };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            throw new https_1.HttpsError('failed-precondition', 'Le compte Auth de ce client est introuvable.');
        }
        throwCallableError(error, 'Erreur sendUserSetupEmail:');
    }
});
/**
 * Prepare un lien d'invitation cabinet signe et expirant.
 */
exports.prepareCabinetInvitation = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    if (getCallerRole(request.auth) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Seul un administrateur systeme peut inviter un cabinet.');
    }
    const cabinetId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.cabinetId;
    if (typeof cabinetId !== 'string' || !cabinetId.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'cabinetId requis.');
    }
    try {
        const cabinetRef = getDb().collection('cabinets').doc(cabinetId);
        const cabinetSnap = await cabinetRef.get();
        if (!cabinetSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Cabinet introuvable.');
        }
        const cabinetData = cabinetSnap.data();
        if ((cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationStatus) === 'accepted') {
            throw new https_1.HttpsError('failed-precondition', 'Ce cabinet est deja configure.');
        }
        if (!(cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.email)) {
            throw new https_1.HttpsError('failed-precondition', 'Ce cabinet n a pas d email de contact.');
        }
        const token = generateInvitationToken();
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        await cabinetRef.update({
            invitationTokenHash: hashInvitationToken(token),
            invitationExpiresAt: expiresAt,
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            invitationStatus: 'pending',
            invitedBy: request.auth.uid,
        });
        return {
            success: true,
            invitationUrl: buildCabinetOnboardingUrl(cabinetId, token),
            expiresAt: expiresAt.toDate().toISOString(),
        };
    }
    catch (error) {
        throwCallableError(error, 'Erreur prepareCabinetInvitation:');
    }
});
/**
 * Cree un cabinet depuis le super admin et envoie immediatement le lien d'activation.
 */
exports.createCabinetWithInvitation = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    if (getCallerRole(request.auth) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Seul un administrateur systeme peut creer un cabinet.');
    }
    const name = String(((_a = request.data) === null || _a === void 0 ? void 0 : _a.name) || '').trim();
    const email = String(((_b = request.data) === null || _b === void 0 ? void 0 : _b.email) || '').trim().toLowerCase();
    const plan = String(((_c = request.data) === null || _c === void 0 ? void 0 : _c.plan) || 'starter');
    const allowedPlans = ['starter', 'professional', 'enterprise', 'elite'];
    if (!name) {
        throw new https_1.HttpsError('invalid-argument', 'Nom du cabinet requis.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new https_1.HttpsError('invalid-argument', 'Email cabinet invalide.');
    }
    if (!allowedPlans.includes(plan)) {
        throw new https_1.HttpsError('invalid-argument', 'Plan cabinet invalide.');
    }
    const maxClients = Number(((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.quotas) === null || _e === void 0 ? void 0 : _e.maxClients) || 10);
    const maxDocumentsPerMonth = Number(((_g = (_f = request.data) === null || _f === void 0 ? void 0 : _f.quotas) === null || _g === void 0 ? void 0 : _g.maxDocumentsPerMonth) || 100);
    const maxCollaborators = Number(((_j = (_h = request.data) === null || _h === void 0 ? void 0 : _h.quotas) === null || _j === void 0 ? void 0 : _j.maxCollaborators) || 5);
    const storageLimitGb = Number(((_l = (_k = request.data) === null || _k === void 0 ? void 0 : _k.quotas) === null || _l === void 0 ? void 0 : _l.storageLimitGb) || 5);
    try {
        const duplicateCabinet = await getDb().collection('cabinets').where('email', '==', email).limit(1).get();
        if (!duplicateCabinet.empty) {
            throw new https_1.HttpsError('already-exists', 'Un cabinet utilise deja cet email.');
        }
        const cabinetRef = getDb().collection('cabinets').doc();
        const token = generateInvitationToken();
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const invitationUrl = buildCabinetOnboardingUrl(cabinetRef.id, token);
        await cabinetRef.set({
            id: cabinetRef.id,
            name,
            email,
            plan,
            status: 'active',
            quotas: {
                maxClients,
                maxDocumentsPerMonth,
                maxCollaborators,
                storageLimitGb,
                usedDocumentsMonth: 0,
                usedClients: 0,
            },
            invitationTokenHash: hashInvitationToken(token),
            invitationExpiresAt: expiresAt,
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            invitationStatus: 'pending',
            invitedBy: request.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
        });
        await queueCabinetInvitationEmail({
            id: cabinetRef.id,
            name,
            email,
            invitationUrl,
        });
        logger.info(`Cabinet ${cabinetRef.id} cree et invitation envoyee a ${email}`);
        return {
            success: true,
            cabinetId: cabinetRef.id,
            invitationUrl,
            expiresAt: expiresAt.toDate().toISOString(),
        };
    }
    catch (error) {
        throwCallableError(error, 'Erreur createCabinetWithInvitation:');
    }
});
/**
 * Regenere et envoie le lien d'activation d'un cabinet existant.
 */
exports.sendCabinetInvitation = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    if (getCallerRole(request.auth) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Seul un administrateur systeme peut inviter un cabinet.');
    }
    const cabinetId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.cabinetId;
    if (typeof cabinetId !== 'string' || !cabinetId.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'cabinetId requis.');
    }
    try {
        const cabinetRef = getDb().collection('cabinets').doc(cabinetId);
        const cabinetSnap = await cabinetRef.get();
        if (!cabinetSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Cabinet introuvable.');
        }
        const cabinetData = cabinetSnap.data();
        if ((cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationStatus) === 'accepted') {
            throw new https_1.HttpsError('failed-precondition', 'Ce cabinet est deja configure.');
        }
        if (!(cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.email) || !(cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.name)) {
            throw new https_1.HttpsError('failed-precondition', 'Nom et email cabinet requis.');
        }
        const token = generateInvitationToken();
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        const invitationUrl = buildCabinetOnboardingUrl(cabinetId, token);
        const email = String(cabinetData.email).trim().toLowerCase();
        const name = String(cabinetData.name).trim();
        await cabinetRef.update({
            invitationTokenHash: hashInvitationToken(token),
            invitationExpiresAt: expiresAt,
            invitationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            invitationStatus: 'pending',
            invitedBy: request.auth.uid,
        });
        await queueCabinetInvitationEmail({
            id: cabinetId,
            name,
            email,
            invitationUrl,
        });
        logger.info(`Invitation cabinet ${cabinetId} envoyee a ${email}`);
        return {
            success: true,
            invitationUrl,
            expiresAt: expiresAt.toDate().toISOString(),
        };
    }
    catch (error) {
        throwCallableError(error, 'Erreur sendCabinetInvitation:');
    }
});
/**
 * Verifie un lien d'invitation cabinet sans exposer le document Firestore.
 */
exports.verifyCabinetInvitation = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    const { cabinetId, token } = request.data || {};
    if (!cabinetId || !token) {
        throw new https_1.HttpsError('invalid-argument', 'cabinetId et token requis.');
    }
    try {
        const cabinetSnap = await getDb().collection('cabinets').doc(cabinetId).get();
        if (!cabinetSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Invitation introuvable.');
        }
        const cabinetData = cabinetSnap.data();
        if ((cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationStatus) === 'accepted') {
            return {
                valid: false,
                status: 'accepted',
                name: cabinetData.name,
            };
        }
        if (!(cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationTokenHash) || hashInvitationToken(token) !== cabinetData.invitationTokenHash) {
            throw new https_1.HttpsError('permission-denied', 'Lien d invitation invalide.');
        }
        const expiresAtRaw = cabinetData.invitationExpiresAt;
        const expiresAt = (expiresAtRaw === null || expiresAtRaw === void 0 ? void 0 : expiresAtRaw.toDate) ? expiresAtRaw.toDate() : new Date(expiresAtRaw);
        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
            throw new https_1.HttpsError('deadline-exceeded', 'Ce lien d invitation a expire.');
        }
        return {
            valid: true,
            status: (cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationStatus) || 'pending',
            name: cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.name,
            email: cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.email,
            expiresAt: expiresAt.toISOString(),
        };
    }
    catch (error) {
        throwCallableError(error, 'Erreur verifyCabinetInvitation:');
    }
});
/**
 * Finalise l'onboarding d'un cabinet invitÃ©.
 */
exports.setupInvitedCabinet = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    const { cabinetId, password, email, name, token } = request.data;
    if (!cabinetId || !password || !email || !token) {
        throw new https_1.HttpsError('invalid-argument', 'ParamÃ¨tres manquants.');
    }
    if (typeof password !== 'string' || password.length < 12) {
        throw new https_1.HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 12 caracteres.');
    }
    try {
        // 1. VÃ©rifier que le cabinet existe et est en attente
        const cabinetRef = getDb().collection('cabinets').doc(cabinetId);
        const cabinetSnap = await cabinetRef.get();
        if (!cabinetSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Cabinet introuvable.');
        }
        const cabinetData = cabinetSnap.data();
        if ((cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationStatus) === 'accepted') {
            throw new https_1.HttpsError('already-exists', 'Ce cabinet est dÃ©jÃ  configurÃ©.');
        }
        if (!(cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.invitationTokenHash) || hashInvitationToken(token) !== cabinetData.invitationTokenHash) {
            throw new https_1.HttpsError('permission-denied', 'Lien d invitation invalide.');
        }
        const expiresAtRaw = cabinetData.invitationExpiresAt;
        const expiresAt = (expiresAtRaw === null || expiresAtRaw === void 0 ? void 0 : expiresAtRaw.toDate) ? expiresAtRaw.toDate() : new Date(expiresAtRaw);
        if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
            throw new https_1.HttpsError('deadline-exceeded', 'Ce lien d invitation a expire.');
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const expectedEmail = String(cabinetData.email || '').trim().toLowerCase();
        if (!expectedEmail || normalizedEmail !== expectedEmail) {
            throw new https_1.HttpsError('permission-denied', 'Email non autorise pour cette invitation.');
        }
        // 2. CrÃ©er ou rÃ©cupÃ©rer l'utilisateur Auth
        let uid;
        try {
            const userRecord = await admin.auth().createUser({
                email: normalizedEmail,
                password,
                displayName: name || cabinetData.name,
                emailVerified: true
            });
            uid = userRecord.uid;
        }
        catch (error) {
            if (error.code === 'auth/email-already-exists') {
                const existingUser = await admin.auth().getUserByEmail(normalizedEmail);
                const existingClaims = existingUser.customClaims || {};
                if ((existingClaims.cabinetId && existingClaims.cabinetId !== cabinetId) ||
                    (existingClaims.role && existingClaims.role !== 'accountant')) {
                    throw new https_1.HttpsError('already-exists', 'Cet email est deja rattache a un autre compte.');
                }
                uid = existingUser.uid;
                // SÃ‰CURITÃ‰ : Ne pas rÃ©initialiser le mot de passe d'un utilisateur existant.
                logger.warn(`L'utilisateur ${normalizedEmail} existe dÃ©jÃ . Liaison au cabinet ${cabinetId} sans reset password.`);
            }
            else {
                throw error;
            }
        }
        const role = 'accountant'; // Par dÃ©faut, le crÃ©ateur est le premier comptable admin
        // 3. Custom Claims
        await admin.auth().setCustomUserClaims(uid, { role, cabinetId });
        // 4. Mettre Ã  jour le cabinet
        await cabinetRef.update({
            invitationStatus: 'accepted',
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminUid: uid,
            status: 'active',
            invitationTokenHash: admin.firestore.FieldValue.delete(),
            invitationExpiresAt: admin.firestore.FieldValue.delete(),
            invitationAcceptedEmail: normalizedEmail,
        });
        // 5. CrÃ©er le profil "client" (qui sert de base utilisateur)
        await getDb().collection('clients').doc(uid).set({
            name: name || cabinetData.name,
            email: normalizedEmail,
            role,
            cabinetId,
            isCabinetAdmin: true,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        logger.info(`Cabinet ${cabinetId} activÃ© par ${uid}`);
        return { success: true };
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 'auth/weak-password') {
            throw new https_1.HttpsError('invalid-argument', 'Le mot de passe fourni est trop faible.');
        }
        throwCallableError(error, 'Setup cabinet error:');
    }
});
/**
 * Trigger centralisÃ© pour le traitement IA des documents.
 * Se dÃ©clenche dÃ¨s qu'un document est crÃ©Ã© ou mis Ã  jour avec le statut 'pending'.
 */
exports.onDocumentPending = (0, firestore_1.onDocumentWritten)({
    document: "documents/{docId}",
    region: "europe-west9",
    memory: "1GiB",
    timeoutSeconds: 300,
    secrets: ["GEMINI_API_KEY"]
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    const previousData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
    // On ne traite que si le statut est 'pending' et qu'il ne l'Ã©tait pas dÃ©jÃ  (ou si c'est une crÃ©ation)
    if (!data || data.status !== 'pending' || (previousData && previousData.status === 'pending')) {
        return;
    }
    const docId = event.params.docId;
    const storagePath = data.storagePath;
    const documentType = data.type || 'invoice'; // Par dÃ©faut invoice si non spÃ©cifiÃ©
    logger.log(`ðŸ¤– [Processor] DÃ©but du traitement IA pour le document : ${docId} (Type: ${documentType})`);
    try {
        // 1. Marquer comme en cours de traitement pour Ã©viter les doubles dÃ©clenchements
        await ((_c = event.data) === null || _c === void 0 ? void 0 : _c.after.ref.update({ status: 'processing' }));
        // 2. TÃ©lÃ©charger le contenu depuis Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(storagePath);
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || 'application/pdf';
        const [buffer] = await file.download();
        // 3. Appel du processeur IA (Gemini multimodal)
        const { processDocumentContent, calculateBillableLines } = await import('./document-processor.js');
        const extractedData = await processDocumentContent(buffer, contentType, documentType);
        // 4. DÃ©tection intelligente de doublons (Vendor + Date + Amount)
        let isDuplicate = false;
        let existingId = null;
        const vendor = (_d = extractedData.vendorNames) === null || _d === void 0 ? void 0 : _d[0];
        const date = (_e = extractedData.dates) === null || _e === void 0 ? void 0 : _e[0];
        const amount = (_f = extractedData.amounts) === null || _f === void 0 ? void 0 : _f[0];
        if (vendor && date && amount) {
            // Un seul array-contains autorisÃ© par requÃªte Firestore
            const duplicates = await getDb().collection("documents")
                .where("clientId", "==", data.clientId)
                .where("extractedData.amounts", "array-contains", amount) // Le montant est souvent plus discriminant
                .where("status", "in", ["approved", "reviewing", "exported"])
                .get();
            for (const otherDoc of duplicates.docs) {
                const otherData = otherDoc.data().extractedData;
                if (otherDoc.id !== docId &&
                    ((_g = otherData === null || otherData === void 0 ? void 0 : otherData.vendorNames) === null || _g === void 0 ? void 0 : _g.includes(vendor)) &&
                    ((_h = otherData === null || otherData === void 0 ? void 0 : otherData.dates) === null || _h === void 0 ? void 0 : _h.includes(date))) {
                    isDuplicate = true;
                    existingId = otherDoc.id;
                    break;
                }
            }
        }
        // 4.5. Zéro-Clic (Zero-Touch) : Vérification de la mémoire locale
        let isZeroTouch = false;
        if (vendor && !isDuplicate) {
            const vendorSlug = vendor.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const ruleDoc = await getDb().collection('clients').doc(data.clientId).collection('accounting_rules').doc(vendorSlug).get();
            if (ruleDoc.exists) {
                const rule = ruleDoc.data();
                if (rule && rule.accountingEntry) {
                    extractedData.accountingEntry = Object.assign(Object.assign({}, rule.accountingEntry), { confidenceScore: 100 // Confiance absolue
                     });
                    isZeroTouch = true;
                    logger.log(`⚡ [Zero-Touch] Règle locale appliquée pour ${vendor}`);
                }
            }
        }
        // 5. Calcul de la monetisation (billable lines)
        const billableLines = calculateBillableLines(extractedData, documentType);
        // 6. Mise a jour finale du document
        const finalStatus = isDuplicate ? 'duplicate' : (isZeroTouch ? 'approved' : 'reviewing');
        const auditAction = isDuplicate
            ? `Doublon detecte (ID: ${existingId})`
            : (isZeroTouch ? 'Auto-approbation (Zero-Touch) via Apprentissage Local' : 'Analyse IA automatique terminee');
        const updateData = {
            extractedData,
            billableLines,
            type: extractedData.documentType || documentType,
            status: finalStatus,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            'auditTrail': admin.firestore.FieldValue.arrayUnion({
                action: auditAction,
                date: new Date().toISOString(),
                user: isZeroTouch ? 'Système Zero-Touch' : 'Système AI'
            })
        };
        if (isDuplicate) {
            updateData.anomalies = admin.firestore.FieldValue.arrayUnion("Doublon potentiel détecté : une facture identique existe déjà.");
        }
        await ((_j = event.data) === null || _j === void 0 ? void 0 : _j.after.ref.update(updateData));
        logger.log(`âœ… [Processor] SuccÃ¨s pour ${docId} : ${billableLines} lignes dÃ©tectÃ©es. ${isDuplicate ? '(DOUBLON)' : ''}`);
        // 7. Report usage to Stripe & Update Cabinet Quotas if NOT a duplicate
        if (!isDuplicate) {
            try {
                // RÃ©cupÃ©rer le cabinet liÃ© au client
                const clientDoc = await getDb().collection("clients").doc(data.clientId).get();
                const clientData = clientDoc.data();
                const cabinetId = clientData === null || clientData === void 0 ? void 0 : clientData.cabinetId;
                if (cabinetId) {
                    const cabinetRef = getDb().collection("cabinets").doc(cabinetId);
                    // Mise Ã  jour du quota interne (Firestore)
                    await cabinetRef.update({
                        'quotas.usedDocumentsMonth': admin.firestore.FieldValue.increment(1),
                        'quotas.totalBillableLines': admin.firestore.FieldValue.increment(billableLines)
                    });
                    // Report Ã  Stripe si configurÃ©
                    const cabinetSnap = await cabinetRef.get();
                    const cabinetData = cabinetSnap.data();
                    if (cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.stripeSubscriptionItemId) {
                        logger.log(`ðŸ’³ [Stripe] Reporting usage for cabinet ${cabinetId} : ${billableLines} lines`);
                        const { StripeService } = await import('./stripe.js');
                        await StripeService.reportUsage(cabinetData.stripeSubscriptionItemId, billableLines);
                    }
                }
            }
            catch (billingError) {
                logger.error(`âš ï¸ [Billing] Erreur lors du report de consommation pour ${docId}:`, billingError);
            }
        }
    }
    catch (error) {
        logger.error(`âŒ [Processor] Ã‰chec pour ${docId} :`, error);
        await ((_k = event.data) === null || _k === void 0 ? void 0 : _k.after.ref.update({
            status: 'error',
            'auditTrail': admin.firestore.FieldValue.arrayUnion({
                action: `Erreur d'analyse IA : ${error.message}`,
                date: new Date().toISOString(),
                user: 'SystÃ¨me AI'
            })
        }));
    }
});
/**
 * GÃ©nÃ¨re un lien vers le Portail Client Stripe.
 */
exports.createPortalSession = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Vous devez Ãªtre connectÃ©.');
    }
    const uid = request.auth.uid;
    const clientDoc = await getDb().collection("clients").doc(uid).get();
    const clientData = clientDoc.data();
    if (!(clientData === null || clientData === void 0 ? void 0 : clientData.stripeCustomerId)) {
        throw new https_1.HttpsError('failed-precondition', "Aucun compte client Stripe n'est configurÃ©.");
    }
    try {
        const { StripeService } = await import('./stripe.js');
        const returnUrl = request.data.returnUrl || `${getAppBaseUrl()}/dashboard/settings`;
        const session = await StripeService.createPortalSession(clientData.stripeCustomerId, returnUrl);
        return { url: session.url };
    }
    catch (error) {
        logger.error('Erreur Portail Stripe:', error);
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * GÃ©nÃ¨re un lien Checkout Stripe pour l'abonnement d'un cabinet.
 * (RÃ©servÃ© aux super-admins)
 */
exports.generateCabinetCheckout = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const { cabinetId, priceId } = request.data;
    if (!cabinetId || !priceId) {
        throw new https_1.HttpsError('invalid-argument', 'cabinetId et priceId requis.');
    }
    const callerRole = getCallerRole(request.auth);
    if (callerRole !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Seul l\'administrateur systÃ¨me peut gÃ©nÃ©rer ce lien.');
    }
    const cabinetDoc = await getDb().collection("cabinets").doc(cabinetId).get();
    if (!cabinetDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Cabinet introuvable.');
    }
    const cabinetData = cabinetDoc.data();
    const email = (cabinetData === null || cabinetData === void 0 ? void 0 : cabinetData.email) || request.auth.token.email;
    try {
        const { StripeService } = await import('./stripe.js');
        const successUrl = `${getAppBaseUrl()}/dashboard/admin/subscriptions?success=true`;
        const cancelUrl = `${getAppBaseUrl()}/dashboard/admin/subscriptions?canceled=true`;
        const session = await StripeService.createCheckoutSession(cabinetId, priceId, email, successUrl, cancelUrl);
        return { url: session.url };
    }
    catch (error) {
        logger.error('Erreur Checkout Stripe:', error);
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Webhook Stripe pour Ã©couter les paiements et Ã©vÃ©nements d'abonnement.
 */
exports.stripeWebhook = (0, https_1.onRequest)({ region: "europe-west9" }, async (req, res) => {
    var _a;
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !endpointSecret) {
        logger.error('Webhook secret or signature missing.');
        res.status(400).send('Webhook Error: Missing signature or secret');
        return;
    }
    let event;
    try {
        const { StripeService } = await import('./stripe.js');
        event = StripeService.constructWebhookEvent(req.rawBody, sig, endpointSecret);
    }
    catch (err) {
        logger.error(`Webhook signature verification failed.`, err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const cabinetId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.cabinetId;
                if (cabinetId) {
                    logger.info(`Checkout completed for cabinet ${cabinetId}`);
                    let stripeSubscriptionItemId = null;
                    if (session.subscription) {
                        try {
                            const { StripeService } = await import('./stripe.js');
                            const subscriptionDetails = await StripeService.getSubscription(session.subscription);
                            // Trouver l'item avec un usage "metered" (au compteur)
                            const meteredItem = subscriptionDetails.items.data.find((item) => { var _a; return ((_a = item.price.recurring) === null || _a === void 0 ? void 0 : _a.usage_type) === 'metered'; });
                            if (meteredItem) {
                                stripeSubscriptionItemId = meteredItem.id;
                                logger.info(`Found metered subscription item: ${stripeSubscriptionItemId}`);
                            }
                            else if (subscriptionDetails.items.data.length > 0) {
                                // Fallback: prendre le premier item si la configuration n'est pas explicite
                                stripeSubscriptionItemId = subscriptionDetails.items.data[0].id;
                                logger.info(`No specific metered item found, defaulting to: ${stripeSubscriptionItemId}`);
                            }
                        }
                        catch (e) {
                            logger.error(`Error fetching subscription details: ${e.message}`);
                        }
                    }
                    const updateData = {
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                        status: 'active'
                    };
                    if (stripeSubscriptionItemId) {
                        updateData.stripeSubscriptionItemId = stripeSubscriptionItemId;
                    }
                    await getDb().collection("cabinets").doc(cabinetId).update(updateData);
                    logger.info(`Updated cabinet ${cabinetId} with Stripe details.`);
                }
                break;
            }
            case 'customer.subscription.deleted':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const cabinetsQuery = await getDb().collection("cabinets").where("stripeSubscriptionId", "==", subscription.id).get();
                if (!cabinetsQuery.empty) {
                    const cabinetDoc = cabinetsQuery.docs[0];
                    await cabinetDoc.ref.update({
                        status: subscription.status === 'active' ? 'active' : 'past_due'
                    });
                    logger.info(`Updated cabinet ${cabinetDoc.id} status to ${subscription.status}`);
                }
                break;
            }
            default:
                logger.log(`Unhandled event type ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        logger.error('Error processing webhook:', error);
        res.status(500).send('Webhook processing error');
    }
});
/**
 * Exporte une sÃ©lection de documents au format comptable (FEC ou CSV).
 */
exports.exportDocuments = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Vous devez Ãªtre connectÃ©.');
    }
    const { documentIds, format: exportFormat } = request.data;
    if (!documentIds || !Array.isArray(documentIds)) {
        throw new https_1.HttpsError('invalid-argument', 'Les documentIds doivent Ãªtre fournis sous forme de tableau.');
    }
    const callerUid = request.auth.uid;
    const callerRole = getCallerRole(request.auth);
    const isGlobalAdmin = callerRole === 'admin';
    let callerCabinetId;
    if (!isGlobalAdmin && callerRole !== 'client') {
        callerCabinetId = getCallerCabinetId(request.auth);
    }
    try {
        // 1. RÃ©cupÃ©rer les documents
        const docsToExport = [];
        for (const id of documentIds) {
            const docSnap = await getDb().collection("documents").doc(id).get();
            if (docSnap.exists) {
                const docData = docSnap.data();
                // SÃ‰CURITÃ‰ : VÃ©rification de l'isolation client/cabinet
                if (callerRole === 'client' && docData.clientId !== callerUid) {
                    logger.warn(`Tentative d'export illÃ©gal par ${callerUid} pour le doc ${id}`);
                    continue;
                }
                if (!isGlobalAdmin &&
                    callerRole !== 'client' &&
                    (!['accountant', 'secretary'].includes(callerRole) || docData.cabinetId !== callerCabinetId)) {
                    logger.warn(`Tentative d'export illÃ©gal par ${callerUid} pour le doc ${id}`);
                    continue;
                }
                docsToExport.push(Object.assign(Object.assign({}, docData), { id: docSnap.id }));
            }
        }
        if (docsToExport.length === 0) {
            throw new https_1.HttpsError('not-found', 'Aucun document trouvÃ© pour l\'export.');
        }
        // 2. GÃ©nÃ©rer le fichier
        const { format: formatFns } = await import('date-fns');
        const { ExportFactory } = await import('./export-factory.js');
        let fileContent = '';
        let fileName = '';
        const timestamp = formatFns(new Date(), 'yyyyMMdd_HHmm');
        if (exportFormat === 'FEC') {
            fileContent = ExportFactory.generateFEC(docsToExport);
            fileName = `export_compta_FEC_${timestamp}.txt`;
        }
        else {
            fileContent = ExportFactory.generateCSV(docsToExport);
            fileName = `export_compta_${timestamp}.csv`;
        }
        // 3. Marquer comme exportÃ©s
        const batch = getDb().batch();
        const exportId = `export_${timestamp}`;
        for (const doc of docsToExport) {
            const ref = getDb().collection("documents").doc(doc.id);
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
    }
    catch (error) {
        throwCallableError(error, 'Erreur Export:');
    }
});
/**
 * Trigger de notification pour les nouveaux commentaires.
 * Informe le client quand le cabinet commente, et inversement.
 */
exports.onCommentAdded = (0, firestore_1.onDocumentWritten)({
    document: "documents/{docId}",
    region: "europe-west9"
}, async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after.data();
    const previousData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.before.data();
    if (!data || !previousData)
        return;
    const comments = data.comments || [];
    const prevComments = previousData.comments || [];
    // Si la taille du tableau de commentaires a augmentÃ©
    if (comments.length > prevComments.length) {
        const newComment = comments[comments.length - 1];
        const clientId = data.clientId;
        const cabinetId = data.cabinetId || "";
        const docName = data.name || "Document sans nom";
        logger.log(`ðŸ’¬ Nouveau commentaire sur ${docName} par ${newComment.user}`);
        // CrÃ©ation de la notification dans Firestore
        const notificationId = getDb().collection("notifications").doc().id;
        await getDb().collection("notifications").doc(notificationId).set({
            id: notificationId,
            documentId: event.params.docId,
            documentName: docName,
            message: `${newComment.user} a ajoutÃ© un commentaire : "${newComment.text.substring(0, 50)}${newComment.text.length > 50 ? '...' : ''}"`,
            date: new Date().toISOString(),
            isRead: false,
            clientId: clientId, // Pour filtrer les notifications par client
            cabinetId,
            type: 'comment'
        });
        // IncrÃ©menter le compteur de nouveaux documents/notifications pour le badge UI
        await getDb().collection('clients').doc(clientId).update({
            newDocuments: admin.firestore.FieldValue.increment(1)
        });
    }
});
/**
 * GÃ©nÃ¨re manuellement (ou via scheduler) le briefing hebdomadaire.
 */
exports.requestWeeklySummary = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const callerUid = request.auth.uid;
    const targetClientId = request.data.clientId || callerUid;
    // SÃ‰CURITÃ‰ : VÃ©rification de l'accÃ¨s au rÃ©sumÃ©
    if (targetClientId !== callerUid) {
        await assertClientCabinetAccess(request.auth, targetClientId, ['admin', 'accountant', 'secretary']);
    }
    const targetClient = await getClientOrThrow(targetClientId);
    // 1. RÃ©cupÃ©rer les 7 derniers jours de documents
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const docsSnapshot = await getDb().collection("documents")
        .where("clientId", "==", targetClientId)
        .where("uploadDate", ">=", sevenDaysAgo.toISOString())
        .get();
    const docs = docsSnapshot.docs.map(d => d.data());
    if (docs.length === 0) {
        return { message: "Pas assez de donnÃ©es pour cette semaine." };
    }
    // 2. GÃ©nÃ©rer via IA
    const { generateWeeklyBriefing } = await import('./proactive-ai.js');
    const briefing = await generateWeeklyBriefing({ clientId: targetClientId, docs });
    // 3. Sauvegarder comme notification spÃ©ciale
    const notifId = getDb().collection("notifications").doc().id;
    await getDb().collection("notifications").doc(notifId).set({
        id: notifId,
        clientId: targetClientId,
        type: 'weekly_briefing',
        message: briefing.summary,
        date: new Date().toISOString(),
        isRead: false,
        cabinetId: targetClient.cabinetId || '',
        documentName: "Briefing Hebdomadaire",
        extraData: briefing
    });
    return { success: true, briefing };
});
/**
 * Moteur de lettrage algorithmique : Rapprochement bancaire backend
 */
exports.autoMatchBankTransactions = (0, https_1.onCall)({ region: "europe-west9", memory: "1GiB" }, async (request) => {
    var _a, _b, _c;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisé');
    const clientId = request.data.clientId || request.auth.uid;
    const callerRole = getCallerRole(request.auth);
    if (callerRole === 'client' && clientId !== request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'Vous ne pouvez pas accéder à ce dossier.');
    }
    try {
        const db = getDb();
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId, ['admin', 'accountant', 'secretary']);
        const bankStatementsSnap = await db.collection("documents")
            .where("clientId", "==", clientId)
            .where("type", "==", "bank statement")
            .get();
        const invoicesSnap = await db.collection("documents")
            .where("clientId", "==", clientId)
            .where("status", "in", ["approved", "reviewing", "exported"])
            .get();
        const invoices = invoicesSnap.docs
            .filter(doc => doc.data().type !== 'bank statement' && !doc.data().matchedTransactionId)
            .map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const batch = db.batch();
        let matchCount = 0;
        let suggestionCount = 0;
        // Fonction utilitaire de scoring multicritère
        const calculateMatchScore = (tx, inv) => {
            var _a, _b, _c, _d, _e, _f;
            let score = 0;
            // 1. Comparaison de montant (TTC vs Transaction)
            const txAmount = Math.abs(tx.amount);
            const invAmount = Math.abs(((_b = (_a = inv.extractedData) === null || _a === void 0 ? void 0 : _a.amounts) === null || _b === void 0 ? void 0 : _b[0]) || inv.amount || 0);
            if (txAmount === invAmount) {
                score += 55;
            }
            else if (Math.abs(txAmount - invAmount) < 0.05) {
                score += 35; // Tolérance centimes
            }
            else if (Math.abs(txAmount - invAmount) < 1.00) {
                score += 15; // Écart mineur
            }
            // 2. Comparaison de date (Date Facture vs Date Transaction)
            const txDateStr = tx.date;
            const invDateStr = ((_d = (_c = inv.extractedData) === null || _c === void 0 ? void 0 : _c.dates) === null || _d === void 0 ? void 0 : _d[0]) || inv.date || inv.uploadDate;
            if (txDateStr && invDateStr) {
                const txDate = new Date(txDateStr);
                const invDate = new Date(invDateStr);
                const diffTime = Math.abs(txDate.getTime() - invDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 3) {
                    score += 30;
                }
                else if (diffDays <= 10) {
                    score += 15;
                }
                else if (diffDays <= 30) {
                    score += 5;
                }
            }
            // 3. Comparaison de nom de tiers (Libellé Transaction vs Nom Fournisseur)
            const txDesc = (tx.description || '').toLowerCase();
            const vendorName = (((_f = (_e = inv.extractedData) === null || _e === void 0 ? void 0 : _e.vendorNames) === null || _f === void 0 ? void 0 : _f[0]) || inv.vendorName || inv.name || '').toLowerCase();
            if (vendorName && txDesc) {
                const cleanStr = (s) => s.replace(/[^a-z0-9]/g, '');
                const cTx = cleanStr(txDesc);
                const cVendor = cleanStr(vendorName);
                if (cTx.includes(cVendor) || cVendor.includes(cTx)) {
                    score += 20;
                }
                else {
                    const txWords = txDesc.split(/\s+/).filter((w) => w.length > 3);
                    const vendorWords = vendorName.split(/\s+/).filter((w) => w.length > 3);
                    const commonWords = txWords.filter((w) => vendorWords.includes(w));
                    if (commonWords.length > 0) {
                        score += 15;
                    }
                }
            }
            return score;
        };
        for (const bsDoc of bankStatementsSnap.docs) {
            const data = bsDoc.data();
            if (!((_a = data.extractedData) === null || _a === void 0 ? void 0 : _a.transactions))
                continue;
            let updated = false;
            const transactions = [...data.extractedData.transactions];
            for (let i = 0; i < transactions.length; i++) {
                const tx = transactions[i];
                // Si déjà rapproché, on ne touche à rien
                if (tx.matchingDocumentId || tx.status === 'matched')
                    continue;
                // Calculer le meilleur match parmi toutes les factures disponibles
                let bestMatch = null;
                let bestScore = 0;
                for (const inv of invoices) {
                    const score = calculateMatchScore(tx, inv);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = inv;
                    }
                }
                if (bestMatch && bestScore >= 90) {
                    // Matching Automatique Évident
                    const txId = `${bsDoc.id}-${i}`;
                    tx.matchingDocumentId = bestMatch.id;
                    tx.status = 'matched';
                    tx.confidenceScore = bestScore;
                    // Supprimer les champs de suggestion s'ils existaient
                    delete tx.suggestedDocId;
                    delete tx.suggestedConfidenceScore;
                    delete tx.suggestedVendor;
                    batch.update(db.collection("documents").doc(bestMatch.id), {
                        matchedTransactionId: txId,
                        isMatched: true
                    });
                    // Retirer de la liste pour éviter les doubles correspondances
                    const matchIndex = invoices.findIndex(inv => inv.id === bestMatch.id);
                    if (matchIndex > -1)
                        invoices.splice(matchIndex, 1);
                    // Générer l'écriture comptable de règlement associée (BQ)
                    const now = new Date().toISOString();
                    const entryRef = db.collection("accounting_entries").doc();
                    const isExpense = tx.amount < 0;
                    const amount = Math.abs(tx.amount);
                    const partnerAccount = isExpense ? '401000' : '411000';
                    const partnerLabel = isExpense ? 'Fournisseurs' : 'Clients';
                    const lines = isExpense ? [
                        {
                            accountNumber: partnerAccount,
                            accountLabel: partnerLabel,
                            debit: amount,
                            credit: 0
                        },
                        {
                            accountNumber: '512000',
                            accountLabel: 'Banque',
                            debit: 0,
                            credit: amount
                        }
                    ] : [
                        {
                            accountNumber: '512000',
                            accountLabel: 'Banque',
                            debit: amount,
                            credit: 0
                        },
                        {
                            accountNumber: partnerAccount,
                            accountLabel: partnerLabel,
                            debit: 0,
                            credit: amount
                        }
                    ];
                    batch.set(entryRef, {
                        id: entryRef.id,
                        clientId,
                        cabinetId: targetCabinetId || bestMatch.cabinetId || '',
                        journalCode: 'BQ',
                        entryDate: tx.date || now.split('T')[0],
                        label: `Règlement ${isExpense ? 'Fournisseur' : 'Client'} - ${tx.description} - Réf ${bestMatch.name || bestMatch.id.slice(0, 8)}`,
                        lines,
                        sourceType: 'bank_reconciliation',
                        sourceId: txId,
                        fiscalYear: new Date(tx.date || now).getFullYear(),
                        status: 'draft',
                        createdAt: now,
                        updatedAt: now
                    });
                    updated = true;
                    matchCount++;
                }
                else if (bestMatch && bestScore >= 50) {
                    // Suggestion IA (à valider par l'utilisateur)
                    tx.suggestedDocId = bestMatch.id;
                    tx.suggestedConfidenceScore = bestScore;
                    tx.suggestedVendor = ((_c = (_b = bestMatch.extractedData) === null || _b === void 0 ? void 0 : _b.vendorNames) === null || _c === void 0 ? void 0 : _c[0]) || bestMatch.vendorName || bestMatch.name || 'Vendeur Inconnu';
                    tx.status = 'pending';
                    updated = true;
                    suggestionCount++;
                }
                else {
                    // Nettoyage au cas où les données changent
                    if (tx.suggestedDocId) {
                        delete tx.suggestedDocId;
                        delete tx.suggestedConfidenceScore;
                        delete tx.suggestedVendor;
                        updated = true;
                    }
                }
            }
            if (updated) {
                batch.update(bsDoc.ref, {
                    "extractedData.transactions": transactions
                });
            }
        }
        if (matchCount > 0) {
            await batch.commit();
        }
        return { success: true, matchCount };
    }
    catch (error) {
        throwCallableError(error, 'Erreur Auto-Lettrage:');
    }
});
/**
 * GÃ©nÃ¨re une fiche d'amortissement linÃ©aire (V1)
 */
exports.generateAssetSchedule = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const { documentId, clientId, acquisitionDate, serviceStartDate, acquisitionValue, usefulLifeMonths, assetName } = request.data;
    if (!documentId || !clientId) {
        throw new https_1.HttpsError('invalid-argument', 'documentId et clientId sont requis.');
    }
    try {
        const db = getDb();
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId);
        const sourceDoc = await db.collection("documents").doc(documentId).get();
        if (!sourceDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Document source introuvable.');
        }
        const sourceData = sourceDoc.data();
        if (sourceData.clientId !== clientId) {
            throw new https_1.HttpsError('permission-denied', 'Document source hors dossier client.');
        }
        if (targetCabinetId && sourceData.cabinetId && sourceData.cabinetId !== targetCabinetId) {
            throw new https_1.HttpsError('permission-denied', 'Document source hors cabinet.');
        }
        const serviceStart = new Date(serviceStartDate);
        const currentYear = serviceStart.getFullYear();
        // Calcul du Prorata Temporis pour la premiÃ¨re annÃ©e (LinÃ©aire)
        const startMonth = serviceStart.getMonth(); // 0-11
        const startDay = serviceStart.getDate();
        const remainingDaysInYear = 360 - ((startMonth * 30) + startDay);
        const prorataFirstYear = Math.max(0, remainingDaysInYear) / 360;
        const annualDepreciation = acquisitionValue / (usefulLifeMonths / 12);
        const schedule = [];
        let remainingValue = acquisitionValue;
        const totalYears = Math.ceil(usefulLifeMonths / 12);
        // AnnÃ©e 1 avec prorata
        const firstYearDepreciation = annualDepreciation * prorataFirstYear;
        schedule.push({
            year: currentYear,
            openingValue: remainingValue,
            depreciationAmount: Number(firstYearDepreciation.toFixed(2)),
            closingValue: Number((remainingValue - firstYearDepreciation).toFixed(2))
        });
        remainingValue -= firstYearDepreciation;
        // AnnÃ©es pleines
        for (let i = 1; i < totalYears; i++) {
            const depAmount = Math.min(annualDepreciation, remainingValue);
            schedule.push({
                year: currentYear + i,
                openingValue: Number(remainingValue.toFixed(2)),
                depreciationAmount: Number(depAmount.toFixed(2)),
                closingValue: Number((remainingValue - depAmount).toFixed(2))
            });
            remainingValue -= depAmount;
        }
        // DerniÃ¨re annÃ©e (reliquat si prorata)
        if (remainingValue > 0.01) {
            schedule.push({
                year: currentYear + totalYears,
                openingValue: Number(remainingValue.toFixed(2)),
                depreciationAmount: Number(remainingValue.toFixed(2)),
                closingValue: 0
            });
        }
        const assetData = {
            clientId,
            cabinetId: targetCabinetId || sourceData.cabinetId || '',
            documentId,
            name: assetName,
            amortizationMethod: 'linear',
            acquisitionDate,
            serviceStartDate,
            acquisitionValue: Number(acquisitionValue),
            usefulLifeMonths: Number(usefulLifeMonths),
            depreciationBase: Number(acquisitionValue),
            residualValue: 0,
            status: 'active',
            schedule,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const assetRef = db.collection("assets").doc();
        const batch = db.batch();
        batch.set(assetRef, Object.assign({ id: assetRef.id }, assetData));
        batch.update(db.collection("documents").doc(documentId), { assetId: assetRef.id });
        await batch.commit();
        return { success: true, assetId: assetRef.id, schedule };
    }
    catch (error) {
        throwCallableError(error, 'Erreur generateAssetSchedule:');
    }
});
/**
 * GÃ©nÃ¨re les Ã©critures OD de dotations aux amortissements pour un exercice comptable.
 *
 * RÃ¨gles mÃ©tier :
 * - Ã‰criture gÃ©nÃ©rÃ©e en statut "draft" uniquement.
 * - Anti-doublon : vÃ©rifie si une Ã©criture existe dÃ©jÃ  pour (assetId, fiscalYear).
 * - Validation humaine obligatoire avant export ou comptabilisation dÃ©finitive.
 * - Extensible : le champ sourceType permet d'adapter Ã  d'autres types d'OD (V2).
 */
exports.generateDepreciationODs = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const { clientId, fiscalYear } = request.data;
    if (!clientId || !fiscalYear) {
        throw new https_1.HttpsError('invalid-argument', 'clientId et fiscalYear sont requis.');
    }
    try {
        const db = getDb();
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId);
        // 1. RÃ©cupÃ©rer toutes les immobilisations actives du client
        const assetsQuery = db.collection("assets")
            .where("clientId", "==", clientId)
            .where("status", "==", "active");
        const assetsSnap = targetCabinetId
            ? await assetsQuery.where("cabinetId", "==", targetCabinetId).get()
            : await assetsQuery.get();
        if (assetsSnap.empty) {
            return { success: true, created: 0, skipped: 0, message: "Aucune immobilisation active." };
        }
        // 2. RÃ©cupÃ©rer les OD dÃ©jÃ  existants pour cet exercice (anti-doublon)
        const existingODsQuery = db.collection("accounting_entries")
            .where("clientId", "==", clientId)
            .where("fiscalYear", "==", fiscalYear)
            .where("sourceType", "==", "asset_depreciation");
        const existingODsSnap = targetCabinetId
            ? await existingODsQuery.where("cabinetId", "==", targetCabinetId).get()
            : await existingODsQuery.get();
        const existingSourceIds = new Set(existingODsSnap.docs.map(d => d.data().sourceId));
        // 3. GÃ©nÃ©rer les Ã©critures OD manquantes
        const batch = db.batch();
        let created = 0;
        let skipped = 0;
        for (const assetDoc of assetsSnap.docs) {
            const asset = assetDoc.data();
            const assetId = assetDoc.id;
            // Anti-doublon : skip si dÃ©jÃ  existant pour cet exercice
            if (existingSourceIds.has(assetId)) {
                skipped++;
                continue;
            }
            // Chercher la ligne du plan pour l'exercice
            const scheduleLine = (asset.schedule || []).find((s) => s.year === fiscalYear);
            if (!scheduleLine || scheduleLine.depreciationAmount <= 0) {
                skipped++;
                continue;
            }
            // RÃ©soudre les comptes PCG selon le nom de l'actif
            const assetName = (asset.name || '').toLowerCase();
            let debitAccount = '68112';
            let debitLabel = 'Dotations aux amortissements immobilisations corporelles';
            let creditAccount = '28183';
            let creditLabel = 'Amortissements matÃ©riel de bureau et informatique';
            if (assetName.includes('vÃ©hicule') || assetName.includes('voiture') || assetName.includes('camion')) {
                creditAccount = '2815';
                creditLabel = 'Amortissements du matÃ©riel de transport';
            }
            else if (assetName.includes('logiciel') || assetName.includes('software') || assetName.includes('licence')) {
                debitAccount = '68811';
                debitLabel = 'Dotations aux amortissements immobilisations incorporelles';
                creditAccount = '2805';
                creditLabel = 'Amortissements des logiciels et droits incorporels';
            }
            const entryRef = db.collection("accounting_entries").doc();
            const now = new Date().toISOString();
            batch.set(entryRef, {
                id: entryRef.id,
                clientId,
                cabinetId: targetCabinetId || asset.cabinetId || '',
                journalCode: 'OD',
                entryDate: `${fiscalYear}-12-31`,
                label: `Dotation amortissement - ${asset.name} - ${fiscalYear}`,
                lines: [
                    {
                        accountNumber: debitAccount,
                        accountLabel: debitLabel,
                        debit: scheduleLine.depreciationAmount,
                        credit: 0,
                    },
                    {
                        accountNumber: creditAccount,
                        accountLabel: creditLabel,
                        debit: 0,
                        credit: scheduleLine.depreciationAmount,
                    },
                ],
                sourceType: 'asset_depreciation',
                sourceId: assetId,
                fiscalYear,
                status: 'draft',
                createdAt: now,
                updatedAt: now,
            });
            created++;
        }
        if (created > 0) {
            await batch.commit();
        }
        return { success: true, created, skipped };
    }
    catch (error) {
        throwCallableError(error, 'Erreur generateDepreciationODs:');
    }
});
/**
 * Valide une Ã©criture comptable (draft â†’ validated).
 * Seul un comptable ou admin peut valider.
 */
exports.validateAccountingEntry = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const { entryId } = request.data;
    if (!entryId)
        throw new https_1.HttpsError('invalid-argument', 'entryId requis.');
    try {
        const db = getDb();
        const entryRef = db.collection("accounting_entries").doc(entryId);
        const snap = await entryRef.get();
        if (!snap.exists)
            throw new https_1.HttpsError('not-found', 'Ã‰criture introuvable.');
        const entry = snap.data();
        if (!entry.clientId) {
            throw new https_1.HttpsError('failed-precondition', 'Ã‰criture sans client rattache.');
        }
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, entry.clientId);
        if (targetCabinetId && entry.cabinetId !== targetCabinetId) {
            throw new https_1.HttpsError('permission-denied', 'Ã‰criture hors cabinet.');
        }
        if (entry.status !== 'draft') {
            throw new https_1.HttpsError('failed-precondition', 'Seules les Ã©critures en brouillon peuvent Ãªtre validÃ©es.');
        }
        await entryRef.update({
            status: 'validated',
            validatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return { success: true };
    }
    catch (error) {
        throwCallableError(error, 'Erreur validateAccountingEntry:');
    }
});
/**
 * Exporte le FEC pour un exercice donnÃ© et scelle les Ã©critures (PAF).
 */
exports.generateFECExport = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const { clientId, fiscalYearId, year } = request.data;
    if (!clientId) {
        throw new https_1.HttpsError('invalid-argument', 'clientId requis.');
    }
    try {
        const db = getDb();
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId);
        let targetYear = year || 2024;
        if (fiscalYearId) {
            const fySnap = await db.collection("fiscal_years").doc(fiscalYearId).get();
            if (fySnap.exists) {
                const fyData = fySnap.data();
                if (fyData.clientId && fyData.clientId !== clientId) {
                    throw new https_1.HttpsError('permission-denied', 'Exercice hors dossier client.');
                }
                if (targetCabinetId && fyData.cabinetId && fyData.cabinetId !== targetCabinetId) {
                    throw new https_1.HttpsError('permission-denied', 'Exercice hors cabinet.');
                }
                targetYear = parseInt(fyData.label, 10) || fyData.year || 2024;
            }
            else if (!year) {
                targetYear = parseInt(fiscalYearId, 10) || 2024; // Fallback to id as year
            }
        }
        // 2. RÃ©cupÃ©rer les Ã©critures validÃ©es ou dÃ©jÃ  exportÃ©es
        const entriesQuery = db.collection("accounting_entries")
            .where("clientId", "==", clientId)
            .where("fiscalYear", "==", targetYear)
            .where("status", "in", ["validated", "exported"]);
        const entriesSnap = targetCabinetId
            ? await entriesQuery.where("cabinetId", "==", targetCabinetId).get()
            : await entriesQuery.get();
        if (entriesSnap.empty) {
            throw new https_1.HttpsError('not-found', 'Aucune Ã©criture comptable validÃ©e pour cet exercice.');
        }
        const entries = entriesSnap.docs.map(doc => doc.data());
        // 3. GÃ©nÃ©rer le fichier FEC
        const { ExportFactory } = await import('./export-factory.js');
        const fileContent = ExportFactory.generateFECFromEntries(entries);
        const { format: formatFns } = await import('date-fns');
        const timestamp = formatFns(new Date(), 'yyyyMMdd_HHmmss');
        const fileName = `FEC_${clientId}_${targetYear}_${timestamp}.txt`;
        const filePath = `exports/${clientId}/${fileName}`;
        // 4. Upload sur Storage
        // NOTE: fallback to default bucket config for environment.
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);
        await file.save(fileContent, {
            metadata: {
                contentType: 'text/plain',
            }
        });
        // 5. GÃ©nÃ©rer une URL signÃ©e (valable 1 heure)
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000,
        });
        // 6. Archiver et Sceller les Ã©critures
        const batch = db.batch();
        const now = new Date().toISOString();
        // CrÃ©er le document d'archive
        const exportRef = db.collection("fec_exports").doc();
        batch.set(exportRef, {
            clientId,
            cabinetId: targetCabinetId || '',
            fiscalYearId,
            targetYear,
            fileName,
            storagePath: filePath,
            exportedBy: request.auth.uid,
            exportedAt: now,
            entriesCount: entries.length,
        });
        // Sceller les Ã©critures (PAF)
        entriesSnap.docs.forEach(doc => {
            if (doc.data().status !== 'exported') {
                batch.update(doc.ref, {
                    status: 'exported',
                    exportedAt: now,
                    updatedAt: now,
                });
            }
        });
        await batch.commit();
        return { success: true, url, entriesCount: entries.length };
    }
    catch (error) {
        throwCallableError(error, 'Erreur generateFECExport:');
    }
});
/**
 * GÃ¨re la sortie d'une immobilisation (cession ou mise au rebut) :
 * - Calcule l'amortissement prorata temporis de l'annÃ©e de sortie.
 * - Ajuste le plan d'amortissement de l'actif.
 * - GÃ©nÃ¨re les Ã©critures comptables d'OD associÃ©es (solder l'immo, solder les amortissements, enregistrer la VNC et la vente).
 */
exports.disposeAsset = (0, https_1.onCall)({ region: "europe-west9" }, async (request) => {
    var _a, _b;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Non autorisÃ©');
    const { assetId, disposalDate, disposalType, salePrice, vatRate } = request.data;
    if (!assetId || !disposalDate || !disposalType) {
        throw new https_1.HttpsError('invalid-argument', 'assetId, disposalDate et disposalType sont requis.');
    }
    try {
        const db = getDb();
        // 1. Charger l'actif
        const assetSnap = await db.collection("assets").doc(assetId).get();
        if (!assetSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Immobilisation introuvable.');
        }
        const asset = assetSnap.data();
        if (!asset.clientId) {
            throw new https_1.HttpsError('failed-precondition', 'Immobilisation sans client rattache.');
        }
        const { targetCabinetId } = await assertClientCabinetAccess(request.auth, asset.clientId);
        if (targetCabinetId && asset.cabinetId !== targetCabinetId) {
            throw new https_1.HttpsError('permission-denied', 'Immobilisation hors cabinet.');
        }
        if (asset.status !== 'active') {
            throw new https_1.HttpsError('failed-precondition', 'L\'immobilisation n\'est plus active.');
        }
        // 2. DÃ©terminer l'annÃ©e de cession
        const serviceStart = new Date(asset.serviceStartDate);
        const dEnd = new Date(disposalDate);
        const disposalYear = dEnd.getFullYear();
        if (dEnd < serviceStart) {
            throw new https_1.HttpsError('invalid-argument', 'La date de cession ne peut pas Ãªtre antÃ©rieure Ã  la date de mise en service.');
        }
        // 3. Recalculer le plan d'amortissement au prorata
        const annualDepreciation = asset.acquisitionValue / (asset.usefulLifeMonths / 12);
        const startYear = serviceStart.getFullYear();
        // Calcul du dÃ©but de la pÃ©riode d'amortissement pour l'annÃ©e de cession
        let dStart = new Date(`${disposalYear}-01-01`);
        if (disposalYear === startYear) {
            dStart = serviceStart;
        }
        const timeDiff = dEnd.getTime() - dStart.getTime();
        const days = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1);
        // Calcul de la dotation proratisÃ©e de l'annÃ©e de cession (365 jours de base)
        const prorataFactor = days / 365;
        const originalSchedule = asset.schedule || [];
        const previousClosingValue = (_b = (_a = originalSchedule.find((s) => s.year === disposalYear - 1)) === null || _a === void 0 ? void 0 : _a.closingValue) !== null && _b !== void 0 ? _b : asset.acquisitionValue;
        let depAmount = Number(Math.min(annualDepreciation * prorataFactor, previousClosingValue).toFixed(2));
        if (disposalYear > startYear + Math.ceil(asset.usefulLifeMonths / 12)) {
            // DÃ©jÃ  complÃ¨tement amorti au-delÃ  de la durÃ©e de vie
            depAmount = 0;
        }
        const newClosingValue = Number((previousClosingValue - depAmount).toFixed(2)); // C'est la VNC finale au jour de la cession
        // Reconstruire le nouveau plan d'amortissement en enlevant les annÃ©es futures
        const newSchedule = [];
        let accumulatedAmortization = 0;
        for (const line of originalSchedule) {
            if (line.year < disposalYear) {
                newSchedule.push(line);
                accumulatedAmortization += line.depreciationAmount;
            }
            else if (line.year === disposalYear) {
                const proratedLine = {
                    year: disposalYear,
                    openingValue: Number(previousClosingValue.toFixed(2)),
                    depreciationAmount: depAmount,
                    closingValue: newClosingValue
                };
                newSchedule.push(proratedLine);
                accumulatedAmortization += depAmount;
                break; // On s'arrÃªte ici, les annÃ©es futures n'existent plus
            }
        }
        // S'assurer qu'au moins la ligne de cession existe
        if (!newSchedule.some(s => s.year === disposalYear) && previousClosingValue > 0) {
            const proratedLine = {
                year: disposalYear,
                openingValue: Number(previousClosingValue.toFixed(2)),
                depreciationAmount: depAmount,
                closingValue: newClosingValue
            };
            newSchedule.push(proratedLine);
            accumulatedAmortization += depAmount;
        }
        accumulatedAmortization = Number(accumulatedAmortization.toFixed(2));
        // 4. RÃ©soudre les comptes comptables selon la catÃ©gorie d'immo
        const assetNameLower = (asset.name || '').toLowerCase();
        let assetAccount = '218300';
        let assetLabel = 'MatÃ©riel de bureau et informatique';
        let amortAccount = '28183';
        let amortLabel = 'Amortissements matÃ©riel de bureau et informatique';
        if (assetNameLower.includes('vÃ©hicule') || assetNameLower.includes('voiture') || assetNameLower.includes('camion')) {
            assetAccount = '218200';
            assetLabel = 'MatÃ©riel de transport';
            amortAccount = '2815';
            amortLabel = 'Amortissements du matÃ©riel de transport';
        }
        else if (assetNameLower.includes('logiciel') || assetNameLower.includes('software') || assetNameLower.includes('licence')) {
            assetAccount = '205000';
            assetLabel = 'Logiciels et brevets';
            amortAccount = '2805';
            amortLabel = 'Amortissements des logiciels et droits incorporels';
        }
        // 5. GÃ©nÃ©rer l'Ã©criture d'OD
        const lines = [];
        // A. DÃ©bit Amortissement CumulÃ©
        if (accumulatedAmortization > 0) {
            lines.push({
                accountNumber: amortAccount,
                accountLabel: amortLabel,
                debit: accumulatedAmortization,
                credit: 0
            });
        }
        // B. DÃ©bit Valeur Nette Comptable (675000)
        if (newClosingValue > 0) {
            lines.push({
                accountNumber: '675000',
                accountLabel: 'Valeur rÃ©siduelle des immobs. cÃ©dÃ©es (VNC)',
                debit: newClosingValue,
                credit: 0
            });
        }
        // C. CrÃ©dit Compte Immo d'origine (Valeur brute)
        lines.push({
            accountNumber: assetAccount,
            accountLabel: assetLabel,
            debit: 0,
            credit: asset.acquisitionValue
        });
        // D. Si vente, ajouter les Ã©critures de cession correspondantes
        if (disposalType === 'sold' && salePrice > 0) {
            const priceHT = Number(salePrice);
            const vatAmt = vatRate ? Number((priceHT * vatRate / 100).toFixed(2)) : 0;
            const priceTTC = Number((priceHT + vatAmt).toFixed(2));
            // DÃ©bit CrÃ©ances sur cessions (462000) ou Banque (512000)
            lines.push({
                accountNumber: '462000',
                accountLabel: 'CrÃ©ances sur cessions d\'immobilisations',
                debit: priceTTC,
                credit: 0
            });
            // CrÃ©dit Produits de Cessions d'Ã©lÃ©ments d'Actif (775000)
            lines.push({
                accountNumber: '775000',
                accountLabel: 'Produits des cessions d\'Ã©lÃ©ments d\'actif',
                debit: 0,
                credit: priceHT
            });
            // CrÃ©dit TVA CollectÃ©e sur cession (445710)
            if (vatAmt > 0) {
                lines.push({
                    accountNumber: '445710',
                    accountLabel: 'TVA collectÃ©e sur cession d\'immobilisations',
                    debit: 0,
                    credit: vatAmt
                });
            }
        }
        const entryRef = db.collection("accounting_entries").doc();
        const nowIso = new Date().toISOString();
        const entryData = {
            id: entryRef.id,
            clientId: asset.clientId,
            cabinetId: targetCabinetId || asset.cabinetId || '',
            journalCode: 'OD',
            entryDate: disposalDate,
            label: disposalType === 'sold'
                ? `Sortie d'actif (Cession) - ${asset.name}`
                : `Sortie d'actif (Mise au rebut) - ${asset.name}`,
            lines,
            sourceType: disposalType === 'sold' ? 'asset_sale' : 'asset_disposal',
            sourceId: assetId,
            fiscalYear: disposalYear,
            status: 'draft',
            createdAt: nowIso,
            updatedAt: nowIso
        };
        // 6. Enregistrement Firestore
        const batch = db.batch();
        // Mettre Ã  jour l'immo
        batch.update(db.collection("assets").doc(assetId), {
            status: disposalType === 'sold' ? 'sold' : 'scrapped',
            cabinetId: targetCabinetId || asset.cabinetId || '',
            schedule: newSchedule,
            updatedAt: nowIso
        });
        // CrÃ©er l'Ã©criture comptable
        batch.set(entryRef, entryData);
        await batch.commit();
        return {
            success: true,
            assetId,
            entryId: entryRef.id,
            vnc: newClosingValue,
            accumulatedAmortization,
            status: disposalType === 'sold' ? 'sold' : 'scrapped'
        };
    }
    catch (error) {
        throwCallableError(error, 'Erreur disposeAsset:');
    }
});
exports.inviteClient = (0, https_1.onCall)({ region: 'europe-west9', memory: '256MiB' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const callerRole = getCallerRole(request.auth);
    if (!['admin', 'accountant'].includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Seuls les admins et comptables peuvent inviter des clients.');
    }
    const { email, name, cabinetId } = request.data || {};
    if (!email || typeof email !== 'string' || !name || typeof name !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'L\'email et le nom sont requis et doivent etre des chaines.');
    }
    let targetCabinetId = cabinetId;
    // Si c'est un comptable, on force le cabinetId a celui du comptable
    if (callerRole === 'accountant') {
        const callerCabinetId = getCallerCabinetId(request.auth);
        if (!callerCabinetId) {
            throw new https_1.HttpsError('permission-denied', 'Le comptable n\'est rattache a aucun cabinet.');
        }
        targetCabinetId = callerCabinetId;
    }
    else if (callerRole === 'admin' && !targetCabinetId) {
        throw new https_1.HttpsError('invalid-argument', 'Un admin doit specifier un cabinetId.');
    }
    try {
        const password = generateTemporaryPassword();
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: 'client',
            cabinetId: targetCabinetId
        });
        const db = getDb();
        await db.collection('clients').doc(userRecord.uid).set({
            name,
            email,
            cabinetId: targetCabinetId,
            role: 'client',
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Client ${email} created with temporary password: ${password}`);
        return { success: true, uid: userRecord.uid, temporaryPassword: password };
    }
    catch (error) {
        throwCallableError(error, 'Erreur inviteClient:');
    }
});
/**
 * Trigger Zéro-Clic: Apprentissage Local
 * S'exécute lorsqu'un document est approuvé pour mémoriser l'imputation par fournisseur.
 */
exports.onDocumentApproved = (0, firestore_1.onDocumentUpdated)({
    document: "documents/{docId}",
    region: "europe-west9"
}, async (event) => {
    var _a, _b, _c, _d, _e;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    // Détecter le passage à "approved"
    if (before.status !== 'approved' && after.status === 'approved') {
        const clientId = after.clientId;
        const vendorName = (_d = (_c = after.extractedData) === null || _c === void 0 ? void 0 : _c.vendorNames) === null || _d === void 0 ? void 0 : _d[0];
        const accountingEntry = (_e = after.extractedData) === null || _e === void 0 ? void 0 : _e.accountingEntry;
        if (clientId && vendorName && accountingEntry) {
            const vendorSlug = vendorName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const ruleRef = getDb().collection('clients').doc(clientId).collection('accounting_rules').doc(vendorSlug);
            await ruleRef.set({
                vendorName,
                accountingEntry,
                lastApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
                approvalCount: admin.firestore.FieldValue.increment(1)
            }, { merge: true });
            logger.log(`🧠 [Local Learning] Règle apprise pour le fournisseur ${vendorName} (Client: ${clientId})`);
        }
    }
});
//# sourceMappingURL=index.js.map