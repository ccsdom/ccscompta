'use server';
/**
 * @fileOverview AI flow to reconcile bank statement transactions with extracted invoices.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionInputSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
});

const InvoiceInputSchema = z.object({
  id: z.string(),
  date: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  vendorName: z.string().nullable().optional(),
});

const ReconcileInputSchema = z.object({
  transactions: z.array(TransactionInputSchema).describe('Les transactions du relevé bancaire.'),
  invoices: z.array(InvoiceInputSchema).describe('La liste des factures potentiellement correspondantes de ce client.'),
});

export type ReconcileInput = z.infer<typeof ReconcileInputSchema>;

const ReconcileOutputSchema = z.object({
  matches: z.array(z.object({
    transactionIndex: z.number().describe('Index base-0 de la transaction dans le tableau fourni.'),
    documentId: z.string().describe('ID de la facture (invoice) correspondante.'),
    confidenceScore: z.number().describe('Score de confiance de 0 à 100.'),
  })).describe('Les transactions qui ont formellement été rapprochées à une facture existante.'),
  anomalies: z.array(z.object({
    transactionIndex: z.number().describe('Index base-0 de la transaction anormale.'),
    reason: z.string().describe('Raison courte expliquant pourquoi cette dépense est une anomalie (ex: "Aucune facture Free de 29.99 trouvée à cette période")'),
  })).describe('Les transactions en débit, sans reçu, ou qui semblent très suspectes.'),
});

export type ReconcileOutput = z.infer<typeof ReconcileOutputSchema>;

const prompt = ai.definePrompt({
  name: 'reconcileBankStatementPrompt',
  input: { schema: ReconcileInputSchema },
  output: { schema: ReconcileOutputSchema },
  prompt: `Tu es un Expert-Comptable redoutable avec 30 ans d'expérience. 
  
Ta mission est d'effectuer un "Rapprochement Bancaire" (Lettrage) entre des Lignes de Relevé Bancaire \`transactions\` et des factures/reçus validés connus du cabinet \`invoices\`.

Règles de lettrage :
1. Fais un rapprochement flou (Fuzzy Matching) très intelligent : un "Mcdonalds 12.50€" le 14/03 correspond parfaitement à une facture "MC DO" de 12.50 le 14/03.
2. Un paiement de carte bancaire intervient parfois le lendemain ou le surlendemain (ex: achat le 21/04, débit le 23/04). C'est normal.
3. Attention aux montants ! Une transaction en DEBIT est négative (-12.50) sur le relevé, alors que la facture annonce un total de TTC positif (12.50). Elles matchent.
4. Tolérance sur les montants : des arrondis (ex: 29.99 vs 30.00) se tolèrent si la date et le nom correspondent, mais font baisser le confidenceScore (ex: 70).
5. Si un rapprochement est évident et sûr (Même date, Même montant, Même vendeur), le confidenceScore est 99 ou 100.
6. Assigne les factures trouvées à la liste \`matches\`.

Règles des anomalies (Dépenses orphelines) :
1. Si une transaction (surtout un DÉBIT) ne correspond à absolument AUCUNE facture de la liste, elle doit être signalée dans la section \`anomalies\` avec une \`reason\` courte, incisive et professionnelle ("Aucun reçu trouvé pour cet achat Google Ads").
2. Les salaires et charges sociales (URSSAF, DGFIP) n'ont parfois pas besoin de facture, signale-les s'y elles semblent anormales, mais ce n'est pas orphelin obligatoirement.
3. Les transactions de CRÉDIT (entrées) sans justificatifs sont des ventes/apports, signale-les si nécessaire mais concentre-toi sur les charges justifiées.

Transactions:
{{json transactions}}

Factures (Invoices):
{{json invoices}}

Effectue ton travail avec la plus grande rigueur au format JSON.
`,
});

export const reconcileBankStatementFlow = ai.defineFlow(
  {
    name: 'reconcileBankStatementFlow',
    inputSchema: ReconcileInputSchema,
    outputSchema: ReconcileOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
