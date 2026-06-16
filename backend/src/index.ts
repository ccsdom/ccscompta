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
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
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

type AuthContext = NonNullable<CallableRequest["auth"]>;

const DEFAULT_APP_BASE_URL = 'https://ccscompta.fr';

function getCallerRole(auth: AuthContext): string {
  return typeof auth.token.role === 'string' ? auth.token.role : 'client';
}

function getCallerCabinetId(auth: AuthContext): string | undefined {
  return typeof auth.token.cabinetId === 'string' ? auth.token.cabinetId : undefined;
}

function generateTemporaryPassword(): string {
  return `${randomBytes(24).toString('base64url')}aA1!`;
}

function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getAccountSetupUrl(): string {
  return process.env.ACCOUNT_SETUP_CONTINUE_URL ||
    `${getAppBaseUrl()}/connexion`;
}

function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL || DEFAULT_APP_BASE_URL).replace(/\/$/, '');
}

function buildCabinetOnboardingUrl(cabinetId: string, token: string): string {
  return `${getAppBaseUrl()}/onboarding?cabinetId=${encodeURIComponent(cabinetId)}&token=${encodeURIComponent(token)}`;
}

function buildCabinetInvitationMailPayload(cabinet: { id: string; name: string; email: string; invitationUrl: string }) {
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

async function queueCabinetInvitationEmail(cabinet: { id: string; name: string; email: string; invitationUrl: string }) {
  const payload = buildCabinetInvitationMailPayload(cabinet);
  await getDb().collection('mail').add(payload);
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'administrateur',
    accountant: 'comptable',
    secretary: 'secretaire',
    client: 'client',
  };

  return labels[role] || 'utilisateur';
}

function buildUserSetupMailPayload(user: { uid: string; name?: string; email: string; role: string; cabinetId?: string; setupLink: string }) {
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

async function queueUserSetupEmail(user: { uid: string; name?: string; email: string; role: string; cabinetId?: string; setupLink: string }) {
  const payload = buildUserSetupMailPayload(user);
  await getDb().collection('mail').add(payload);
}

async function getClientOrThrow(clientId: string) {
  const snap = await getDb().collection('clients').doc(clientId).get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Client introuvable.');
  }
  return { id: snap.id, ...(snap.data() || {}) } as any;
}

async function assertClientCabinetAccess(
  auth: AuthContext,
  clientId: string,
  allowedRoles: string[] = ['admin', 'accountant']
) {
  const callerRole = getCallerRole(auth);
  if (!allowedRoles.includes(callerRole)) {
    throw new HttpsError('permission-denied', 'Role non autorise pour cette operation.');
  }

  const targetClient = await getClientOrThrow(clientId);
  const targetCabinetId = targetClient.cabinetId;

  if (callerRole === 'admin') {
    return { callerRole, targetClient, targetCabinetId };
  }

  const callerCabinetId = getCallerCabinetId(auth);

  if (!callerCabinetId || callerCabinetId !== targetCabinetId) {
    throw new HttpsError('permission-denied', 'Acces interdit a ce cabinet.');
  }

  return { callerRole, targetClient, targetCabinetId };
}

function throwCallableError(error: unknown, context: string): never {
  logger.error(context, error);
  if (error instanceof HttpsError) {
    throw error;
  }
  const message = error instanceof Error ? error.message : 'Erreur interne.';
  throw new HttpsError('internal', message);
}

type CompanySearchResult = {
  name: string;
  siret: string;
  address: string;
  legalRepresentative: string;
};

type SupportChatMessage = {
  role: 'user' | 'model';
  text: string;
};

type IntelligentSearchOutput = {
  documentTypes?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  vendor?: string;
  keywords?: string[];
  originalQuery: string;
};

type BankReconciliationTransaction = {
  date: string;
  description: string;
  amount: number;
};

type BankReconciliationInvoice = {
  id: string;
  date?: string | null;
  amount?: number | null;
  vendorName?: string | null;
};

type BankReconciliationOutput = {
  matches: Array<{
    transactionIndex: number;
    documentId: string;
    confidenceScore: number;
  }>;
  anomalies: Array<{
    transactionIndex: number;
    reason: string;
  }>;
};

type CreateInvoiceInput = {
  clientId?: unknown;
  documentId?: unknown;
};

type MockBankTransaction = {
  date: string;
  description: string;
  amount: number;
};


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

function normalizeCompanySearchQuery(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Le terme de recherche est obligatoire.');
  }

  const query = value.trim();
  if (query.length < 3 || query.length > 120) {
    throw new HttpsError('invalid-argument', 'Le terme de recherche doit contenir entre 3 et 120 caracteres.');
  }

  return query;
}

function normalizeIntelligentSearchQuery(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'La requete de recherche est obligatoire.');
  }

  const queryText = value.trim();
  if (queryText.length < 2 || queryText.length > 300) {
    throw new HttpsError('invalid-argument', 'La requete de recherche doit contenir entre 2 et 300 caracteres.');
  }

  return queryText;
}

function normalizeIsoDate(value: unknown): string {
  if (typeof value !== 'string') {
    return new Date().toISOString();
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
}

function normalizeBankTransactions(value: unknown): BankReconciliationTransaction[] {
  if (!Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'La liste des transactions est obligatoire.');
  }

  const transactions = value.slice(0, 500).map((transaction): BankReconciliationTransaction => {
    const candidate = transaction as { date?: unknown; description?: unknown; amount?: unknown };
    const date = typeof candidate.date === 'string' ? candidate.date.trim().slice(0, 80) : '';
    const description = typeof candidate.description === 'string' ? candidate.description.trim().slice(0, 500) : '';
    const amount = typeof candidate.amount === 'number'
      ? candidate.amount
      : typeof candidate.amount === 'string'
        ? Number(candidate.amount.replace(',', '.'))
        : Number.NaN;

    if (!date || !description || !Number.isFinite(amount)) {
      throw new HttpsError('invalid-argument', 'Une transaction bancaire est invalide.');
    }

    return { date, description, amount };
  });

  if (transactions.length === 0) {
    throw new HttpsError('invalid-argument', 'Aucune transaction bancaire valide.');
  }

  return transactions;
}

function normalizeDocumentId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'Document obligatoire.');
  }

  return value.trim();
}

function normalizeClientId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'Client obligatoire.');
  }

  return value.trim();
}

function normalizeOptionalCabinetId(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeRequisitionId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'Requisition bancaire obligatoire.');
  }

  return value.trim();
}

