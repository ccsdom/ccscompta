'use server';

import { db } from '@/lib/firebase-server';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

/**
 * Initiates a bank connection for a client.
 * In a real scenario, this would call GoCardless/Nordigen.
 * Here we simulate the URL generation.
 */
export async function getBankAuthLink(clientId: string, cabinetId: string) {
    try {
        console.log(`Initiating bank connection for client ${clientId} in cabinet ${cabinetId}`);
        
        // Simulating Nordigen Requisition URL
        const mockAuthUrl = `https://ob.nordigen.com/psd2/start/mock-auth-${Math.random().toString(36).substring(7)}`;
        
        return { success: true, url: mockAuthUrl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Finalizes the bank connection.
 * Simulates the callback from the bank.
 */
export async function finalizeBankConnection(clientId: string, cabinetId: string, requisitionId: string) {
    try {
        const connectionsRef = collection(db, 'bank_connections');
        const newConn = await addDoc(connectionsRef, {
            clientId,
            cabinetId,
            requisitionId,
            status: 'active',
            institutionId: 'SANDBOX_FINANCE',
            institutionName: 'Banque de Démonstration',
            lastSync: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        // Update client profile
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, {
            hasBankConnected: true,
            lastBankConnectionId: newConn.id
        });

        return { success: true, connectionId: newConn.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Synchronizes transactions from the bank.
 * In mock mode, generates realistic transactions for the last 30 days.
 */
export async function syncBankTransactions(clientId: string) {
    try {
        // Simulating delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const transactions = [
            { date: '2026-04-20', description: 'Amazon.fr Prime', amount: -14.99 },
            { date: '2026-04-21', description: 'Virement Client 4589', amount: 1250.00 },
            { date: '2026-04-22', description: 'Facture EDF Pro', amount: -245.50 },
            { date: '2026-04-23', description: 'Orange Communications', amount: -49.90 },
            { date: '2026-04-24', description: 'Station Service Total', amount: -75.00 },
            { date: '2026-04-25', description: 'URSSAF Cotisations', amount: -890.00 },
            { date: '2026-04-26', description: 'Adobe Systems Inc', amount: -65.99 },
            { date: '2026-04-27', description: 'Loyer Bureau Mai', amount: -1500.00 },
            { date: '2026-04-28', description: 'Remboursement Assurance', amount: 45.00 }
        ];

        return { success: true, transactions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
