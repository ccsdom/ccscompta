
'use server';
/**
 * @fileOverview A flow to handle interactions with the Cegid accounting software.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-server';
import { doc, getDoc, updateDoc, FieldValue } from 'firebase/firestore';
import type { Document, Client } from '@/lib/types';
import { createAccountingEntry, findSupplier, createSupplier } from '@/services/cegid';

// Define the input schema for the flow
const SendDocumentToCegidInputSchema = z.object({
  documentId: z.string().describe("The ID of the document to send to Cegid."),
  triggeredBy: z.string().describe("The name of the user who triggered the action."),
});
export type SendDocumentToCegidInput = z.infer<typeof SendDocumentToCegidInputSchema>;

// Define the output schema for the flow
const SendDocumentToCegidOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  error: z.string().optional(),
});
export type SendDocumentToCegidOutput = z.infer<typeof SendDocumentToCegidOutputSchema>;


/**
 * A server action that wraps the Genkit flow to send a document to Cegid.
 * This is the function that should be called from the UI.
 * @param input - The input data for the flow.
 * @returns The result of the operation.
 */
export async function sendDocumentToCegid(input: SendDocumentToCegidInput): Promise<SendDocumentToCegidOutput> {
  return sendDocumentToCegidFlow(input);
}


/**
 * The main Genkit flow for sending document data to Cegid.
 */
const sendDocumentToCegidFlow = ai.defineFlow(
  {
    name: 'sendDocumentToCegidFlow',
    inputSchema: SendDocumentToCegidInputSchema,
    outputSchema: SendDocumentToCegidOutputSchema,
  },
  async ({ documentId, triggeredBy }) => {
    const docRef = doc(db, 'documents', documentId);
    
    const addAuditEvent = (action: string) => updateDoc(docRef, {
        auditTrail: FieldValue.arrayUnion({ action, date: new Date().toISOString(), user: triggeredBy })
    });

    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error(`Document with ID ${documentId} not found.`);
      }

      const document = docSnap.data() as Document;
      
      if (document.status !== 'approved') {
        throw new Error("Only approved documents can be sent to Cegid.");
      }
      
      if (!document.extractedData) {
          throw new Error("No extracted data found for this document.");
      }
      
      const clientSnap = await getDoc(doc(db, 'clients', document.clientId));
      if (!clientSnap.exists()) {
          throw new Error(`Client with ID ${document.clientId} not found.`);
      }
      const client = clientSnap.data() as Client;

      await addAuditEvent('Envoi vers Cegid initié');
      
      const vendorName = document.extractedData.vendorNames?.[0];
      if (!vendorName) {
          throw new Error("Vendor name is missing from extracted data.");
      }

      let supplier = await findSupplier(vendorName);
      if (!supplier) {
          console.log(`[Cegid Flow] Supplier not found, creating...`);
          supplier = await createSupplier({ name: vendorName, email: '' }); // Email is optional
          await addAuditEvent(`Fournisseur "${vendorName}" créé dans Cegid`);
      }

      const totalAmount = document.extractedData.amounts?.[0] ?? 0;
      const vatAmount = document.extractedData.vatAmount ?? 0;

      // Construct the accounting entry
      const accountingEntry = {
        date: document.extractedData.dates?.[0] ?? document.uploadDate,
        journal: 'ACH', // Journal d'Achat
        label: `Facture ${vendorName} - ${document.name}`,
        client_siret: client.siret, // SIRET for client matching in Cegid
        lines: [
            // Débit: Compte de charge (ex: 6063 Fournitures)
            { account: '606300', debit: totalAmount - vatAmount, credit: 0, supplierId: supplier.id },
            // Débit: Compte de TVA
            { account: '445660', debit: vatAmount, credit: 0, supplierId: supplier.id },
            // Crédit: Compte fournisseur
            { account: '401000', debit: 0, credit: totalAmount, supplierId: supplier.id }
        ]
      };
      
      const result = await createAccountingEntry(accountingEntry);

      if (result.success) {
        await addAuditEvent('Écriture comptable envoyée à Cegid avec succès');
        return { success: true, message: "Document sent successfully to Cegid." };
      } else {
        throw new Error("Failed to create accounting entry in Cegid.");
      }

    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred.";
      console.error(`[Cegid Flow] Error sending document ${documentId}:`, errorMessage);
      await addAuditEvent(`Erreur d'envoi Cegid: ${errorMessage}`);
      return { success: false, message: "Failed to send document.", error: errorMessage };
    }
  }
);
