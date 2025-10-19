'use server';

import type { Invoice, Client } from '@/lib/types';
import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, getCountFromServer, getDoc } from 'firebase/firestore';


export async function getInvoices(): Promise<Invoice[]> {
    console.log('[Firestore] Fetching all invoices.');
    try {
        const snapshot = await getDocs(collection(db, 'invoices'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    } catch(e) {
        console.error("[Firestore] Error fetching invoices:", e);
        return [];
    }
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'number'>): Promise<Invoice> {
    console.log(`[Firestore] Adding new invoice for client ${invoice.clientId}`);
    try {
        const coll = collection(db, "invoices");
        const snapshot = await getCountFromServer(coll);
        const invoiceCount = snapshot.data().count;
        const newInvoiceNumber = `FACT-2024-${String(invoiceCount + 1).padStart(3, '0')}`;

        const newInvoiceData = {
            ...invoice,
            number: newInvoiceNumber
        };

        const docRef = await addDoc(collection(db, 'invoices'), newInvoiceData);
        return { ...newInvoiceData, id: docRef.id };
    } catch(e) {
        console.error("[Firestore] Error adding invoice:", e);
        throw e;
    }
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    console.log(`[Firestore] Updating invoice ${invoiceId}`);
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        await updateDoc(docRef, updates);
        const updatedSnapshot = await getDoc(docRef);
        return { id: updatedSnapshot.id, ...updatedSnapshot.data() } as Invoice;
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