async function assertInvoiceCreationAccess(auth: AuthContext, clientId: string) {
  const callerRole = getCallerRole(auth);

  if (callerRole === 'client') {
    if (auth.uid !== clientId) {
      throw new HttpsError('permission-denied', 'Acces interdit a ce client.');
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

async function assertBankAccess(auth: AuthContext, clientId: string, expectedCabinetId?: string) {
  const callerRole = getCallerRole(auth);

  if (callerRole === 'client') {
    if (auth.uid !== clientId) {
      throw new HttpsError('permission-denied', 'Acces interdit a ce client.');
    }

    const targetClient = await getClientOrThrow(clientId);
    const targetCabinetId = targetClient.cabinetId;
    if (expectedCabinetId && targetCabinetId && expectedCabinetId !== targetCabinetId) {
      throw new HttpsError('permission-denied', 'Acces interdit a ce cabinet.');
    }

    return { callerRole, targetClient, targetCabinetId };
  }

  const access = await assertClientCabinetAccess(auth, clientId, ['admin', 'accountant', 'secretary']);
  if (expectedCabinetId && access.targetCabinetId && expectedCabinetId !== access.targetCabinetId) {
    throw new HttpsError('permission-denied', 'Acces interdit a ce cabinet.');
  }

  return access;
}

async function searchFrenchCompanies(query: string): Promise<CompanySearchResult[]> {
  const response = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=5`
  );

  if (!response.ok) {
    logger.error('French company API search failed', {
      status: response.status,
      statusText: response.statusText,
    });
    return [];
  }

  const data = await response.json() as { results?: unknown[] };

  return (data.results || [])
    .map((result): CompanySearchResult | null => {
      const company = result as {
        nom_raison_sociale?: unknown;
        nom_complet?: unknown;
        siege?: { siret?: unknown; adresse?: unknown };
        dirigeants?: Array<{ prenoms?: unknown; nom?: unknown }>;
      };

      const name = typeof company.nom_raison_sociale === 'string'
        ? company.nom_raison_sociale
        : typeof company.nom_complet === 'string'
          ? company.nom_complet
          : '';
      const siret = typeof company.siege?.siret === 'string' ? company.siege.siret : '';

      if (!name || !siret) {
        return null;
      }

      const mainRepresentative = company.dirigeants?.[0];
      const legalRepresentative = mainRepresentative
        ? `${typeof mainRepresentative.prenoms === 'string' ? mainRepresentative.prenoms : ''} ${typeof mainRepresentative.nom === 'string' ? mainRepresentative.nom : ''}`.trim()
        : '';

      return {
        name,
        siret,
        address: typeof company.siege?.adresse === 'string' ? company.siege.adresse : '',
        legalRepresentative: legalRepresentative || 'N/A',
      };
    })
    .filter((result): result is CompanySearchResult => result !== null);
}

function normalizeSupportChatHistory(value: unknown): SupportChatMessage[] {
  if (!Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Historique de conversation invalide.');
  }

  return value.slice(-20).map((message): SupportChatMessage => {
    const candidate = message as {
      role?: unknown;
      text?: unknown;
      content?: Array<{ text?: unknown }>;
    };
    const role = candidate.role === 'user' ? 'user' : 'model';
    const rawText = typeof candidate.text === 'string'
      ? candidate.text
      : typeof candidate.content?.[0]?.text === 'string'
        ? candidate.content[0].text
        : '';
    const text = rawText.trim().slice(0, 1500);

    if (!text) {
      throw new HttpsError('invalid-argument', 'Un message de conversation est vide.');
    }

    return { role, text };
  });
}

async function generateSupportChatAnswer(history: SupportChatMessage[], financialContext: string = ''): Promise<string> {
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

async function loadApprovedInvoicesForReconciliation(
  clientId: string,
  cabinetId?: string
): Promise<BankReconciliationInvoice[]> {
  const snapshot = await getDb()
    .collection('documents')
    .where('clientId', '==', clientId)
    .where('status', '==', 'approved')
    .get();

  return snapshot.docs
    .map((docSnap): BankReconciliationInvoice | null => {
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
    .filter((invoice): invoice is BankReconciliationInvoice => invoice !== null);
}

async function generateBankReconciliation(
  transactions: BankReconciliationTransaction[],
  invoices: BankReconciliationInvoice[]
): Promise<BankReconciliationOutput> {
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

async function createProcessingInvoiceForDocument(clientId: string, documentId: string, cabinetId?: string): Promise<string> {
  const db = getDb();
  const documentSnap = await db.collection('documents').doc(documentId).get();
  if (!documentSnap.exists) {
    throw new HttpsError('not-found', 'Document introuvable.');
  }

  const documentData = documentSnap.data() || {};
  if (documentData.clientId !== clientId) {
    throw new HttpsError('permission-denied', 'Le document ne correspond pas au client.');
  }

  if (cabinetId && documentData.cabinetId && documentData.cabinetId !== cabinetId) {
    throw new HttpsError('permission-denied', 'Acces interdit a ce document.');
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
    throw new HttpsError('not-found', 'Client introuvable.');
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

function buildMockBankTransactions(): MockBankTransaction[] {
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

async function generateIntelligentSearchCriteria(queryText: string, currentDate: string): Promise<IntelligentSearchOutput> {
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

  return {
    ...(output || {}),
    originalQuery: output?.originalQuery || queryText,
  };
}

export const searchCompany = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{ query?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const query = normalizeCompanySearchQuery(request.data?.query);
      const results = await searchFrenchCompanies(query);
      return { results };
    } catch (error) {
      throwCallableError(error, 'searchCompany failed');
    }
  }
);

export const extractClientData = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{ searchTerm?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const searchTerm = normalizeCompanySearchQuery(request.data?.searchTerm);
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
    } catch (error) {
      throwCallableError(error, 'extractClientData failed');
    }
  }
);

export const getBankAuthLink = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{ clientId?: unknown; cabinetId?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const clientId = normalizeClientId(request.data?.clientId);
      const cabinetId = normalizeOptionalCabinetId(request.data?.cabinetId);
      const { targetCabinetId } = await assertBankAccess(request.auth, clientId, cabinetId);
      const token = randomBytes(8).toString('base64url');
      const mockAuthUrl = `https://ob.nordigen.com/psd2/start/mock-auth-${token}`;

      logger.info('Mock bank auth link generated', {
        clientId,
        cabinetId: targetCabinetId || cabinetId || null,
        callerUid: request.auth.uid,
      });

      return { success: true, url: mockAuthUrl };
    } catch (error) {
      throwCallableError(error, 'getBankAuthLink failed');
    }
  }
);

export const finalizeBankConnection = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{ clientId?: unknown; cabinetId?: unknown; requisitionId?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const clientId = normalizeClientId(request.data?.clientId);
      const cabinetId = normalizeOptionalCabinetId(request.data?.cabinetId);
      const requisitionId = normalizeRequisitionId(request.data?.requisitionId);
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
    } catch (error) {
      throwCallableError(error, 'finalizeBankConnection failed');
    }
  }
);

export const syncBankTransactions = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{ clientId?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const clientId = normalizeClientId(request.data?.clientId);
      await assertBankAccess(request.auth, clientId);
      return {
        success: true,
        transactions: buildMockBankTransactions(),
      };
    } catch (error) {
      throwCallableError(error, 'syncBankTransactions failed');
    }
  }
);

export const createInvoiceForDocument = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<CreateInvoiceInput>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const clientId = typeof request.data?.clientId === 'string' ? request.data.clientId.trim() : '';
      if (!clientId) {
        throw new HttpsError('invalid-argument', 'Client obligatoire.');
      }

      const documentId = normalizeDocumentId(request.data?.documentId);
      const { targetCabinetId } = await assertInvoiceCreationAccess(request.auth, clientId);
      const invoiceId = await createProcessingInvoiceForDocument(clientId, documentId, targetCabinetId);

      return { success: true, id: invoiceId };
    } catch (error) {
      throwCallableError(error, 'createInvoiceForDocument failed');
    }
  }
);

