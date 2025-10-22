
'use server';

import { db } from '@/lib/firebase-server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Client } from '@/lib/types';


export async function getClients(cabinetId?: string): Promise<Client[]> {
    try {
        const clientsRef = collection(db, 'clients');
        const q = cabinetId ? query(clientsRef, where('cabinetId', '==', cabinetId)) : query(clientsRef);
        
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    } catch (error) {
        console.error("[Firestore] Error fetching clients:", error);
        return [];
    }
}
