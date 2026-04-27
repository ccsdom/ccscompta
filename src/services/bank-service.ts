import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'matched' | 'pending' | 'anomaly';
    matchedDocId?: string;
    vendor?: string;
    sourceDocId: string;
}

export class BankService {
    /**
     * Retrieves all bank transactions for a specific client.
     * It scans documents of type 'bank statement' and flattens their transaction arrays.
     */
    public static async getTransactions(clientId: string): Promise<BankTransaction[]> {
        try {
            const docsRef = collection(db, 'documents');
            const q = query(
                docsRef, 
                where('clientId', '==', clientId),
                where('type', '==', 'bank statement'),
                orderBy('processedAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const allTransactions: BankTransaction[] = [];
            
            querySnapshot.docs.forEach(docSnap => {
                const data = docSnap.data();
                if (data.extractedData?.transactions) {
                    const txs = data.extractedData.transactions.map((tx: any, index: number) => ({
                        id: `${docSnap.id}-${index}`,
                        date: tx.date || data.createdAt,
                        description: tx.description || 'Transaction sans libellé',
                        amount: tx.amount || 0,
                        status: tx.matchingDocumentId ? 'matched' : 'pending',
                        matchedDocId: tx.matchingDocumentId,
                        vendor: tx.vendor,
                        sourceDocId: docSnap.id
                    }));
                    allTransactions.push(...txs);
                }
            });
            
            // Tri par date décroissante
            return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    }
}