export const intelligentSearch = onCall(
  { region: 'europe-west9', memory: '512MiB', timeoutSeconds: 60 },
  async (request: CallableRequest<{ query?: unknown; currentDate?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const queryText = normalizeIntelligentSearchQuery(request.data?.query);
      const currentDate = normalizeIsoDate(request.data?.currentDate);
      const criteria = await generateIntelligentSearchCriteria(queryText, currentDate);
      return criteria;
    } catch (error) {
      throwCallableError(error, 'intelligentSearch failed');
    }
  }
);

export const runBankReconciliation = onCall(
  { region: 'europe-west9', memory: '512MiB', timeoutSeconds: 120 },
  async (request: CallableRequest<{ transactions?: unknown; clientId?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const clientId = typeof request.data?.clientId === 'string' ? request.data.clientId.trim() : '';
      if (!clientId) {
        throw new HttpsError('invalid-argument', 'Client obligatoire.');
      }

      const { targetCabinetId } = await assertClientCabinetAccess(
        request.auth,
        clientId,
        ['admin', 'accountant', 'secretary']
      );
      const transactions = normalizeBankTransactions(request.data?.transactions);
      const invoices = await loadApprovedInvoicesForReconciliation(clientId, targetCabinetId);
      const result = await generateBankReconciliation(transactions, invoices);

      return { success: true, ...result };
    } catch (error) {
      throwCallableError(error, 'runBankReconciliation failed');
    }
  }
);

export const saveBankReconciliation = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{
    clientId?: unknown;
    clientName?: unknown;
    summary?: unknown;
    matches?: unknown;
    anomalies?: unknown;
  }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const clientId = typeof request.data?.clientId === 'string' ? request.data.clientId.trim() : '';
      if (!clientId) {
        throw new HttpsError('invalid-argument', 'Client obligatoire.');
      }

      const { targetCabinetId } = await assertClientCabinetAccess(
        request.auth,
        clientId,
        ['admin', 'accountant', 'secretary']
      );

      const docRef = await getDb().collection('reconciliations').add({
        clientId,
        cabinetId: targetCabinetId || null,
        clientName: typeof request.data?.clientName === 'string' ? request.data.clientName : '',
        summary: typeof request.data?.summary === 'object' && request.data.summary !== null ? request.data.summary : {},
        matches: Array.isArray(request.data?.matches) ? request.data.matches.slice(0, 500) : [],
        anomalies: Array.isArray(request.data?.anomalies) ? request.data.anomalies.slice(0, 500) : [],
        createdAt: new Date().toISOString(),
        createdBy: request.auth.uid,
        status: 'completed',
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      throwCallableError(error, 'saveBankReconciliation failed');
    }
  }
);

export const supportChat = onCall(
  { region: 'europe-west9', memory: '512MiB', timeoutSeconds: 60 },
  async (request: CallableRequest<{ history?: unknown, clientId?: unknown }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    try {
      const history = normalizeSupportChatHistory(request.data?.history);
      
      let financialContext = '';
      if (typeof request.data?.clientId === 'string' && request.data.clientId.trim() !== '') {
        const clientId = request.data.clientId.trim();
        const db = getDb();
        const snapshot = await db.collection('documents')
          .where('clientId', '==', clientId)
          .where('status', '==', 'approved')
          .get();
        
        let totalSpent = 0;
        let totalVat = 0;
        const vendors: Record<string, number> = {};

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const amounts = data.extractedData?.amounts || [];
            const vat = data.extractedData?.vatAmount || 0;
            const vendor = (data.extractedData?.vendorNames || [])[0] || 'Inconnu';
            const amount = amounts.reduce((a: number, b: number) => a + b, 0);
            
            totalSpent += amount;
            totalVat += vat;
            vendors[vendor] = (vendors[vendor] || 0) + amount;
        });

        const topVendors = Object.entries(vendors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, val]) => `${name} (${val.toFixed(2)} €)`);

        financialContext = `
Nombre de documents approuvés: ${snapshot.docs.length}
Total des dépenses TTC: ${totalSpent.toFixed(2)} €
TVA Déductible totale: ${totalVat.toFixed(2)} €
Top Fournisseurs: ${topVendors.length > 0 ? topVendors.join(', ') : 'Aucun'}
`;
      }

      const response = await generateSupportChatAnswer(history, financialContext);
      return { response };
    } catch (error) {
      throwCallableError(error, 'supportChat failed');
    }
  }
);


// type AnalyzeMailOutput = z.infer<typeof analyzeMailOutputSchema>;

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
    const clientCabinetId = clientSnap.data()?.cabinetId || "";

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
      const fileSize = metadata.size ? parseInt(metadata.size as string, 10) : 0;
      const sizeInMB = fileSize / (1024 * 1024);
      if (sizeInMB > 10) throw new Error(`Fichier trop volumineux (${sizeInMB.toFixed(2)} Mo).`);

      const [fileBuffer] = await file.download();

      logger.log(`Ã‰tape 1 : Analyse multimodale structurÃ©e (One-Shot) via Gemini (${contentType})`);

      const documentUri = `data:${contentType};base64,${fileBuffer.toString("base64")}`;

      const { output } = await ai.generate({
        model: googleAI.model("gemini-1.5-flash"),
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

      if (!output) throw new Error("L'analyse IA a retournÃ© une sortie vide.");

      const validation = analyzeMailOutputSchema.safeParse(output);
      if (!validation.success) {
        logger.error("RÃ©sultat IA invalide :", validation.error.issues);
        throw new Error("Le JSON retournÃ© par Gemini ne respecte pas le schÃ©ma attendu.");
      }

      const analysisResult: any = validation.data;
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue pendant le traitement.";
      logger.error(`âŒ Ã‰chec traitement mailId=${mailId} : ${errorMessage}`);

      await mailDocRef.set({
        status: "Erreur d'analyse",
        analysis: { error: errorMessage },
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
);

// --- ðŸŽ¯ PHASE 2.2 : WEBHOOK MAIL-TO-BOX (Ingestion via E-mail) --- //
// Service d'ingestion recommandÃ© : Postmark Inbound Webhook (JSON pur, pas de mutipart/form-data complexe)

export const inboundEmailWebhook = onRequest(
  { region: "europe-west9", memory: "256MiB", maxInstances: 10 },
  async (req: any, res: any) => {
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
      && timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));

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
    } catch(err: any) {
        logger.error("Erreur Webhook Mail-to-Box : " + err);
        res.status(500).send("Internal Webhook Error");
    }
  }
);


// --- ðŸŽ¯ ADMINISTRATION : Gestion des RÃ´les & Utilisateurs (v2) --- //

