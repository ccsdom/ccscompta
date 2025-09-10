
'use server';

import type { Invoice, Client } from '@/lib/types';

// --- Simulation de la base de données de factures en mémoire ---
let invoiceCounter = 10;
const invoicesStore: Invoice[] = [
    { id: 'inv-1', clientId: 'client-01', clientName: 'ACTION AVENTURE', number: 'FACT-2024-007', date: '2024-07-01', dueDate: '2024-07-31', amount: 350.00, status: 'pending' },
    { id: 'inv-2', clientId: 'client-02', clientName: 'AUTO ECOLE DE LA MAIRIE', number: 'FACT-2024-006', date: '2024-06-01', dueDate: '2024-06-30', amount: 350.00, status: 'paid' },
    { id: 'inv-3', clientId: 'client-03', clientName: 'BODY MINUTE', number: 'FACT-2024-005', date: '2024-05-01', dueDate: '2024-05-31', amount: 350.00, status: 'paid' },
    { id: 'inv-4', clientId: 'client-04', clientName: 'CABINET FLORET', number: 'FACT-2023-BILAN', date: '2024-04-15', dueDate: '2024-05-15', amount: 1800.00, status: 'overdue' },
    { id: 'inv-5', clientId: 'vsw-sas', clientName: 'VSW SAS', number: 'FACT-2024-004', date: '2024-04-01', dueDate: '2024-04-30', amount: 350.00, status: 'paid' },
];
// --- Fin de la simulation ---

export async function getInvoices(): Promise<Invoice[]> {
    console.log('[SIMULATION] Fetching all invoices.');
    return Promise.resolve([...invoicesStore]);
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'number'>): Promise<Invoice> {
    console.log(`[SIMULATION] Adding new invoice for client ${invoice.clientId}`);
    const newInvoice: Invoice = {
        ...invoice,
        id: `inv-${Date.now()}`,
        number: `FACT-2024-${String(invoiceCounter++).padStart(3, '0')}`,
    };
    invoicesStore.push(newInvoice);
    return Promise.resolve(newInvoice);
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    console.log(`[SIMULATION] Updating invoice ${invoiceId}`);
    const index = invoicesStore.findIndex(inv => inv.id === invoiceId);
    if (index !== -1) {
        invoicesStore[index] = { ...invoicesStore[index], ...updates };
        return Promise.resolve(invoicesStore[index]);
    }
    return Promise.resolve(null);
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
