
'use server';

import { db } from '@/lib/firebase-server';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import type { Invoice, Client, Document } from '@/lib/types';

/**
 * Creates a new invoice in Firestore for a given document.
 * This is intended to be called from a server-side context (e.g., another flow or Cloud Function)
 * after a document has been successfully processed and approved.
 * 
 * @param client - The client object for whom the invoice is being created.
 * @param documentId - The ID of the document that was processed.
 * @returns The ID of the newly created invoice.
 */
export async function createInvoiceForDocument(client: Client, documentId: string): Promise<string> {
    if (!client) {
        throw new Error("Client data is required to create an invoice.");
    }

    const newInvoice: Omit<Invoice, 'id'> = {
        clientId: client.id,
        clientName: client.name,
        documentId: documentId,
        number: `INV-${Date.now()}`,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due in 30 days
        amount: 0.50, // 50 cents per document processed
        status: 'pending',
    };

    try {
        const docRef = await addDoc(collection(db, 'invoices'), newInvoice);
        console.log(`[Action] Invoice created with ID: ${docRef.id} for document ${documentId}`);
        return docRef.id;
    } catch (error) {
        console.error('[Action] Error creating invoice:', error);
        throw new Error('Failed to create invoice in Firestore.');
    }
}