/**
 * DÃ©finit l'utilisateur actuel comme administrateur (setup initial).
 * Version robuste : crÃ©e le profil s'il n'existe pas et vÃ©rifie l'email.
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
        throw new HttpsError('permission-denied', 'Email non autorisÃ©.');
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
    } catch (error: any) {
        console.error("âŒ Erreur de synchro:", error);
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

    const auth = request.auth;
    const callingUserRole = getCallerRole(auth);
    const targetRole = request.data.role || 'client';
    if (!['admin', 'accountant', 'secretary', 'client'].includes(targetRole)) {
      throw new HttpsError('invalid-argument', 'Role cible invalide.');
    }

    // Hierarchie de securite: seules les custom claims font autorite.
    if (!['admin', 'accountant', 'secretary'].includes(callingUserRole)) {
      throw new HttpsError('permission-denied', 'Role non autorise pour creer un compte.');
    }
    if (callingUserRole === 'secretary' && targetRole !== 'client') {
      throw new HttpsError('permission-denied', 'Un secrÃ©taire ne peut crÃ©er que des comptes clients.');
    }
    if (callingUserRole === 'accountant' && !['accountant', 'secretary', 'client'].includes(targetRole)) {
      throw new HttpsError('permission-denied', 'Un comptable ne peut pas crÃ©er d\'administrateur systÃ¨me.');
    }

    const { email } = request.data;
    if (!email) {
      throw new HttpsError('invalid-argument', 'Email requis.');
    }

    try {
      const profileDataClean: any = { ...request.data };
      delete profileDataClean.email;
      delete profileDataClean.password;
      delete profileDataClean.role;

      let targetCabinetId = typeof profileDataClean.cabinetId === 'string'
        ? profileDataClean.cabinetId
        : undefined;

      if (targetRole === 'admin') {
        if (callingUserRole !== 'admin') {
          throw new HttpsError('permission-denied', 'Seul un administrateur systeme peut creer un administrateur.');
        }
        delete profileDataClean.cabinetId;
        delete profileDataClean.isCabinetAdmin;
        targetCabinetId = undefined;
      } else if (callingUserRole !== 'admin') {
        const callerCabinetId = getCallerCabinetId(auth);

        if (!callerCabinetId) {
          throw new HttpsError('failed-precondition', 'Votre compte n est rattache a aucun cabinet.');
        }
        if (targetCabinetId && targetCabinetId !== callerCabinetId) {
          throw new HttpsError('permission-denied', 'Creation interdite hors de votre cabinet.');
        }

        targetCabinetId = callerCabinetId;
        profileDataClean.cabinetId = callerCabinetId;
        delete profileDataClean.isCabinetAdmin;
      } else if (!targetCabinetId) {
        throw new HttpsError('invalid-argument', 'cabinetId requis pour un compte cabinet ou client.');
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

      const claims: Record<string, string> = { role };
      if (targetCabinetId) {
        claims.cabinetId = targetCabinetId;
      }
      await admin.auth().setCustomUserClaims(uid, claims);

      await getDb().collection('clients').doc(uid).set({
        ...profileDataClean,
        email,
        role,
        newDocuments: 0,
        lastActivity: new Date().toISOString(),
        status: 'onboarding',
        createdBy: auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      let setupLink: string | undefined;
      let emailQueued = false;
      try {
        setupLink = await admin.auth().generatePasswordResetLink(email, {
          url: getAccountSetupUrl(),
          handleCodeInApp: false,
        });
      } catch (linkError) {
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
        } catch (mailError) {
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
    } catch (error: any) {
      logger.error('Erreur lors de la crÃ©ation de l\'utilisateur:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Cet email est dÃ©jÃ  utilisÃ© par un autre compte.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new HttpsError('invalid-argument', 'L\'adresse email fournie est invalide.');
      }
      if (error.code === 'auth/weak-password') {
        throw new HttpsError('invalid-argument', 'Le mot de passe fourni est trop faible. Il doit contenir au moins 6 caractÃ¨res.');
      }
      throw new HttpsError('internal', "Erreur lors de la crÃ©ation du compte : " + error.message, error.message);
    }
  }
);

export const sendUserSetupEmail = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const clientId = request.data?.clientId;
    if (typeof clientId !== 'string' || !clientId.trim()) {
      throw new HttpsError('invalid-argument', 'clientId requis.');
    }

    try {
      const { targetClient, targetCabinetId } = await assertClientCabinetAccess(
        request.auth,
        clientId,
        ['admin', 'accountant', 'secretary']
      );

      if (targetClient.role !== 'client') {
        throw new HttpsError('failed-precondition', 'Le renvoi d acces est reserve aux comptes clients.');
      }

      const email = String(targetClient.email || '').trim().toLowerCase();
      if (!email) {
        throw new HttpsError('failed-precondition', 'Ce client n a pas d email de connexion.');
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
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new HttpsError('failed-precondition', 'Le compte Auth de ce client est introuvable.');
      }
      throwCallableError(error, 'Erreur sendUserSetupEmail:');
    }
  }
);

/**
 * Prepare un lien d'invitation cabinet signe et expirant.
 */
export const prepareCabinetInvitation = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    if (getCallerRole(request.auth) !== 'admin') {
      throw new HttpsError('permission-denied', 'Seul un administrateur systeme peut inviter un cabinet.');
    }

    const cabinetId = request.data?.cabinetId;
    if (typeof cabinetId !== 'string' || !cabinetId.trim()) {
      throw new HttpsError('invalid-argument', 'cabinetId requis.');
    }

    try {
      const cabinetRef = getDb().collection('cabinets').doc(cabinetId);
      const cabinetSnap = await cabinetRef.get();
      if (!cabinetSnap.exists) {
        throw new HttpsError('not-found', 'Cabinet introuvable.');
      }

      const cabinetData = cabinetSnap.data();
      if (cabinetData?.invitationStatus === 'accepted') {
        throw new HttpsError('failed-precondition', 'Ce cabinet est deja configure.');
      }
      if (!cabinetData?.email) {
        throw new HttpsError('failed-precondition', 'Ce cabinet n a pas d email de contact.');
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
    } catch (error) {
      throwCallableError(error, 'Erreur prepareCabinetInvitation:');
    }
  }
);

/**
 * Cree un cabinet depuis le super admin et envoie immediatement le lien d'activation.
 */
export const createCabinetWithInvitation = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    if (getCallerRole(request.auth) !== 'admin') {
      throw new HttpsError('permission-denied', 'Seul un administrateur systeme peut creer un cabinet.');
    }

    const name = String(request.data?.name || '').trim();
    const email = String(request.data?.email || '').trim().toLowerCase();
    const plan = String(request.data?.plan || 'starter');
    const allowedPlans = ['starter', 'professional', 'enterprise', 'elite'];

    if (!name) {
      throw new HttpsError('invalid-argument', 'Nom du cabinet requis.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Email cabinet invalide.');
    }
    if (!allowedPlans.includes(plan)) {
      throw new HttpsError('invalid-argument', 'Plan cabinet invalide.');
    }

    const maxClients = Number(request.data?.quotas?.maxClients || 10);
    const maxDocumentsPerMonth = Number(request.data?.quotas?.maxDocumentsPerMonth || 100);
    const maxCollaborators = Number(request.data?.quotas?.maxCollaborators || 5);
    const storageLimitGb = Number(request.data?.quotas?.storageLimitGb || 5);

    try {
      const duplicateCabinet = await getDb().collection('cabinets').where('email', '==', email).limit(1).get();
      if (!duplicateCabinet.empty) {
        throw new HttpsError('already-exists', 'Un cabinet utilise deja cet email.');
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
    } catch (error) {
      throwCallableError(error, 'Erreur createCabinetWithInvitation:');
    }
  }
);

