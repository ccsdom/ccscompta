'use server';

import { reconcileBankStatementFlow, type ReconcileInput } from './reconcile-bank-statement';
import { db } from '@/lib/firebase-server';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ExtractDataOutput } from './extract-data-from-documents';

export async function runBankReconciliation(
  transactions: { date: string; description: string; amount: number }[],
  clientId: string
) {
  try {
    // 1. Fetch recent approved invoices for this client
    const docsRef = collection(db, 'documents');
    const q = query(
      docsRef,
      where('clientId', '==', clientId),
      where('status', '==', 'approved')
    );

    const snapshot = await getDocs(q);
    
    const invoices = snapshot.docs.map(doc => {
      const data = doc.data();
      const extracted = data.extractedData as ExtractDataOutput | undefined;
      const firstAmount = extracted?.amounts?.[0] || null;
      const firstDate = extracted?.dates?.[0] || null;
      const firstVendor = extracted?.vendorNames?.[0] || null;

      return {
        id: doc.id,
        date: firstDate,
        amount: firstAmount,
        vendorName: firstVendor,
      };
    }).filter(inv => inv.amount !== null);

    // 2. Prepare the payload for Genkit
    const inputPayload: ReconcileInput = {
      transactions: transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
      })),
      invoices,
    };

    // 3. Call the Genkit Flow
    const result = await reconcileBankStatementFlow(inputPayload);

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Erreur durant le rapprochement bancaire :", error);
    return { success: false, error: error.message || "Erreur inconnue" };
  }
}

export async function saveBankReconciliation(data: {
  clientId: string;
  clientName: string;
  summary: {
    totalTransactions: number;
    matchedTransactions: number;
    totalAmount: number;
    matchedAmount: number;
    anomalyCount: number;
  };
  matches: any[];
  anomalies: any[];
}) {
  try {
    const reconcRef = collection(db, 'reconciliations');
    const docData = {
      ...data,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };
    
    const docRef = await addDoc(reconcRef, docData);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Erreur durant la sauvegarde du rapprochement :", error);
    return { success: false, error: error.message || "Erreur de sauvegarde" };
  }
}
