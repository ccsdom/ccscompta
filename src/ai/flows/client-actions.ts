
'use server';

import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Client } from '@/lib/types';


/**
 * Fetches clients from Firestore. This function is intended for server-side use only.
 * If cabinetId is provided, it filters clients by that cabinet.
 * @param cabinetId Optional cabinet ID to filter clients.
 * @returns A promise that resolves to an array of Client objects.
 */
export async function getClientsForServer(cabinetId?: string): Promise<Client[]> {
    try {
        console.log(`[Server Action] Fetching clients for cabinet: ${cabinetId || 'all'}`);
        const clientsRef = collection(db, 'clients');
        const q = cabinetId ? query(clientsRef, where('cabinetId', '==', cabinetId)) : query(clientsRef);
        
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
        console.error("[Firestore Server] Error fetching clients:", error);
        return [];
    }
}

    