/**
 * Regenere et envoie le lien d'activation d'un cabinet existant.
 */
export const sendCabinetInvitation = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    if (getCallerRole(request.auth) !== 'admin') {
      throw new HttpsError('permission-denied', 'Seul un administrateur systeme peut inviter un cabinet.');
    }

    const cabinetId = request.data?.cabinetId;
    if (typeof cabinetId !== 'string' || !cabinetId.trim()) {
      throw new HttpsError('invalid-argument', 'cabinetId requis.');
    }

    try {
      const cabinetRef = getDb().collection('cabinets').doc(cabinetId);
      const cabinetSnap = await cabinetRef.get();
      if (!cabinetSnap.exists) {
        throw new HttpsError('not-found', 'Cabinet introuvable.');
      }

      const cabinetData = cabinetSnap.data();
      if (cabinetData?.invitationStatus === 'accepted') {
        throw new HttpsError('failed-precondition', 'Ce cabinet est deja configure.');
      }
      if (!cabinetData?.email || !cabinetData?.name) {
        throw new HttpsError('failed-precondition', 'Nom et email cabinet requis.');
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
    } catch (error) {
      throwCallableError(error, 'Erreur sendCabinetInvitation:');
    }
  }
);

/**
 * Verifie un lien d'invitation cabinet sans exposer le document Firestore.
 */
export const verifyCabinetInvitation = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    const { cabinetId, token } = request.data || {};
    if (!cabinetId || !token) {
      throw new HttpsError('invalid-argument', 'cabinetId et token requis.');
    }

    try {
      const cabinetSnap = await getDb().collection('cabinets').doc(cabinetId).get();
      if (!cabinetSnap.exists) {
        throw new HttpsError('not-found', 'Invitation introuvable.');
      }

      const cabinetData = cabinetSnap.data();
      if (cabinetData?.invitationStatus === 'accepted') {
        return {
          valid: false,
          status: 'accepted',
          name: cabinetData.name,
        };
      }

      if (!cabinetData?.invitationTokenHash || hashInvitationToken(token) !== cabinetData.invitationTokenHash) {
        throw new HttpsError('permission-denied', 'Lien d invitation invalide.');
      }

      const expiresAtRaw = cabinetData.invitationExpiresAt;
      const expiresAt = expiresAtRaw?.toDate ? expiresAtRaw.toDate() : new Date(expiresAtRaw);
      if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        throw new HttpsError('deadline-exceeded', 'Ce lien d invitation a expire.');
      }

      return {
        valid: true,
        status: cabinetData?.invitationStatus || 'pending',
        name: cabinetData?.name,
        email: cabinetData?.email,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      throwCallableError(error, 'Erreur verifyCabinetInvitation:');
    }
  }
);

/**
 * Finalise l'onboarding d'un cabinet invitÃ©.
 */
export const setupInvitedCabinet = onCall(
  { region: "europe-west9" },
  async (request: CallableRequest<any>) => {
    const { cabinetId, password, email, name, token } = request.data;

    if (!cabinetId || !password || !email || !token) {
      throw new HttpsError('invalid-argument', 'ParamÃ¨tres manquants.');
    }
    if (typeof password !== 'string' || password.length < 12) {
      throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 12 caracteres.');
    }

    try {
      // 1. VÃ©rifier que le cabinet existe et est en attente
      const cabinetRef = getDb().collection('cabinets').doc(cabinetId);
      const cabinetSnap = await cabinetRef.get();

      if (!cabinetSnap.exists) {
        throw new HttpsError('not-found', 'Cabinet introuvable.');
      }

      const cabinetData = cabinetSnap.data();
      if (cabinetData?.invitationStatus === 'accepted') {
        throw new HttpsError('already-exists', 'Ce cabinet est dÃ©jÃ  configurÃ©.');
      }
      if (!cabinetData?.invitationTokenHash || hashInvitationToken(token) !== cabinetData.invitationTokenHash) {
        throw new HttpsError('permission-denied', 'Lien d invitation invalide.');
      }

      const expiresAtRaw = cabinetData.invitationExpiresAt;
      const expiresAt = expiresAtRaw?.toDate ? expiresAtRaw.toDate() : new Date(expiresAtRaw);
      if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
        throw new HttpsError('deadline-exceeded', 'Ce lien d invitation a expire.');
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const expectedEmail = String(cabinetData.email || '').trim().toLowerCase();
      if (!expectedEmail || normalizedEmail !== expectedEmail) {
        throw new HttpsError('permission-denied', 'Email non autorise pour cette invitation.');
      }

      // 2. CrÃ©er ou rÃ©cupÃ©rer l'utilisateur Auth
      let uid: string;
      try {
        const userRecord = await admin.auth().createUser({
          email: normalizedEmail,
          password,
          displayName: name || cabinetData.name,
          emailVerified: true
        });
        uid = userRecord.uid;
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          const existingUser = await admin.auth().getUserByEmail(normalizedEmail);
          const existingClaims = existingUser.customClaims || {};
          if (
            (existingClaims.cabinetId && existingClaims.cabinetId !== cabinetId) ||
            (existingClaims.role && existingClaims.role !== 'accountant')
          ) {
            throw new HttpsError('already-exists', 'Cet email est deja rattache a un autre compte.');
          }
          uid = existingUser.uid;
          // SÃ‰CURITÃ‰ : Ne pas rÃ©initialiser le mot de passe d'un utilisateur existant.
          logger.warn(`L'utilisateur ${normalizedEmail} existe dÃ©jÃ . Liaison au cabinet ${cabinetId} sans reset password.`);
        } else {
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
    } catch (error: any) {
      if (error?.code === 'auth/weak-password') {
        throw new HttpsError('invalid-argument', 'Le mot de passe fourni est trop faible.');
      }
      throwCallableError(error, 'Setup cabinet error:');
    }
  }
);

/**
 * Trigger centralisÃ© pour le traitement IA des documents.
 * Se dÃ©clenche dÃ¨s qu'un document est crÃ©Ã© ou mis Ã  jour avec le statut 'pending'.
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
        await event.data?.after.ref.update({ status: 'processing' });

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

        const vendor = extractedData.vendorNames?.[0];
        const date = extractedData.dates?.[0];
        const amount = extractedData.amounts?.[0];

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
                    otherData?.vendorNames?.includes(vendor) &&
                    otherData?.dates?.includes(date)) {
                    isDuplicate = true;
                    existingId = otherDoc.id;
                    break;
                }
            }
        }

        // 5. Calcul de la monÃ©tisation (billable lines)
        const billableLines = calculateBillableLines(extractedData, documentType);

        // 6. Mise Ã  jour finale du document
        const updateData: any = {
            extractedData,
            billableLines,
            type: extractedData.documentType || documentType,
            status: isDuplicate ? 'duplicate' : 'reviewing',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            'auditTrail': admin.firestore.FieldValue.arrayUnion({
                action: isDuplicate ? `Doublon dÃ©tectÃ© (ID: ${existingId})` : 'Analyse IA automatique terminÃ©e',
                date: new Date().toISOString(),
                user: 'SystÃ¨me AI'
            })
        };

        if (isDuplicate) {
            updateData.anomalies = admin.firestore.FieldValue.arrayUnion("Doublon potentiel dÃ©tectÃ© : une facture identique existe dÃ©jÃ .");
        }

        await event.data?.after.ref.update(updateData);

        logger.log(`âœ… [Processor] SuccÃ¨s pour ${docId} : ${billableLines} lignes dÃ©tectÃ©es. ${isDuplicate ? '(DOUBLON)' : ''}`);

        // 7. Report usage to Stripe & Update Cabinet Quotas if NOT a duplicate
        if (!isDuplicate) {
            try {
                // RÃ©cupÃ©rer le cabinet liÃ© au client
                const clientDoc = await getDb().collection("clients").doc(data.clientId).get();
                const clientData = clientDoc.data();
                const cabinetId = clientData?.cabinetId;

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

                    if (cabinetData?.stripeSubscriptionItemId) {
                        logger.log(`ðŸ’³ [Stripe] Reporting usage for cabinet ${cabinetId} : ${billableLines} lines`);
                        const { StripeService } = await import('./stripe.js');
                        await StripeService.reportUsage(cabinetData.stripeSubscriptionItemId, billableLines);
                    }
                }
            } catch (billingError) {
                logger.error(`âš ï¸ [Billing] Erreur lors du report de consommation pour ${docId}:`, billingError);
            }
        }

    } catch (error: any) {
        logger.error(`âŒ [Processor] Ã‰chec pour ${docId} :`, error);
        await event.data?.after.ref.update({
            status: 'error',
            'auditTrail': admin.firestore.FieldValue.arrayUnion({
                action: `Erreur d'analyse IA : ${error.message}`,
                date: new Date().toISOString(),
                user: 'SystÃ¨me AI'
            })
        });
    }
  }
);

/**
 * GÃ©nÃ¨re un lien vers le Portail Client Stripe.
 */
export const createPortalSession = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Vous devez Ãªtre connectÃ©.');
        }

        const uid = request.auth.uid;
        const clientDoc = await getDb().collection("clients").doc(uid).get();
        const clientData = clientDoc.data();

        if (!clientData?.stripeCustomerId) {
            throw new HttpsError('failed-precondition', "Aucun compte client Stripe n'est configurÃ©.");
        }

        try {
            const { StripeService } = await import('./stripe.js');
            const returnUrl = request.data.returnUrl || `${getAppBaseUrl()}/dashboard/settings`;
            const session = await StripeService.createPortalSession(clientData.stripeCustomerId, returnUrl);
            return { url: session.url };
        } catch (error: any) {
            logger.error('Erreur Portail Stripe:', error);
            throw new HttpsError('internal', error.message);
        }
    }
);

