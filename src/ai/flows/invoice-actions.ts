
'use server';

import type { Invoice, Client } from '@/lib/types';
import { db } from '@/lib/firebase-admin';

const MOCK_INVOICES: Omit<Invoice, 'id'>[] = [
    { clientId: 'client-01', clientName: 'ACTION AVENTURE', number: 'FACT-2024-007', date: '2024-07-01', dueDate: '2024-07-31', amount: 350.00, status: 'pending' },
    { clientId: 'client-02', clientName: 'AUTO ECOLE DE LA MAIRIE', number: 'FACT-2024-006', date: '2024-06-01', dueDate: '2024-06-30', amount: 350.00, status: 'paid' },
    { clientId: 'client-03', clientName: 'BODY MINUTE', number: 'FACT-2024-005', date: '2024-05-01', dueDate: '2024-05-31', amount: 350.00, status: 'paid' },
    { clientId: 'client-04', clientName: 'CABINET FLORET', number: 'FACT-2023-BILAN', date: '2024-04-15', dueDate: '2024-05-15', amount: 1800.00, status: 'overdue' },
    { clientId: 'vsw-sas', clientName: 'VSW SAS', number: 'FACT-2024-004', date: '2024-04-01', dueDate: '2024-04-30', amount: 350.00, status: 'paid' },
];


export async function getInvoices(): Promise<Invoice[]> {
    console.log('[Firestore] Fetching all invoices.');
    try {
        const snapshot = await db.collection('invoices').get();
        if (snapshot.empty) {
            console.log("No invoices found in Firestore, seeding with mock data...");
            const batch = db.batch();
            MOCK_INVOICES.forEach(invoice => {
                const docRef = db.collection('invoices').doc();
                batch.set(docRef, invoice);
            });
            await batch.commit();
            console.log(`${MOCK_INVOICES.length} mock invoices seeded.`);
            const seededSnapshot = await db.collection('invoices').get();
            return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    } catch(e) {
        console.error("[Firestore] Error fetching invoices:", e);
        return [];
    }
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'number'>): Promise<Invoice> {
    console.log(`[Firestore] Adding new invoice for client ${invoice.clientId}`);
    try {
        const countQuery = await db.collection('invoices').count().get();
        const invoiceCount = countQuery.data().count;
        const newInvoiceNumber = `FACT-2024-${String(invoiceCount + 1).padStart(3, '0')}`;

        const newInvoiceData = {
            ...invoice,
            number: newInvoiceNumber
        };

        const docRef = await db.collection('invoices').add(newInvoiceData);
        return { ...newInvoiceData, id: docRef.id };
    } catch(e) {
        console.error("[Firestore] Error adding invoice:", e);
        throw e;
    }
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    console.log(`[Firestore] Updating invoice ${invoiceId}`);
    try {
        const docRef = db.collection('invoices').doc(invoiceId);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() } as Invoice;
    } catch(e) {
        console.error(`[Firestore] Error updating invoice ${invoiceId}:`, e);
        return null;
    }
}

export async function createInvoiceForDocument(client: Client, documentId: string): Promise<Invoice> {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);

    const newInvoiceData = {
        clientId: client.id,
        clientName: client.name,
        documentId: documentId,
        date: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        amount: 5.00, // 5€ processing fee
        status: 'pending' as const,
    };
    
    return addInvoice(newInvoiceData);
}
