import { db } from '@/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
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
     * Generates a professional PDF for a sales invoice.
     */
    async generateInvoicePDF(invoice: SalesInvoice, seller: any) {
        const [{ default: jsPDF }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);
        const safeSeller = seller || {};

        const doc = new jsPDF();
        const margin = 14;

        // Header: Seller Info
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(safeSeller.name || safeSeller.companyName || "Mon Entreprise", margin, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const sellerInfo = [
            safeSeller.address,
            safeSeller.siret ? `SIRET: ${safeSeller.siret}` : null,
            safeSeller.vatNumber ? `TVA: ${safeSeller.vatNumber}` : null,
            safeSeller.email,
            safeSeller.phone
        ].filter(Boolean);

        sellerInfo.forEach((line, i) => {
            doc.text(line as string, margin, 28 + (i * 5));
        });

        // Invoice Header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("FACTURE", 140, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`N° : ${invoice.invoiceNumber}`, 140, 28);
        doc.text(`Date : ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 140, 33);
        doc.text(`Échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, 140, 38);

        // Customer Info
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Facturer à :", 110, 60);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.customerName, 110, 68);
        if (invoice.customerAddress) {
            const splitAddress = doc.splitTextToSize(invoice.customerAddress, 80);
            doc.text(splitAddress, 110, 73);
        }

        // Table
        (doc as any).autoTable({
            startY: 95,
            head: [['Désignation', 'Qté', 'Prix Unitaire HT', 'TVA', 'Total TTC']],
            body: invoice.items.map(item => [
                item.description,
                item.quantity,
                item.unitPrice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
                `${item.vatRate}%`,
                item.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
            ]),
            headStyles: { fillColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        const finalY = (doc as any).lastAutoTable.cursor.y + 10;

        // Totals (right aligned)
        doc.setFont("helvetica", "bold");
        doc.text(`Total HT :`, 140, finalY);
        doc.text(invoice.totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 196, finalY, { align: 'right' });

        doc.text(`Total TVA :`, 140, finalY + 7);
        doc.text(invoice.totalVAT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 196, finalY + 7, { align: 'right' });

        doc.setFontSize(14);
        doc.text(`TOTAL TTC :`, 140, finalY + 16);
        doc.text(invoice.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), 196, finalY + 16, { align: 'right' });

        // Footer: Bank info
        if (safeSeller.iban) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Coordonnées bancaires :", margin, 250);
            doc.setFont("helvetica", "normal");
            doc.text(`Titulaire : ${safeSeller.bankName || safeSeller.name || safeSeller.companyName}`, margin, 255);
            doc.text(`IBAN : ${safeSeller.iban}`, margin, 260);
            if (safeSeller.bic) doc.text(`BIC : ${safeSeller.bic}`, margin, 265);
        }

        // Save
        doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
    },
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
     * Fetches a specific invoice by ID.
     */
    async getInvoice(invoiceId: string) {
        const docRef = doc(db, 'sales_invoices', invoiceId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as SalesInvoice;
    },

    /**
     * Updates an existing invoice.
     */
    async updateInvoice(invoiceId: string, data: Partial<SalesInvoice>) {
        const docRef = doc(db, 'sales_invoices', invoiceId);
        const updateData = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        await updateDoc(docRef, updateData);
        return { id: invoiceId, ...updateData };
    },

    /**
     * Updates an invoice status.
     */
    async updateStatus(invoiceId: string, status: SalesInvoice['status']) {
        return this.updateInvoice(invoiceId, { status });
    }
};