/**
 * GÃ©nÃ¨re un lien Checkout Stripe pour l'abonnement d'un cabinet.
 * (RÃ©servÃ© aux super-admins)
 */
export const generateCabinetCheckout = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

        const { cabinetId, priceId } = request.data;
        if (!cabinetId || !priceId) {
            throw new HttpsError('invalid-argument', 'cabinetId et priceId requis.');
        }

        const callerRole = getCallerRole(request.auth);
        if (callerRole !== 'admin') {
             throw new HttpsError('permission-denied', 'Seul l\'administrateur systÃ¨me peut gÃ©nÃ©rer ce lien.');
        }

        const cabinetDoc = await getDb().collection("cabinets").doc(cabinetId).get();
        if (!cabinetDoc.exists) {
            throw new HttpsError('not-found', 'Cabinet introuvable.');
        }

        const cabinetData = cabinetDoc.data();
        const email = cabinetData?.email || request.auth.token.email;

        try {
            const { StripeService } = await import('./stripe.js');
            const successUrl = `${getAppBaseUrl()}/dashboard/admin/subscriptions?success=true`;
            const cancelUrl = `${getAppBaseUrl()}/dashboard/admin/subscriptions?canceled=true`;

            const session = await StripeService.createCheckoutSession(
                cabinetId,
                priceId,
                email,
                successUrl,
                cancelUrl
            );

            return { url: session.url };
        } catch (error: any) {
             logger.error('Erreur Checkout Stripe:', error);
             throw new HttpsError('internal', error.message);
        }
    }
);

/**
 * Webhook Stripe pour Ã©couter les paiements et Ã©vÃ©nements d'abonnement.
 */
export const stripeWebhook = onRequest(
    { region: "europe-west9" },
    async (req, res) => {
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
            event = StripeService.constructWebhookEvent((req as any).rawBody, sig as string, endpointSecret);
        } catch (err: any) {
            logger.error(`Webhook signature verification failed.`, err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as any;
                    const cabinetId = session.metadata?.cabinetId;

                    if (cabinetId) {
                        logger.info(`Checkout completed for cabinet ${cabinetId}`);

                        let stripeSubscriptionItemId = null;
                        if (session.subscription) {
                            try {
                                const { StripeService } = await import('./stripe.js');
                                const subscriptionDetails = await StripeService.getSubscription(session.subscription as string);
                                // Trouver l'item avec un usage "metered" (au compteur)
                                const meteredItem = subscriptionDetails.items.data.find((item: any) => item.price.recurring?.usage_type === 'metered');
                                if (meteredItem) {
                                    stripeSubscriptionItemId = meteredItem.id;
                                    logger.info(`Found metered subscription item: ${stripeSubscriptionItemId}`);
                                } else if (subscriptionDetails.items.data.length > 0) {
                                    // Fallback: prendre le premier item si la configuration n'est pas explicite
                                    stripeSubscriptionItemId = subscriptionDetails.items.data[0].id;
                                    logger.info(`No specific metered item found, defaulting to: ${stripeSubscriptionItemId}`);
                                }
                            } catch (e: any) {
                                logger.error(`Error fetching subscription details: ${e.message}`);
                            }
                        }

                        const updateData: any = {
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
                    const subscription = event.data.object as any;
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

            res.json({received: true});
        } catch (error) {
            logger.error('Error processing webhook:', error);
            res.status(500).send('Webhook processing error');
        }
    }
);

/**
 * Exporte une sÃ©lection de documents au format comptable (FEC ou CSV).
 */
export const exportDocuments = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Vous devez Ãªtre connectÃ©.');
        }

        const { documentIds, format: exportFormat } = request.data;
        if (!documentIds || !Array.isArray(documentIds)) {
            throw new HttpsError('invalid-argument', 'Les documentIds doivent Ãªtre fournis sous forme de tableau.');
        }

        const callerUid = request.auth.uid;
        const callerRole = getCallerRole(request.auth);
        const isGlobalAdmin = callerRole === 'admin';

        let callerCabinetId: string | undefined;
        if (!isGlobalAdmin && callerRole !== 'client') {
            callerCabinetId = getCallerCabinetId(request.auth);
        }

        try {
            // 1. RÃ©cupÃ©rer les documents
            const docsToExport = [];
            for (const id of documentIds) {
                const docSnap = await getDb().collection("documents").doc(id).get();
                if (docSnap.exists) {
                    const docData = docSnap.data() as any;

                    // SÃ‰CURITÃ‰ : VÃ©rification de l'isolation client/cabinet
                    if (callerRole === 'client' && docData.clientId !== callerUid) {
                        logger.warn(`Tentative d'export illÃ©gal par ${callerUid} pour le doc ${id}`);
                        continue;
                    }
                    if (
                        !isGlobalAdmin &&
                        callerRole !== 'client' &&
                        (!['accountant', 'secretary'].includes(callerRole) || docData.cabinetId !== callerCabinetId)
                    ) {
                        logger.warn(`Tentative d'export illÃ©gal par ${callerUid} pour le doc ${id}`);
                        continue;
                    }

                    docsToExport.push({ ...docData, id: docSnap.id });
                }
            }

            if (docsToExport.length === 0) {
                throw new HttpsError('not-found', 'Aucun document trouvÃ© pour l\'export.');
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
            } else {
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
        } catch (error: any) {
            throwCallableError(error, 'Erreur Export:');
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
    }
);

/**
 * GÃ©nÃ¨re manuellement (ou via scheduler) le briefing hebdomadaire.
 */
export const requestWeeklySummary = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

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
    }
);

