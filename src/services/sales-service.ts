import { db } from '@/firebase';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    limit,
    Timestamp 
} from 'firebase/firestore';
import { SalesInvoice, SalesInvoiceItem } from '@/lib/types';

export const salesService = {
    /**
     * Creates a new sales invoice.
     */
    async createInvoice(invoice: Omit<SalesInvoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) {
        const nextNumber = await this.generateInvoiceNumber(invoice.clientId);
        
        const newInvoice = {
            ...invoice,
            invoiceNumber: nextNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, 'sales_invoices'), newInvoice);
        return { id: docRef.id, ...newInvoice };
    },

    /**
     * Generates the next sequential invoice number for a client.
     * Format: F-YYYY-XXX
     */
    async generateInvoiceNumber(clientId: string): Promise<string> {
        const year = new Date().getFullYear();
        const q = query(
            collection(db, 'sales_invoices'),
            where('clientId', '==', clientId),
            orderBy('invoiceNumber', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        let lastCount = 0;

        if (!snapshot.empty) {
            const lastNum = snapshot.docs[0].data().invoiceNumber;
            const parts = lastNum.split('-');
            if (parts.length === 3 && parseInt(parts[1]) === year) {
                lastCount = parseInt(parts[2]);
            }
        }

        const nextCount = (lastCount + 1).toString().padStart(3, '0');
        return `F-${year}-${nextCount}`;
    },

    /**
     * Fetches all sales invoices for a client.
     */
    async getClientInvoices(clientId: string) {
        const q = query(
            collection(db, 'sales_invoices'),
            where('clientId', '==', clientId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SalesInvoice[];
    },

    /**
     * Updates an invoice status.
     */
    async updateStatus(invoiceId: string, status: SalesInvoice['status']) {
        const docRef = doc(db, 'sales_invoices', invoiceId);
        await updateDoc(docRef, {
            status,
            updatedAt: new Date().toISOString()
        });
    }
};