/**
 * Moteur de lettrage algorithmique : Rapprochement bancaire backend
 */
export const autoMatchBankTransactions = onCall(
    { region: "europe-west9", memory: "1GiB" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisé');

        const clientId = request.data.clientId || request.auth.uid;
        const callerRole = getCallerRole(request.auth);

        if (callerRole === 'client' && clientId !== request.auth.uid) {
            throw new HttpsError('permission-denied', 'Vous ne pouvez pas accéder à ce dossier.');
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
                .map(doc => ({ id: doc.id, ...doc.data() } as any));

            const batch = db.batch();
            let matchCount = 0;
            let suggestionCount = 0;

            // Fonction utilitaire de scoring multicritère
            const calculateMatchScore = (tx: any, inv: any): number => {
                let score = 0;
                
                // 1. Comparaison de montant (TTC vs Transaction)
                const txAmount = Math.abs(tx.amount);
                const invAmount = Math.abs(inv.extractedData?.amounts?.[0] || inv.amount || 0);
                
                if (txAmount === invAmount) {
                    score += 55;
                } else if (Math.abs(txAmount - invAmount) < 0.05) {
                    score += 35; // Tolérance centimes
                } else if (Math.abs(txAmount - invAmount) < 1.00) {
                    score += 15; // Écart mineur
                }
                
                // 2. Comparaison de date (Date Facture vs Date Transaction)
                const txDateStr = tx.date;
                const invDateStr = inv.extractedData?.dates?.[0] || inv.date || inv.uploadDate;
                if (txDateStr && invDateStr) {
                    const txDate = new Date(txDateStr);
                    const invDate = new Date(invDateStr);
                    const diffTime = Math.abs(txDate.getTime() - invDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 3) {
                        score += 30;
                    } else if (diffDays <= 10) {
                        score += 15;
                    } else if (diffDays <= 30) {
                        score += 5;
                    }
                }
                
                // 3. Comparaison de nom de tiers (Libellé Transaction vs Nom Fournisseur)
                const txDesc = (tx.description || '').toLowerCase();
                const vendorName = (inv.extractedData?.vendorNames?.[0] || inv.vendorName || inv.name || '').toLowerCase();
                
                if (vendorName && txDesc) {
                    const cleanStr = (s: string) => s.replace(/[^a-z0-9]/g, '');
                    const cTx = cleanStr(txDesc);
                    const cVendor = cleanStr(vendorName);
                    
                    if (cTx.includes(cVendor) || cVendor.includes(cTx)) {
                        score += 20;
                    } else {
                        const txWords = txDesc.split(/\s+/).filter((w: string) => w.length > 3);
                        const vendorWords = vendorName.split(/\s+/).filter((w: string) => w.length > 3);
                        const commonWords = txWords.filter((w: string) => vendorWords.includes(w));
                        if (commonWords.length > 0) {
                            score += 15;
                        }
                    }
                }
                
                return score;
            };

            for (const bsDoc of bankStatementsSnap.docs) {
                const data = bsDoc.data();
                if (!data.extractedData?.transactions) continue;

                let updated = false;
                const transactions = [...data.extractedData.transactions];

                for (let i = 0; i < transactions.length; i++) {
                    const tx = transactions[i];
                    
                    // Si déjà rapproché, on ne touche à rien
                    if (tx.matchingDocumentId || tx.status === 'matched') continue;

                    // Calculer le meilleur match parmi toutes les factures disponibles
                    let bestMatch: any = null;
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
                        if (matchIndex > -1) invoices.splice(matchIndex, 1);

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
                    } else if (bestMatch && bestScore >= 50) {
                        // Suggestion IA (à valider par l'utilisateur)
                        tx.suggestedDocId = bestMatch.id;
                        tx.suggestedConfidenceScore = bestScore;
                        tx.suggestedVendor = bestMatch.extractedData?.vendorNames?.[0] || bestMatch.vendorName || bestMatch.name || 'Vendeur Inconnu';
                        tx.status = 'pending';
                        
                        updated = true;
                        suggestionCount++;
                    } else {
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
        } catch (error: any) {
            throwCallableError(error, 'Erreur Auto-Lettrage:');
        }
    }
);

/**
 * GÃ©nÃ¨re une fiche d'amortissement linÃ©aire (V1)
 */
export const generateAssetSchedule = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

        const { documentId, clientId, acquisitionDate, serviceStartDate, acquisitionValue, usefulLifeMonths, assetName } = request.data;
        if (!documentId || !clientId) {
            throw new HttpsError('invalid-argument', 'documentId et clientId sont requis.');
        }

        try {
            const db = getDb();
            const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId);
            const sourceDoc = await db.collection("documents").doc(documentId).get();
            if (!sourceDoc.exists) {
                throw new HttpsError('not-found', 'Document source introuvable.');
            }
            const sourceData = sourceDoc.data() as any;
            if (sourceData.clientId !== clientId) {
                throw new HttpsError('permission-denied', 'Document source hors dossier client.');
            }
            if (targetCabinetId && sourceData.cabinetId && sourceData.cabinetId !== targetCabinetId) {
                throw new HttpsError('permission-denied', 'Document source hors cabinet.');
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
            batch.set(assetRef, { id: assetRef.id, ...assetData });
            batch.update(db.collection("documents").doc(documentId), { assetId: assetRef.id });

            await batch.commit();

            return { success: true, assetId: assetRef.id, schedule };

        } catch (error: any) {
            throwCallableError(error, 'Erreur generateAssetSchedule:');
        }
    }
);

/**
 * GÃ©nÃ¨re les Ã©critures OD de dotations aux amortissements pour un exercice comptable.
 *
 * RÃ¨gles mÃ©tier :
 * - Ã‰criture gÃ©nÃ©rÃ©e en statut "draft" uniquement.
 * - Anti-doublon : vÃ©rifie si une Ã©criture existe dÃ©jÃ  pour (assetId, fiscalYear).
 * - Validation humaine obligatoire avant export ou comptabilisation dÃ©finitive.
 * - Extensible : le champ sourceType permet d'adapter Ã  d'autres types d'OD (V2).
 */
export const generateDepreciationODs = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

        const { clientId, fiscalYear } = request.data;
        if (!clientId || !fiscalYear) {
            throw new HttpsError('invalid-argument', 'clientId et fiscalYear sont requis.');
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
                const scheduleLine = (asset.schedule || []).find(
                    (s: { year: number; depreciationAmount: number }) => s.year === fiscalYear
                );

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
                } else if (assetName.includes('logiciel') || assetName.includes('software') || assetName.includes('licence')) {
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

        } catch (error: any) {
            throwCallableError(error, 'Erreur generateDepreciationODs:');
        }
    }
);

/**
 * Valide une Ã©criture comptable (draft â†’ validated).
 * Seul un comptable ou admin peut valider.
 */
export const validateAccountingEntry = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

        const { entryId } = request.data;
        if (!entryId) throw new HttpsError('invalid-argument', 'entryId requis.');

        try {
            const db = getDb();
            const entryRef = db.collection("accounting_entries").doc(entryId);
            const snap = await entryRef.get();

            if (!snap.exists) throw new HttpsError('not-found', 'Ã‰criture introuvable.');
            const entry = snap.data() as any;
            if (!entry.clientId) {
                throw new HttpsError('failed-precondition', 'Ã‰criture sans client rattache.');
            }
            const { targetCabinetId } = await assertClientCabinetAccess(request.auth, entry.clientId);
            if (targetCabinetId && entry.cabinetId !== targetCabinetId) {
                throw new HttpsError('permission-denied', 'Ã‰criture hors cabinet.');
            }
            if (entry.status !== 'draft') {
                throw new HttpsError('failed-precondition', 'Seules les Ã©critures en brouillon peuvent Ãªtre validÃ©es.');
            }

            await entryRef.update({
                status: 'validated',
                validatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            return { success: true };

        } catch (error: any) {
            throwCallableError(error, 'Erreur validateAccountingEntry:');
        }
    }
);

/**
 * Exporte le FEC pour un exercice donnÃ© et scelle les Ã©critures (PAF).
 */
export const generateFECExport = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

        const { clientId, fiscalYearId, year } = request.data;
        if (!clientId) {
            throw new HttpsError('invalid-argument', 'clientId requis.');
        }

        try {
            const db = getDb();
            const { targetCabinetId } = await assertClientCabinetAccess(request.auth, clientId);
            let targetYear = year || 2024;

            if (fiscalYearId) {
                const fySnap = await db.collection("fiscal_years").doc(fiscalYearId).get();
                if (fySnap.exists) {
                    const fyData = fySnap.data() as any;
                    if (fyData.clientId && fyData.clientId !== clientId) {
                        throw new HttpsError('permission-denied', 'Exercice hors dossier client.');
                    }
                    if (targetCabinetId && fyData.cabinetId && fyData.cabinetId !== targetCabinetId) {
                        throw new HttpsError('permission-denied', 'Exercice hors cabinet.');
                    }
                    targetYear = parseInt(fyData.label, 10) || fyData.year || 2024;
                } else if (!year) {
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
                throw new HttpsError('not-found', 'Aucune Ã©criture comptable validÃ©e pour cet exercice.');
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

        } catch (error: any) {
            throwCallableError(error, 'Erreur generateFECExport:');
        }
    }
);

/**
 * GÃ¨re la sortie d'une immobilisation (cession ou mise au rebut) :
 * - Calcule l'amortissement prorata temporis de l'annÃ©e de sortie.
 * - Ajuste le plan d'amortissement de l'actif.
 * - GÃ©nÃ¨re les Ã©critures comptables d'OD associÃ©es (solder l'immo, solder les amortissements, enregistrer la VNC et la vente).
 */
export const disposeAsset = onCall(
    { region: "europe-west9" },
    async (request) => {
        if (!request.auth) throw new HttpsError('unauthenticated', 'Non autorisÃ©');

        const { assetId, disposalDate, disposalType, salePrice, vatRate } = request.data;
        if (!assetId || !disposalDate || !disposalType) {
            throw new HttpsError('invalid-argument', 'assetId, disposalDate et disposalType sont requis.');
        }

        try {
            const db = getDb();

            // 1. Charger l'actif
            const assetSnap = await db.collection("assets").doc(assetId).get();
            if (!assetSnap.exists) {
                throw new HttpsError('not-found', 'Immobilisation introuvable.');
            }

            const asset = assetSnap.data() as any;
            if (!asset.clientId) {
                throw new HttpsError('failed-precondition', 'Immobilisation sans client rattache.');
            }
            const { targetCabinetId } = await assertClientCabinetAccess(request.auth, asset.clientId);
            if (targetCabinetId && asset.cabinetId !== targetCabinetId) {
                throw new HttpsError('permission-denied', 'Immobilisation hors cabinet.');
            }
            if (asset.status !== 'active') {
                throw new HttpsError('failed-precondition', 'L\'immobilisation n\'est plus active.');
            }

            // 2. DÃ©terminer l'annÃ©e de cession
            const serviceStart = new Date(asset.serviceStartDate);
            const dEnd = new Date(disposalDate);
            const disposalYear = dEnd.getFullYear();

            if (dEnd < serviceStart) {
                throw new HttpsError('invalid-argument', 'La date de cession ne peut pas Ãªtre antÃ©rieure Ã  la date de mise en service.');
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
            const previousClosingValue = originalSchedule.find((s: any) => s.year === disposalYear - 1)?.closingValue ?? asset.acquisitionValue;

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
                } else if (line.year === disposalYear) {
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
            } else if (assetNameLower.includes('logiciel') || assetNameLower.includes('software') || assetNameLower.includes('licence')) {
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

        } catch (error: any) {
            throwCallableError(error, 'Erreur disposeAsset:');
        }
    }
);

export const inviteClient = onCall(
  { region: 'europe-west9', memory: '256MiB' },
  async (request: CallableRequest<{ email: string; name: string; cabinetId?: string }>) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerRole = getCallerRole(request.auth);
    if (!['admin', 'accountant'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Seuls les admins et comptables peuvent inviter des clients.');
    }

    const { email, name, cabinetId } = request.data || {};
    
    if (!email || typeof email !== 'string' || !name || typeof name !== 'string') {
      throw new HttpsError('invalid-argument', 'L\'email et le nom sont requis et doivent etre des chaines.');
    }

    let targetCabinetId = cabinetId;

    // Si c'est un comptable, on force le cabinetId a celui du comptable
    if (callerRole === 'accountant') {
      const callerCabinetId = getCallerCabinetId(request.auth);
      if (!callerCabinetId) {
        throw new HttpsError('permission-denied', 'Le comptable n\'est rattache a aucun cabinet.');
      }
      targetCabinetId = callerCabinetId;
    } else if (callerRole === 'admin' && !targetCabinetId) {
      throw new HttpsError('invalid-argument', 'Un admin doit specifier un cabinetId.');
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
    } catch (error: any) {
      throwCallableError(error, 'Erreur inviteClient:');
    }
  }
);
